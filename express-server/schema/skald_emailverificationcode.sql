CREATE TABLE skald_emailverificationcode (
    id bigint NOT NULL,
    code character varying(6) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    attempts integer NOT NULL,
    user_id bigint NOT NULL,
    PRIMARY KEY (id)
);