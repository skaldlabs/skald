CREATE TABLE skald_projectapikey (
    api_key_hash character varying(255) NOT NULL,
    first_12_digits character varying(12) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    project_id uuid NOT NULL,
    PRIMARY KEY (api_key_hash)
);