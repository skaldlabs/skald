CREATE TABLE skald_memochunk (
    uuid uuid NOT NULL,
    chunk_content text NOT NULL,
    chunk_index integer NOT NULL,
    embedding USER-DEFINED NOT NULL,
    memo_id uuid NOT NULL,
    project_id uuid NOT NULL,
    PRIMARY KEY (uuid)
);