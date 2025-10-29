--
-- PostgreSQL database dump
--

-- Dumped from database version 16.8 (Homebrew)
-- Dumped by pg_dump version 16.8 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: authtoken_token; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.authtoken_token (
    key character varying(40) NOT NULL,
    created timestamp with time zone NOT NULL,
    user_id bigint NOT NULL
);


--
-- Name: mikro_orm_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mikro_orm_migrations (
    id integer NOT NULL,
    name character varying(255),
    executed_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: mikro_orm_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.mikro_orm_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: mikro_orm_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.mikro_orm_migrations_id_seq OWNED BY public.mikro_orm_migrations.id;


--
-- Name: skald_emailverificationcode; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skald_emailverificationcode (
    id bigint NOT NULL,
    code character varying(6) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    attempts integer NOT NULL,
    user_id bigint NOT NULL
);


--
-- Name: skald_emailverificationcode_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.skald_emailverificationcode_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: skald_emailverificationcode_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.skald_emailverificationcode_id_seq OWNED BY public.skald_emailverificationcode.id;


--
-- Name: skald_memo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skald_memo (
    uuid uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    title character varying(255) NOT NULL,
    content_length integer NOT NULL,
    metadata jsonb NOT NULL,
    expiration_date timestamp with time zone,
    archived boolean NOT NULL,
    content_hash character varying(255) NOT NULL,
    pending boolean NOT NULL,
    type character varying(255),
    source character varying(255),
    client_reference_id character varying(255),
    project_id uuid NOT NULL
);


--
-- Name: skald_memochunk; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skald_memochunk (
    uuid uuid NOT NULL,
    chunk_content text NOT NULL,
    chunk_index integer NOT NULL,
    embedding public.vector(2048) NOT NULL,
    memo_id uuid NOT NULL,
    project_id uuid NOT NULL
);


--
-- Name: skald_memocontent; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skald_memocontent (
    uuid uuid NOT NULL,
    content text NOT NULL,
    memo_id uuid NOT NULL,
    project_id uuid NOT NULL
);


--
-- Name: skald_memosummary; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skald_memosummary (
    uuid uuid NOT NULL,
    summary text NOT NULL,
    embedding public.vector(2048) NOT NULL,
    memo_id uuid NOT NULL,
    project_id uuid NOT NULL
);


--
-- Name: skald_memotag; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skald_memotag (
    uuid uuid NOT NULL,
    tag text NOT NULL,
    memo_id uuid NOT NULL,
    project_id uuid NOT NULL
);


--
-- Name: skald_organization; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skald_organization (
    uuid uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    name character varying(255) NOT NULL,
    owner_id bigint NOT NULL
);


--
-- Name: skald_organizationmembership; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skald_organizationmembership (
    id bigint NOT NULL,
    access_level integer NOT NULL,
    joined_at timestamp with time zone NOT NULL,
    organization_id uuid NOT NULL,
    user_id bigint NOT NULL
);


--
-- Name: skald_organizationmembership_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.skald_organizationmembership_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: skald_organizationmembership_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.skald_organizationmembership_id_seq OWNED BY public.skald_organizationmembership.id;


--
-- Name: skald_organizationmembershipinvite; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skald_organizationmembershipinvite (
    id uuid NOT NULL,
    email character varying(254) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    accepted_at timestamp with time zone,
    invited_by_id bigint NOT NULL,
    organization_id uuid NOT NULL
);


--
-- Name: skald_organizationsubscription; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skald_organizationsubscription (
    id bigint NOT NULL,
    stripe_customer_id character varying(255),
    stripe_subscription_id character varying(255),
    status character varying(50) NOT NULL,
    current_period_start timestamp with time zone NOT NULL,
    current_period_end timestamp with time zone NOT NULL,
    cancel_at_period_end boolean NOT NULL,
    canceled_at timestamp with time zone,
    trial_start timestamp with time zone,
    trial_end timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    organization_id uuid NOT NULL,
    plan_id bigint NOT NULL,
    scheduled_change_date timestamp with time zone,
    scheduled_plan_id bigint,
    stripe_schedule_id character varying(255)
);


--
-- Name: skald_organizationsubscription_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.skald_organizationsubscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: skald_organizationsubscription_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.skald_organizationsubscription_id_seq OWNED BY public.skald_organizationsubscription.id;


--
-- Name: skald_plan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skald_plan (
    id bigint NOT NULL,
    slug character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    stripe_price_id character varying(255),
    monthly_price numeric(10,2) NOT NULL,
    memo_operations_limit integer,
    chat_queries_limit integer,
    projects_limit integer,
    features jsonb NOT NULL,
    is_active boolean NOT NULL,
    is_default boolean NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: skald_plan_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.skald_plan_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: skald_plan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.skald_plan_id_seq OWNED BY public.skald_plan.id;


--
-- Name: skald_project; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skald_project (
    uuid uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    name character varying(255) NOT NULL,
    organization_id uuid NOT NULL,
    owner_id bigint NOT NULL
);


--
-- Name: skald_projectapikey; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skald_projectapikey (
    api_key_hash character varying(255) NOT NULL,
    first_12_digits character varying(12) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    project_id uuid NOT NULL
);


--
-- Name: skald_stripeevent; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skald_stripeevent (
    id bigint NOT NULL,
    stripe_event_id character varying(255) NOT NULL,
    event_type character varying(100) NOT NULL,
    payload jsonb NOT NULL,
    processed boolean NOT NULL,
    processing_error text,
    created_at timestamp with time zone NOT NULL,
    processed_at timestamp with time zone
);


--
-- Name: skald_stripeevent_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.skald_stripeevent_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: skald_stripeevent_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.skald_stripeevent_id_seq OWNED BY public.skald_stripeevent.id;


--
-- Name: skald_usagerecord; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skald_usagerecord (
    id bigint NOT NULL,
    billing_period_start date NOT NULL,
    billing_period_end date NOT NULL,
    memo_operations_count integer NOT NULL,
    chat_queries_count integer NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    organization_id uuid NOT NULL,
    alerts_sent jsonb NOT NULL
);


--
-- Name: skald_usagerecord_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.skald_usagerecord_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: skald_usagerecord_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.skald_usagerecord_id_seq OWNED BY public.skald_usagerecord.id;


--
-- Name: skald_user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skald_user (
    id bigint NOT NULL,
    password character varying(128) NOT NULL,
    last_login timestamp with time zone,
    is_superuser boolean NOT NULL,
    first_name character varying(150) NOT NULL,
    last_name character varying(150) NOT NULL,
    is_staff boolean NOT NULL,
    is_active boolean NOT NULL,
    date_joined timestamp with time zone NOT NULL,
    email character varying(254) NOT NULL,
    email_verified boolean NOT NULL,
    name character varying(255) NOT NULL,
    default_organization_id uuid,
    current_project_id uuid
);


--
-- Name: skald_user_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.skald_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: skald_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.skald_user_id_seq OWNED BY public.skald_user.id;


--
-- Name: mikro_orm_migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mikro_orm_migrations ALTER COLUMN id SET DEFAULT nextval('public.mikro_orm_migrations_id_seq'::regclass);


--
-- Name: skald_emailverificationcode id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_emailverificationcode ALTER COLUMN id SET DEFAULT nextval('public.skald_emailverificationcode_id_seq'::regclass);


--
-- Name: skald_organizationmembership id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_organizationmembership ALTER COLUMN id SET DEFAULT nextval('public.skald_organizationmembership_id_seq'::regclass);


--
-- Name: skald_organizationsubscription id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_organizationsubscription ALTER COLUMN id SET DEFAULT nextval('public.skald_organizationsubscription_id_seq'::regclass);


--
-- Name: skald_plan id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_plan ALTER COLUMN id SET DEFAULT nextval('public.skald_plan_id_seq'::regclass);


--
-- Name: skald_stripeevent id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_stripeevent ALTER COLUMN id SET DEFAULT nextval('public.skald_stripeevent_id_seq'::regclass);


--
-- Name: skald_usagerecord id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_usagerecord ALTER COLUMN id SET DEFAULT nextval('public.skald_usagerecord_id_seq'::regclass);


--
-- Name: skald_user id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_user ALTER COLUMN id SET DEFAULT nextval('public.skald_user_id_seq'::regclass);


--
-- Name: authtoken_token authtoken_token_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.authtoken_token
    ADD CONSTRAINT authtoken_token_pkey PRIMARY KEY (key);


--
-- Name: authtoken_token authtoken_token_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.authtoken_token
    ADD CONSTRAINT authtoken_token_user_id_key UNIQUE (user_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: mikro_orm_migrations mikro_orm_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mikro_orm_migrations
    ADD CONSTRAINT mikro_orm_migrations_pkey PRIMARY KEY (id);


--
-- Name: skald_emailverificationcode skald_emailverificationcode_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_emailverificationcode
    ADD CONSTRAINT skald_emailverificationcode_pkey PRIMARY KEY (id);


--
-- Name: skald_emailverificationcode skald_emailverificationcode_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_emailverificationcode
    ADD CONSTRAINT skald_emailverificationcode_user_id_key UNIQUE (user_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: skald_memo skald_memo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_memo
    ADD CONSTRAINT skald_memo_pkey PRIMARY KEY (uuid);


--
-- Name: skald_memochunk skald_memochunk_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_memochunk
    ADD CONSTRAINT skald_memochunk_pkey PRIMARY KEY (uuid);


--
-- Name: skald_memocontent skald_memocontent_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_memocontent
    ADD CONSTRAINT skald_memocontent_pkey PRIMARY KEY (uuid);


--
-- Name: skald_memosummary skald_memosummary_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_memosummary
    ADD CONSTRAINT skald_memosummary_pkey PRIMARY KEY (uuid);


--
-- Name: skald_memotag skald_memotag_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_memotag
    ADD CONSTRAINT skald_memotag_pkey PRIMARY KEY (uuid);


--
-- Name: skald_organization skald_organization_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_organization
    ADD CONSTRAINT skald_organization_pkey PRIMARY KEY (uuid);


--
-- Name: skald_organizationmembershipinvite skald_organizationmember_organization_id_email_a6273e0c_uniq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_organizationmembershipinvite
    ADD CONSTRAINT skald_organizationmember_organization_id_email_a6273e0c_uniq UNIQUE (organization_id, email);


--
-- Name: skald_organizationmembership skald_organizationmember_user_id_organization_id_539edeac_uniq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_organizationmembership
    ADD CONSTRAINT skald_organizationmember_user_id_organization_id_539edeac_uniq UNIQUE (user_id, organization_id);


--
-- Name: skald_organizationmembership skald_organizationmembership_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_organizationmembership
    ADD CONSTRAINT skald_organizationmembership_pkey PRIMARY KEY (id);


--
-- Name: skald_organizationmembershipinvite skald_organizationmembershipinvite_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_organizationmembershipinvite
    ADD CONSTRAINT skald_organizationmembershipinvite_pkey PRIMARY KEY (id);


--
-- Name: skald_organizationsubscription skald_organizationsubscription_organization_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_organizationsubscription
    ADD CONSTRAINT skald_organizationsubscription_organization_id_key UNIQUE (organization_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: skald_organizationsubscription skald_organizationsubscription_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_organizationsubscription
    ADD CONSTRAINT skald_organizationsubscription_pkey PRIMARY KEY (id);


--
-- Name: skald_organizationsubscription skald_organizationsubscription_stripe_customer_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_organizationsubscription
    ADD CONSTRAINT skald_organizationsubscription_stripe_customer_id_key UNIQUE (stripe_customer_id);


--
-- Name: skald_organizationsubscription skald_organizationsubscription_stripe_schedule_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_organizationsubscription
    ADD CONSTRAINT skald_organizationsubscription_stripe_schedule_id_key UNIQUE (stripe_schedule_id);


--
-- Name: skald_organizationsubscription skald_organizationsubscription_stripe_subscription_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_organizationsubscription
    ADD CONSTRAINT skald_organizationsubscription_stripe_subscription_id_key UNIQUE (stripe_subscription_id);


--
-- Name: skald_plan skald_plan_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_plan
    ADD CONSTRAINT skald_plan_pkey PRIMARY KEY (id);


--
-- Name: skald_plan skald_plan_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_plan
    ADD CONSTRAINT skald_plan_slug_key UNIQUE (slug);


--
-- Name: skald_plan skald_plan_stripe_price_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_plan
    ADD CONSTRAINT skald_plan_stripe_price_id_key UNIQUE (stripe_price_id);


--
-- Name: skald_project skald_project_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_project
    ADD CONSTRAINT skald_project_pkey PRIMARY KEY (uuid);


--
-- Name: skald_projectapikey skald_projectapikey_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_projectapikey
    ADD CONSTRAINT skald_projectapikey_pkey PRIMARY KEY (api_key_hash);


--
-- Name: skald_stripeevent skald_stripeevent_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_stripeevent
    ADD CONSTRAINT skald_stripeevent_pkey PRIMARY KEY (id);


--
-- Name: skald_stripeevent skald_stripeevent_stripe_event_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_stripeevent
    ADD CONSTRAINT skald_stripeevent_stripe_event_id_key UNIQUE (stripe_event_id);


--
-- Name: skald_usagerecord skald_usagerecord_organization_id_billing__7c9da398_uniq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_usagerecord
    ADD CONSTRAINT skald_usagerecord_organization_id_billing__7c9da398_uniq UNIQUE (organization_id, billing_period_start);


--
-- Name: skald_usagerecord skald_usagerecord_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_usagerecord
    ADD CONSTRAINT skald_usagerecord_pkey PRIMARY KEY (id);


--
-- Name: skald_user skald_user_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_user
    ADD CONSTRAINT skald_user_email_key UNIQUE (email);


--
-- Name: skald_user skald_user_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_user
    ADD CONSTRAINT skald_user_pkey PRIMARY KEY (id);


--
-- Name: authtoken_token_key_10f0b77e_like; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX authtoken_token_key_10f0b77e_like ON public.authtoken_token USING btree (key);


--
-- Name: skald_email_code_27ca5e_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX skald_email_code_27ca5e_idx ON public.skald_emailverificationcode USING btree (code);


--
-- Name: skald_memo_metadat_9c96be_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX skald_memo_metadat_9c96be_gin ON public.skald_memo USING btree (metadata);


--
-- Name: skald_memo_project_8101aa_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX skald_memo_project_8101aa_idx ON public.skald_memo USING btree (project_id, client_reference_id);


--
-- Name: skald_memo_project_88bd2e_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX skald_memo_project_88bd2e_idx ON public.skald_memo USING btree (project_id, source);


--
-- Name: skald_memo_project_id_b4c56bf7; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX skald_memo_project_id_b4c56bf7 ON public.skald_memo USING btree (project_id);


--
-- Name: skald_memochunk_memo_id_0faad25b; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX skald_memochunk_memo_id_0faad25b ON public.skald_memochunk USING btree (memo_id);


--
-- Name: skald_memochunk_project_id_6ec66677; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX skald_memochunk_project_id_6ec66677 ON public.skald_memochunk USING btree (project_id);


--
-- Name: skald_memocontent_memo_id_f2eae36a; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX skald_memocontent_memo_id_f2eae36a ON public.skald_memocontent USING btree (memo_id);


--
-- Name: skald_memocontent_project_id_fa46c46d; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX skald_memocontent_project_id_fa46c46d ON public.skald_memocontent USING btree (project_id);


--
-- Name: skald_memosummary_memo_id_43ac3024; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX skald_memosummary_memo_id_43ac3024 ON public.skald_memosummary USING btree (memo_id);


--
-- Name: skald_memosummary_project_id_95cfb327; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX skald_memosummary_project_id_95cfb327 ON public.skald_memosummary USING btree (project_id);


--
-- Name: skald_memotag_memo_id_a7433d48; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX skald_memotag_memo_id_a7433d48 ON public.skald_memotag USING btree (memo_id);


--
-- Name: skald_memotag_project_id_968368ae; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX skald_memotag_project_id_968368ae ON public.skald_memotag USING btree (project_id);


--
-- Name: skald_organ_status_b30bd1_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX skald_organ_status_b30bd1_idx ON public.skald_organizationsubscription USING btree (status);


--
-- Name: skald_organ_stripe__4bbed4_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX skald_organ_stripe__4bbed4_idx ON public.skald_organizationsubscription USING btree (stripe_subscription_id);


--
-- Name: skald_organ_stripe__787c7f_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX skald_organ_stripe__787c7f_idx ON public.skald_organizationsubscription USING btree (stripe_customer_id);


--
-- Name: skald_organ_stripe__fb7b46_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX skald_organ_stripe__fb7b46_idx ON public.skald_organizationsubscription USING btree (stripe_schedule_id);


--
-- Name: skald_organization_owner_id_c9bf676b; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX skald_organization_owner_id_c9bf676b ON public.skald_organization USING btree (owner_id);


--
-- Name: skald_organizationmembership_organization_id_21fd5aa7; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX skald_organizationmembership_organization_id_21fd5aa7 ON public.skald_organizationmembership USING btree (organization_id);


--
-- Name: skald_organizationmembership_user_id_938634a4; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX skald_organizationmembership_user_id_938634a4 ON public.skald_organizationmembership USING btree (user_id);


--
-- Name: skald_organizationmembershipinvite_invited_by_id_bb70bb84; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX skald_organizationmembershipinvite_invited_by_id_bb70bb84 ON public.skald_organizationmembershipinvite USING btree (invited_by_id);


--
-- Name: skald_organizationmembershipinvite_organization_id_f922971e; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX skald_organizationmembershipinvite_organization_id_f922971e ON public.skald_organizationmembershipinvite USING btree (organization_id);


--
-- Name: skald_organizationsubscr_stripe_subscription_id_e67d0e5c_like; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX skald_organizationsubscr_stripe_subscription_id_e67d0e5c_like ON public.skald_organizationsubscription USING btree (stripe_subscription_id);


--
-- Name: skald_organizationsubscription_plan_id_f66eaa4c; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX skald_organizationsubscription_plan_id_f66eaa4c ON public.skald_organizationsubscription USING btree (plan_id);


--
-- Name: skald_organizationsubscription_scheduled_plan_id_607e5f4d; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX skald_organizationsubscription_scheduled_plan_id_607e5f4d ON public.skald_organizationsubscription USING btree (scheduled_plan_id);


--
-- Name: skald_organizationsubscription_stripe_customer_id_aa0de48c_like; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX skald_organizationsubscription_stripe_customer_id_aa0de48c_like ON public.skald_organizationsubscription USING btree (stripe_customer_id);


--
-- Name: skald_organizationsubscription_stripe_schedule_id_3e51e1c3_like; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX skald_organizationsubscription_stripe_schedule_id_3e51e1c3_like ON public.skald_organizationsubscription USING btree (stripe_schedule_id);


--
-- Name: skald_plan_slug_0a0cac0f_like; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX skald_plan_slug_0a0cac0f_like ON public.skald_plan USING btree (slug);


--
-- Name: skald_plan_stripe_price_id_3080b1eb_like; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX skald_plan_stripe_price_id_3080b1eb_like ON public.skald_plan USING btree (stripe_price_id);


--
-- Name: skald_project_organization_id_826910ec; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX skald_project_organization_id_826910ec ON public.skald_project USING btree (organization_id);


--
-- Name: skald_project_owner_id_5fc4828a; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX skald_project_owner_id_5fc4828a ON public.skald_project USING btree (owner_id);


--
-- Name: skald_projectapikey_api_key_hash_a9fcb967_like; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX skald_projectapikey_api_key_hash_a9fcb967_like ON public.skald_projectapikey USING btree (api_key_hash);


--
-- Name: skald_projectapikey_project_id_398f2e74; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX skald_projectapikey_project_id_398f2e74 ON public.skald_projectapikey USING btree (project_id);


--
-- Name: skald_strip_event_t_1ffd58_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX skald_strip_event_t_1ffd58_idx ON public.skald_stripeevent USING btree (event_type, processed);


--
-- Name: skald_strip_stripe__efbcc3_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX skald_strip_stripe__efbcc3_idx ON public.skald_stripeevent USING btree (stripe_event_id);


--
-- Name: skald_stripeevent_stripe_event_id_5dfbba10_like; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX skald_stripeevent_stripe_event_id_5dfbba10_like ON public.skald_stripeevent USING btree (stripe_event_id);


--
-- Name: skald_usage_billing_07f781_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX skald_usage_billing_07f781_idx ON public.skald_usagerecord USING btree (billing_period_start);


--
-- Name: skald_usage_organiz_41ff84_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX skald_usage_organiz_41ff84_idx ON public.skald_usagerecord USING btree (organization_id, billing_period_start);


--
-- Name: skald_usagerecord_organization_id_b31763fe; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX skald_usagerecord_organization_id_b31763fe ON public.skald_usagerecord USING btree (organization_id);


--
-- Name: skald_user_current_project_id_ed8d14d2; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX skald_user_current_project_id_ed8d14d2 ON public.skald_user USING btree (current_project_id);


--
-- Name: skald_user_default_organization_id_0d57be46; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX skald_user_default_organization_id_0d57be46 ON public.skald_user USING btree (default_organization_id);


--
-- Name: skald_user_email_16347cfd_like; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX skald_user_email_16347cfd_like ON public.skald_user USING btree (email);


--
-- Name: authtoken_token authtoken_token_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.authtoken_token
    ADD CONSTRAINT authtoken_token_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.skald_user(id) ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;


--
-- Name: skald_emailverificationcode skald_emailverificationcode_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_emailverificationcode
    ADD CONSTRAINT skald_emailverificationcode_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.skald_user(id) ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;


--
-- Name: skald_memo skald_memo_project_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_memo
    ADD CONSTRAINT skald_memo_project_id_foreign FOREIGN KEY (project_id) REFERENCES public.skald_project(uuid) ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;


--
-- Name: skald_memochunk skald_memochunk_memo_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_memochunk
    ADD CONSTRAINT skald_memochunk_memo_id_foreign FOREIGN KEY (memo_id) REFERENCES public.skald_memo(uuid) ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;


--
-- Name: skald_memochunk skald_memochunk_project_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_memochunk
    ADD CONSTRAINT skald_memochunk_project_id_foreign FOREIGN KEY (project_id) REFERENCES public.skald_project(uuid) ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;


--
-- Name: skald_memocontent skald_memocontent_memo_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_memocontent
    ADD CONSTRAINT skald_memocontent_memo_id_foreign FOREIGN KEY (memo_id) REFERENCES public.skald_memo(uuid) ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;


--
-- Name: skald_memocontent skald_memocontent_project_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_memocontent
    ADD CONSTRAINT skald_memocontent_project_id_foreign FOREIGN KEY (project_id) REFERENCES public.skald_project(uuid) ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;


--
-- Name: skald_memosummary skald_memosummary_memo_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_memosummary
    ADD CONSTRAINT skald_memosummary_memo_id_foreign FOREIGN KEY (memo_id) REFERENCES public.skald_memo(uuid) ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;


--
-- Name: skald_memosummary skald_memosummary_project_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_memosummary
    ADD CONSTRAINT skald_memosummary_project_id_foreign FOREIGN KEY (project_id) REFERENCES public.skald_project(uuid) ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;


--
-- Name: skald_memotag skald_memotag_memo_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_memotag
    ADD CONSTRAINT skald_memotag_memo_id_foreign FOREIGN KEY (memo_id) REFERENCES public.skald_memo(uuid) ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;


--
-- Name: skald_memotag skald_memotag_project_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_memotag
    ADD CONSTRAINT skald_memotag_project_id_foreign FOREIGN KEY (project_id) REFERENCES public.skald_project(uuid) ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;


--
-- Name: skald_organization skald_organization_owner_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_organization
    ADD CONSTRAINT skald_organization_owner_id_foreign FOREIGN KEY (owner_id) REFERENCES public.skald_user(id) ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;


--
-- Name: skald_organizationmembership skald_organizationmembership_organization_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_organizationmembership
    ADD CONSTRAINT skald_organizationmembership_organization_id_foreign FOREIGN KEY (organization_id) REFERENCES public.skald_organization(uuid) ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;


--
-- Name: skald_organizationmembership skald_organizationmembership_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_organizationmembership
    ADD CONSTRAINT skald_organizationmembership_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.skald_user(id) ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;


--
-- Name: skald_organizationmembershipinvite skald_organizationmembershipinvite_invited_by_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_organizationmembershipinvite
    ADD CONSTRAINT skald_organizationmembershipinvite_invited_by_id_foreign FOREIGN KEY (invited_by_id) REFERENCES public.skald_user(id) ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;


--
-- Name: skald_organizationmembershipinvite skald_organizationmembershipinvite_organization_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_organizationmembershipinvite
    ADD CONSTRAINT skald_organizationmembershipinvite_organization_id_foreign FOREIGN KEY (organization_id) REFERENCES public.skald_organization(uuid) ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;


--
-- Name: skald_organizationsubscription skald_organizationsubscription_organization_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_organizationsubscription
    ADD CONSTRAINT skald_organizationsubscription_organization_id_foreign FOREIGN KEY (organization_id) REFERENCES public.skald_organization(uuid) ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;


--
-- Name: skald_organizationsubscription skald_organizationsubscription_plan_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_organizationsubscription
    ADD CONSTRAINT skald_organizationsubscription_plan_id_foreign FOREIGN KEY (plan_id) REFERENCES public.skald_plan(id) ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;


--
-- Name: skald_organizationsubscription skald_organizationsubscription_scheduled_plan_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_organizationsubscription
    ADD CONSTRAINT skald_organizationsubscription_scheduled_plan_id_foreign FOREIGN KEY (scheduled_plan_id) REFERENCES public.skald_plan(id) ON UPDATE CASCADE ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED;


--
-- Name: skald_project skald_project_organization_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_project
    ADD CONSTRAINT skald_project_organization_id_foreign FOREIGN KEY (organization_id) REFERENCES public.skald_organization(uuid) ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;


--
-- Name: skald_project skald_project_owner_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_project
    ADD CONSTRAINT skald_project_owner_id_foreign FOREIGN KEY (owner_id) REFERENCES public.skald_user(id) ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;


--
-- Name: skald_projectapikey skald_projectapikey_project_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_projectapikey
    ADD CONSTRAINT skald_projectapikey_project_id_foreign FOREIGN KEY (project_id) REFERENCES public.skald_project(uuid) ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;


--
-- Name: skald_usagerecord skald_usagerecord_organization_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_usagerecord
    ADD CONSTRAINT skald_usagerecord_organization_id_foreign FOREIGN KEY (organization_id) REFERENCES public.skald_organization(uuid) ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;


--
-- Name: skald_user skald_user_current_project_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_user
    ADD CONSTRAINT skald_user_current_project_id_foreign FOREIGN KEY (current_project_id) REFERENCES public.skald_project(uuid) ON UPDATE CASCADE ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED;


--
-- Name: skald_user skald_user_default_organization_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skald_user
    ADD CONSTRAINT skald_user_default_organization_id_foreign FOREIGN KEY (default_organization_id) REFERENCES public.skald_organization(uuid) ON UPDATE CASCADE ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED;


--
-- PostgreSQL database dump complete
--

