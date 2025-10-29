CREATE TABLE skald_stripeevent (
    id bigint NOT NULL,
    stripe_event_id character varying(255) NOT NULL,
    event_type character varying(100) NOT NULL,
    payload jsonb NOT NULL,
    processed boolean NOT NULL,
    processing_error text,
    created_at timestamp with time zone NOT NULL,
    processed_at timestamp with time zone,
    PRIMARY KEY (id)
);