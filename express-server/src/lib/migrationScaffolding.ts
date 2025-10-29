export class MigrationOperation {
    SQL: string
    rollbackSQL: string

    constructor({ SQL, rollbackSQL }: { SQL: string; rollbackSQL: string }) {
        this.SQL = SQL
        this.rollbackSQL = rollbackSQL
    }
}
