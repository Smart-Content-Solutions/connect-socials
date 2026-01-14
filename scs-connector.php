<?php
/**
 * Plugin Name: SCS Connector
 * Plugin URI: https://smartcontentsolutions.co.uk
 * Description: Connect your WordPress site to Smart Content Solutions for AI-powered content optimization. Enables seamless integration with the SCS AI Editor for automatic SEO enhancement, internal linking, and content optimization.
 * Version: 1.0.0
 * Author: Smart Content Solutions
 * Author URI: https://smartcontentsolutions.co.uk
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: scs-connector
 * Requires at least: 6.0
 * Requires PHP: 7.4
 */

// Exit if accessed directly
defined('ABSPATH') || exit;

/**
 * Main SCS Connector Class
 * 
 * This plugin serves as the bridge between WordPress and the SCS AI Editor.
 * It provides:
 * - Secure API endpoints for the AI agent
 * - Rank Math meta field registration for REST API access
 * - Site context retrieval (posts, pages, categories, tags)
 * - Safe content and metadata updates
 */

class SCS_Connector {
    const VERSION = '1.0.0';
    private static $instance = null;
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    private function __construct() {
        add_action('init', [$this, 'register_meta_fields']);
        add_action('rest_api_init', [$this, 'register_api_routes']);
        add_action('admin_menu', [$this, 'add_admin_menu']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_assets']);
        register_activation_hook(__FILE__, [$this, 'activate']);
        register_deactivation_hook(__FILE__, [$this, 'deactivate']);
    }
    public function activate() {
        if (!get_option('scs_connector_version')) {
            add_option('scs_connector_version', self::VERSION);
            add_option('scs_connector_activated_time', current_time('timestamp'));
        }
        flush_rewrite_rules();
    }
    public function deactivation() {
        flush_rewrite_rules();
    }
    public function register_meta_fields() {
        $meta_fields = [
            'rank_math_focus_keyword',
            'rank_math_title',
            'rank_math_description',
            '_rank_math_focus_keyword',
            '_rank_math_title',
            '_rank_math_description',
            'rank_math_pillar_content',
            'rank_math_primary_category',
            'rank_math_canonical_url',
            'rank_math_robots',
        ];
        
        foreach ($meta_fields as $field) {
            register_post_meta('post', $field, [
                'show_in_rest' => true,
                'single' => true,
                'type' => 'string',
                'auth_callback' => function() {
                    return current_user_can('edit_posts');
                },
                'sanitize_callback' => 'sanitize_text_field',
            ]);
        }
        
        foreach ($meta_fields as $field) {
            register_post_meta('page', $field, [
                'show_in_rest' => true,
                'single' => true,
                'type' => 'string',
                'auth_callback' => function() {
                    return current_user_can('edit_pages');
                },
                'sanitize_callback' => 'sanitize_text_field',
            ]);
        }
    }
}