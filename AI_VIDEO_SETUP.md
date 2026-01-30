# AI Video Generation Setup Guide

This guide will help you set up the Higgsfield AI Video Generation feature.

## Prerequisites

- Higgsfield AI account with yearly plan
- Higgsfield API key
- Supabase project with storage enabled
- n8n instance running
- PostgreSQL database access

## Setup Steps

### 1. Database Setup

Run the SQL migration to create the `ai_video_jobs` table:

```bash
# Connect to your PostgreSQL database and run:
psql -h YOUR_DB_HOST -U YOUR_DB_USER -d YOUR_DB_NAME -f database/migrations/create_ai_video_jobs_table.sql
```

Or execute the SQL directly in your Supabase SQL editor.

### 2. Supabase Storage Bucket

Create a new storage bucket for AI-generated videos:

1. Go to Supabase Dashboard → Storage
2. Click "Create a new bucket"
3. Name: `ai-videos`
4. Public bucket: **Yes** (for video embedding)
5. Click "Create bucket"

### 3. n8n Workflow Setup

1. **Import the workflow:**
   - Open n8n
   - Go to Workflows → Import from File
   - Select `n8n_automations/Higgsfield AI Video Generation.json`

2. **Configure credentials:**
   - Update all Supabase nodes with your Supabase credentials
   - Update all Postgres nodes with your database credentials

3. **Set environment variable:**
   - Add `HIGGSFIELD_API_KEY` to your n8n environment variables
   - Restart n8n to apply changes

4. **Update Higgsfield API endpoints:**
   - The workflow uses placeholder endpoints for Higgsfield API
   - Update the following nodes with actual Higgsfield API URLs:
     - "Create Higgsfield Job" node
     - "Check Job Status" node
   - Refer to Higgsfield API documentation for exact endpoints

5. **Activate the workflow:**
   - Click "Active" toggle in the workflow
   - Test the webhook endpoint

### 4. Frontend Configuration

The frontend is already configured to use the webhook endpoint:
```
https://n8n.smartcontentsolutions.co.uk/webhook/ai-video-generate
```

Make sure this matches your n8n instance URL.

### 5. Testing

1. Navigate to the Post Video tab in your application
2. Click "Generate AI Video" toggle
3. Upload a test image (9:16 aspect ratio recommended)
4. Set duration to 5 seconds
5. Click "Generate Preview"
6. Wait for the video to generate (may take 30-60 seconds)
7. Preview the video and click "Use This Video"
8. The video should now be attached to your post

## Higgsfield API Integration Notes

**IMPORTANT:** The n8n workflow uses placeholder API endpoints. You need to update them with actual Higgsfield API URLs:

### Expected Higgsfield API Endpoints (Update these):

1. **Create Job:**
   ```
   POST https://api.higgsfield.ai/v1/video/generate
   Headers: Authorization: Bearer YOUR_API_KEY
   Body: {
     "source_image_url": "string",
     "prompt": "string",
     "duration": 5,
     "aspect_ratio": "9:16",
     "format": "mp4",
     "codec": "h264"
   }
   Response: {
     "job_id": "string",
     "status": "pending"
   }
   ```

2. **Check Status:**
   ```
   GET https://api.higgsfield.ai/v1/video/status/{job_id}
   Headers: Authorization: Bearer YOUR_API_KEY
   Response: {
     "status": "completed" | "processing" | "failed",
     "video_url": "string" (when completed)
   }
   ```

### Adjust the workflow based on actual Higgsfield API:

- Update request/response field names
- Adjust polling intervals if needed
- Add error handling for specific Higgsfield error codes

## Monitoring

Check the `ai_video_jobs` table to monitor:
- Job success/failure rates
- Average generation time
- User usage patterns
- Error messages

```sql
-- View recent jobs
SELECT * FROM ai_video_jobs ORDER BY created_at DESC LIMIT 10;

-- Count jobs by status
SELECT status, COUNT(*) FROM ai_video_jobs GROUP BY status;

-- View failed jobs
SELECT * FROM ai_video_jobs WHERE status = 'failed' ORDER BY created_at DESC;
```

## Troubleshooting

### Video generation fails immediately
- Check `HIGGSFIELD_API_KEY` is set correctly in n8n
- Verify Higgsfield API endpoints are correct
- Check n8n logs for API errors

### Video not appearing in preview
- Check Supabase storage bucket `ai-videos` exists and is public
- Verify video was uploaded successfully
- Check browser console for CORS errors

### Database errors
- Ensure `ai_video_jobs` table exists
- Check PostgreSQL credentials in n8n nodes
- Verify database user has INSERT/UPDATE permissions

## Cost Monitoring

Track AI video generation costs:

```sql
-- Count videos generated per user
SELECT user_id, COUNT(*) as video_count
FROM ai_video_jobs
WHERE status = 'completed'
GROUP BY user_id
ORDER BY video_count DESC;

-- Videos generated per day
SELECT DATE(created_at) as date, COUNT(*) as videos
FROM ai_video_jobs
WHERE status = 'completed'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

## Phase 2: Text → Video

Text-to-video generation is marked as "Coming Soon" in the UI. To implement:

1. Update frontend to enable the "Text → Video" tab
2. Add text input form for video description
3. Update n8n workflow to handle text-to-video requests
4. Test with Higgsfield text-to-video API (if available)

## Support

For issues or questions:
1. Check n8n workflow execution logs
2. Review `ai_video_jobs` table for error messages
3. Consult Higgsfield API documentation
4. Check Supabase storage logs
