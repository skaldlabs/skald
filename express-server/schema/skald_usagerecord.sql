CREATE TABLE skald_usagerecord (
    id bigint NOT NULL,
    billing_period_start date NOT NULL,
    billing_period_end date NOT NULL,
    memo_operations_count integer NOT NULL,
    chat_queries_count integer NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    organization_id uuid NOT NULL,
    alerts_sent jsonb NOT NULL,
    PRIMARY KEY (id)
);