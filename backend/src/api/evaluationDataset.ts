import express from 'express'
import { Request, Response } from 'express'
import { DI } from '@/di'
import { EvaluationDataset } from '@/entities/EvaluationDataset'
import { EvaluationDatasetQuestion } from '@/entities/EvaluationDatasetQuestion'
import { randomUUID } from 'crypto'

export const evaluationDatasetRouter = express.Router({ mergeParams: true })

interface EvaluationDatasetResponse {
    uuid: string
    name: string
    description: string
    created_at: Date
}

interface CreateEvaluationDatasetRequest {
    name: string
    description: string
    questions: {
        question: string
        answer: string
    }[]
}

interface EvaluationDatasetDetailResponse extends EvaluationDatasetResponse {
    questions: {
        uuid: string
        question: string
        answer: string
        created_at: Date
    }[]
}

interface UpdateQuestionRequest {
    question: string
    answer: string
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

    const datasets = await DI.evaluationDatasets.find({ project: project }, { orderBy: { created_at: 'DESC' } })

    const response: EvaluationDatasetResponse[] = datasets.map((dataset) => ({
        uuid: dataset.uuid,
        name: dataset.name,
        description: dataset.description || '',
        created_at: dataset.created_at,
    }))

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

    const { name, description, questions } = req.body as CreateEvaluationDatasetRequest

    if (!name || !description) {
        return res.status(400).json({ error: 'Name and description are required' })
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ error: 'At least one question is required' })
    }

    // Validate all questions have both question and answer
    for (const q of questions) {
        if (!q.question || !q.answer) {
            return res.status(400).json({ error: 'All questions must have both question and answer fields' })
        }
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

    // Create the dataset and questions in a transaction
    await DI.em.transactional(async (em) => {
        const dataset = em.create(EvaluationDataset, {
            uuid: randomUUID(),
            name,
            description,
            project,
            created_at: new Date(),
        })

        await em.persistAndFlush(dataset)

        // Create all questions
        for (const q of questions) {
            const question = em.create(EvaluationDatasetQuestion, {
                uuid: randomUUID(),
                question: q.question,
                answer: q.answer,
                evaluationDataset: dataset,
                created_at: new Date(),
            })
            em.persist(question)
        }

        await em.flush()

        const response: EvaluationDatasetResponse = {
            uuid: dataset.uuid,
            name: dataset.name,
            description: dataset.description || '',
            created_at: dataset.created_at,
        }

        res.status(201).json(response)
    })
}

const getDataset = async (req: Request, res: Response) => {
    const user = req.context?.requestUser?.userInstance
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    const projectUuid = req.params.uuid
    const datasetUuid = req.params.datasetUuid

    if (!projectUuid || !datasetUuid) {
        return res.status(400).json({ error: 'Project UUID and Dataset UUID are required' })
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

    const dataset = await DI.evaluationDatasets.findOne({ uuid: datasetUuid, project: project })
    if (!dataset) {
        return res.status(404).json({ error: 'Dataset not found' })
    }

    const questions = await DI.evaluationDatasetQuestions.find(
        { evaluationDataset: dataset },
        { orderBy: { created_at: 'ASC' } }
    )

    const response: EvaluationDatasetDetailResponse = {
        uuid: dataset.uuid,
        name: dataset.name,
        description: dataset.description || '',
        created_at: dataset.created_at,
        questions: questions.map((q) => ({
            uuid: q.uuid,
            question: q.question,
            answer: q.answer,
            created_at: q.created_at,
        })),
    }

    res.status(200).json(response)
}

const updateQuestion = async (req: Request, res: Response) => {
    const user = req.context?.requestUser?.userInstance
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    const projectUuid = req.params.uuid
    const datasetUuid = req.params.datasetUuid
    const questionUuid = req.params.questionUuid

    if (!projectUuid || !datasetUuid || !questionUuid) {
        return res.status(400).json({ error: 'Project UUID, Dataset UUID, and Question UUID are required' })
    }

    const { question, answer } = req.body as UpdateQuestionRequest

    if (!question || !answer) {
        return res.status(400).json({ error: 'Question and answer are required' })
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

    const dataset = await DI.evaluationDatasets.findOne({ uuid: datasetUuid, project: project })
    if (!dataset) {
        return res.status(404).json({ error: 'Dataset not found' })
    }

    const questionEntity = await DI.evaluationDatasetQuestions.findOne({
        uuid: questionUuid,
        evaluationDataset: dataset,
    })
    if (!questionEntity) {
        return res.status(404).json({ error: 'Question not found' })
    }

    questionEntity.question = question
    questionEntity.answer = answer

    await DI.em.persistAndFlush(questionEntity)

    res.status(200).json({
        uuid: questionEntity.uuid,
        question: questionEntity.question,
        answer: questionEntity.answer,
        created_at: questionEntity.created_at,
    })
}

interface ExportQuestionResponse {
    question: string
    answer: string
}

const exportDataset = async (req: Request, res: Response) => {
    const user = req.context?.requestUser?.userInstance
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    const projectUuid = req.params.uuid
    const datasetUuid = req.params.datasetUuid

    if (!projectUuid || !datasetUuid) {
        return res.status(400).json({ error: 'Project UUID and Dataset UUID are required' })
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

    const dataset = await DI.evaluationDatasets.findOne({ uuid: datasetUuid, project: project })
    if (!dataset) {
        return res.status(404).json({ error: 'Dataset not found' })
    }

    const questions = await DI.evaluationDatasetQuestions.find(
        { evaluationDataset: dataset },
        { orderBy: { created_at: 'ASC' } }
    )

    const response: ExportQuestionResponse[] = questions.map((q) => ({
        question: q.question,
        answer: q.answer,
    }))

    res.status(200).json(response)
}

evaluationDatasetRouter.get('/', list)
evaluationDatasetRouter.get('/:datasetUuid', getDataset)
evaluationDatasetRouter.get('/:datasetUuid/export', exportDataset)
evaluationDatasetRouter.post('/', create)
evaluationDatasetRouter.patch('/:datasetUuid/questions/:questionUuid', updateQuestion)
