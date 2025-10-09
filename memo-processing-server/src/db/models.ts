export interface Memo {
  uuid: string;
  created_at: Date;
  updated_at: Date;
  title: string;
  summary: string;
  content_length: number;
  metadata: Record<string, any>;
  expiration_date: Date | null;
  archived: boolean;
  content_hash: string;
  
  // can be code, document, etc
  type: string | null;
  
  // client provided source. could be a url, a file name, a third-party app name, a repository name, etc
  source: string | null;
  
  // client's can give us their own reference id for the memo, which matches with a record in their own system
  client_reference_id: string | null;
}

export interface MemoSummary {
  uuid: string;
  memo_id: string; // Foreign key to Memo
  summary: string;
  embedding: number[]; // VectorField with dimensions=2048
}

export interface MemoContent {
  uuid: string;
  memo_id: string; // Foreign key to Memo
  content: string;
}

export interface MemoTag {
  uuid: string;
  memo_id: string; // Foreign key to Memo
  tag: string;
}

export interface MemoRelationship {
  uuid: string;
  memo_id: string; // Foreign key to Memo
  related_memo_id: string; // Foreign key to Memo
  relationship_type: string;
}

export interface MemoChunk {
  uuid: string;
  memo_id: string; // Foreign key to Memo
  chunk_content: string;
  chunk_index: number;
  embedding: number[]; // VectorField with dimensions=2048
}

export interface MemoChunkKeyword {
  uuid: string;
  memo_chunk_id: string; // Foreign key to MemoChunk
  keyword: string;
}