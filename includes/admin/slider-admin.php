<?php
class AWS_Admin {
    public function __construct() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
        add_action('admin_init', array($this, 'handle_form_submissions'));
    }

    public function add_admin_menu() {
        add_menu_page(
            'WooCommerce Sliders',
            'WC Sliders',
            'manage_options',
            'aws-sliders',
            array($this, 'render_admin_page'),
            'dashicons-slides',
            30
        );
    }

    public function enqueue_admin_scripts($hook) {
        if ($hook !== 'toplevel_page_aws-sliders') {
            return;
        }

        wp_enqueue_media();
        wp_enqueue_style('aws-admin-css', plugins_url('../assets/css/admin.css', __FILE__));
        wp_enqueue_script('jquery');
        wp_enqueue_script('aws-admin-js', plugins_url('../assets/js/admin.js', __FILE__), array('jquery', 'wp-util'), '1.0', true);
    }

    public function handle_form_submissions() {
        if (!current_user_can('manage_options')) {
            return;
        }

        if (isset($_POST['save_slider'])) {
            $this->save_slider();
        }

        if (isset($_POST['delete_slider'])) {
            $this->delete_slider();
        }
    }

    private function save_slider() {
        global $wpdb;

// Verify nonce first
    if (!isset($_POST['_wpnonce']) || !wp_verify_nonce($_POST['_wpnonce'], 'aws-slider-nonce')) {
        wp_die('Security check failed');
    }

              
        $table_name = $wpdb->prefix . 'aws_sliders';
        
        $name = sanitize_text_field($_POST['slider_name']);
        $slug = sanitize_text_field($_POST['slider_slug']);
        $slides = stripslashes($_POST['slider_slides']);
        
        if (empty($name) || empty($slug)) {
            wp_die('Name and slug are required');
        }
        
        $slides_data = json_decode($slides, true);
        if (json_last_error() !== JSON_ERROR_NONE || !is_array($slides_data)) {
            wp_die('Invalid slides data');
        }
        
        $sanitized_slides = array();
        foreach ($slides_data as $slide) {
            $sanitized_slides[] = array(
                'title' => sanitize_text_field($slide['title']),
                'link' => esc_url_raw($slide['link']),
                'mobile_image' => esc_url_raw($slide['mobile_image']),
                'desktop_image' => esc_url_raw($slide['desktop_image'])
            );
        }
        
        $data = array(
            'name' => $name,
            'slug' => $slug,
            'slides' => serialize($sanitized_slides),
            'updated_at' => current_time('mysql')
        );
        
        $existing = $wpdb->get_row($wpdb->prepare(
            "SELECT id FROM $table_name WHERE slug = %s", $slug
        ));
        
        if ($existing) {
            $wpdb->update($table_name, $data, array('id' => $existing->id));
        } else {
            $data['created_at'] = current_time('mysql');
            $wpdb->insert($table_name, $data);
        }
        
        wp_redirect(admin_url('admin.php?page=aws-sliders&message=saved'));
        exit;
    }

    private function delete_slider() {
        global $wpdb;
        $table_name = $wpdb->prefix . 'aws_sliders';
        $id = intval($_POST['delete_slider']);
        $wpdb->delete($table_name, array('id' => $id));
        wp_redirect(admin_url('admin.php?page=aws-sliders&message=deleted'));
        exit;
    }

    public function render_admin_page() {
        $editing_slider = null;
        if (isset($_POST['edit_slider'])) {
            global $wpdb;
            $table_name = $wpdb->prefix . 'aws_sliders';
            $editing_slider = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM $table_name WHERE id = %d",
                intval($_POST['edit_slider'])
            ));
        }
        ?>
        <div class="wrap aws-admin">
            <h1>WooCommerce Sliders</h1>
            
            <?php if (isset($_GET['message'])): ?>
                <div class="notice notice-success is-dismissible">
                    <p>
                        <?php
                        switch ($_GET['message']) {
                            case 'saved':
                                echo 'Slider saved successfully.';
                                break;
                            case 'deleted':
                                echo 'Slider deleted successfully.';
                                break;
                        }
                        ?>
                    </p>
                </div>
            <?php endif; ?>
            
            <div class="aws-admin-container">
                <div class="aws-sliders-list" style="<?php echo $editing_slider ? 'display:none;' : ''; ?>">
                    <div class="aws-header">
                        <h2>Your Sliders</h2>
                        <button id="aws-add-new" class="button button-primary">Add New Slider</button>
                    </div>
                    
                    <div class="aws-sliders-table">
                        <?php $this->render_sliders_table(); ?>
                    </div>
                </div>
                
                <div class="aws-slider-editor" style="<?php echo $editing_slider ? 'display:block;' : 'display:none;'; ?>">
                    <div class="aws-editor-header">
                        <h2>Edit Slider</h2>
                        <div class="aws-editor-actions">
                            <button id="aws-save-slider" class="button button-primary">Save Slider</button>
                            <button id="aws-cancel-edit" class="button">Cancel</button>
                        </div>
                    </div>
                    
                    <div class="aws-editor-form">
                        <div class="aws-form-group">
                            <label for="aws-slider-name">Slider Name</label>
                            <input type="text" id="aws-slider-name" class="regular-text" required
                                   value="<?php echo esc_attr($editing_slider ? $editing_slider->name : ''); ?>">
                        </div>
                        
                        <div class="aws-form-group">
                            <label for="aws-slider-slug">Slider Slug (shortcode)</label>
                            <input type="text" id="aws-slider-slug" class="regular-text" required
                                   value="<?php echo esc_attr($editing_slider ? $editing_slider->slug : ''); ?>">
                            <p class="description">This will be used in the shortcode like [aws_slider slug="your-slug"]</p>
                        </div>
                        
                        <h3>Slides</h3>
                        <div id="aws-slides-container"></div>
                        
                        <button id="aws-add-slide" class="button">Add Slide</button>
                    </div>
                </div>
            </div>
        </div>
        <?php
        
        // Initialize slides if editing
        if ($editing_slider) {
            $slides = unserialize($editing_slider->slides);
            if (!empty($slides)) {
                ?>
                <script>
                    document.addEventListener('DOMContentLoaded', function() {
                        window.initializeSlider(<?php echo json_encode($slides); ?>);
                    });
                </script>
                <?php
            }
        }
    }

    private function render_sliders_table() {
        global $wpdb;
        $table_name = $wpdb->prefix . 'aws_sliders';
        $sliders = $wpdb->get_results("SELECT * FROM $table_name ORDER BY created_at DESC");
        
        if (empty($sliders)) {
            echo '<p>No sliders found. Create your first slider!</p>';
            return;
        }
        
        echo '<table class="wp-list-table widefat fixed striped">';
        echo '<thead><tr>
                <th>Name</th>
                <th>Shortcode</th>
                <th>Slides</th>
                <th>Created</th>
                <th>Actions</th>
            </tr></thead>';
        echo '<tbody>';
        
        foreach ($sliders as $slider) {
            $slides = unserialize($slider->slides);
            $slide_count = is_array($slides) ? count($slides) : 0;
            
            echo '<tr>
                <td>' . esc_html($slider->name) . '</td>
                <td><code>[aws_slider slug="' . esc_attr($slider->slug) . '"]</code></td>
                <td>' . $slide_count . ' slides</td>
                <td>' . date('M j, Y', strtotime($slider->created_at)) . '</td>
                <td>
                    <button class="button aws-edit-slider" data-id="' . $slider->id . '">Edit</button>
                    <button class="button aws-delete-slider" data-id="' . $slider->id . '">Delete</button>
                </td>
            </tr>';
        }
        
        echo '</tbody></table>';
    }
}
