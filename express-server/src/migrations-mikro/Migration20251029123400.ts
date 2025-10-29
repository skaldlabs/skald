import { Migration } from '@mikro-orm/migrations'

export class Migration20251029123400 extends Migration {
    override async up(): Promise<void> {
        this.addSql(
            `create table "skald_plan" ("id" bigserial primary key, "slug" varchar(50) not null, "name" varchar(100) not null, "stripe_price_id" varchar(255) null, "monthly_price" numeric(10,2) not null, "memo_operations_limit" int null, "chat_queries_limit" int null, "projects_limit" int null, "features" jsonb not null, "is_active" boolean not null, "is_default" boolean not null, "created_at" timestamptz not null, "updated_at" timestamptz not null);`
        )
        this.addSql(`create index "skald_plan_slug_0a0cac0f_like" on "skald_plan" ("slug");`)
        this.addSql(`alter table "skald_plan" add constraint "skald_plan_slug_key" unique ("slug");`)
        this.addSql(`create index "skald_plan_stripe_price_id_3080b1eb_like" on "skald_plan" ("stripe_price_id");`)
        this.addSql(
            `alter table "skald_plan" add constraint "skald_plan_stripe_price_id_key" unique ("stripe_price_id");`
        )

        this.addSql(
            `create table "skald_stripeevent" ("id" bigserial primary key, "stripe_event_id" varchar(255) not null, "event_type" varchar(100) not null, "payload" jsonb not null, "processed" boolean not null, "processing_error" text null, "created_at" timestamptz not null, "processed_at" timestamptz null);`
        )
        this.addSql(`create index "skald_strip_stripe__efbcc3_idx" on "skald_stripeevent" ("stripe_event_id");`)
        this.addSql(
            `alter table "skald_stripeevent" add constraint "skald_stripeevent_stripe_event_id_key" unique ("stripe_event_id");`
        )
        this.addSql(
            `create index "skald_stripeevent_stripe_event_id_5dfbba10_like" on "skald_stripeevent" ("stripe_event_id");`
        )
        this.addSql(`create index "skald_strip_event_t_1ffd58_idx" on "skald_stripeevent" ("event_type", "processed");`)

        this.addSql(
            `create table "skald_user" ("id" bigserial primary key, "password" varchar(128) not null, "last_login" timestamptz null, "is_superuser" boolean not null, "first_name" varchar(150) not null, "last_name" varchar(150) not null, "is_staff" boolean not null, "is_active" boolean not null, "date_joined" timestamptz not null, "email" varchar(254) not null, "email_verified" boolean not null, "name" varchar(255) not null, "default_organization_id" uuid null, "current_project_id" uuid null);`
        )
        this.addSql(`create index "skald_user_email_16347cfd_like" on "skald_user" ("email");`)
        this.addSql(`alter table "skald_user" add constraint "skald_user_email_key" unique ("email");`)
        this.addSql(
            `create index "skald_user_default_organization_id_0d57be46" on "skald_user" ("default_organization_id");`
        )
        this.addSql(`create index "skald_user_current_project_id_ed8d14d2" on "skald_user" ("current_project_id");`)

        this.addSql(
            `create table "skald_organization" ("uuid" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "name" varchar(255) not null, "owner_id" bigint not null, constraint "skald_organization_pkey" primary key ("uuid"));`
        )
        this.addSql(`create index "skald_organization_owner_id_c9bf676b" on "skald_organization" ("owner_id");`)

        this.addSql(
            `create table "skald_usagerecord" ("id" bigserial primary key, "billing_period_start" date not null, "billing_period_end" date not null, "memo_operations_count" int not null, "chat_queries_count" int not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "organization_id" uuid not null, "alerts_sent" jsonb not null);`
        )
        this.addSql(`create index "skald_usage_billing_07f781_idx" on "skald_usagerecord" ("billing_period_start");`)
        this.addSql(
            `create index "skald_usagerecord_organization_id_b31763fe" on "skald_usagerecord" ("organization_id");`
        )
        this.addSql(
            `create index "skald_usage_organiz_41ff84_idx" on "skald_usagerecord" ("organization_id", "billing_period_start");`
        )
        this.addSql(
            `alter table "skald_usagerecord" add constraint "skald_usagerecord_organization_id_billing__7c9da398_uniq" unique ("organization_id", "billing_period_start");`
        )

        this.addSql(
            `create table "skald_project" ("uuid" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "name" varchar(255) not null, "organization_id" uuid not null, "owner_id" bigint not null, constraint "skald_project_pkey" primary key ("uuid"));`
        )
        this.addSql(`create index "skald_project_organization_id_826910ec" on "skald_project" ("organization_id");`)
        this.addSql(`create index "skald_project_owner_id_5fc4828a" on "skald_project" ("owner_id");`)

        this.addSql(
            `create table "skald_projectapikey" ("api_key_hash" varchar(255) not null, "first_12_digits" varchar(12) not null, "created_at" timestamptz not null, "project_id" uuid not null, constraint "skald_projectapikey_pkey" primary key ("api_key_hash"));`
        )
        this.addSql(
            `create index "skald_projectapikey_api_key_hash_a9fcb967_like" on "skald_projectapikey" ("api_key_hash");`
        )
        this.addSql(`create index "skald_projectapikey_project_id_398f2e74" on "skald_projectapikey" ("project_id");`)

        this.addSql(
            `create table "skald_memo" ("uuid" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "title" varchar(255) not null, "content_length" int not null, "metadata" jsonb not null, "expiration_date" timestamptz null, "archived" boolean not null, "content_hash" varchar(255) not null, "pending" boolean not null, "type" varchar(255) null, "source" varchar(255) null, "client_reference_id" varchar(255) null, "project_id" uuid not null, constraint "skald_memo_pkey" primary key ("uuid"));`
        )
        this.addSql(`create index "skald_memo_metadat_9c96be_gin" on "skald_memo" ("metadata");`)
        this.addSql(`create index "skald_memo_project_id_b4c56bf7" on "skald_memo" ("project_id");`)
        this.addSql(`create index "skald_memo_project_88bd2e_idx" on "skald_memo" ("project_id", "source");`)
        this.addSql(
            `create index "skald_memo_project_8101aa_idx" on "skald_memo" ("project_id", "client_reference_id");`
        )

        this.addSql(
            `create table "skald_memotag" ("uuid" uuid not null, "tag" text not null, "memo_id" uuid not null, "project_id" uuid not null, constraint "skald_memotag_pkey" primary key ("uuid"));`
        )
        this.addSql(`create index "skald_memotag_memo_id_a7433d48" on "skald_memotag" ("memo_id");`)
        this.addSql(`create index "skald_memotag_project_id_968368ae" on "skald_memotag" ("project_id");`)

        this.addSql(
            `create table "skald_memosummary" ("uuid" uuid not null, "summary" text not null, "embedding" vector(2048) not null, "memo_id" uuid not null, "project_id" uuid not null, constraint "skald_memosummary_pkey" primary key ("uuid"));`
        )
        this.addSql(`create index "skald_memosummary_memo_id_43ac3024" on "skald_memosummary" ("memo_id");`)
        this.addSql(`create index "skald_memosummary_project_id_95cfb327" on "skald_memosummary" ("project_id");`)

        this.addSql(
            `create table "skald_memocontent" ("uuid" uuid not null, "content" text not null, "memo_id" uuid not null, "project_id" uuid not null, constraint "skald_memocontent_pkey" primary key ("uuid"));`
        )
        this.addSql(`create index "skald_memocontent_memo_id_f2eae36a" on "skald_memocontent" ("memo_id");`)
        this.addSql(`create index "skald_memocontent_project_id_fa46c46d" on "skald_memocontent" ("project_id");`)

        this.addSql(
            `create table "skald_memochunk" ("uuid" uuid not null, "chunk_content" text not null, "chunk_index" int not null, "embedding" vector(2048) not null, "memo_id" uuid not null, "project_id" uuid not null, constraint "skald_memochunk_pkey" primary key ("uuid"));`
        )
        this.addSql(`create index "skald_memochunk_memo_id_0faad25b" on "skald_memochunk" ("memo_id");`)
        this.addSql(`create index "skald_memochunk_project_id_6ec66677" on "skald_memochunk" ("project_id");`)

        this.addSql(
            `create table "skald_organizationsubscription" ("id" bigserial primary key, "stripe_customer_id" varchar(255) null, "stripe_subscription_id" varchar(255) null, "status" varchar(50) not null, "current_period_start" timestamptz not null, "current_period_end" timestamptz not null, "cancel_at_period_end" boolean not null, "canceled_at" timestamptz null, "trial_start" timestamptz null, "trial_end" timestamptz null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "organization_id" uuid not null, "plan_id" bigint not null, "scheduled_change_date" timestamptz null, "scheduled_plan_id" bigint null, "stripe_schedule_id" varchar(255) null);`
        )
        this.addSql(
            `create index "skald_organ_stripe__787c7f_idx" on "skald_organizationsubscription" ("stripe_customer_id");`
        )
        this.addSql(
            `alter table "skald_organizationsubscription" add constraint "skald_organizationsubscription_stripe_customer_id_key" unique ("stripe_customer_id");`
        )
        this.addSql(
            `create index "skald_organ_stripe__4bbed4_idx" on "skald_organizationsubscription" ("stripe_subscription_id");`
        )
        this.addSql(
            `alter table "skald_organizationsubscription" add constraint "skald_organizationsubscription_stripe_subscription_id_key" unique ("stripe_subscription_id");`
        )
        this.addSql(`create index "skald_organ_status_b30bd1_idx" on "skald_organizationsubscription" ("status");`)
        this.addSql(
            `alter table "skald_organizationsubscription" add constraint "skald_organizationsubscription_organization_id_key" unique ("organization_id") deferrable initially deferred;`
        )
        this.addSql(
            `create index "skald_organizationsubscription_plan_id_f66eaa4c" on "skald_organizationsubscription" ("plan_id");`
        )
        this.addSql(
            `create index "skald_organizationsubscription_scheduled_plan_id_607e5f4d" on "skald_organizationsubscription" ("scheduled_plan_id");`
        )
        this.addSql(
            `create index "skald_organ_stripe__fb7b46_idx" on "skald_organizationsubscription" ("stripe_schedule_id");`
        )
        this.addSql(
            `alter table "skald_organizationsubscription" add constraint "skald_organizationsubscription_stripe_schedule_id_key" unique ("stripe_schedule_id");`
        )
        this.addSql(
            `create index "skald_organizationsubscription_stripe_customer_id_aa0de48c_like" on "skald_organizationsubscription" ("stripe_customer_id");`
        )
        this.addSql(
            `create index "skald_organizationsubscr_stripe_subscription_id_e67d0e5c_like" on "skald_organizationsubscription" ("stripe_subscription_id");`
        )
        this.addSql(
            `create index "skald_organizationsubscription_stripe_schedule_id_3e51e1c3_like" on "skald_organizationsubscription" ("stripe_schedule_id");`
        )

        this.addSql(
            `create table "skald_organizationmembershipinvite" ("id" uuid not null, "email" varchar(254) not null, "created_at" timestamptz not null, "accepted_at" timestamptz null, "invited_by_id" bigint not null, "organization_id" uuid not null, constraint "skald_organizationmembershipinvite_pkey" primary key ("id"));`
        )
        this.addSql(
            `create index "skald_organizationmembershipinvite_invited_by_id_bb70bb84" on "skald_organizationmembershipinvite" ("invited_by_id");`
        )
        this.addSql(
            `create index "skald_organizationmembershipinvite_organization_id_f922971e" on "skald_organizationmembershipinvite" ("organization_id");`
        )
        this.addSql(
            `alter table "skald_organizationmembershipinvite" add constraint "skald_organizationmember_organization_id_email_a6273e0c_uniq" unique ("organization_id", "email");`
        )

        this.addSql(
            `create table "skald_organizationmembership" ("id" bigserial primary key, "access_level" int not null, "joined_at" timestamptz not null, "organization_id" uuid not null, "user_id" bigint not null);`
        )
        this.addSql(
            `create index "skald_organizationmembership_organization_id_21fd5aa7" on "skald_organizationmembership" ("organization_id");`
        )
        this.addSql(
            `create index "skald_organizationmembership_user_id_938634a4" on "skald_organizationmembership" ("user_id");`
        )
        this.addSql(
            `alter table "skald_organizationmembership" add constraint "skald_organizationmember_user_id_organization_id_539edeac_uniq" unique ("user_id", "organization_id");`
        )

        this.addSql(
            `create table "skald_emailverificationcode" ("id" bigserial primary key, "code" varchar(6) not null, "created_at" timestamptz not null, "expires_at" timestamptz not null, "attempts" int not null, "user_id" bigint not null);`
        )
        this.addSql(`create index "skald_email_code_27ca5e_idx" on "skald_emailverificationcode" ("code");`)
        this.addSql(
            `alter table "skald_emailverificationcode" add constraint "skald_emailverificationcode_user_id_key" unique ("user_id") deferrable initially deferred;`
        )

        this.addSql(
            `create table "authtoken_token" ("key" varchar(40) not null, "created" timestamptz not null, "user_id" bigint not null, constraint "authtoken_token_pkey" primary key ("key"));`
        )
        this.addSql(`create index "authtoken_token_key_10f0b77e_like" on "authtoken_token" ("key");`)
        this.addSql(
            `alter table "authtoken_token" add constraint "authtoken_token_user_id_key" unique ("user_id") deferrable initially deferred;`
        )

        this.addSql(
            `alter table "skald_user" add constraint "skald_user_default_organization_id_foreign" foreign key ("default_organization_id") references "skald_organization" ("uuid") on update cascade on delete set null deferrable initially deferred ;`
        )
        this.addSql(
            `alter table "skald_user" add constraint "skald_user_current_project_id_foreign" foreign key ("current_project_id") references "skald_project" ("uuid") on update cascade on delete set null deferrable initially deferred ;`
        )

        this.addSql(
            `alter table "skald_organization" add constraint "skald_organization_owner_id_foreign" foreign key ("owner_id") references "skald_user" ("id") on update cascade deferrable initially deferred ;`
        )

        this.addSql(
            `alter table "skald_usagerecord" add constraint "skald_usagerecord_organization_id_foreign" foreign key ("organization_id") references "skald_organization" ("uuid") on update cascade deferrable initially deferred ;`
        )

        this.addSql(
            `alter table "skald_project" add constraint "skald_project_organization_id_foreign" foreign key ("organization_id") references "skald_organization" ("uuid") on update cascade deferrable initially deferred ;`
        )
        this.addSql(
            `alter table "skald_project" add constraint "skald_project_owner_id_foreign" foreign key ("owner_id") references "skald_user" ("id") on update cascade deferrable initially deferred ;`
        )

        this.addSql(
            `alter table "skald_projectapikey" add constraint "skald_projectapikey_project_id_foreign" foreign key ("project_id") references "skald_project" ("uuid") on update cascade deferrable initially deferred ;`
        )

        this.addSql(
            `alter table "skald_memo" add constraint "skald_memo_project_id_foreign" foreign key ("project_id") references "skald_project" ("uuid") on update cascade deferrable initially deferred ;`
        )

        this.addSql(
            `alter table "skald_memotag" add constraint "skald_memotag_memo_id_foreign" foreign key ("memo_id") references "skald_memo" ("uuid") on update cascade deferrable initially deferred ;`
        )
        this.addSql(
            `alter table "skald_memotag" add constraint "skald_memotag_project_id_foreign" foreign key ("project_id") references "skald_project" ("uuid") on update cascade deferrable initially deferred ;`
        )

        this.addSql(
            `alter table "skald_memosummary" add constraint "skald_memosummary_memo_id_foreign" foreign key ("memo_id") references "skald_memo" ("uuid") on update cascade deferrable initially deferred ;`
        )
        this.addSql(
            `alter table "skald_memosummary" add constraint "skald_memosummary_project_id_foreign" foreign key ("project_id") references "skald_project" ("uuid") on update cascade deferrable initially deferred ;`
        )

        this.addSql(
            `alter table "skald_memocontent" add constraint "skald_memocontent_memo_id_foreign" foreign key ("memo_id") references "skald_memo" ("uuid") on update cascade deferrable initially deferred ;`
        )
        this.addSql(
            `alter table "skald_memocontent" add constraint "skald_memocontent_project_id_foreign" foreign key ("project_id") references "skald_project" ("uuid") on update cascade deferrable initially deferred ;`
        )

        this.addSql(
            `alter table "skald_memochunk" add constraint "skald_memochunk_memo_id_foreign" foreign key ("memo_id") references "skald_memo" ("uuid") on update cascade deferrable initially deferred ;`
        )
        this.addSql(
            `alter table "skald_memochunk" add constraint "skald_memochunk_project_id_foreign" foreign key ("project_id") references "skald_project" ("uuid") on update cascade deferrable initially deferred ;`
        )

        this.addSql(
            `alter table "skald_organizationsubscription" add constraint "skald_organizationsubscription_organization_id_foreign" foreign key ("organization_id") references "skald_organization" ("uuid") on update cascade deferrable initially deferred ;`
        )
        this.addSql(
            `alter table "skald_organizationsubscription" add constraint "skald_organizationsubscription_plan_id_foreign" foreign key ("plan_id") references "skald_plan" ("id") on update cascade deferrable initially deferred ;`
        )
        this.addSql(
            `alter table "skald_organizationsubscription" add constraint "skald_organizationsubscription_scheduled_plan_id_foreign" foreign key ("scheduled_plan_id") references "skald_plan" ("id") on update cascade on delete set null deferrable initially deferred ;`
        )

        this.addSql(
            `alter table "skald_organizationmembershipinvite" add constraint "skald_organizationmembershipinvite_invited_by_id_foreign" foreign key ("invited_by_id") references "skald_user" ("id") on update cascade deferrable initially deferred ;`
        )
        this.addSql(
            `alter table "skald_organizationmembershipinvite" add constraint "skald_organizationmembershipinvite_organization_id_foreign" foreign key ("organization_id") references "skald_organization" ("uuid") on update cascade deferrable initially deferred ;`
        )

        this.addSql(
            `alter table "skald_organizationmembership" add constraint "skald_organizationmembership_organization_id_foreign" foreign key ("organization_id") references "skald_organization" ("uuid") on update cascade deferrable initially deferred ;`
        )
        this.addSql(
            `alter table "skald_organizationmembership" add constraint "skald_organizationmembership_user_id_foreign" foreign key ("user_id") references "skald_user" ("id") on update cascade deferrable initially deferred ;`
        )

        this.addSql(
            `alter table "skald_emailverificationcode" add constraint "skald_emailverificationcode_user_id_foreign" foreign key ("user_id") references "skald_user" ("id") on update cascade deferrable initially deferred ;`
        )

        this.addSql(
            `alter table "authtoken_token" add constraint "authtoken_token_user_id_foreign" foreign key ("user_id") references "skald_user" ("id") on update cascade deferrable initially deferred ;`
        )
    }

    override async down(): Promise<void> {
        this.addSql(
            `alter table "skald_organizationsubscription" drop constraint "skald_organizationsubscription_plan_id_foreign";`
        )

        this.addSql(
            `alter table "skald_organizationsubscription" drop constraint "skald_organizationsubscription_scheduled_plan_id_foreign";`
        )

        this.addSql(`alter table "skald_organization" drop constraint "skald_organization_owner_id_foreign";`)

        this.addSql(`alter table "skald_project" drop constraint "skald_project_owner_id_foreign";`)

        this.addSql(
            `alter table "skald_organizationmembershipinvite" drop constraint "skald_organizationmembershipinvite_invited_by_id_foreign";`
        )

        this.addSql(
            `alter table "skald_organizationmembership" drop constraint "skald_organizationmembership_user_id_foreign";`
        )

        this.addSql(
            `alter table "skald_emailverificationcode" drop constraint "skald_emailverificationcode_user_id_foreign";`
        )

        this.addSql(`alter table "authtoken_token" drop constraint "authtoken_token_user_id_foreign";`)

        this.addSql(`alter table "skald_user" drop constraint "skald_user_default_organization_id_foreign";`)

        this.addSql(`alter table "skald_usagerecord" drop constraint "skald_usagerecord_organization_id_foreign";`)

        this.addSql(`alter table "skald_project" drop constraint "skald_project_organization_id_foreign";`)

        this.addSql(
            `alter table "skald_organizationsubscription" drop constraint "skald_organizationsubscription_organization_id_foreign";`
        )

        this.addSql(
            `alter table "skald_organizationmembershipinvite" drop constraint "skald_organizationmembershipinvite_organization_id_foreign";`
        )

        this.addSql(
            `alter table "skald_organizationmembership" drop constraint "skald_organizationmembership_organization_id_foreign";`
        )

        this.addSql(`alter table "skald_user" drop constraint "skald_user_current_project_id_foreign";`)

        this.addSql(`alter table "skald_projectapikey" drop constraint "skald_projectapikey_project_id_foreign";`)

        this.addSql(`alter table "skald_memo" drop constraint "skald_memo_project_id_foreign";`)

        this.addSql(`alter table "skald_memotag" drop constraint "skald_memotag_project_id_foreign";`)

        this.addSql(`alter table "skald_memosummary" drop constraint "skald_memosummary_project_id_foreign";`)

        this.addSql(`alter table "skald_memocontent" drop constraint "skald_memocontent_project_id_foreign";`)

        this.addSql(`alter table "skald_memochunk" drop constraint "skald_memochunk_project_id_foreign";`)

        this.addSql(`alter table "skald_memotag" drop constraint "skald_memotag_memo_id_foreign";`)

        this.addSql(`alter table "skald_memosummary" drop constraint "skald_memosummary_memo_id_foreign";`)

        this.addSql(`alter table "skald_memocontent" drop constraint "skald_memocontent_memo_id_foreign";`)

        this.addSql(`alter table "skald_memochunk" drop constraint "skald_memochunk_memo_id_foreign";`)

        this.addSql(`drop table if exists "skald_plan" cascade;`)

        this.addSql(`drop table if exists "skald_stripeevent" cascade;`)

        this.addSql(`drop table if exists "skald_user" cascade;`)

        this.addSql(`drop table if exists "skald_organization" cascade;`)

        this.addSql(`drop table if exists "skald_usagerecord" cascade;`)

        this.addSql(`drop table if exists "skald_project" cascade;`)

        this.addSql(`drop table if exists "skald_projectapikey" cascade;`)

        this.addSql(`drop table if exists "skald_memo" cascade;`)

        this.addSql(`drop table if exists "skald_memotag" cascade;`)

        this.addSql(`drop table if exists "skald_memosummary" cascade;`)

        this.addSql(`drop table if exists "skald_memocontent" cascade;`)

        this.addSql(`drop table if exists "skald_memochunk" cascade;`)

        this.addSql(`drop table if exists "skald_organizationsubscription" cascade;`)

        this.addSql(`drop table if exists "skald_organizationmembershipinvite" cascade;`)

        this.addSql(`drop table if exists "skald_organizationmembership" cascade;`)

        this.addSql(`drop table if exists "skald_emailverificationcode" cascade;`)

        this.addSql(`drop table if exists "authtoken_token" cascade;`)
    }
}
