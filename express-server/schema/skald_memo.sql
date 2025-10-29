CREATE TABLE skald_memo (
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
    project_id uuid NOT NULL,
    PRIMARY KEY (uuid)
);