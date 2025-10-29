CREATE TABLE skald_memosummary (
    uuid uuid NOT NULL,
    summary text NOT NULL,
    embedding USER-DEFINED NOT NULL,
    memo_id uuid NOT NULL,
    project_id uuid NOT NULL,
    PRIMARY KEY (uuid)
);