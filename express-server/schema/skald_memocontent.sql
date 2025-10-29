CREATE TABLE skald_memocontent (
    uuid uuid NOT NULL,
    content text NOT NULL,
    memo_id uuid NOT NULL,
    project_id uuid NOT NULL,
    PRIMARY KEY (uuid)
);