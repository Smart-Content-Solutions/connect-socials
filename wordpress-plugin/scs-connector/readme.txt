=== SCS Connector ===
Contributors: Smart Content Solutions
Tags: seo, ai, content, automation, rank-math
Requires at least: 6.0
Tested up to: 6.4
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Connect your WordPress site to Smart Content Solutions for AI-powered content optimization.

== Description ==

SCS Connector is the bridge between your WordPress site and the Smart Content Solutions AI Editor. It enables seamless integration for automatic SEO enhancement, intelligent internal linking, and content optimization.

= Features =

* **Rank Math Integration**: Automatically fills SEO metadata fields (Focus Keyword, Title, Description)
* **Smart Internal Linking**: AI analyzes your existing content to add relevant internal links
* **Auto-Categorization**: Assigns appropriate categories and tags based on your site's taxonomy
* **Content Optimization**: Ensures posts follow SEO best practices
* **Duplicate Detection**: Checks for similar titles to avoid content conflicts
* **Secure API**: Token-based authentication for safe communication

= How It Works =

1. Install and activate the SCS Connector plugin
2. Create an Application Password in your WordPress profile
3. Connect your site in the SCS Dashboard
4. The AI Editor automatically enhances all your drafts

= Requirements =

* WordPress 6.0 or higher
* PHP 7.4 or higher
* HTTPS enabled (required for Application Passwords)
* Rank Math SEO plugin (recommended)

== Installation ==

= Automatic Installation =

1. Log in to your WordPress admin panel
2. Go to Plugins → Add New
3. Search for "SCS Connector"
4. Click "Install Now" and then "Activate"

= Manual Installation =

1. Download the plugin ZIP file
2. Go to Plugins → Add New → Upload Plugin
3. Choose the ZIP file and click "Install Now"
4. Activate the plugin

= Setup =

1. Go to Settings → SCS Connector
2. Follow the on-screen instructions to create an Application Password
3. Enter your credentials in the SCS Dashboard
4. Start creating AI-optimized content!

== Frequently Asked Questions ==

= Do I need a Smart Content Solutions account? =

Yes, this plugin requires an active SCS account. Visit smartcontentsolutions.co.uk to sign up.

= Is Rank Math required? =

While not strictly required, Rank Math is highly recommended for the best SEO results. The plugin will work with other SEO plugins but is optimized for Rank Math.

= Is my data secure? =

Yes. All communication uses WordPress Application Passwords and HTTPS. The AI agent only has permission to edit posts, not delete or publish them.

= Can I use this with other AI tools? =

This plugin is specifically designed for Smart Content Solutions. It may not work with other AI content tools.

= What permissions does the AI agent have? =

The AI agent can:
- Read published posts and pages
- Update draft post content
- Update SEO metadata
- Assign categories and tags

The AI agent CANNOT:
- Delete any content
- Publish posts (they remain as drafts)
- Edit users or settings
- Modify themes or plugins

== Changelog ==

= 1.0.0 =
* Initial release
* Rank Math meta field registration
* Site context API endpoints
* Content search functionality
* Post enhancement endpoint
* Admin settings page

== Upgrade Notice ==

= 1.0.0 =
Initial release of SCS Connector.

== Screenshots ==

1. Settings page showing connection status
2. Site information and API endpoints
3. Setup instructions
4. Feature overview

== Privacy Policy ==

SCS Connector communicates with Smart Content Solutions servers to provide AI-powered content optimization. The plugin sends:
- Post titles and content (drafts only)
- Site structure (categories, tags, page titles)
- SEO metadata

No personal user data or sensitive information is transmitted. All communication is encrypted via HTTPS.

== Support ==

For support, visit:
- Documentation: https://smartcontentsolutions.co.uk/docs
- Support Center: https://smartcontentsolutions.co.uk/support
- Email: support@smartcontentsolutions.co.uk
