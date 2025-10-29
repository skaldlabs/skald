CREATE TABLE skald_organization (
    uuid uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    name character varying(255) NOT NULL,
    owner_id bigint NOT NULL,
    PRIMARY KEY (uuid)
);