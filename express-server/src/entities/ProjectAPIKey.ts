import { DeferMode, Entity, ManyToOne, PrimaryKey, PrimaryKeyProp, Property } from '@mikro-orm/core'
import { Project } from './Project'

@Entity({ tableName: 'skald_projectapikey' })
export class ProjectAPIKey {
    [PrimaryKeyProp]?: 'api_key_hash'

    @PrimaryKey({ index: 'skald_projectapikey_api_key_hash_a9fcb967_like' })
    api_key_hash!: string

    @Property({ fieldName: 'first_12_digits', length: 12 })
    first_12_digits!: string

    @Property()
    created_at!: Date

    @ManyToOne({
        entity: () => Project,
        fieldName: 'project_id',
        deferMode: DeferMode.INITIALLY_DEFERRED,
        index: 'skald_projectapikey_project_id_398f2e74',
    })
    project!: Project
}
