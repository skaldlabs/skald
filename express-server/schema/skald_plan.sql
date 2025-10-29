CREATE TABLE skald_plan (
    id bigint NOT NULL,
    slug character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    stripe_price_id character varying(255),
    monthly_price numeric NOT NULL,
    memo_operations_limit integer,
    chat_queries_limit integer,
    projects_limit integer,
    features jsonb NOT NULL,
    is_active boolean NOT NULL,
    is_default boolean NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    PRIMARY KEY (id)
);