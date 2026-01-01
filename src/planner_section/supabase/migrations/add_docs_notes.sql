-- Add notes column to the docs table
ALTER TABLE docs ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';

-- Update the column comment
COMMENT ON COLUMN docs.notes IS 'Internal notes about the document';
