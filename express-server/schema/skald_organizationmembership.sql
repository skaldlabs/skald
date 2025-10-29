CREATE TABLE skald_organizationmembership (
    id bigint NOT NULL,
    access_level integer NOT NULL,
    joined_at timestamp with time zone NOT NULL,
    organization_id uuid NOT NULL,
    user_id bigint NOT NULL,
    PRIMARY KEY (id)
);