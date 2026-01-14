<?php
/**
 * Plugin Name: SCS Connector
 * Plugin URI: https://smartcontentsolutions.co.uk
 * Description: Connect your WordPress site to Smart Content Solutions for AI-powered content optimization. Enables seamless integration with the SCS AI Editor for automatic SEO enhancement, internal linking, and content optimization.
 * Version: 1.1.0
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
 * Main SCS Connector Safety Wrapper
 * This prevents crashes if multiple versions are installed.
 */
if ( ! class_exists( 'SCS_Connector' ) ) {

    class SCS_Connector {
        
        /**
         * Plugin version
         */
        const VERSION = '1.1.0';
        
        /**
         * Singleton instance
         */
        private static $instance = null;
        
        /**
         * Get singleton instance
         */
        public static function get_instance() {
            if (null === self::$instance) {
                self::$instance = new self();
            }
            return self::$instance;
        }
        
        /**
         * Constructor
         */
        private function __construct() {
            // Core hooks
            add_action('init', [$this, 'register_meta_fields']);
            add_action('rest_api_init', [$this, 'register_api_routes']);
            add_action('admin_menu', [$this, 'add_admin_menu']);
            add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_assets']);
            
            // Activation/Deactivation
            register_activation_hook(__FILE__, [$this, 'activate']);
            register_deactivation_hook(__FILE__, [$this, 'deactivate']);
        }
        
        /**
         * Plugin activation
         */
        public function activate() {
            if (!get_option('scs_connector_version')) {
                add_option('scs_connector_version', self::VERSION);
                add_option('scs_connector_activated_time', current_time('timestamp'));
            }
            flush_rewrite_rules();
        }
        
        /**
         * Plugin deactivation
         */
        public function deactivate() {
            flush_rewrite_rules();
        }
        
        /**
         * Register Rank Math meta fields for REST API access
         */
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
        
        /**
         * Register custom REST API routes
         */
        public function register_api_routes() {
            register_rest_route('scs/v1', '/site-context', [
                'methods' => 'GET',
                'callback' => [$this, 'get_site_context'],
                'permission_callback' => [$this, 'check_permissions'],
            ]);
            
            register_rest_route('scs/v1', '/search', [
                'methods' => 'GET',
                'callback' => [$this, 'search_content'],
                'permission_callback' => [$this, 'check_permissions'],
                'args' => [
                    'query' => ['required' => true, 'type' => 'string'],
                ],
            ]);
            
            register_rest_route('scs/v1', '/enhance-post/(?P<id>\d+)', [
                'methods' => 'POST',
                'callback' => [$this, 'enhance_post'],
                'permission_callback' => [$this, 'check_permissions'],
            ]);
            
            register_rest_route('scs/v1', '/post/(?P<id>\d+)', [
                'methods' => 'GET',
                'callback' => [$this, 'get_post_details'],
                'permission_callback' => [$this, 'check_permissions'],
            ]);
        }
        
        public function check_permissions() {
            return current_user_can('edit_posts');
        }
        
        public function get_site_context($request) {
            $posts = get_posts(['post_status' => 'publish', 'posts_per_page' => 100]);
            $pages = get_pages(['post_status' => 'publish', 'number' => 50]);
            $categories = get_categories(['hide_empty' => false]);
            $tags = get_tags(['hide_empty' => false]);
            
            return new WP_REST_Response([
                'success' => true,
                'data' => [
                    'site_url' => get_site_url(),
                    'posts' => array_map(function($p) { return ['id' => $p->ID, 'title' => $p->post_title, 'link' => get_permalink($p->ID)]; }, $posts),
                    'pages' => array_map(function($p) { return ['id' => $p->ID, 'title' => $p->post_title, 'link' => get_permalink($p->ID)]; }, $pages),
                    'categories' => array_map(function($c) { return ['id' => $c->term_id, 'name' => $c->name]; }, $categories),
                    'tags' => array_map(function($t) { return ['id' => $t->term_id, 'name' => $t->name]; }, $tags),
                ],
            ], 200);
        }
        
        public function search_content($request) {
            $query = $request->get_param('query');
            $search_query = new WP_Query(['s' => $query, 'post_type' => ['post', 'page'], 'post_status' => 'publish', 'posts_per_page' => 20]);
            $results = [];
            while ($search_query->have_posts()) {
                $search_query->the_post();
                $results[] = ['id' => get_the_ID(), 'title' => get_the_title(), 'link' => get_permalink()];
            }
            wp_reset_postdata();
            return new WP_REST_Response(['success' => true, 'results' => $results], 200);
        }
        
        public function get_post_details($request) {
            $post_id = $request->get_param('id');
            $post = get_post($post_id);
            if (!$post) return new WP_Error('not_found', 'Post not found', ['status' => 404]);
            
            return new WP_REST_Response([
                'success' => true,
                'post' => [
                    'id' => $post->ID,
                    'title' => $post->post_title,
                    'content' => $post->post_content,
                    'rank_math' => [
                        'focus_keyword' => get_post_meta($post_id, 'rank_math_focus_keyword', true),
                        'title' => get_post_meta($post_id, 'rank_math_title', true),
                        'description' => get_post_meta($post_id, 'rank_math_description', true),
                    ]
                ],
            ], 200);
        }
        
        public function enhance_post($request) {
            $post_id = $request->get_param('id');
            $body = $request->get_json_params();
            
            if (isset($body['content'])) {
                wp_update_post(['ID' => $post_id, 'post_content' => wp_kses_post($body['content'])]);
            }
            
            if (isset($body['rank_math'])) {
                foreach ($body['rank_math'] as $key => $val) {
                    update_post_meta($post_id, 'rank_math_' . $key, sanitize_text_field($val));
                    update_post_meta($post_id, '_rank_math_' . $key, sanitize_text_field($val));
                }
            }
            
            return new WP_REST_Response(['success' => true, 'message' => 'Post updated'], 200);
        }
        
        public function add_admin_menu() {
            add_options_page('SCS Connector', 'SCS Connector', 'manage_options', 'scs-connector', [$this, 'render_settings_page']);
        }
        
        public function enqueue_admin_assets($hook) {
            if ('settings_page_scs-connector' !== $hook) return;
        }
        
        public function render_settings_page() {
            ?>
            <div class="wrap">
                <h1>SCS Connector Settings</h1>
                <div style="background: #fff; padding: 20px; border: 1px solid #ccd0d4; margin-top: 20px;">
                    <h2 style="color: #46b450;">🟢 Connection Status: Active</h2>
                    <p>Site URL: <code><?php echo esc_html(get_site_url()); ?></code></p>
                    <p>API Endpoint: <code><?php echo esc_html(rest_url('scs/v1/')); ?></code></p>
                </div>
            </div>
            <?php
        }
    }

    // Initialize the plugin
    if ( ! function_exists( 'scs_connector_init' ) ) {
        function scs_connector_init() {
            return SCS_Connector::get_instance();
        }
        add_action('plugins_loaded', 'scs_connector_init');
    }
}