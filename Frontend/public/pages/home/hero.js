/**
 * ═══════════════════════════════════════════════════════════════
 * ABH HOLDING GROUP — Cinematic Video Hero
 * Smooth video background with performance optimizations
 * ═══════════════════════════════════════════════════════════════
 */
(function () {
    'use strict';

    const prefersReducedMotion = () =>
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    class VideoHero {
        constructor() {
            this.hero = document.querySelector('.hero-section');
            this.video = document.querySelector('.hero-video-bg');
            if (!this.hero) return;

            this.init();
        }

        init() {
            // Video performance: pause when not visible + respect reduced motion
            if (this.video && 'IntersectionObserver' in window) {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            if (!prefersReducedMotion()) {
                                this.video.play().catch(() => {});
                            }
                        } else {
                            this.video.pause();
                        }
                    });
                }, { threshold: 0.1 });
                observer.observe(this.hero);
            }

            // Smooth scroll hint click
            const scrollHint = document.querySelector('.hero-scroll-hint');
            if (scrollHint) {
                scrollHint.style.cursor = 'pointer';
                scrollHint.addEventListener('click', () => {
                    const nextSection = this.hero.nextElementSibling;
                    if (nextSection) {
                        nextSection.scrollIntoView({ behavior: 'smooth' });
                    }
                });
            }

            // Parallax subtle effect on scroll (lightweight)
            if (!prefersReducedMotion() && this.video) {
                let ticking = false;
                window.addEventListener('scroll', () => {
                    if (!ticking) {
                        requestAnimationFrame(() => {
                            const scrollY = window.scrollY;
                            const heroH = this.hero.offsetHeight;
                            if (scrollY < heroH) {
                                const progress = scrollY / heroH;
                                this.video.style.transform = `translate(-50%, -50%) scale(${1 + progress * 0.1})`;
                            }
                            ticking = false;
                        });
                        ticking = true;
                    }
                }, { passive: true });
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => new VideoHero());
    } else {
        new VideoHero();
    }
})();