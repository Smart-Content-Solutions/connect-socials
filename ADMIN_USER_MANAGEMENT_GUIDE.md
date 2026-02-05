# Admin User Management Guide

## Overview

Admins can now view and manage all user roles and entitlements through a comprehensive User Management interface in the admin dashboard.

---

## Accessing User Management

1. **Login as Admin**
2. **Navigate to Admin Dashboard** (`/admin`)
3. **Click on "Users" tab** in the segmented navigation

---

## Features

### 📊 User Statistics Dashboard

At the top of the page, you'll see cards showing:
- **Admin** users count
- **Early Access** users count  
- **Pro** users count
- **Free** users count

### 🔍 Search & Filter

- **Search Bar**: Search by email or name
- **Tier Filter**: Filter users by their access tier (Admin, Early Access, Pro, Free)

### 👥 User List

Each user card shows:
- **User Icon**: Visual indicator of their tier (Crown for Admin, Star for Early Access, etc.)
- **Name & Email**: User's full name and email address
- **Tier Selector**: Dropdown to change the user's base tier
- **Entitlement Buttons**: Toggle individual entitlements on/off

---

## Managing User Access

### Changing User Tier

1. Find the user in the list
2. Click the **Tier dropdown** (shows current tier with color coding)
3. Select new tier:
   - **Admin** (purple) - Full access to everything
   - **Early Access** (yellow) - Access to social_automation, wp_ai_agent, ai_agent
   - **Pro** (blue) - Access to social_automation, wp_ai_agent
   - **Free** (gray) - No special access

The change is applied immediately.

### Adding/Removing Individual Entitlements

Each user has buttons for available entitlements:
- **social_automation** - Social media automation tool access
- **wp_ai_agent** - WordPress AI agent access
- **ai_agent** - AI agent access
- **ai_video** - AI video generation access

**To add an entitlement:**
- Click the **outlined button** (gray) with a **+** icon
- Button turns **green** when active

**To remove an entitlement:**
- Click the **green button** with a **-** icon
- Button returns to outlined state

### Active Entitlements Display

At the bottom of each user card, you'll see:
- **Active Entitlements**: List of all currently active entitlements for that user
- Shows both tier-based and individually granted entitlements

---

## How Entitlements Work

### Base Tier Grants

When you set a user's tier, they automatically get these entitlements:

| Tier | Automatic Entitlements |
|------|----------------------|
| **Admin** | All access (`*`) |
| **Early Access** | `social_automation`, `wp_ai_agent`, `ai_agent` |
| **Pro** | `social_automation`, `wp_ai_agent` |
| **Free** | None |

### Stackable Entitlements

You can **add extra entitlements** on top of the base tier:

**Example:**
- User has **Free** tier (no automatic access)
- You add `wp_ai_agent` entitlement
- User now has WordPress tool access, but nothing else

**Another Example:**
- User has **Early Access** tier (gets social_automation, wp_ai_agent, ai_agent)
- You add `ai_video` entitlement
- User now has all Early Access features PLUS ai_video

### Removing Entitlements

- You can remove individually granted entitlements
- Base tier entitlements are automatic and can't be removed individually
- To remove base tier entitlements, change the user's tier to a lower one

---

## API Endpoints Used

The User Management page uses these admin-only endpoints:

### GET `/api/admin-list-users`
- Lists all users with their metadata
- Requires admin authentication
- Returns user details including roles and entitlements

### POST `/api/admin-update-user-role`
- Updates user tier or entitlements
- Requires admin authentication

**Request body options:**
```json
{
  "userId": "user_xxx",
  "base_tier": "early_access"  // Change tier
}
```

```json
{
  "userId": "user_xxx",
  "addEntitlement": "ai_video"  // Add entitlement
}
```

```json
{
  "userId": "user_xxx",
  "removeEntitlement": "ai_video"  // Remove entitlement
}
```

---

## Visual Indicators

### Tier Colors
- 🟣 **Purple** - Admin
- 🟡 **Yellow** - Early Access
- 🔵 **Blue** - Pro
- ⚪ **Gray** - Free

### Tier Icons
- 👑 **Crown** - Admin
- ⭐ **Star** - Early Access
- 🛡️ **Shield** - Pro
- 👤 **User** - Free

### Entitlement Buttons
- **Green with minus (-)** - Entitlement is active (click to remove)
- **Gray outlined with plus (+)** - Entitlement is inactive (click to add)

---

## Common Use Cases

### 1. Grant Early Access to Paying Customer
1. Search for user by email
2. Change tier from "Free" to "Early Access"
3. User immediately gets access to social automation, WordPress, and AI agent tools

### 2. Give Free User Access to One Tool
1. Find the free user
2. Keep tier as "Free"
3. Click the entitlement button (e.g., "wp_ai_agent")
4. User gets access to just that tool

### 3. Give Early Access User Extra Features
1. Find the early_access user
2. Keep tier as "Early Access" (they keep their base access)
3. Add "ai_video" entitlement
4. User now has all Early Access features plus AI video

### 4. Revoke Access
1. Find the user
2. Either:
   - Change tier to "Free" (removes all tier-based access)
   - OR click individual entitlement buttons to remove specific access

### 5. Promote User to Admin
1. Find the user
2. Change tier to "Admin"
3. User gets full access to everything including admin dashboard

---

## Real-Time Updates

- All changes are applied **immediately**
- The page shows a **loading indicator** while updating
- **Success toast** appears when update completes
- **Error toast** appears if update fails
- User list **refreshes automatically** after each change

---

## Security

- Only users with `admin` tier can access this page
- All API calls require admin authentication token
- Non-admin users get 403 Forbidden error
- Changes are logged in Clerk's audit trail

---

## Troubleshooting

### "Failed to load users"
- Check your admin authentication
- Verify Clerk API keys are configured
- Check browser console for errors

### "Failed to update user tier"
- Ensure you're logged in as admin
- Check network connection
- Verify the API endpoint is accessible

### User doesn't see new access
- User may need to **refresh their page**
- User may need to **log out and log back in**
- Check that the entitlement was actually saved (look at Active Entitlements section)

---

## Files Created/Modified

### New Files
- ✅ `src/pages/admin/UsersPage.tsx` - User management interface
- ✅ `api/admin-list-users.ts` - API to list all users

### Modified Files
- ✅ `api/admin-update-user-role.ts` - Enhanced to support entitlements
- ✅ `src/components/admin/AdminLayout.tsx` - Already includes Users page in navigation

---

## Next Steps

1. **Test the interface** with different user tiers
2. **Grant access** to your paying customers
3. **Monitor usage** through the dashboard stats
4. **Adjust entitlements** as needed for special cases

The User Management interface is now live and ready to use! 🎉
