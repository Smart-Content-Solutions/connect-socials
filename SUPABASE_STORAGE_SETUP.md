# Supabase Storage Setup for Docs Attachments

## Error: "Storage Error: Bucket not found"

This error occurs because the `doc-attachments` storage bucket hasn't been created in your Supabase project yet.

## Quick Fix - Create the Storage Bucket

### Step 1: Go to Supabase Dashboard
1. Open your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar

### Step 2: Create the Bucket
1. Click **"New bucket"** button
2. Enter bucket name: `doc-attachments`
3. Set to **Public** (or configure policies for your auth setup)
4. Click **"Create bucket"**

### Step 3: Configure Storage Policies

After creating the bucket, you need to set up Row Level Security (RLS) policies:

#### Option A: Public Bucket (Quick Setup for Testing)
If you made the bucket public, you're done! The bucket will allow all operations.

#### Option B: Authenticated Users Only (Recommended for Production)

Go to **Storage** → **Policies** and add these policies for the `doc-attachments` bucket:

**1. Allow Uploads (INSERT)**
```sql
-- Policy name: Allow authenticated uploads
-- Allowed operation: INSERT

CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'doc-attachments');
```

**2. Allow Downloads (SELECT)**
```sql
-- Policy name: Allow public downloads
-- Allowed operation: SELECT

CREATE POLICY "Allow public downloads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'doc-attachments');
```

**3. Allow Deletes (DELETE)**
```sql
-- Policy name: Allow authenticated deletes
-- Allowed operation: DELETE

CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'doc-attachments');
```

### Step 4: Test the Upload
1. Go back to your app
2. Try uploading a file again
3. It should work now! ✅

## Alternative: Create via SQL

If you prefer to use SQL, you can run this in the Supabase SQL Editor:

```sql
-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('doc-attachments', 'doc-attachments', true);

-- Set up policies (if public bucket)
-- Public buckets don't need policies, but here's how to add them for a private bucket:

CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'doc-attachments');

CREATE POLICY "Allow public downloads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'doc-attachments');

CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'doc-attachments');
```

## Verification

To verify the bucket was created:
1. Go to **Storage** in Supabase dashboard
2. You should see `doc-attachments` in the buckets list
3. Try uploading a file in your app

## Bucket Configuration Details

**Bucket Name**: `doc-attachments`
**Used By**: DocsAttachments component
**File Types Allowed**: PDF, Word, images, videos, code files, archives (.zip, .rar)
**Max File Size**: 200MB per file
**Storage Path Format**: `{doc_id}/{timestamp}-{filename}`

## Troubleshooting

### Still getting "Bucket not found"?
1. **Check bucket name** - Must be exactly `doc-attachments` (with hyphen, not underscore)
2. **Refresh your app** - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. **Check Supabase credentials** - Verify `.env` has correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### Getting "Permission denied"?
1. **Check RLS policies** - Make sure the policies are created
2. **Check authentication** - User might not be authenticated
3. **Check bucket is public** - Or policies allow the operation

### Files not appearing after upload?
1. **Check the database** - Verify entries in `doc_attachments` table
2. **Check storage** - Look in Storage → doc-attachments to see uploaded files
3. **Check browser console** - Look for any JavaScript errors

## Security Considerations

### For Production:
- ✅ Use **authenticated-only** policies
- ✅ Add file size limits in policies
- ✅ Validate file types on upload
- ✅ Scan files for malware if accepting user uploads
- ✅ Set up proper CORS if needed

### For Development/Testing:
- ⚠️ Public bucket is fine
- ⚠️ Just remember to restrict it before going to production!

## Related Setup

Make sure you've also completed:
- [ ] Run migration: `add_doc_attachments.sql` (creates database table)
- [ ] Run migration: `add_docs_notes.sql` (adds notes column)
- [ ] Created storage bucket: `doc-attachments` (for file uploads) ← **YOU ARE HERE**

## Need Help?

If you're still having issues:
1. Check the Supabase logs in the dashboard
2. Check browser console for detailed error messages
3. Verify your Supabase project is active and not paused
