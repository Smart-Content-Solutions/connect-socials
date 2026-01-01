-- ==============================================================================
-- FIX STORAGE POLICIES FOR doc-attachments
-- Reason: The error "new row violates row-level security policy" happens because
-- the previous policies required 'authenticated' role, but the app uses 'anon'.
-- ==============================================================================

-- 1. Drop existing restrictive policies (if any) to prevent conflicts
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;
DROP POLICY IF EXISTS "Allow public downloads" ON storage.objects; -- Re-creating to be safe
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes" ON storage.objects;

-- 2. Create PERMISSIVE policies (TO public) so 'anon' key can upload

-- Allow Uploads (INSERT)
CREATE POLICY "Allow public uploads" 
ON storage.objects FOR INSERT 
TO public 
WITH CHECK (bucket_id = 'doc-attachments');

-- Allow Downloads (SELECT)
CREATE POLICY "Allow public downloads" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'doc-attachments');

-- Allow Deletes (DELETE)
CREATE POLICY "Allow public deletes" 
ON storage.objects FOR DELETE 
TO public 
USING (bucket_id = 'doc-attachments');

-- Allow Updates (UPDATE) - optional but good for overwrites
CREATE POLICY "Allow public updates" 
ON storage.objects FOR UPDATE 
TO public 
USING (bucket_id = 'doc-attachments') 
WITH CHECK (bucket_id = 'doc-attachments');
