CREATE TABLE migrations (
    name character varying NOT NULL,
    date_applied timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (name)
);