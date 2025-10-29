CREATE TABLE skald_organizationmembershipinvite (
    id uuid NOT NULL,
    email character varying(254) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    accepted_at timestamp with time zone,
    invited_by_id bigint NOT NULL,
    organization_id uuid NOT NULL,
    PRIMARY KEY (id)
);