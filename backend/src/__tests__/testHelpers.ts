import { MikroORM } from '@mikro-orm/postgresql'
import { User } from '../entities/User'
import { Organization } from '../entities/Organization'
import { Project } from '../entities/Project'
import { Memo } from '../entities/Memo'
import { MemoContent } from '../entities/MemoContent'
import { OrganizationMembership } from '../entities/OrganizationMembership'
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
        name: '',
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

export const createTestOrganization = async (orm: MikroORM, name: string, owner: User): Promise<Organization> => {
    const em = orm.em.fork()
    const organization = em.create(Organization, {
        uuid: randomUUID(),
        name,
        owner,
        created_at: new Date(),
        updated_at: new Date(),
    })
    await em.persistAndFlush(organization)
    return organization
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
        pending: false,
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
