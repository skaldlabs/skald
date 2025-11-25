import express from 'express'
import { Request, Response } from 'express'
import { DI } from '@/di'
import { Experiment } from '@/entities/Experiment'
import { ExperimentResult } from '@/entities/ExperimentResult'
import { randomUUID } from 'crypto'
import { ragGraph } from '@/agents/chatAgent/ragGraph'
import { parseRagConfig } from '@/lib/ragUtils'
import { streamChatAgent } from '@/agents/chatAgent/chatAgent'
import { logger } from '@/lib/logger'
import * as Sentry from '@sentry/node'
import { llmJudgeAgent } from '@/agents/llmJudgeAgent'
import { UsageTrackingService } from '@/services/usageTrackingService'
import { LLM_PROVIDER } from '@/settings'

export const experimentRouter = express.Router({ mergeParams: true })

interface ExperimentStatistics {
    average_llm_answer_rating: number | null
    average_human_answer_rating: number | null
    average_total_answer_time_ms: number | null
    average_time_to_first_token_ms: number | null
    total_results: number
}

interface ExperimentResponse {
    uuid: string
    title: string
    description: string
    properties: Record<string, any>
    evaluation_dataset_uuid: string
    evaluation_dataset_name: string
    statistics: ExperimentStatistics
    created_at: Date
}

interface CreateExperimentRequest {
    title: string
    description: string
    properties: Record<string, any>
    evaluation_dataset_uuid: string
}

const list = async (req: Request, res: Response) => {
    const user = req.context?.requestUser?.userInstance
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    const projectUuid = req.params.uuid
    if (!projectUuid) {
        return res.status(400).json({ error: 'Project UUID is required' })
    }

    const project = await DI.projects.findOne({ uuid: projectUuid })
    if (!project) {
        return res.status(404).json({ error: 'Project not found' })
    }

    // Verify user has access to this project's organization
    const membership = await DI.organizationMemberships.findOne({
        user: user,
        organization: project.organization,
    })
    if (!membership) {
        return res.status(403).json({ error: 'You do not have access to this project' })
    }

    const experiments = await DI.experiments.find(
        { project: project },
        { orderBy: { created_at: 'DESC' }, populate: ['evaluationDataset'] }
    )

    const response: ExperimentResponse[] = await Promise.all(
        experiments.map(async (experiment) => {
            const statistics = await calculateExperimentStatistics(experiment)
            return {
                uuid: experiment.uuid,
                title: experiment.title,
                description: experiment.description || '',
                properties: experiment.properties || {},
                evaluation_dataset_uuid: experiment.evaluationDataset.uuid,
                evaluation_dataset_name: experiment.evaluationDataset.name,
                statistics,
                created_at: experiment.created_at,
            }
        })
    )

    res.status(200).json(response)
}

const getExperiment = async (req: Request, res: Response) => {
    const user = req.context?.requestUser?.userInstance
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    const projectUuid = req.params.uuid
    const experimentUuid = req.params.experimentUuid

    if (!projectUuid || !experimentUuid) {
        return res.status(400).json({ error: 'Project UUID and Experiment UUID are required' })
    }

    const project = await DI.projects.findOne({ uuid: projectUuid })
    if (!project) {
        return res.status(404).json({ error: 'Project not found' })
    }

    // Verify user has access to this project's organization
    const membership = await DI.organizationMemberships.findOne({
        user: user,
        organization: project.organization,
    })
    if (!membership) {
        return res.status(403).json({ error: 'You do not have access to this project' })
    }

    const experiment = await DI.experiments.findOne(
        { uuid: experimentUuid, project: project },
        { populate: ['evaluationDataset'] }
    )
    if (!experiment) {
        return res.status(404).json({ error: 'Experiment not found' })
    }

    const statistics = await calculateExperimentStatistics(experiment)

    const response: ExperimentResponse = {
        uuid: experiment.uuid,
        title: experiment.title,
        description: experiment.description || '',
        properties: experiment.properties || {},
        evaluation_dataset_uuid: experiment.evaluationDataset.uuid,
        evaluation_dataset_name: experiment.evaluationDataset.name,
        statistics,
        created_at: experiment.created_at,
    }

    res.status(200).json(response)
}

const create = async (req: Request, res: Response) => {
    const user = req.context?.requestUser?.userInstance
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    const projectUuid = req.params.uuid
    if (!projectUuid) {
        return res.status(400).json({ error: 'Project UUID is required' })
    }

    const { title, description, properties, evaluation_dataset_uuid } = req.body as CreateExperimentRequest

    if (!title || !description) {
        return res.status(400).json({ error: 'Title and description are required' })
    }

    if (!evaluation_dataset_uuid) {
        return res.status(400).json({ error: 'Evaluation dataset UUID is required' })
    }

    const project = await DI.projects.findOne({ uuid: projectUuid })
    if (!project) {
        return res.status(404).json({ error: 'Project not found' })
    }

    // Verify user has access to this project's organization
    const membership = await DI.organizationMemberships.findOne({
        user: user,
        organization: project.organization,
    })
    if (!membership) {
        return res.status(403).json({ error: 'You do not have access to this project' })
    }

    // Verify the evaluation dataset exists and belongs to this project
    const evaluationDataset = await DI.evaluationDatasets.findOne({
        uuid: evaluation_dataset_uuid,
        project: project,
    })
    if (!evaluationDataset) {
        return res.status(404).json({ error: 'Evaluation dataset not found' })
    }

    const experiment = DI.em.create(Experiment, {
        uuid: randomUUID(),
        title,
        description,
        properties: properties || {},
        project,
        evaluationDataset,
        created_at: new Date(),
    })

    await DI.em.persistAndFlush(experiment)

    const statistics = await calculateExperimentStatistics(experiment)

    const response: ExperimentResponse = {
        uuid: experiment.uuid,
        title: experiment.title,
        description: experiment.description || '',
        properties: experiment.properties || {},
        evaluation_dataset_uuid: experiment.evaluationDataset.uuid,
        evaluation_dataset_name: experiment.evaluationDataset.name,
        statistics,
        created_at: experiment.created_at,
    }

    res.status(201).json(response)
}

interface RunExperimentRequest {
    evaluation_dataset_question_uuid: string
}

const calculateExperimentStatistics = async (experiment: Experiment): Promise<ExperimentStatistics> => {
    const results = await DI.experimentResults.find({ experiment })

    if (results.length === 0) {
        return {
            average_llm_answer_rating: null,
            average_human_answer_rating: null,
            average_total_answer_time_ms: null,
            average_time_to_first_token_ms: null,
            total_results: 0,
        }
    }

    // Filter out null values for each metric
    const llmRatings = results
        .filter((r) => r.llm_answer_rating !== null && r.llm_answer_rating !== undefined)
        .map((r) => r.llm_answer_rating!)
    const humanRatings = results
        .filter((r) => r.human_answer_rating !== null && r.human_answer_rating !== undefined)
        .map((r) => r.human_answer_rating!)
    const totalTimes = results
        .filter((r) => r.total_answer_time_ms !== null && r.total_answer_time_ms !== undefined)
        .map((r) => r.total_answer_time_ms!)
    const ttfts = results
        .filter((r) => r.time_to_first_token_ms !== null && r.time_to_first_token_ms !== undefined)
        .map((r) => r.time_to_first_token_ms!)

    return {
        average_llm_answer_rating:
            llmRatings.length > 0 ? llmRatings.reduce((a, b) => a + b, 0) / llmRatings.length : null,
        average_human_answer_rating:
            humanRatings.length > 0 ? humanRatings.reduce((a, b) => a + b, 0) / humanRatings.length : null,
        average_total_answer_time_ms:
            totalTimes.length > 0 ? totalTimes.reduce((a, b) => a + b, 0) / totalTimes.length : null,
        average_time_to_first_token_ms: ttfts.length > 0 ? ttfts.reduce((a, b) => a + b, 0) / ttfts.length : null,
        total_results: results.length,
    }
}

const run = async (req: Request, res: Response) => {
    const user = req.context?.requestUser?.userInstance
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    const projectUuid = req.params.uuid
    const experimentUuid = req.params.experimentUuid

    if (!projectUuid || !experimentUuid) {
        return res.status(400).json({ error: 'Project UUID and Experiment UUID are required' })
    }

    const { evaluation_dataset_question_uuid } = req.body as RunExperimentRequest

    if (!evaluation_dataset_question_uuid) {
        return res.status(400).json({ error: 'Evaluation dataset question UUID is required' })
    }

    const project = await DI.projects.findOne({ uuid: projectUuid })
    if (!project) {
        return res.status(404).json({ error: 'Project not found' })
    }

    // Verify user has access to this project's organization
    const membership = await DI.organizationMemberships.findOne({
        user: user,
        organization: project.organization,
    })
    if (!membership) {
        return res.status(403).json({ error: 'You do not have access to this project' })
    }

    // Get the experiment and populate its evaluation dataset
    const experiment = await DI.experiments.findOne(
        { uuid: experimentUuid, project: project },
        { populate: ['evaluationDataset'] }
    )
    if (!experiment) {
        return res.status(404).json({ error: 'Experiment not found' })
    }

    // Get the question and verify it belongs to the experiment's evaluation dataset
    const question = await DI.evaluationDatasetQuestions.findOne({
        uuid: evaluation_dataset_question_uuid,
        evaluationDataset: experiment.evaluationDataset,
    })
    if (!question) {
        return res.status(404).json({
            error: 'Evaluation dataset question not found or does not belong to this experiment',
        })
    }

    // Parse filters and RAG config from experiment properties
    const filters = experiment.properties?.filters || []
    const ragConfig = experiment.properties?.rag_config || {}
    const clientSystemPrompt = experiment.properties?.client_system_prompt || null

    const { parsedRagConfig, error } = parseRagConfig(ragConfig)
    if (error || !parsedRagConfig) {
        return res.status(400).json({ error: error || 'Error parsing rag_config from experiment properties' })
    }

    // Run RAG graph to get context and query
    const startTime = Date.now()
    let timeToFirstToken: number | undefined

    try {
        const ragResultState = await ragGraph.invoke({
            query: question.question,
            project,
            chatId: null, // Don't create a chat for experiment runs
            filters,
            clientSystemPrompt,
            ragConfig: parsedRagConfig,
        })

        const { query: finalQuery, contextStr, prompt, rerankedResults } = ragResultState

        // Generate the answer without streaming
        let fullResponse = ''
        let firstTokenReceived = false

        for await (const chunk of streamChatAgent({
            query: finalQuery,
            prompt,
            contextStr: contextStr || '',
            rerankResults: rerankedResults || [],
            enableReferences: parsedRagConfig.references.enabled,
            llmProvider: parsedRagConfig.llmProvider,
        })) {
            if (chunk.type === 'token') {
                if (!firstTokenReceived) {
                    timeToFirstToken = Date.now() - startTime
                    firstTokenReceived = true
                }
                fullResponse += chunk.content || ''
            }
        }

        const totalTime = Date.now() - startTime

        let llmJudgeResult: { score: number | null } = {
            score: null,
        }

        if (['openai', 'anthropic', 'gemini'].includes(LLM_PROVIDER)) {
            llmJudgeResult = await llmJudgeAgent.judge(question.question, fullResponse, question.answer)
        }

        // Create the experiment result
        const experimentResult = DI.em.create(ExperimentResult, {
            uuid: randomUUID(),
            experiment,
            evaluationDatasetQuestion: question,
            answer: fullResponse,
            total_answer_time_ms: totalTime,
            time_to_first_token_ms: timeToFirstToken,
            llm_answer_rating: llmJudgeResult.score,
            metadata: {
                client_system_prompt: clientSystemPrompt,
                contextStr: contextStr || '',
                query: finalQuery,
            },
            created_at: new Date(),
        })

        await new UsageTrackingService(DI.em).incrementChatQueries(project.organization)

        await DI.em.persistAndFlush(experimentResult)

        return res.status(201).json({
            uuid: experimentResult.uuid,
            answer: experimentResult.answer,
            total_answer_time_ms: experimentResult.total_answer_time_ms,
            time_to_first_token_ms: experimentResult.time_to_first_token_ms,
        })
    } catch (error) {
        logger.error({ err: error }, 'Experiment run error')
        Sentry.captureException(error)
        return res.status(503).json({ error: 'Failed to run experiment' })
    }
}

const getResults = async (req: Request, res: Response) => {
    const user = req.context?.requestUser?.userInstance
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    const projectUuid = req.params.uuid
    const experimentUuid = req.params.experimentUuid

    if (!projectUuid || !experimentUuid) {
        return res.status(400).json({ error: 'Project UUID and Experiment UUID are required' })
    }

    const project = await DI.projects.findOne({ uuid: projectUuid })
    if (!project) {
        return res.status(404).json({ error: 'Project not found' })
    }

    // Verify user has access to this project's organization
    const membership = await DI.organizationMemberships.findOne({
        user: user,
        organization: project.organization,
    })
    if (!membership) {
        return res.status(403).json({ error: 'You do not have access to this project' })
    }

    const experiment = await DI.experiments.findOne({ uuid: experimentUuid, project: project })
    if (!experiment) {
        return res.status(404).json({ error: 'Experiment not found' })
    }

    const results = await DI.experimentResults.find(
        { experiment: experiment },
        { populate: ['evaluationDatasetQuestion'], orderBy: { created_at: 'ASC' } }
    )

    const response = results.map((result) => ({
        uuid: result.uuid,
        question: result.evaluationDatasetQuestion.question,
        expected_answer: result.evaluationDatasetQuestion.answer,
        answer: result.answer,
        total_answer_time_ms: result.total_answer_time_ms,
        time_to_first_token_ms: result.time_to_first_token_ms,
        llm_answer_rating: result.llm_answer_rating,
        human_answer_rating: result.human_answer_rating,
        created_at: result.created_at,
    }))

    res.status(200).json(response)
}

const deleteExperiment = async (req: Request, res: Response) => {
    const user = req.context?.requestUser?.userInstance
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    const projectUuid = req.params.uuid
    const experimentUuid = req.params.experimentUuid

    if (!projectUuid || !experimentUuid) {
        return res.status(400).json({ error: 'Project UUID and Experiment UUID are required' })
    }

    const project = await DI.projects.findOne({ uuid: projectUuid })
    if (!project) {
        return res.status(404).json({ error: 'Project not found' })
    }

    const membership = await DI.organizationMemberships.findOne({
        user: user,
        organization: project.organization,
    })
    if (!membership) {
        return res.status(403).json({ error: 'You do not have access to this project' })
    }

    const experiment = await DI.experiments.findOne({ uuid: experimentUuid, project: project })
    if (!experiment) {
        return res.status(404).json({ error: 'Experiment not found' })
    }

    await DI.em.transactional(async (em) => {
        // Delete all experiment results first
        await em.nativeDelete(ExperimentResult, { experiment })

        // Delete the experiment itself
        await em.nativeDelete(Experiment, { uuid: experimentUuid })
    })

    res.status(204).send()
}

experimentRouter.get('/', list)
experimentRouter.get('/:experimentUuid', getExperiment)
experimentRouter.get('/:experimentUuid/results', getResults)
experimentRouter.post('/', create)
experimentRouter.post('/:experimentUuid/run', run)
experimentRouter.delete('/:experimentUuid', deleteExperiment)
