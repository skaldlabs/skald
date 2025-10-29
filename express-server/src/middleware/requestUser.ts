import { User } from '../entities/User'
import { Project } from '../entities/Project'

export class RequestUser {
    userInstance: User | null
    userType: 'authenticatedUser' | 'unauthenticatedUser' | 'projectAPIKeyUser'
    project: Project | null

    constructor(
        userInstance: User | null,
        userType: 'authenticatedUser' | 'unauthenticatedUser' | 'projectAPIKeyUser',
        project: Project | null
    ) {
        this.userInstance = userInstance
        this.userType = userType
        this.project = project
    }
}
