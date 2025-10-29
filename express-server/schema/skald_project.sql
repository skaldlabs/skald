CREATE TABLE skald_project (
    uuid uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    name character varying(255) NOT NULL,
    organization_id uuid NOT NULL,
    owner_id bigint NOT NULL,
    PRIMARY KEY (uuid)
);