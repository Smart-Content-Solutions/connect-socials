# Feedback API Error - Troubleshooting Guide

## Current Error
```
POST https://www.smartcontentsolutions.co.uk/api/feedback 500 (Internal Server Error)
FUNCTION_INVOCATION_FAILED
```

## Root Cause
The serverless function is failing on Vercel, most likely due to **missing environment variables**.

## Fixes Applied

### 1. Fixed Response Body Reading Error ✅
- Changed `feedback-api.ts` to read response body only once
- Prevents "body stream already read" error

### 2. Added Comprehensive Logging ✅
- Added detailed console logs throughout `api/feedback.ts`
- Logs will help identify exact failure point
- Check Vercel function logs to see where it's failing

### 3. Updated Vercel Configuration ✅
- Updated `vercel.json` with proper API function settings
- Configured Node.js 20 runtime
- Set 10-second timeout for API functions

## Required Actions

### **CRITICAL: Set Environment Variables on Vercel**

The API requires these environment variables to be set in your Vercel project settings:

#### Required Variables:
1. **CLERK_SECRET_KEY** or **VITE_CLERK_SECRET_KEY**
   - Your Clerk secret key for authentication
   - Get from: https://dashboard.clerk.com

2. **VITE_SUPABASE_URL** or **SUPABASE_URL**
   - Your Supabase project URL
   - Get from: Supabase project settings

3. **SUPABASE_SERVICE_ROLE_KEY** or **VITE_SUPABASE_SERVICE_ROLE_KEY** or **VITE_SUPABASE_ANON_KEY**
   - Your Supabase service role key (preferred) or anon key
   - Get from: Supabase project settings → API

#### Optional Variables:
4. **N8N_FEEDBACK_WEBHOOK_URL**
   - Webhook URL for feedback notifications
   - Can be skipped if you don't have n8n set up

5. **SUPPORT_INBOX_EMAIL**
   - Email address for support notifications
   - Defaults to: support@smartcontentsolutions.co.uk

### How to Set Environment Variables on Vercel:

1. Go to your Vercel dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each required variable:
   - Variable name (e.g., `CLERK_SECRET_KEY`)
   - Value (paste your key)
   - Environment: Select **Production**, **Preview**, and **Development**
5. Click **Save**
6. **Redeploy** your application for changes to take effect

### Check Vercel Logs

After redeploying, check the function logs:

1. Go to Vercel dashboard → Your project
2. Click on **Deployments**
3. Click on the latest deployment
4. Click on **Functions** tab
5. Find `/api/feedback` and click to view logs
6. Look for the `[Feedback API]` log messages to see where it's failing

## Expected Log Output (Success)

When working correctly, you should see logs like:
```
[Feedback API] Request received: POST
[Feedback API] Checking environment variables...
[Feedback API] Environment check: { hasClerkKey: true, hasSupabaseUrl: true, hasSupabaseKey: true }
[Feedback API] Authenticating user...
[Feedback API] User authenticated: { userId: '...', email: '...', name: '...' }
[Feedback API] Initializing Supabase client...
[Feedback API] Reading request body...
[Feedback API] Request data: { rating: 5, category: 'General', messageLength: 50, pageUrl: '...' }
[Feedback API] Inserting feedback into database...
[Feedback API] Feedback created successfully: abc123
```

## Common Error Patterns

### If logs show:
- **"Missing Clerk secret key"** → Set CLERK_SECRET_KEY in Vercel
- **"Missing Supabase credentials"** → Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel
- **"Authentication failed"** → Check that CLERK_SECRET_KEY is correct
- **"Database error occurred"** → Check Supabase credentials and that the `feedback` table exists

## Database Schema

Ensure your Supabase database has a `feedback` table with this schema:

```sql
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  category TEXT NOT NULL CHECK (category IN ('General', 'Bug', 'Feature', 'Billing')),
  message TEXT NOT NULL,
  page_url TEXT,
  user_id TEXT NOT NULL,
  user_email TEXT,
  user_name TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies if needed
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own feedback
CREATE POLICY "Users can insert their own feedback"
  ON feedback FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Allow service role to do everything
CREATE POLICY "Service role can do everything"
  ON feedback FOR ALL
  USING (true)
  WITH CHECK (true);
```

## Next Steps

1. ✅ Code fixes have been applied
2. ⏳ **Set environment variables on Vercel** (CRITICAL)
3. ⏳ **Redeploy** your application
4. ⏳ **Check Vercel function logs** to verify the fix
5. ⏳ **Test** the feedback form again

Once environment variables are set and the app is redeployed, the feedback API should work correctly!
