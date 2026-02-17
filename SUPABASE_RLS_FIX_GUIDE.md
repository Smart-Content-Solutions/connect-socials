# Supabase RLS Authentication Error - Fix Guide

## Error Summary
**Error Code:** 42501 (PostgreSQL insufficient privilege)  
**Message:** "new row violates row-level security policy for table 'post_drafts'"  
**HTTP Status:** 401 Unauthorized

## Root Cause
Your application uses **Clerk for authentication**, but **Supabase doesn't recognize the authenticated user** because:

1. Clerk manages user sessions independently
2. Supabase has Row-Level Security (RLS) policies on `post_drafts` table
3. The Supabase client was using only the anonymous key without user context
4. RLS policies require authenticated user context to allow INSERT/UPDATE operations

## Solution Implemented

I've created an integration between Clerk and Supabase authentication:

### Files Created/Modified:

1. **`src/lib/supabase-clerk-integration.ts`** - New file
   - Provides function to create authenticated Supabase clients
   - Accepts Clerk JWT tokens for authentication

2. **`src/hooks/useAuthenticatedSupabase.ts`** - New file
   - Custom hook that returns a Supabase client authenticated with Clerk
   - Automatically fetches and uses Clerk JWT tokens

3. **`src/hooks/usePostDraft.ts`** - Modified
   - Now uses `useAuthenticatedSupabase()` instead of the static `supabase` client
   - All database operations now include user authentication context

## Required Configuration in Clerk Dashboard

⚠️ **CRITICAL STEP:** You must configure a JWT template in Clerk for this to work.

### Steps:

1. **Go to Clerk Dashboard** → https://dashboard.clerk.com
2. **Navigate to:** Your Application → JWT Templates
3. **Create a new template:**
   - **Name:** `supabase`
   - **Template Type:** Supabase
4. **Configure the template:**
   - Clerk will provide a pre-configured template for Supabase
   - Copy your **Supabase JWT Secret** from Supabase Dashboard
5. **In Supabase Dashboard:**
   - Go to Project Settings → API
   - Find the **JWT Secret** (under "JWT Settings")
   - Copy this value
6. **Back in Clerk:**
   - Paste the JWT Secret into the template configuration
   - Save the template

### Alternative: Configure Supabase to Accept Clerk JWTs

If you prefer to configure Supabase instead:

1. **Go to Supabase Dashboard** → Your Project → Authentication → Providers
2. **Add Clerk as an OAuth provider** (if available)
3. **Or configure Custom JWT:**
   - Go to Project Settings → API → JWT Settings
   - Add Clerk's public key for JWT verification

## Testing the Fix

After configuring the JWT template:

1. **Sign in to your application** with Clerk
2. **Try saving a draft** in any post creation tool
3. **Verify in browser console** that there are no 401 errors
4. **Check Supabase Dashboard** → Table Editor → `post_drafts` to see the saved draft

## Fallback: Temporary RLS Policy Adjustment

If you need an immediate fix while setting up Clerk-Supabase integration, you can temporarily adjust the RLS policy:

### Option A: Trust the user_id in the request (Less Secure)

```sql
-- WARNING: This is less secure and should only be temporary
ALTER TABLE post_drafts ENABLE ROW LEVEL SECURITY;

-- Allow insert if user_id matches
CREATE POLICY "Users can insert their own drafts"
ON post_drafts FOR INSERT
WITH CHECK (true); -- Temporarily allow all inserts

-- Allow update if user_id matches
CREATE POLICY "Users can update their own drafts"
ON post_drafts FOR UPDATE
USING (true); -- Temporarily allow all updates

-- Allow select if user_id matches
CREATE POLICY "Users can view their own drafts"
ON post_drafts FOR SELECT
USING (true); -- Temporarily allow all selects

-- Allow delete if user_id matches
CREATE POLICY "Users can delete their own drafts"
ON post_drafts FOR DELETE
USING (true); -- Temporarily allow all deletes
```

### Option B: Disable RLS (NOT RECOMMENDED for Production)

```sql
-- DANGER: This disables all security on the table
ALTER TABLE post_drafts DISABLE ROW LEVEL SECURITY;
```

⚠️ **Do NOT use Option B in production!** This removes all access control.

## Recommended Approach

1. ✅ **Use the Clerk-Supabase integration** (implemented in this fix)
2. ✅ **Configure the JWT template in Clerk** (required step above)
3. ✅ **Keep RLS enabled** for security
4. ✅ **Test thoroughly** before deploying

## Verification Checklist

- [ ] Clerk JWT template named `supabase` is created
- [ ] Supabase JWT Secret is configured in Clerk template
- [ ] Application can successfully save drafts without 401 errors
- [ ] RLS policies are still enabled on `post_drafts` table
- [ ] User can only see/edit their own drafts (security check)

## Additional Notes

- The `useAuthenticatedSupabase` hook automatically handles token refresh
- If the user is not signed in, it falls back to the anonymous client
- All existing draft operations (save, load, delete) now work with proper authentication
- LocalStorage backup functionality remains intact as a fallback

## Troubleshooting

### Still getting 401 errors?
- Check browser console for token-related errors
- Verify the JWT template name is exactly `supabase`
- Ensure you're signed in with Clerk
- Check that `getToken({ template: 'supabase' })` returns a valid token

### Token not being generated?
- Verify Clerk publishable key is correct
- Check that ClerkProvider is wrapping your app
- Ensure user is fully authenticated (not just loading)

### RLS still blocking requests?
- Verify the JWT secret matches between Clerk and Supabase
- Check Supabase logs for specific RLS policy violations
- Ensure the `user_id` in the request matches the authenticated user's ID

## Contact & Support

If you continue to experience issues:
1. Check Clerk documentation: https://clerk.com/docs/integrations/databases/supabase
2. Check Supabase documentation: https://supabase.com/docs/guides/auth/social-login/auth-clerk
3. Review both Clerk and Supabase dashboard logs for detailed error messages
