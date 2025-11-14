import express from 'express'
import { Request, Response } from 'express'
import { DI } from '@/di'
import { Experiment } from '@/entities/Experiment'
import { randomUUID } from 'crypto'

export const experimentRouter = express.Router({ mergeParams: true })

interface ExperimentResponse {
    uuid: string
    title: string
    description: string
    properties: Record<string, any>
    evaluation_dataset_uuid: string
    evaluation_dataset_name: string
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

    const response: ExperimentResponse[] = experiments.map((experiment) => ({
        uuid: experiment.uuid,
        title: experiment.title,
        description: experiment.description,
        properties: experiment.properties,
        evaluation_dataset_uuid: experiment.evaluationDataset.uuid,
        evaluation_dataset_name: experiment.evaluationDataset.name,
        created_at: experiment.created_at,
    }))

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

    const response: ExperimentResponse = {
        uuid: experiment.uuid,
        title: experiment.title,
        description: experiment.description,
        properties: experiment.properties,
        evaluation_dataset_uuid: experiment.evaluationDataset.uuid,
        evaluation_dataset_name: experiment.evaluationDataset.name,
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

    const response: ExperimentResponse = {
        uuid: experiment.uuid,
        title: experiment.title,
        description: experiment.description,
        properties: experiment.properties,
        evaluation_dataset_uuid: experiment.evaluationDataset.uuid,
        evaluation_dataset_name: experiment.evaluationDataset.name,
        created_at: experiment.created_at,
    }

    res.status(201).json(response)
}

experimentRouter.get('/', list)
experimentRouter.get('/:experimentUuid', getExperiment)
experimentRouter.post('/', create)
