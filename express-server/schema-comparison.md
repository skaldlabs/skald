# Schema Comparison Report: old.sql vs new.sql

This document details all differences found between the old.sql and new.sql schemas for tables that exist in new.sql.

## Summary

The main categories of differences are:
1. Index types (GIN vs BTREE for metadata)
2. Removal of `varchar_pattern_ops` from string indexes
3. Foreign key naming conventions
4. Addition of `ON UPDATE CASCADE` and `ON DELETE SET NULL` to foreign keys
5. Addition of `DEFERRABLE INITIALLY DEFERRED` to several unique constraints
6. Different sequence definition syntax

---

## Detailed Differences

### 1. skald_memo table - Index difference

**Location:**
- old.sql line 1059
- new.sql line 795

**Difference:**
- **old.sql**: Uses `GIN` index type
  ```sql
  CREATE INDEX skald_memo_metadat_9c96be_gin ON public.skald_memo USING gin (metadata);
  ```
- **new.sql**: Uses `BTREE` index type
  ```sql
  CREATE INDEX skald_memo_metadat_9c96be_gin ON public.skald_memo USING btree (metadata);
  ```

**Impact:** GIN indexes are typically better for JSONB queries, while BTREE is more general-purpose.

---

### 2. authtoken_token index - Pattern matching

**Location:**
- old.sql line 1017
- new.sql line 781

**Difference:**
- **old.sql**: Uses varchar_pattern_ops for the index
  ```sql
  CREATE INDEX authtoken_token_key_10f0b77e_like ON public.authtoken_token USING btree (key varchar_pattern_ops);
  ```
- **new.sql**: Simple btree index without varchar_pattern_ops
  ```sql
  CREATE INDEX authtoken_token_key_10f0b77e_like ON public.authtoken_token USING btree (key);
  ```

**Impact:** varchar_pattern_ops is optimized for LIKE queries with patterns.

---

### 3. skald_organizationsubscription indexes - Pattern matching

**Locations:**
- old.sql lines 1206, 1227, 1234
- new.sql lines 942, 963, 970

**Difference:**
- **old.sql**: All include `varchar_pattern_ops`
  ```sql
  CREATE INDEX skald_organizationsubscr_stripe_subscription_id_e67d0e5c_like
    ON public.skald_organizationsubscription USING btree (stripe_subscription_id varchar_pattern_ops);
  CREATE INDEX skald_organizationsubscription_stripe_customer_id_aa0de48c_like
    ON public.skald_organizationsubscription USING btree (stripe_customer_id varchar_pattern_ops);
  CREATE INDEX skald_organizationsubscription_stripe_schedule_id_3e51e1c3_like
    ON public.skald_organizationsubscription USING btree (stripe_schedule_id varchar_pattern_ops);
  ```
- **new.sql**: None include `varchar_pattern_ops`
  ```sql
  CREATE INDEX skald_organizationsubscr_stripe_subscription_id_e67d0e5c_like
    ON public.skald_organizationsubscription USING btree (stripe_subscription_id);
  CREATE INDEX skald_organizationsubscription_stripe_customer_id_aa0de48c_like
    ON public.skald_organizationsubscription USING btree (stripe_customer_id);
  CREATE INDEX skald_organizationsubscription_stripe_schedule_id_3e51e1c3_like
    ON public.skald_organizationsubscription USING btree (stripe_schedule_id);
  ```

---

### 4. skald_plan indexes - Pattern matching

**Locations:**
- old.sql lines 1241, 1248
- new.sql lines 977, 984

**Difference:**
- **old.sql**: Include `varchar_pattern_ops`
  ```sql
  CREATE INDEX skald_plan_slug_0a0cac0f_like ON public.skald_plan USING btree (slug varchar_pattern_ops);
  CREATE INDEX skald_plan_stripe_price_id_3080b1eb_like ON public.skald_plan USING btree (stripe_price_id varchar_pattern_ops);
  ```
- **new.sql**: Do not include `varchar_pattern_ops`
  ```sql
  CREATE INDEX skald_plan_slug_0a0cac0f_like ON public.skald_plan USING btree (slug);
  CREATE INDEX skald_plan_stripe_price_id_3080b1eb_like ON public.skald_plan USING btree (stripe_price_id);
  ```

---

### 5. skald_projectapikey index - Pattern matching

**Locations:**
- old.sql line 1269
- new.sql line 1005

**Difference:**
- **old.sql**: Includes `varchar_pattern_ops`
  ```sql
  CREATE INDEX skald_projectapikey_api_key_hash_a9fcb967_like ON public.skald_projectapikey USING btree (api_key_hash varchar_pattern_ops);
  ```
- **new.sql**: Does not include `varchar_pattern_ops`
  ```sql
  CREATE INDEX skald_projectapikey_api_key_hash_a9fcb967_like ON public.skald_projectapikey USING btree (api_key_hash);
  ```

---

### 6. skald_stripeevent index - Pattern matching

**Locations:**
- old.sql line 1297
- new.sql line 1033

**Difference:**
- **old.sql**: Includes `varchar_pattern_ops`
  ```sql
  CREATE INDEX skald_stripeevent_stripe_event_id_5dfbba10_like ON public.skald_stripeevent USING btree (stripe_event_id varchar_pattern_ops);
  ```
- **new.sql**: Does not include `varchar_pattern_ops`
  ```sql
  CREATE INDEX skald_stripeevent_stripe_event_id_5dfbba10_like ON public.skald_stripeevent USING btree (stripe_event_id);
  ```

---

### 7. skald_user email index - Pattern matching

**Locations:**
- old.sql line 1339
- new.sql line 1075

**Difference:**
- **old.sql**: Includes `varchar_pattern_ops`
  ```sql
  CREATE INDEX skald_user_email_16347cfd_like ON public.skald_user USING btree (email varchar_pattern_ops);
  ```
- **new.sql**: Does not include `varchar_pattern_ops`
  ```sql
  CREATE INDEX skald_user_email_16347cfd_like ON public.skald_user USING btree (email);
  ```

---

### 8. Foreign Key Constraints - Naming and CASCADE behavior

**All Foreign Keys Changed:**

All foreign key constraints in new.sql have:
- Simpler naming conventions (e.g., `_foreign` suffix instead of Django-style naming)
- `ON UPDATE CASCADE` clause added
- Some include `ON DELETE SET NULL` for nullable relationships

**Examples:**

| Table | old.sql Constraint Name | new.sql Constraint Name |
|-------|------------------------|------------------------|
| authtoken_token | `authtoken_token_user_id_35299eff_fk_skald_user_id` | `authtoken_token_user_id_foreign` |
| skald_emailverificationcode | `skald_emailverificationcode_user_id_260f5e14_fk_skald_user_id` | `skald_emailverificationcode_user_id_foreign` |
| skald_memo | `skald_memo_project_id_b4c56bf7_fk_skald_project_uuid` | `skald_memo_project_id_foreign` |
| skald_organization | `skald_organization_owner_id_c9bf676b_fk_skald_user_id` | `skald_organization_owner_id_foreign` |

**CASCADE Behavior Examples:**

**old.sql** (lines 1395-1399):
```sql
ALTER TABLE ONLY public.authtoken_token
    ADD CONSTRAINT authtoken_token_user_id_35299eff_fk_skald_user_id
    FOREIGN KEY (user_id) REFERENCES public.skald_user(id)
    DEFERRABLE INITIALLY DEFERRED;
```

**new.sql** (lines 1082-1084):
```sql
ALTER TABLE ONLY public.authtoken_token
    ADD CONSTRAINT authtoken_token_user_id_foreign
    FOREIGN KEY (user_id) REFERENCES public.skald_user(id)
    ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
```

**ON DELETE SET NULL Examples:**

**new.sql** (lines 1227, 1263-1267):
```sql
-- scheduled_plan_id foreign key
ADD CONSTRAINT skald_organizationsubscription_scheduled_plan_id_foreign
    FOREIGN KEY (scheduled_plan_id) REFERENCES public.skald_plan(id)
    ON UPDATE CASCADE ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED;

-- user current_project_id foreign key
ADD CONSTRAINT skald_user_current_project_id_foreign
    FOREIGN KEY (current_project_id) REFERENCES public.skald_project(uuid)
    ON UPDATE CASCADE ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED;
```

---

### 9. authtoken_token constraints - DEFERRABLE difference

**Locations:**
- old.sql line 686
- new.sql line 542

**Difference:**
- **old.sql**: Unique constraint without DEFERRABLE
  ```sql
  ALTER TABLE ONLY public.authtoken_token
      ADD CONSTRAINT authtoken_token_user_id_key UNIQUE (user_id);
  ```
- **new.sql**: Unique constraint with `DEFERRABLE INITIALLY DEFERRED`
  ```sql
  ALTER TABLE ONLY public.authtoken_token
      ADD CONSTRAINT authtoken_token_user_id_key UNIQUE (user_id) DEFERRABLE INITIALLY DEFERRED;
  ```

---

### 10. skald_emailverificationcode constraint

**Locations:**
- old.sql line 742
- new.sql line 566

**Difference:**
- **old.sql**: Without DEFERRABLE
  ```sql
  ALTER TABLE ONLY public.skald_emailverificationcode
      ADD CONSTRAINT skald_emailverificationcode_user_id_key UNIQUE (user_id);
  ```
- **new.sql**: With `DEFERRABLE INITIALLY DEFERRED`
  ```sql
  ALTER TABLE ONLY public.skald_emailverificationcode
      ADD CONSTRAINT skald_emailverificationcode_user_id_key UNIQUE (user_id) DEFERRABLE INITIALLY DEFERRED;
  ```

---

### 11. skald_organizationsubscription constraints

**Locations:**
- old.sql lines 830, 846, 854, 862
- new.sql lines 654, 670, 678, 686

**Difference:**
All four unique constraints in new.sql include `DEFERRABLE INITIALLY DEFERRED`:
- `skald_organizationsubscription_organization_id_key`
- `skald_organizationsubscription_stripe_customer_id_key`
- `skald_organizationsubscription_stripe_schedule_id_key`
- `skald_organizationsubscription_stripe_subscription_id_key`

---

### 12. Sequence definitions differ

**Approach Difference:**

**old.sql** (example lines 58-65):
```sql
ALTER TABLE public.auth_group ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_group_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
```

**new.sql** (example lines 70-83, 477):
```sql
CREATE SEQUENCE public.mikro_orm_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.mikro_orm_migrations_id_seq OWNED BY public.mikro_orm_migrations.id;

-- Later...
ALTER TABLE ONLY public.mikro_orm_migrations ALTER COLUMN id SET DEFAULT nextval('public.mikro_orm_migrations_id_seq'::regclass);
```

**Impact:** Both approaches create auto-incrementing columns, but the syntax differs. old.sql uses PostgreSQL's IDENTITY columns (SQL standard), while new.sql uses traditional sequences with DEFAULT nextval().

---

## Notes

- The old.sql schema appears to be generated by Django (based on naming conventions)
- The new.sql schema appears to be generated by MikroORM (based on the `mikro_orm_migrations` table and naming conventions)
- Most functional differences relate to index optimization strategies and referential integrity behavior
- The removal of `varchar_pattern_ops` may impact LIKE query performance on those columns
- The change from GIN to BTREE for JSONB metadata may impact query performance for JSONB operations
