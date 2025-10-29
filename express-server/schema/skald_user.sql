CREATE TABLE skald_user (
    id bigint NOT NULL,
    password character varying(128) NOT NULL,
    last_login timestamp with time zone,
    is_superuser boolean NOT NULL,
    first_name character varying(150) NOT NULL,
    last_name character varying(150) NOT NULL,
    is_staff boolean NOT NULL,
    is_active boolean NOT NULL,
    date_joined timestamp with time zone NOT NULL,
    email character varying(254) NOT NULL,
    email_verified boolean NOT NULL,
    name character varying(255) NOT NULL,
    default_organization_id uuid,
    current_project_id uuid,
    PRIMARY KEY (id)
);