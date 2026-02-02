# TikTok Integration Complete! 🚀

The frontend and backend have been updated to support `TikTok` authentication and `Direct Post` (Image & Video).

## 🎥 Demo Video Instructions

To record your demo video for TikTok App Review:

1.  **Grant Access**: Ensure your TikTok account is added to the **Sandbox Allowlist** in the Developer Portal.
2.  **Connect**:
    -   Go to the Social Media Tool.
    -   Click the **TikTok** icon.
    -   Authorize the app.
    -   **Verify**: The "Connected" checkmark appears.
3.  **Post an Image** (Photo Mode):
    -   Select **TikTok** as the platform.
    -   Upload an image.
    -   Click "Post Now".
    -   **Verify**: Check your TikTok profile for the new photo post.
4.  **Post a Video** (Direct Post):
    -   Select **TikTok**.
    -   Upload a video (MP4/MOV, <50MB).
    -   Click "Post Now".
    -   **Verify**: Check your TikTok profile for the new video post.

## Technical Details
-   **Scopes**: Updated to include `video.publish`, `video.upload`, `user.info.stats`.
-   **Auth**: Hardcoded provided Client Key/Secret.
-   **Workflows**:
    -   `Complete Social media Automation.json`: Added TikTok Photo Mode support.
    -   `Complete Social Media Video Automation.json`: Added TikTok Video Upload support.
