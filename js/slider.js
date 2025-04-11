class ImageSlider {
    constructor(selector) {
        this.slider = document.querySelector(selector);
        if (!this.slider) return;

        this.inner = this.slider.querySelector('.VueCarousel-inner');
        this.slides = this.slider.querySelectorAll('.VueCarousel-slide');
        this.dots = this.slider.querySelectorAll('.VueCarousel-dot');
        
        this.currentSlide = 0;
        this.slideCount = this.slides.length;
        this.isAnimating = false;
        
        this.updateSliderWidth();
        this.inner.style.transform = 'translate(0, 0)';
        
        this.init();
    }

    updateSliderWidth() {
        // Set total width of inner container
        const totalWidth = `${this.slideCount * 100}%`;
        this.inner.style.width = totalWidth;
        
        // Set width for each individual slide
        const slideWidth = `${100 / this.slideCount}%`;
        this.slides.forEach(slide => {
            slide.style.width = slideWidth;
        });
    }

    init() {
        // Set up dots click handlers
        this.dots.forEach((dot, index) => {
            dot.addEventListener('click', () => this.goToSlide(index));
        });

        // Set up touch events
        let touchStartX = 0;
        let touchEndX = 0;

        this.inner.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        });

        this.inner.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].clientX;
            const diff = touchStartX - touchEndX;

            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    this.nextSlide();
                } else {
                    this.prevSlide();
                }
            }
        });

        // Auto advance slides
        setInterval(() => this.nextSlide(), 5000);

        // Handle window resize
        window.addEventListener('resize', () => {
            this.updateSliderWidth();
            this.goToSlide(this.currentSlide, false);
        });
    }

    goToSlide(index, animate = true) {
        if (this.isAnimating || index === this.currentSlide) return;
        
        if (animate) {
            this.isAnimating = true;
        }

        // Calculate exact translation percentage
        const translateX = -(index * (100 / this.slideCount));
        
        // Apply transition
        this.inner.style.transition = animate ? 'transform 0.5s ease' : 'none';
        this.inner.style.transform = `translate(${translateX}%, 0)`;
        
        // Update dots
        this.dots[this.currentSlide].classList.remove('VueCarousel-dot--active');
        this.dots[this.currentSlide].style.backgroundColor = 
            window.innerWidth <= 768 ? '#979A9F' : '#EFEFEF';
        
        this.dots[index].classList.add('VueCarousel-dot--active');
        this.dots[index].style.backgroundColor = 
            window.innerWidth <= 768 ? '#000' : '#117A7A';

        this.currentSlide = index;

        if (animate) {
            setTimeout(() => {
                this.isAnimating = false;
                this.inner.style.transition = 'transform 0.5s ease';
            }, 500);
        }
    }

    nextSlide() {
        const next = (this.currentSlide + 1) % this.slideCount;
        this.goToSlide(next);
    }

    prevSlide() {
        const prev = (this.currentSlide - 1 + this.slideCount) % this.slideCount;
        this.goToSlide(prev);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Initialize mobile slider
    new ImageSlider('.mobileBannerView');
    // Initialize desktop slider
    new ImageSlider('.bannerview');
});