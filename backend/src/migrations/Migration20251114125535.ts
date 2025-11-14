import { Migration } from '@mikro-orm/migrations';

export class Migration20251114125535 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "skald_evaluationdataset" ("uuid" uuid not null, "name" varchar(255) not null, "description" varchar(255) not null, "project_id" uuid not null, "created_at" timestamptz not null, constraint "skald_evaluationdataset_pkey" primary key ("uuid"));`);
    this.addSql(`create index "skald_evaluationdataset_project_id_idx" on "skald_evaluationdataset" ("project_id");`);

    this.addSql(`create table "skald_experiment" ("uuid" uuid not null, "title" varchar(255) not null, "description" varchar(255) not null, "properties" varchar(255) not null, "project_id" uuid not null, "evaluation_dataset_id" uuid not null, "created_at" timestamptz not null, constraint "skald_experiment_pkey" primary key ("uuid"));`);
    this.addSql(`create index "skald_experiment_project_id_idx" on "skald_experiment" ("project_id");`);
    this.addSql(`create index "skald_experiment_evaluation_dataset_id_idx" on "skald_experiment" ("evaluation_dataset_id");`);

    this.addSql(`create table "skald_evaluationdatasetquestion" ("uuid" uuid not null, "question" varchar(255) not null, "answer" varchar(255) not null, "evaluation_dataset_id" uuid not null, "created_at" timestamptz not null, constraint "skald_evaluationdatasetquestion_pkey" primary key ("uuid"));`);
    this.addSql(`create index "skald_evaluationdatasetquestion_evaluation_dataset_id_idx" on "skald_evaluationdatasetquestion" ("evaluation_dataset_id");`);

    this.addSql(`alter table "skald_evaluationdataset" add constraint "skald_evaluationdataset_project_id_foreign" foreign key ("project_id") references "skald_project" ("uuid") on update cascade deferrable initially deferred ;`);

    this.addSql(`alter table "skald_experiment" add constraint "skald_experiment_project_id_foreign" foreign key ("project_id") references "skald_project" ("uuid") on update cascade deferrable initially deferred ;`);
    this.addSql(`alter table "skald_experiment" add constraint "skald_experiment_evaluation_dataset_id_foreign" foreign key ("evaluation_dataset_id") references "skald_evaluationdataset" ("uuid") on update cascade deferrable initially deferred ;`);

    this.addSql(`alter table "skald_evaluationdatasetquestion" add constraint "skald_evaluationdatasetquestion_evaluation_dataset_id_foreign" foreign key ("evaluation_dataset_id") references "skald_evaluationdataset" ("uuid") on update cascade deferrable initially deferred ;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "skald_experiment" drop constraint "skald_experiment_evaluation_dataset_id_foreign";`);

    this.addSql(`alter table "skald_evaluationdatasetquestion" drop constraint "skald_evaluationdatasetquestion_evaluation_dataset_id_foreign";`);

    this.addSql(`drop table if exists "skald_evaluationdataset" cascade;`);

    this.addSql(`drop table if exists "skald_experiment" cascade;`);

    this.addSql(`drop table if exists "skald_evaluationdatasetquestion" cascade;`);
  }

}
