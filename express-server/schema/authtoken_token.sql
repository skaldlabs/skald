CREATE TABLE authtoken_token (
    key character varying(40) NOT NULL,
    created timestamp with time zone NOT NULL,
    user_id bigint NOT NULL,
    PRIMARY KEY (key)
);