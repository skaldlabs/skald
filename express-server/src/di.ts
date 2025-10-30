import http from 'http'
import { EntityManager, EntityRepository, MikroORM } from '@mikro-orm/postgresql'
import config from './mikro-orm.config'
import { Memo } from './entities/Memo'
import { User } from './entities/User'
import { Project } from './entities/Project'
import { OrganizationMembership } from './entities/OrganizationMembership'
import { ProjectAPIKey } from './entities/ProjectAPIKey'
import { MemoSummary } from './entities/MemoSummary'
import { MemoChunk } from './entities/MemoChunk'
import { MemoTag } from './entities/MemoTag'
import { MemoContent } from './entities/MemoContent'
import { Organization } from './entities/Organization'
import { OrganizationMembershipInvite } from './entities/OrganizationMembershipInvite'
import { EmailVerificationCode } from './entities/EmailVerificationCode'

export const DI = {} as {
    server: http.Server
    orm: MikroORM
    em: EntityManager
    organizations: EntityRepository<Organization>
    memos: EntityRepository<Memo>
    users: EntityRepository<User>
    projects: EntityRepository<Project>
    organizationMemberships: EntityRepository<OrganizationMembership>
    organizationMembershipInvites: EntityRepository<OrganizationMembershipInvite>
    projectAPIKeys: EntityRepository<ProjectAPIKey>
    memoSummaries: EntityRepository<MemoSummary>
    memoChunks: EntityRepository<MemoChunk>
    memoTags: EntityRepository<MemoTag>
    memoContents: EntityRepository<MemoContent>
    emailVerificationCodes: EntityRepository<EmailVerificationCode>
}

export const initDI = async (): Promise<typeof DI> => {
    DI.orm = await MikroORM.init(config)
    DI.em = DI.orm.em
    DI.organizations = DI.orm.em.getRepository(Organization)
    DI.memos = DI.orm.em.getRepository(Memo)
    DI.users = DI.orm.em.getRepository(User)
    DI.projects = DI.orm.em.getRepository(Project)
    DI.organizationMemberships = DI.orm.em.getRepository(OrganizationMembership)
    DI.organizationMembershipInvites = DI.orm.em.getRepository(OrganizationMembershipInvite)
    DI.projectAPIKeys = DI.orm.em.getRepository(ProjectAPIKey)
    DI.memoSummaries = DI.orm.em.getRepository(MemoSummary)
    DI.memoChunks = DI.orm.em.getRepository(MemoChunk)
    DI.memoTags = DI.orm.em.getRepository(MemoTag)
    DI.memoContents = DI.orm.em.getRepository(MemoContent)
    DI.emailVerificationCodes = DI.orm.em.getRepository(EmailVerificationCode)

    return DI
}
