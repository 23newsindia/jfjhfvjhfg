document.addEventListener('DOMContentLoaded', function() {
    class AWSSliderAdmin {
        constructor() {
            // Initialize elements
            this.elements = {
       
                addNewBtn: document.getElementById('aws-add-new'),
                slidersTable: document.querySelector('.aws-sliders-table'),
                sliderEditor: document.querySelector('.aws-slider-editor'),
                cancelEditBtn: document.getElementById('aws-cancel-edit'),
                saveSliderBtn: document.getElementById('aws-save-slider'),
                addSlideBtn: document.getElementById('aws-add-slide'),
               
                nameField: document.getElementById('aws-slider-name'),
                slugField: document.getElementById('aws-slider-slug'),
               slidesContainer: document.getElementById('aws-slides-container')
            };

          if (!this.elements.slidesContainer) {
        console.error('Slides container not found');
        return;
    }

            // Safety check for required elements
            if (!this.validateElements()) {
                console.warn('Required elements not found');
                return;
            }

            this.isMobile = window.innerWidth < 768;
            this.mediaFrame = null;
            this.init();
        }

        validateElements() {
            return this.elements.addNewBtn && 
                   this.elements.slidersTable && 
                   this.elements.sliderEditor && 
                   this.elements.cancelEditBtn && 
                   this.elements.saveSliderBtn && 
                   this.elements.addSlideBtn && 
                   this.elements.slidesContainer;
        }

        init() {
            // Button event listeners
            this.elements.addNewBtn.addEventListener('click', () => this.showEditor());
            this.elements.cancelEditBtn.addEventListener('click', () => this.hideEditor());
            this.elements.addSlideBtn.addEventListener('click', () => this.addSlide());
            this.elements.saveSliderBtn.addEventListener('click', () => this.saveSlider());

            // Delegated event listeners
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('aws-edit-slider')) {
                    const sliderId = e.target.dataset.id;
                    this.editSlider(sliderId);
                }

                if (e.target.classList.contains('aws-delete-slider')) {
                    if (confirm('Are you sure you want to delete this slider?')) {
                        const sliderId = e.target.dataset.id;
                        this.deleteSlider(sliderId);
                    }
                }

                if (e.target.classList.contains('aws-remove-slide')) {
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
            });
        }

        showEditor() {
            this.elements.slidersTable.style.display = 'none';
            this.elements.sliderEditor.style.display = 'block';
            this.resetEditor();
        }

        hideEditor() {
            this.elements.slidersTable.style.display = 'block';
            this.elements.sliderEditor.style.display = 'none';
        }

        resetEditor() {
            if (this.elements.nameField) this.elements.nameField.value = '';
            if (this.elements.slugField) this.elements.slugField.value = '';
            
            if (this.elements.slidesContainer) {
                this.elements.slidesContainer.innerHTML = '';
                this.addSlide(); // Add one empty slide
            }
        }

        addSlide(slideData = {}) {
    if (!this.elements.slidesContainer) return;

    const slideId = Date.now();
    const slideHtml = `
    
                <div class="aws-slide" data-id="${slideId}">
            <div class="aws-form-group">
                <label>Slide Title</label>
                <input type="text" class="aws-slide-title regular-text" 
                    value="${this.escapeHtml(slideData.title || '')}" 
                    placeholder="Enter slide title">
            </div>

                    
                    <div class="aws-form-group">
                        <label>Link URL</label>
                        <input type="url" class="aws-slide-link regular-text" 
                               value="${this.escapeHtml(slideData.link || '')}" 
                               placeholder="https://example.com">
                    </div>
                    
                    <div class="aws-form-group">
                        <label>Mobile Image</label>
                        <button type="button" class="button aws-upload-image">Upload Image</button>
                        <input type="text" class="aws-slide-mobile-image regular-text" 
                               value="${this.escapeHtml(slideData.mobile_image || '')}" 
                               placeholder="Mobile image URL">
                        <div class="aws-image-preview" style="${slideData.mobile_image ? '' : 'display:none'}">
                            ${slideData.mobile_image ? `<img src="${this.escapeHtml(slideData.mobile_image)}" alt="Preview">` : ''}
                        </div>
                    </div>
                    
                    <div class="aws-form-group">
                        <label>Desktop Image</label>
                        <button type="button" class="button aws-upload-image">Upload Image</button>
                        <input type="text" class="aws-slide-desktop-image regular-text" 
                               value="${this.escapeHtml(slideData.desktop_image || '')}" 
                               placeholder="Desktop image URL">
                        <div class="aws-image-preview" style="${slideData.desktop_image ? '' : 'display:none'}">
                            ${slideData.desktop_image ? `<img src="${this.escapeHtml(slideData.desktop_image)}" alt="Preview">` : ''}
                        </div>
                    </div>
                    
                    <button type="button" class="button aws-remove-slide">Remove Slide</button>
                    <hr>
                </div>
            `;

            this.elements.slidesContainer.insertAdjacentHTML('beforeend', slideHtml);
        }

        openMediaUploader(inputField) {
            // Check if wp.media is available
            if (typeof wp === 'undefined' || !wp.media) {
                console.error('WordPress Media Library not available');
                alert('Media Library not available. Please refresh the page.');
                return;
            }

            // Create the media frame if it doesn't exist
            if (!this.mediaFrame) {
                this.mediaFrame = wp.media({
                    title: 'Select or Upload Image',
                    button: {
                        text: 'Use this image'
                    },
                    multiple: false,
                    library: {
                        type: 'image'
                    }
                });

                // When an image is selected, run a callback.
                this.mediaFrame.on('select', () => {
                    const attachment = this.mediaFrame.state().get('selection').first().toJSON();
                    
                    // Update input field
                    inputField.value = attachment.url;

                    // Update preview
                    const previewDiv = inputField.nextElementSibling;
                    if (previewDiv && previewDiv.classList.contains('aws-image-preview')) {
                        previewDiv.style.display = 'block';
                        let img = previewDiv.querySelector('img');
                        if (!img) {
                            img = document.createElement('img');
                            img.alt = 'Preview';
                            previewDiv.appendChild(img);
                        }
                        img.src = attachment.url;
                        img.style.maxWidth = '100px';
                        img.style.height = 'auto';
                    }
                });
            }

            this.mediaFrame.open();
        }

        escapeHtml(unsafe) {
            if (!unsafe) return '';
            return unsafe
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

        editSlider(sliderId) {
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = window.location.href;

            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'edit_slider';
            input.value = sliderId;

            form.appendChild(input);
            document.body.appendChild(form);
            form.submit();
        }

        deleteSlider(sliderId) {
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = window.location.href;

            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'delete_slider';
            input.value = sliderId;

            form.appendChild(input);
            document.body.appendChild(form);
            form.submit();
        }

        saveSlider() {
    const slides = [];
    this.elements.slidesContainer.querySelectorAll('.aws-slide').forEach(slideEl => {
        slides.push({
            title: slideEl.querySelector('.aws-slide-title').value || '',
            link: slideEl.querySelector('.aws-slide-link').value || '',
            mobile_image: slideEl.querySelector('.aws-slide-mobile-image').value || '',
            desktop_image: slideEl.querySelector('.aws-slide-desktop-image').value || ''
        });
    });

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = window.location.href;

    // Add nonce field (add this part)
    const nonceInput = document.createElement('input');
    nonceInput.type = 'hidden';
    nonceInput.name = '_wpnonce';
    nonceInput.value = awsAdminData.nonce;
    form.appendChild(nonceInput);

    const nameInput = document.createElement('input');
    nameInput.type = 'hidden';
    nameInput.name = 'slider_name';
    nameInput.value = this.elements.nameField.value;

    const slugInput = document.createElement('input');
    slugInput.type = 'hidden';
    slugInput.name = 'slider_slug';
    slugInput.value = this.elements.slugField.value;

    const slidesInput = document.createElement('input');
    slidesInput.type = 'hidden';
    slidesInput.name = 'slider_slides';
    slidesInput.value = JSON.stringify(slides);

    const actionInput = document.createElement('input');
    actionInput.type = 'hidden';
    actionInput.name = 'save_slider';
    actionInput.value = '1';

    form.appendChild(nameInput);
    form.appendChild(slugInput);
    form.appendChild(slidesInput);
    form.appendChild(actionInput);

    document.body.appendChild(form);
    form.submit();
}
    }

    /// Initialize the admin class
    if (document.getElementById('aws-add-new')) {
        window.awsSliderAdmin = new AWSSliderAdmin();
        
        // Global initialization function for PHP
        window.initializeSlider = function(slides) {
            if (window.awsSliderAdmin && Array.isArray(slides)) {
                slides.forEach(slide => window.awsSliderAdmin.addSlide(slide));
            }
        };
    }
});
