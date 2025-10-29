CREATE TABLE skald_memotag (
    uuid uuid NOT NULL,
    tag text NOT NULL,
    memo_id uuid NOT NULL,
    project_id uuid NOT NULL,
    PRIMARY KEY (uuid)
);