-- Create doc_attachments table
CREATE TABLE IF NOT EXISTS doc_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id UUID NOT NULL REFERENCES docs(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_doc_attachments_doc_id ON doc_attachments(doc_id);

-- Enable RLS
ALTER TABLE doc_attachments ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your auth requirements)
CREATE POLICY "Enable all operations for doc_attachments" ON doc_attachments
  FOR ALL USING (true) WITH CHECK (true);
