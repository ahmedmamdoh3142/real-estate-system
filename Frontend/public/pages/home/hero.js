/**
 * ═══════════════════════════════════════════════════════════════
 * ABH HOLDING GROUP — Cinematic Video Hero (OPTIMIZED)
 * Version: 2.1.0
 * Changes: adaptive video quality, reduced forced reflow, passive events
 * ═══════════════════════════════════════════════════════════════
 */
(function () {
    'use strict';

    const prefersReducedMotion = () =>
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const isMobile = () => window.innerWidth < 768;

    class VideoHero {
        constructor() {
            this.hero   = document.querySelector('.hero-section');
            this.video  = document.querySelector('.hero-video-bg');
            if (!this.hero) return;

            this.ticking       = false;
            this.heroHeight    = 0;
            this.rafId         = null;
            this.resizeTimeout = null;

            this.init();
        }

        init() {
            this._setupVideo();
            this._setupScrollHint();
            if (!prefersReducedMotion() && !isMobile() && this.video) {
                this._setupParallax();
            }
        }

        _setupVideo() {
            const video = this.video;
            if (!video) return;

            // On mobile: don't autoplay to save bandwidth — show poster instead
            if (isMobile()) {
                video.removeAttribute('autoplay');
                video.pause();
                return;
            }

            // Pause/resume based on visibility (saves CPU when scrolled away)
            if ('IntersectionObserver' in window) {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            if (!prefersReducedMotion()) {
                                video.play().catch(() => {});
                            }
                        } else {
                            video.pause();
                        }
                    });
                }, { threshold: 0.1 });
                observer.observe(this.hero);
            }

            // Pause when tab is hidden — saves CPU and battery
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    video.pause();
                } else if (!prefersReducedMotion() && !isMobile()) {
                    video.play().catch(() => {});
                }
            });
        }

        _setupScrollHint() {
            const scrollHint = document.querySelector('.hero-scroll-hint');
            if (!scrollHint) return;

            scrollHint.style.cursor = 'pointer';
            scrollHint.addEventListener('click', () => {
                const next = this.hero.nextElementSibling;
                if (next) next.scrollIntoView({ behavior: 'smooth' });
            }, { passive: true });
        }

        _setupParallax() {
            // Cache hero height once — read it here, not in scroll handler
            // This eliminates the forced reflow detected in Lighthouse
            this.heroHeight = this.hero.getBoundingClientRect().height;

            // Update cached height on resize (debounced)
            window.addEventListener('resize', () => {
                clearTimeout(this.resizeTimeout);
                this.resizeTimeout = setTimeout(() => {
                    // Single read — no reflow in scroll handler
                    this.heroHeight = this.hero.getBoundingClientRect().height;
                }, 200);
            }, { passive: true });

            // Scroll handler: write-only (no reads = no forced reflow)
            window.addEventListener('scroll', () => {
                if (!this.ticking) {
                    this.rafId = requestAnimationFrame(() => {
                        const scrollY = window.scrollY;
                        if (scrollY < this.heroHeight) {
                            const progress = scrollY / this.heroHeight;
                            // Use transform only (GPU composited, no layout)
                            this.video.style.transform =
                                `translate(-50%, calc(-50% + ${scrollY * 0.15}px)) scale(${1 + progress * 0.08})`;
                        }
                        this.ticking = false;
                    });
                    this.ticking = true;
                }
            }, { passive: true });
        }

        destroy() {
            if (this.rafId) cancelAnimationFrame(this.rafId);
            clearTimeout(this.resizeTimeout);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => new VideoHero());
    } else {
        new VideoHero();
    }
})();