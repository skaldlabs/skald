import { MikroORM } from '@mikro-orm/postgresql'
import { User } from '../entities/User'
import { Organization } from '../entities/Organization'
import { Project } from '../entities/Project'
import { Memo } from '../entities/Memo'
import { MemoContent } from '../entities/MemoContent'
import { OrganizationMembership } from '../entities/OrganizationMembership'
import { Plan } from '../entities/Plan'
import { OrganizationSubscription } from '../entities/OrganizationSubscription'
import { makePassword } from '../lib/passwordUtils'
import { randomUUID } from 'crypto'
import { createHash } from 'crypto'
import { Chat } from '@/entities/Chat'

export const createTestUser = async (orm: MikroORM, email: string, password: string): Promise<User> => {
    const em = orm.em.fork()
    const hashedPassword = makePassword(password)
    const user = em.create(User, {
        email,
        password: hashedPassword,
        emailVerified: true,
        first_name: '',
        last_name: '',
        is_superuser: false,
        is_staff: false,
        is_active: true,
        date_joined: new Date(),
    })
    await em.persistAndFlush(user)
    return user
}

export const getOrCreateTestPlan = async (orm: MikroORM): Promise<Plan> => {
    const em = orm.em.fork()

    // Try to find existing plan first
    let plan = await em.findOne(Plan, { slug: 'free' })

    if (!plan) {
        plan = em.create(Plan, {
            slug: 'free',
            name: 'Free',
            monthly_price: '0.00',
            memo_operations_limit: 1000,
            chat_queries_limit: 100,
            projects_limit: 1,
            features: {
                search_type: 'basic',
                support_level: 'community',
            },
            isActive: true,
            isDefault: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        })
        await em.persistAndFlush(plan)
    }

    return plan
}

// Legacy alias for backwards compatibility
export const createTestPlan = getOrCreateTestPlan

export const createTestOrganization = async (
    orm: MikroORM,
    name: string,
    owner: User,
    options: { skipSubscription?: boolean } = {}
): Promise<Organization> => {
    const em = orm.em.fork()
    const organization = em.create(Organization, {
        uuid: randomUUID(),
        name,
        owner,
        created_at: new Date(),
        updated_at: new Date(),
    })
    await em.persistAndFlush(organization)

    // Automatically create a subscription with the free plan unless explicitly skipped
    if (!options.skipSubscription) {
        const plan = await createTestPlan(orm)
        await createTestOrganizationSubscription(orm, organization, plan)
    }

    return organization
}

export const createTestOrganizationSubscription = async (
    orm: MikroORM,
    organization: Organization,
    plan: Plan
): Promise<OrganizationSubscription> => {
    const em = orm.em.fork()
    const now = new Date()
    const periodEnd = new Date()
    periodEnd.setMonth(periodEnd.getMonth() + 1)

    const subscription = em.create(OrganizationSubscription, {
        organization,
        plan,
        status: 'active',
        current_period_start: now,
        current_period_end: periodEnd,
        cancel_at_period_end: false,
        created_at: now,
        updated_at: now,
    })
    await em.persistAndFlush(subscription)
    return subscription
}

export const createTestProject = async (
    orm: MikroORM,
    name: string,
    organization: Organization,
    owner: User
): Promise<Project> => {
    const em = orm.em.fork()
    const project = em.create(Project, {
        uuid: randomUUID(),
        name,
        organization,
        owner,
        created_at: new Date(),
        updated_at: new Date(),
    })
    await em.persistAndFlush(project)
    return project
}

export const createTestOrganizationMembership = async (
    orm: MikroORM,
    user: User,
    organization: Organization,
    accessLevel: number = 1
): Promise<OrganizationMembership> => {
    const em = orm.em.fork()
    const membership = em.create(OrganizationMembership, {
        user,
        organization,
        accessLevel,
        joinedAt: new Date(),
    })
    await em.persistAndFlush(membership)
    return membership
}

export const createTestChat = async (orm: MikroORM, project: Project): Promise<Chat> => {
    const em = orm.em.fork()
    const chat = em.create(Chat, {
        uuid: randomUUID(),
        project,
        created_at: new Date(),
    })
    await em.persistAndFlush(chat)
    return chat
}

export const createTestMemo = async (
    orm: MikroORM,
    project: Project,
    data: {
        title: string
        content: string
        client_reference_id?: string
        source?: string
        type?: string
    }
): Promise<Memo> => {
    const em = orm.em.fork()
    const contentHash = createHash('sha256').update(data.content).digest('hex')
    const memo = em.create(Memo, {
        uuid: randomUUID(),
        title: data.title,
        content_length: data.content.length,
        content_hash: contentHash,
        metadata: {},
        archived: false,
        processing_status: 'received',
        processing_error: undefined,
        processing_started_at: undefined,
        processing_completed_at: undefined,
        project,
        client_reference_id: data.client_reference_id,
        source: data.source,
        type: data.type,
        created_at: new Date(),
        updated_at: new Date(),
    })

    const memoContent = em.create(MemoContent, {
        uuid: randomUUID(),
        memo,
        content: data.content,
        project,
    })

    await em.persistAndFlush([memo, memoContent])
    return memo
}

/**
 * Helper to create a complete test context with user, organization, plan, subscription, and project
 */
export const createTestContext = async (
    orm: MikroORM,
    email: string = 'test@example.com',
    password: string = 'password123',
    orgName: string = 'Test Org',
    projectName: string = 'Test Project'
) => {
    const user = await createTestUser(orm, email, password)
    const plan = await createTestPlan(orm)
    const org = await createTestOrganization(orm, orgName, user)
    await createTestOrganizationSubscription(orm, org, plan)
    await createTestOrganizationMembership(orm, user, org)
    const project = await createTestProject(orm, projectName, org, user)

    return { user, org, plan, project }
}
