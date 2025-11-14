import { Migration } from '@mikro-orm/migrations';

export class Migration20251114181537 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "skald_evaluationdatasetquestion" alter column "question" type text using ("question"::text);`);
    this.addSql(`alter table "skald_evaluationdatasetquestion" alter column "answer" type text using ("answer"::text);`);

    this.addSql(`alter table "skald_experimentresult" alter column "answer" type text using ("answer"::text);`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "skald_evaluationdatasetquestion" alter column "question" type varchar(255) using ("question"::varchar(255));`);
    this.addSql(`alter table "skald_evaluationdatasetquestion" alter column "answer" type varchar(255) using ("answer"::varchar(255));`);

    this.addSql(`alter table "skald_experimentresult" alter column "answer" type varchar(255) using ("answer"::varchar(255));`);
  }

}
