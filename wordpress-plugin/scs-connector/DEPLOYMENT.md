# SCS Connector Plugin - Deployment Guide

## 📦 Phase 1 Complete: WordPress Plugin

The **SCS Master WordPress Plugin** has been created and is ready for deployment.

---

## 🎯 What This Plugin Does

This plugin is the **foundation** of Stage B. It solves the core problems:

1. **✅ Fixes the Rank Math Sync Issue**
   - Registers all Rank Math meta fields for REST API access
   - Uses both `rank_math_*` and `_rank_math_*` field names for maximum compatibility
   - Your Rank Math score will now update automatically when the AI agent fills the fields

2. **✅ Provides Site Context to the AI**
   - Exposes endpoints that return all posts, pages, categories, and tags
   - Allows the AI to search for relevant internal link targets
   - Gives the AI a "map" of the entire website

3. **✅ Enables Safe Content Updates**
   - Provides a secure endpoint for the AI to update drafts
   - Includes permission checks (only users with `edit_posts` capability)
   - Never allows publishing or deleting (safety guardrails)

---

## 📂 Files Created

```
wordpress-plugin/
└── scs-connector/
    ├── scs-connector.php    (Main plugin file - 600+ lines)
    ├── readme.txt           (WordPress.org standard readme)
    └── DEPLOYMENT.md        (This file)
```

---

## 🚀 How to Deploy (Your Tasks)

### Step 1: Create the Plugin ZIP File

**On Windows (PowerShell):**
```powershell
cd c:\social-media-connect-main\wordpress-plugin
Compress-Archive -Path scs-connector -DestinationPath scs-connector.zip
```

This will create `scs-connector.zip` in the `wordpress-plugin` folder.

### Step 2: Install on Your Test WordPress Site

1. **Log in to WordPress Admin**
   - Go to your test WordPress site
   - Navigate to **Plugins → Add New → Upload Plugin**

2. **Upload the ZIP**
   - Click "Choose File"
   - Select `scs-connector.zip`
   - Click "Install Now"

3. **Activate the Plugin**
   - Click "Activate Plugin"
   - You should see "Plugin activated" message

4. **Verify Installation**
   - Go to **Settings → SCS Connector**
   - You should see a beautiful settings page with:
     - ✅ Green "Connection Status: Active"
     - Your site URL and API endpoints
     - Setup instructions

### Step 3: Create an Application Password

1. **Go to Your WordPress Profile**
   - Click your name in the top-right corner
   - Select "Edit Profile" or go to **Users → Profile**

2. **Scroll to "Application Passwords"**
   - You'll see a section called "Application Passwords"
   - In the "New Application Password Name" field, type: `SCS Agent`
   - Click "Add New Application Password"

3. **Save the Password**
   - WordPress will show you a password like: `xxxx xxxx xxxx xxxx xxxx xxxx`
   - **IMPORTANT:** Copy this password immediately (you can't see it again)
   - Save it in a secure location

### Step 4: Test the API Endpoints

**Test if the plugin is working:**

Open a new browser tab and visit:
```
https://your-wordpress-site.com/wp-json/scs/v1/site-context
```

**Expected Result:**
- You should see a JSON response with your site's posts, pages, categories, and tags
- If you get a "401 Unauthorized" error, that's actually GOOD - it means the endpoint exists and is protected

**To test with authentication:**

Use a tool like Postman or cURL:
```bash
curl -X GET "https://your-site.com/wp-json/scs/v1/site-context" \
  -u "your-username:your-application-password"
```

Replace:
- `your-site.com` with your actual WordPress URL
- `your-username` with your WordPress username
- `your-application-password` with the password from Step 3

**Expected Result:**
```json
{
  "success": true,
  "data": {
    "site_url": "https://your-site.com",
    "site_name": "Your Site Name",
    "posts": [...],
    "pages": [...],
    "categories": [...],
    "tags": [...]
  }
}
```

---

## ✅ Verification Checklist

After deployment, verify these items:

- [ ] Plugin appears in **Plugins** list
- [ ] Plugin is activated (green checkmark)
- [ ] Settings page accessible at **Settings → SCS Connector**
- [ ] Settings page shows "Connection Status: Active"
- [ ] API endpoint `/wp-json/scs/v1/site-context` exists (returns 401 without auth)
- [ ] Application Password created and saved
- [ ] Test API call with authentication returns site data

---

## 🔧 Troubleshooting

### Problem: "Application Passwords" section not visible

**Solution:** Application Passwords require HTTPS. Make sure your WordPress site has an SSL certificate installed.

### Problem: API returns 404 Not Found

**Solution:** 
1. Go to **Settings → Permalinks**
2. Click "Save Changes" (this flushes rewrite rules)
3. Try the API endpoint again

### Problem: API returns empty data

**Solution:** Make sure you have at least one published post or page on your WordPress site.

### Problem: Rank Math fields still not syncing

**Solution:** 
1. Deactivate and reactivate the SCS Connector plugin
2. Clear your WordPress cache (if using a caching plugin)
3. Test creating a new post via the n8n workflow

---

## 🎯 What's Next (Phase 2)

Once this plugin is installed and tested, we can move to **Phase 2**:

1. **Update the n8n workflow** to call the new `/scs/v1/site-context` endpoint
2. **Build the Agent Orchestrator** that uses this context to enhance posts
3. **Test the full Stage A → Stage B flow**

---

## 📞 Need Help?

If you encounter any issues during deployment:

1. Check the **WordPress Debug Log**:
   - Add to `wp-config.php`: `define('WP_DEBUG', true);`
   - Add to `wp-config.php`: `define('WP_DEBUG_LOG', true);`
   - Check `/wp-content/debug.log` for errors

2. Verify plugin file permissions (should be 644 for files, 755 for directories)

3. Let me know the exact error message and I'll help you fix it

---

## 🎉 Success Criteria

You'll know Phase 1 is complete when:

1. ✅ Plugin installed and activated
2. ✅ Settings page loads without errors
3. ✅ API endpoints return data when authenticated
4. ✅ Application Password created and tested

**Once all checkboxes are ticked, Phase 1 is DONE and we can start Phase 2!**
