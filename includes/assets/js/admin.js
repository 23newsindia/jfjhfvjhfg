document.addEventListener('DOMContentLoaded', function() {
    /// Main Admin Slider Class
    class AWSSliderAdmin {
        constructor() {
            this.elements = {
                addNewBtn: document.getElementById('aws-add-new'),
                slidersTable: document.querySelector('.aws-sliders-table'),
                sliderEditor: document.querySelector('.aws-slider-editor'),
                cancelEditBtn: document.getElementById('aws-cancel-edit'),
                saveSliderBtn: document.getElementById('aws-save-slider'),
                addSlideBtn: document.getElementById('aws-add-slide'),
                slidesContainer: document.getElementById('aws-slides-container')
            };

            // Safety checks
            if (!this.elements.addNewBtn) {
                console.warn('Admin container element not found');
                return;
            }

            // Mobile detection
            this.isMobile = window.innerWidth < 768;
            
            this.init();
            this.initResponsiveFeatures();
        }

        init() {
            this.setupEventListeners();
        }

        setupEventListeners() {
            // Button event listeners
            this.elements.addNewBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showEditor();
            });
            
            this.elements.cancelEditBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideEditor();
            });
            
            this.elements.addSlideBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.addSlide();
            });
            
            this.elements.saveSliderBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.saveSlider();
            });

            // Delegated event listeners
            document.addEventListener('click', (e) => {
                try {
                    if (e.target.classList.contains('aws-edit-slider')) {
                        e.preventDefault();
                        this.getSlider(e.target.dataset.id);
                    }
                    
                    if (e.target.classList.contains('aws-delete-slider')) {
                        e.preventDefault();
                        this.deleteSlider(e.target.dataset.id);
                    }
                    
                    if (e.target.classList.contains('aws-remove-slide')) {
                        e.preventDefault();
                        const slideElement = e.target.closest('.aws-slide');
                        if (slideElement) {
                            slideElement.remove();
                        }
                    }
                    
                    if (e.target.classList.contains('aws-upload-image')) {
                        e.preventDefault();
                        const inputField = e.target.nextElementSibling;
                        if (inputField) {
                            this.openMediaUploader(inputField);
                        }
                    }
                } catch (error) {
                    console.error('Event handler error:', error);
                }
            });

            // Touch events
            document.addEventListener('touchstart', (e) => {
                if (e.target.classList.contains('aws-upload-image')) {
                    e.preventDefault();
                    const inputField = e.target.nextElementSibling;
                    if (inputField) {
                        this.openMediaUploader(inputField);
                    }
                }
            }, { passive: false });
        }

        showEditor() {
            if (this.elements.slidersTable && this.elements.sliderEditor) {
                this.elements.slidersTable.style.display = 'none';
                this.elements.sliderEditor.style.display = 'block';
                this.resetEditor();
                
                // Focus management
                setTimeout(() => {
                    const nameField = document.getElementById('aws-slider-name');
                    if (nameField) nameField.focus();
                }, 100);
            }
        }

        hideEditor() {
            if (this.elements.slidersTable && this.elements.sliderEditor) {
                this.elements.slidersTable.style.display = 'block';
                this.elements.sliderEditor.style.display = 'none';
            }
        }

        resetEditor() {
            const nameField = document.getElementById('aws-slider-name');
            const slugField = document.getElementById('aws-slider-slug');
            
            if (nameField) nameField.value = '';
            if (slugField) slugField.value = '';
            if (this.elements.slidesContainer) {
                this.elements.slidesContainer.innerHTML = '';
                this.addSlide(); // Start with one empty slide
            }
        }

        getSlider(sliderId) {
            if (!aws_admin_vars || !aws_admin_vars.ajax_url) {
                console.error('AJAX variables not defined');
                return;
            }

            const xhr = new XMLHttpRequest();
            xhr.open('POST', aws_admin_vars.ajax_url, true);
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

            xhr.onload = () => {
                if (xhr.status === 200) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        
                        if (response.success) {
                            this.loadSliderIntoEditor(response.data);
                            this.showEditor();
                        } else {
                            console.error('Server error:', response.data);
                            alert('Error loading slider. Check console for details.');
                        }
                    } catch (error) {
                        console.error('JSON parsing failed:', error, xhr.responseText);
                        alert('Invalid slider data received.');
                    }
                } else {
                    alert(`Request failed (Status: ${xhr.status})`);
                }
            };

            xhr.onerror = () => {
                alert('Network error. Check console for details.');
                console.error('AJAX request failed.');
            };

            const data = new URLSearchParams();
            data.append('action', 'aws_get_slider');
            data.append('nonce', aws_admin_vars.nonce);
            data.append('id', sliderId);

            xhr.send(data);
        }

        loadSliderIntoEditor(slider) {
            const nameField = document.getElementById('aws-slider-name');
            const slugField = document.getElementById('aws-slider-slug');
            
            if (nameField) nameField.value = slider.name || '';
            if (slugField) slugField.value = slider.slug || '';
            
            if (this.elements.slidesContainer) {
                this.elements.slidesContainer.innerHTML = '';

                try {
                    // Ensure slides is an array
                    let slides = [];
                    if (Array.isArray(slider.slides)) {
                        slides = slider.slides;
                    } else if (typeof slider.slides === 'string') {
                        slides = JSON.parse(slider.slides || '[]');
                    }
                    
                    if (slides.length === 0) {
                        console.warn('No slides found in slider data.');
                        this.addSlide(); // Add an empty slide if none exist
                    } else {
                        slides.forEach(slide => this.addSlide(slide));
                    }
                } catch (error) {
                    console.error('Failed to parse slides:', error);
                    this.addSlide(); // Fallback to an empty slide
                }
            }
        }

        addSlide(slideData = {}) {
            if (!this.elements.slidesContainer) return;

            const slideId = Date.now();
            const escapedData = {
                title: this.escapeHtml(slideData.title || ''),
                link: this.escapeHtml(slideData.link || ''),
                mobile_image: this.escapeHtml(slideData.mobile_image || ''),
                desktop_image: this.escapeHtml(slideData.desktop_image || '')
            };

            const slideHtml = `
                <div class="aws-slide" data-id="${slideId}">
                    <div class="aws-form-group">
                        <label>Slide Title</label>
                        <input type="text" class="aws-slide-title regular-text" 
                               value="${escapedData.title}" 
                               placeholder="Enter slide title">
                    </div>
                    
                    <div class="aws-form-group">
                        <label>Link URL</label>
                        <input type="url" class="aws-slide-link regular-text" 
                               value="${escapedData.link}" 
                               placeholder="https://example.com">
                    </div>
                    
                    <div class="aws-form-group">
                        <label>Mobile Image</label>
                        <button class="button aws-upload-image">Upload</button>
                        <input type="text" class="aws-slide-mobile-image regular-text" 
                               value="${escapedData.mobile_image}" 
                               placeholder="Mobile image URL">
                        <div class="aws-image-preview" style="${slideData.mobile_image ? '' : 'display:none'}">
                            ${slideData.mobile_image ? `<img src="${escapedData.mobile_image}" style="max-width:100px; height:auto;">` : ''}
                        </div>
                    </div>
                    
                    <div class="aws-form-group">
                        <label>Desktop Image</label>
                        <button class="button aws-upload-image">Upload</button>
                        <input type="text" class="aws-slide-desktop-image regular-text" 
                               value="${escapedData.desktop_image}" 
                               placeholder="Desktop image URL">
                        <div class="aws-image-preview" style="${slideData.desktop_image ? '' : 'display:none'}">
                            ${slideData.desktop_image ? `<img src="${escapedData.desktop_image}" style="max-width:100px; height:auto;">` : ''}
                        </div>
                    </div>
                    
                    <button class="button aws-remove-slide">Remove Slide</button>
                    <hr>
                </div>
            `;

            this.elements.slidesContainer.insertAdjacentHTML('beforeend', slideHtml);
        }

        escapeHtml(unsafe) {
            if (!unsafe) return '';
            return unsafe.toString()
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

        openMediaUploader(inputField) {
            if (typeof wp === 'undefined' || !wp.media) {
                alert('WordPress media library not loaded. Try refreshing the page.');
                return;
            }

            if (this.isMobile && inputField.previousElementSibling) {
                inputField.previousElementSibling.textContent = 'Loading...';
            }

            const frame = wp.media({
                className: this.isMobile ? 'media-modal mobile' : '',
                title: 'Select or Upload Image',
                button: { text: 'Use this image' },
                multiple: false
            });

            frame.on('select', () => {
                const attachment = frame.state().get('selection').first().toJSON();
                
                if (!attachment || !attachment.url) {
                    console.error('No image selected or invalid attachment data.');
                    return;
                }

                // Update the input field with the image URL
                inputField.value = attachment.url;
                
                // Show the image preview
                const preview = inputField.nextElementSibling;
                if (preview && preview.classList.contains('aws-image-preview')) {
                    preview.style.display = 'block';
                    const img = preview.querySelector('img');
                    if (img) {
                        img.src = attachment.url;
                        img.style.maxWidth = this.isMobile ? '80px' : '100px';
                        img.style.height = 'auto';
                    }
                }
            });

            frame.open();
        }
   
      
      
      
       /**
     * Add a new slide to the editor
     * @param {Object} slideData - Optional slide data (for editing existing slides)
     */
    // Add this helper method to escape HTML in your class
escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Add a new slide to the editor
 * @param {Object} slideData - Optional slide data (for editing existing slides)
 */
addSlide(slideData = {}) {
    const slideId = Date.now();
    const slideHtml = `
        <div class="aws-slide" data-id="${slideId}">
            <div class="aws-form-group">
                <label>Slide Title</label>
                <input type="text" class="aws-slide-title regular-text" value="${this.escapeHtml(slideData.title || '')}" placeholder="Enter slide title">
            </div>
            
            <div class="aws-form-group">
                <label>Link URL</label>
                <input type="url" class="aws-slide-link regular-text" value="${this.escapeHtml(slideData.link || '')}" placeholder="https://example.com">
            </div>
            
            <div class="aws-form-group">
                <label>Mobile Image</label>
                <button class="button aws-upload-image">Upload</button>
                <input type="text" class="aws-slide-mobile-image regular-text" value="${this.escapeHtml(slideData.mobile_image || '')}" placeholder="Mobile image URL">
                <div class="aws-image-preview" style="${slideData.mobile_image ? '' : 'display:none'}">
                    ${slideData.mobile_image ? `<img src="${this.escapeHtml(slideData.mobile_image)}" style="max-width:100px; height:auto;">` : ''}
                </div>
            </div>
            
            <div class="aws-form-group">
                <label>Desktop Image</label>
                <button class="button aws-upload-image">Upload</button>
                <input type="text" class="aws-slide-desktop-image regular-text" value="${this.escapeHtml(slideData.desktop_image || '')}" placeholder="Desktop image URL">
                <div class="aws-image-preview" style="${slideData.desktop_image ? '' : 'display:none'}">
                    ${slideData.desktop_image ? `<img src="${this.escapeHtml(slideData.desktop_image)}" style="max-width:100px; height:auto;">` : ''}
                </div>
            </div>
            
            <button class="button aws-remove-slide">Remove Slide</button>
            <hr>
        </div>
    `;

    // Insert the HTML
    this.elements.slidesContainer.insertAdjacentHTML('beforeend', slideHtml);
    
    // Get the newly added slide element
    const newSlideElement = this.elements.slidesContainer.lastElementChild;

    // Add touch event for image preview
    const mobileImgInput = newSlideElement.querySelector('.aws-slide-mobile-image');
    const desktopImgInput = newSlideElement.querySelector('.aws-slide-desktop-image');

    [mobileImgInput, desktopImgInput].forEach(input => {
        input.addEventListener('touchstart', (e) => {
            if (this.isMobile && !input.value) {
                e.preventDefault();
                this.openMediaUploader(input);
            }
        }, { passive: false });
    });
}
      
      
      
       resetEditor() {
        document.getElementById('aws-slider-name').value = '';
        document.getElementById('aws-slider-slug').value = '';
        this.elements.slidesContainer.innerHTML = '';
        
        // Add one empty slide by default
        this.addSlide();
    }
      
      
        /**
     * Validate slider data before saving
     * @returns {boolean} - True if valid, false if errors exist
     */
    validateSliderData(name, slug, slides) {
        // Check slider name and slug
        if (!name.trim()) {
            alert('Slider name is required.');
            return false;
        }

        if (!slug.trim()) {
            alert('Slider slug is required.');
            return false;
        }

        // Validate slug format (alphanumeric + dashes)
        if (!/^[a-z0-9-]+$/.test(slug)) {
            alert('Slug can only contain lowercase letters, numbers, and dashes.');
            return false;
        }

        // Check for at least one slide
        if (slides.length === 0) {
            alert('Please add at least one slide.');
            return false;
        }

        // Validate each slide
        for (const slide of slides) {
            if (!slide.mobile_image && !slide.desktop_image) {
                alert('Each slide must have at least one image (mobile or desktop).');
                return false;
            }

            // Validate URLs if provided
            if (slide.link && !this.isValidUrl(slide.link)) {
                alert('Please enter a valid URL for the slide link.');
                return false;
            }
        }

        return true;
    }

    /**
     * Check if a string is a valid URL
     */
    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
      
      
         async checkSlugExists(slug, currentId = null) {
        return new Promise(resolve => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', aws_admin_vars.ajax_url);
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            xhr.onload = () => {
                try {
                    const response = JSON.parse(xhr.responseText);
                    resolve(response.exists);
                } catch {
                    resolve(false);
                }
            };
            const data = new URLSearchParams();
            data.append('action', 'aws_check_slug');
            data.append('nonce', aws_admin_vars.nonce);
            data.append('slug', slug);
            if (currentId) data.append('current_id', currentId);
            xhr.send(data);
        });
    }
   
      
      
      
      sendAjaxRequest(params) {
        return new Promise((resolve, reject) => {
            // Modern fetch API with fallback to XHR
            if (window.fetch) {
                fetch(aws_admin_vars.ajax_url, {
                    method: 'POST',
                    body: new URLSearchParams(params),
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                })
                .then(response => response.json())
                .then(resolve)
                .catch(reject);
            } else {
                // Fallback for IE11
                const xhr = new XMLHttpRequest();
                xhr.open('POST', aws_admin_vars.ajax_url);
                xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                xhr.onload = () => {
                    try {
                        resolve(JSON.parse(xhr.responseText));
                    } catch (e) {
                        reject(e);
                    }
                };
                xhr.onerror = reject;
                xhr.send(new URLSearchParams(params).toString());
            }
        });
    }
      
      
      
      
      
}
      
      
      
  
  
  
     
      
      
      
      
      
      
      
        // ... More methods to be added in next parts
      
      
      
      
      
      
      
      
      
    
  // Initialize only if the admin interface exists
    if (document.getElementById('aws-add-new')) {
        try {
            new AWSSliderAdmin();
        } catch (error) {
            console.error('Failed to initialize slider admin:', error);
            // Fallback to non-JS functionality
            document.querySelector('.aws-slider-editor').style.display = 'block';
        }
    }
});