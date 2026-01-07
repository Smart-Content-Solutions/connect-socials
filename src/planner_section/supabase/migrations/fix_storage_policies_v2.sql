-- ==============================================================================
-- FIX STORAGE POLICIES V2 (Guaranteed Cleanup)
-- ==============================================================================

-- 1. Drop ALL potential conflicting policies
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;
DROP POLICY IF EXISTS "Allow public downloads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes" ON storage.objects;

-- 2. Create PERMISSIVE policies (TO public)
CREATE POLICY "Allow public uploads" 
ON storage.objects FOR INSERT 
TO public 
WITH CHECK (bucket_id = 'doc-attachments');

CREATE POLICY "Allow public downloads" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'doc-attachments');

CREATE POLICY "Allow public deletes" 
ON storage.objects FOR DELETE 
TO public 
USING (bucket_id = 'doc-attachments');
