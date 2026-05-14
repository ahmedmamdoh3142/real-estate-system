/**
 * ═══════════════════════════════════════════════════════════════
 * ABH HOLDING GROUP - About Page JavaScript
 * Version: 3.0.0 — CINEMATIC + SCROLL REVEAL + AOS
 * Includes: Mobile Menu, Navbar Scroll, AOS, Scroll Reveal Observer
 * ═══════════════════════════════════════════════════════════════
 */

(function() {
    'use strict';

    /**
     * AboutPage Class
     * Handles all About page functionality
     */
    class AboutPage {
        constructor() {
            this.isMenuOpen = false;
            this.scrollThreshold = 50;
            this.observers = [];
            this.init();
        }

        /**
         * Initialize the page
         */
        init() {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setupPage());
            } else {
                this.setupPage();
            }
        }

        /**
         * Setup all page components
         */
        setupPage() {
            this.cacheElements();
            this.initAOS();
            this.initScrollReveal();
            this.setupMobileMenu();
            this.setupNavbarScroll();
            this.setupTouchOptimization();
            this.setupSmoothScroll();
        }

        /**
         * Cache DOM elements for performance
         */
        cacheElements() {
            this.navbar = document.querySelector('.navbar');
            this.toggle = document.getElementById('mobile-toggle');
            this.navMenu = document.querySelector('.nav-menu');
            this.body = document.body;
        }

        /**
         * Initialize AOS (Animate On Scroll)
         */
        initAOS() {
            if (typeof AOS === 'undefined') {
                console.warn('AOS library not loaded');
                return;
            }

            AOS.init({
                duration: 600,
                easing: 'ease-out-cubic',
                once: true,
                mirror: false,
                offset: 80,
                disable: window.innerWidth < 768
            });

            // Refresh AOS after page fully loads
            window.addEventListener('load', () => {
                requestAnimationFrame(() => {
                    AOS.refresh();
                });
            });
        }

        /**
         * Initialize IntersectionObserver for scroll reveal
         */
        initScrollReveal() {
            const sections = document.querySelectorAll('.section-reveal');
            if (!sections.length) return;

            if (!('IntersectionObserver' in window)) {
                sections.forEach(section => section.classList.add('revealed'));
                return;
            }

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '0px 0px -60px 0px'
            });

            sections.forEach(section => {
                observer.observe(section);
            });

            this.observers.push(observer);
        }

        /**
         * Setup mobile menu functionality
         */
        setupMobileMenu() {
            if (!this.toggle || !this.navMenu) return;

            const openMenu = () => {
                this.navMenu.classList.add('active');
                this.toggle.classList.add('active');
                this.toggle.setAttribute('aria-expanded', 'true');
                this.isMenuOpen = true;
                document.body.style.overflow = 'hidden';

                setTimeout(() => {
                    document.addEventListener('click', closeMenuOnClickOutside);
                    document.addEventListener('keydown', closeMenuOnEscape);
                }, 10);
            };

            const closeMenu = () => {
                this.navMenu.classList.remove('active');
                this.toggle.classList.remove('active');
                this.toggle.setAttribute('aria-expanded', 'false');
                this.isMenuOpen = false;
                document.body.style.overflow = '';

                document.removeEventListener('click', closeMenuOnClickOutside);
                document.removeEventListener('keydown', closeMenuOnEscape);
            };

            const closeMenuOnClickOutside = (e) => {
                if (!this.navMenu.contains(e.target) && !this.toggle.contains(e.target)) {
                    closeMenu();
                }
            };

            const closeMenuOnEscape = (e) => {
                if (e.key === 'Escape') {
                    closeMenu();
                    this.toggle.focus();
                }
            };

            this.toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.isMenuOpen ? closeMenu() : openMenu();
            });

            this.navMenu.addEventListener('click', (e) => {
                if (e.target.closest('.nav-link')) {
                    closeMenu();
                }
            });

            window.addEventListener('resize', () => {
                if (window.innerWidth > 768 && this.isMenuOpen) {
                    closeMenu();
                }
            });
        }

        /**
         * Setup navbar scroll effect
         */
        setupNavbarScroll() {
            if (!this.navbar) return;

            let ticking = false;

            const updateNavbar = () => {
                const scrollY = window.scrollY;
                if (scrollY > this.scrollThreshold) {
                    this.navbar.classList.add('scrolled');
                } else {
                    this.navbar.classList.remove('scrolled');
                }
                ticking = false;
            };

            window.addEventListener('scroll', () => {
                if (!ticking) {
                    requestAnimationFrame(updateNavbar);
                    ticking = true;
                }
            }, { passive: true });

            // Initial check
            updateNavbar();
        }

        /**
         * Setup smooth scroll for anchor links
         */
        setupSmoothScroll() {
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function(e) {
                    const targetId = this.getAttribute('href');
                    if (targetId === '#') return;

                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        e.preventDefault();
                        targetElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                });
            });
        }

        /**
         * Setup touch optimization for mobile
         */
        setupTouchOptimization() {
            const touchElements = document.querySelectorAll(
                'button, a, .value-card, .mission-card, .goal, .social-link'
            );

            touchElements.forEach(el => {
                el.addEventListener('touchstart', function() {
                    this.classList.add('touch-active');
                }, { passive: true });

                el.addEventListener('touchend', function() {
                    this.classList.remove('touch-active');
                }, { passive: true });

                el.addEventListener('touchcancel', function() {
                    this.classList.remove('touch-active');
                }, { passive: true });
            });
        }

        /**
         * Cleanup observers on destroy
         */
        destroy() {
            this.observers.forEach(observer => observer.disconnect());
            this.observers = [];
        }
    }

    /**
     * Initialize the page
     */
    function initialize() {
        try {
            window.aboutPage = new AboutPage();
        } catch (error) {
            console.error('Failed to initialize AboutPage:', error);
        }
    }

    // Start initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();