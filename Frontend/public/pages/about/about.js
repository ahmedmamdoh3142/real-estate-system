/**
 * =====================================================
 * ABH HOLDING GROUP - About Page JavaScript
 * Version: 2.0.0
 * Optimized for performance with AOS animations
 * =====================================================
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
            this.setupMobileMenu();
            this.setupNavbarScroll();
            this.setupTouchOptimization();
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
                duration: 500,
                easing: 'ease-out',
                once: true,
                mirror: false,
                offset: 60,
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
         * Setup mobile menu functionality
         */
        setupMobileMenu() {
            if (!this.toggle || !this.navMenu) return;

            // Toggle menu on button click
            this.toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMenu();
            });

            // Close menu on nav link click
            const navLinks = this.navMenu.querySelectorAll('a');
            navLinks.forEach(link => {
                link.addEventListener('click', () => this.closeMenu());
            });

            // Close menu on window resize
            window.addEventListener('resize', () => {
                if (window.innerWidth > 768 && this.isMenuOpen) {
                    this.closeMenu();
                }
            });

            // Close menu on outside click
            document.addEventListener('click', (e) => {
                if (this.isMenuOpen && 
                    !this.navMenu.contains(e.target) && 
                    !this.toggle.contains(e.target)) {
                    this.closeMenu();
                }
            });
        }

        /**
         * Toggle mobile menu
         */
        toggleMenu() {
            if (this.isMenuOpen) {
                this.closeMenu();
            } else {
                this.openMenu();
            }
        }

        /**
         * Open mobile menu
         */
        openMenu() {
            this.navMenu.classList.add('active');
            this.toggle.classList.add('active');
            this.body.classList.add('menu-open');
            this.toggle.setAttribute('aria-expanded', 'true');
            this.isMenuOpen = true;
        }

        /**
         * Close mobile menu
         */
        closeMenu() {
            this.navMenu.classList.remove('active');
            this.toggle.classList.remove('active');
            this.body.classList.remove('menu-open');
            this.toggle.setAttribute('aria-expanded', 'false');
            this.isMenuOpen = false;
        }

        /**
         * Setup navbar scroll effect
         */
        setupNavbarScroll() {
            if (!this.navbar) return;

            let ticking = false;

            const updateNavbar = () => {
                const scrolled = window.scrollY > this.scrollThreshold;
                this.navbar.classList.toggle('scrolled', scrolled);
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
         * Inject mobile admin button styles
         */
        injectMobileAdminStyles() {
            if (document.getElementById('mobile-admin-styles')) return;

            const style = document.createElement('style');
            style.id = 'mobile-admin-styles';
            style.textContent = `
                @media (max-width: 768px) {
                    .mobile-admin-btn {
                        margin-top: auto;
                        padding-top: 1.5rem;
                        border-top: 1px solid rgba(203, 205, 205, 0.08);
                        display: block !important;
                    }
                    
                    .mobile-admin-btn .premium-link {
                        background: rgba(203, 205, 205, 0.05) !important;
                        border: 1px solid rgba(203, 205, 205, 0.1) !important;
                        color: var(--color-text-primary) !important;
                        font-weight: 600 !important;
                    }
                    
                    .mobile-admin-btn .premium-link:hover {
                        background: rgba(203, 205, 205, 0.08) !important;
                        border-color: rgba(203, 205, 205, 0.2) !important;
                    }
                    
                    .mobile-admin-btn .nav-icon-wrapper {
                        background: rgba(203, 205, 205, 0.08) !important;
                    }
                }
                
                @media (min-width: 769px) {
                    .mobile-admin-btn {
                        display: none !important;
                    }
                }
            `;

            document.head.appendChild(style);
        }

        /**
         * Setup touch optimization for mobile
         */
        setupTouchOptimization() {
            const touchElements = document.querySelectorAll(
                'button, a, .value-card, .mission-card, .goal'
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
