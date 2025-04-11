document.addEventListener('DOMContentLoaded', function() {
    // Initialize all sliders on the page
    document.querySelectorAll('.aws-slider').forEach(sliderEl => {
        new AWSSlider(sliderEl);
    });
});

class AWSSlider {
    constructor(sliderEl) {
        this.slider = sliderEl;
        this.inner = sliderEl.querySelector('.aws-slider-inner');
        this.slides = sliderEl.querySelectorAll('.aws-slide');
        this.dots = sliderEl.querySelectorAll('.aws-dot');
        this.currentIndex = 0;
        this.slideCount = this.slides.length;
        this.isAnimating = false;
        this.autoPlayInterval = null;
        
        this.init();
    }
    
    init() {
        // Set up initial slide positions
        this.updateSliderDimensions();
        
        // Set up dot navigation
        this.dots.forEach(dot => {
            dot.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                this.goToSlide(index);
            });
        });
        
        // Set up touch events for mobile
        this.setupTouchEvents();
        
        // Start autoplay
        this.startAutoPlay();
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.updateSliderDimensions();
            this.goToSlide(this.currentIndex, false);
        });
    }
    
    updateSliderDimensions() {
        // Set total width of inner container
        this.inner.style.width = `${this.slideCount * 100}%`;
        
        // Set width for each slide
        const slideWidth = `${100 / this.slideCount}%`;
        this.slides.forEach(slide => {
            slide.style.width = slideWidth;
        });
    }
    
    setupTouchEvents() {
        let touchStartX = 0;
        let touchEndX = 0;
        
        this.inner.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            this.pauseAutoPlay();
        }, { passive: true });
        
        this.inner.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].clientX;
            this.handleSwipe(touchStartX, touchEndX);
            this.resumeAutoPlay();
        }, { passive: true });
    }
    
    handleSwipe(startX, endX) {
        const diff = startX - endX;
        
        if (Math.abs(diff) > 50) { // Minimum swipe distance
            if (diff > 0) {
                this.nextSlide();
            } else {
                this.prevSlide();
            }
        }
    }
    
    goToSlide(index, animate = true) {
        if (this.isAnimating || index < 0 || index >= this.slideCount || index === this.currentIndex) {
            return;
        }
        
        this.isAnimating = animate;
        
        // Calculate translation
        const translateX = -index * 100;
        this.inner.style.transition = animate ? 'transform 0.5s ease' : 'none';
        this.inner.style.transform = `translateX(${translateX}%)`;
        
        // Update dots
        this.updateDots(index);
        
        this.currentIndex = index;
        
        if (animate) {
            setTimeout(() => {
                this.isAnimating = false;
            }, 500);
        }
    }
    
    updateDots(index) {
        this.dots.forEach(dot => dot.classList.remove('active'));
        this.dots[index].classList.add('active');
    }
    
    nextSlide() {
        const nextIndex = (this.currentIndex + 1) % this.slideCount;
        this.goToSlide(nextIndex);
    }
    
    prevSlide() {
        const prevIndex = (this.currentIndex - 1 + this.slideCount) % this.slideCount;
        this.goToSlide(prevIndex);
    }
    
    startAutoPlay() {
        this.autoPlayInterval = setInterval(() => {
            this.nextSlide();
        }, 5000);
    }
    
    pauseAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
    }
    
    resumeAutoPlay() {
        if (!this.autoPlayInterval) {
            this.startAutoPlay();
        }
    }
}