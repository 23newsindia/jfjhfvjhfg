<?php
class AWS_Frontend {
    public function __construct() {
        add_shortcode('aws_slider', array($this, 'render_slider_shortcode'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
    }
    
    public function enqueue_scripts() {
        // Only load on pages with the slider
        if (has_shortcode(get_post()->post_content, 'aws_slider')) {
            wp_enqueue_style('aws-slider-css', plugins_url('../assets/css/slider.css', __FILE__));
            wp_enqueue_script('aws-slider-js', plugins_url('../assets/js/slider.js', __FILE__), array(), '1.0', true);
        }
    }
    
    public function render_slider_shortcode($atts) {
        $atts = shortcode_atts(array(
            'slug' => ''
        ), $atts);
        
        if (empty($atts['slug'])) {
            return '<p>Please specify a slider slug</p>';
        }
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'aws_sliders';
        $slider = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table_name WHERE slug = %s", $atts['slug']
        ));
        
        if (!$slider) {
            return '<p>Slider not found</p>';
        }
        
        $slides = maybe_unserialize($slider->slides);
        if (empty($slides) || !is_array($slides)) {
            return '<p>No slides found for this slider</p>';
        }
        
        ob_start();
        ?>
        <!-- Mobile Slider -->
        <div class="aws-slider aws-mobile-slider d-block d-md-none">
            <div class="aws-slider-inner">
                <?php foreach ($slides as $index => $slide) : 
                    $image_data = $this->get_optimized_image_data($slide['mobile_image'], $index + 1, $slide['title']);
                ?>
                    <div class="aws-slide" data-index="<?php echo $index; ?>">
                        <div class="aws-slide-container">
                            <a href="<?php echo esc_url($slide['link']); ?>" class="aws-slide-link">
                                <img src="<?php echo esc_url($image_data['url']); ?>"
                                     alt="<?php echo esc_attr($image_data['alt']); ?>"
                                     width="<?php echo esc_attr($image_data['width']); ?>"
                                     height="<?php echo esc_attr($image_data['height']); ?>"
                                     loading="<?php echo esc_attr($image_data['loading']); ?>"
                                     class="aws-slide-image"
                                />
                            </a>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
            <div class="aws-pagination">
                <?php foreach ($slides as $index => $slide) : ?>
                    <button class="aws-dot <?php echo $index === 0 ? 'active' : ''; ?>" 
                            data-index="<?php echo $index; ?>"></button>
                <?php endforeach; ?>
            </div>
        </div>
        
        <!-- Desktop Slider -->
        <div class="aws-slider aws-desktop-slider d-none d-md-block">
            <div class="aws-slider-inner">
                <?php foreach ($slides as $index => $slide) : 
                    $image_data = $this->get_optimized_image_data($slide['desktop_image'], $index + 1, $slide['title']);
                ?>
                    <div class="aws-slide" data-index="<?php echo $index; ?>">
                        <div class="aws-slide-container">
                            <a href="<?php echo esc_url($slide['link']); ?>" class="aws-slide-link">
                                <img src="<?php echo esc_url($image_data['url']); ?>"
                                     alt="<?php echo esc_attr($image_data['alt']); ?>"
                                     width="<?php echo esc_attr($image_data['width']); ?>"
                                     height="<?php echo esc_attr($image_data['height']); ?>"
                                     loading="<?php echo esc_attr($image_data['loading']); ?>"
                                     class="aws-slide-image"
                                />
                            </a>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
            <div class="aws-pagination">
                <?php foreach ($slides as $index => $slide) : ?>
                    <button class="aws-dot <?php echo $index === 0 ? 'active' : ''; ?>" 
                            data-index="<?php echo $index; ?>"></button>
                <?php endforeach; ?>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
    
    private function get_optimized_image_data($image_url, $position = 1, $title = '') {
        $image_id = attachment_url_to_postid($image_url);
        
        if (!$image_id) {
            return array(
                'url' => esc_url($image_url),
                'width' => '',
                'height' => '',
                'alt' => sanitize_text_field($title),
                'loading' => $position <= 2 ? 'eager' : 'lazy'
            );
        }
        
        $size = wp_is_mobile() ? 'large' : 'full';
        $image_data = wp_get_attachment_image_src($image_id, $size);
        
        $alt_text = get_post_meta($image_id, '_wp_attachment_image_alt', true);
        if (empty($alt_text)) {
            $alt_text = $title;
        }
        
        return array(
            'url' => $image_data ? esc_url($image_data[0]) : esc_url($image_url),
            'width' => $image_data ? $image_data[1] : '',
            'height' => $image_data ? $image_data[2] : '',
            'alt' => sanitize_text_field($alt_text),
            'loading' => $position <= 2 ? 'eager' : 'lazy'
        );
    }
}