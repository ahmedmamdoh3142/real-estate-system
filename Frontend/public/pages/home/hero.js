/**
 * ═══════════════════════════════════════════════════════════════
 * ABH HOLDING GROUP - Cinematic Hero JavaScript
 * Premium Animation & Interaction System (Performance Optimized)
 * Pure Vanilla JavaScript - No Dependencies
 * ═══════════════════════════════════════════════════════════════
 */

(function() {
    'use strict';

    // ─────────────────────────────────────────────
    // Configuration
    // ─────────────────────────────────────────────
    const CONFIG = {
        particles: {
            count: 25, // Reduced from 60 for high performance
            minSize: 1,
            maxSize: 2.5,
            minSpeed: 0.2,
            maxSpeed: 0.6,
            connectionDistance: 120,
            mouseRadius: 80
        },
        parallax: {
            enabled: true,
            intensity: 0.3
        }
    };

    // ─────────────────────────────────────────────
    // Utility Functions
    // ─────────────────────────────────────────────
    const lerp = (start, end, factor) => start + (end - start) * factor;
    
    const random = (min, max) => Math.random() * (max - min) + min;
    
    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
    
    const prefersReducedMotion = () => 
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ─────────────────────────────────────────────
    // Particle System (Performance Optimized)
    // ─────────────────────────────────────────────
    class ParticleSystem {
        constructor(container) {
            this.container = container;
            this.canvas = null;
            this.ctx = null;
            this.particles = [];
            this.mouse = { x: null, y: null };
            this.animationId = null;
            this.isVisible = true;
            this.lastMouseMoveTime = 0;
            
            if (prefersReducedMotion()) return;
            
            this.init();
        }
        
        init() {
            this.canvas = document.createElement('canvas');
            this.canvas.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
            `;
            this.container.appendChild(this.canvas);
            this.ctx = this.canvas.getContext('2d', { alpha: true, desynchronized: true });
            
            this.resize();
            this.createParticles();
            
            window.addEventListener('resize', () => this.resize());
            window.addEventListener('mousemove', (e) => this.handleMouseMove(e), { passive: true });
            
            document.addEventListener('visibilitychange', () => {
                this.isVisible = !document.hidden;
                if (this.isVisible && !this.animationId) {
                    this.animate();
                }
            });
            
            this.animate();
        }
        
        resize() {
            const rect = this.container.getBoundingClientRect();
            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
        }
        
        createParticles() {
            this.particles = [];
            const { count, minSize, maxSize, minSpeed, maxSpeed } = CONFIG.particles;
            
            for (let i = 0; i < count; i++) {
                this.particles.push({
                    x: random(0, this.canvas.width),
                    y: random(0, this.canvas.height),
                    size: random(minSize, maxSize),
                    speedX: random(-maxSpeed, maxSpeed),
                    speedY: random(-maxSpeed, maxSpeed),
                    opacity: random(0.2, 0.5),
                    pulse: random(0, Math.PI * 2),
                    pulseSpeed: random(0.01, 0.02)
                });
            }
        }
        
        handleMouseMove(e) {
            const now = performance.now();
            if (now - this.lastMouseMoveTime < 16) return; // Throttle to ~60fps
            this.lastMouseMoveTime = now;
            
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        }
        
        animate() {
            if (!this.isVisible || !this.container.isConnected) {
                this.animationId = null;
                return;
            }
            
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Update and draw particles
            this.particles.forEach((p) => {
                p.pulse += p.pulseSpeed;
                const pulseFactor = 0.5 + Math.sin(p.pulse) * 0.5;
                
                if (this.mouse.x !== null) {
                    const dx = this.mouse.x - p.x;
                    const dy = this.mouse.y - p.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < CONFIG.particles.mouseRadius) {
                        const force = (CONFIG.particles.mouseRadius - distance) / CONFIG.particles.mouseRadius;
                        p.x -= dx * force * 0.015;
                        p.y -= dy * force * 0.015;
                    }
                }
                
                p.x += p.speedX;
                p.y += p.speedY;
                
                if (p.x < 0) p.x = this.canvas.width;
                if (p.x > this.canvas.width) p.x = 0;
                if (p.y < 0) p.y = this.canvas.height;
                if (p.y > this.canvas.height) p.y = 0;
                
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size * pulseFactor, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(203, 205, 205, ${p.opacity * pulseFactor})`;
                this.ctx.fill();
            });
            
            // Draw connections (simplified for performance)
            this.drawConnections();
            
            this.animationId = requestAnimationFrame(() => this.animate());
        }
        
        drawConnections() {
            const { connectionDistance } = CONFIG.particles;
            
            for (let i = 0; i < this.particles.length; i++) {
                for (let j = i + 1; j < this.particles.length; j++) {
                    const p1 = this.particles[i];
                    const p2 = this.particles[j];
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < connectionDistance) {
                        const opacity = (1 - distance / connectionDistance) * 0.1;
                        this.ctx.beginPath();
                        this.ctx.moveTo(p1.x, p1.y);
                        this.ctx.lineTo(p2.x, p2.y);
                        this.ctx.strokeStyle = `rgba(203, 205, 205, ${opacity})`;
                        this.ctx.lineWidth = 0.4;
                        this.ctx.stroke();
                    }
                }
            }
        }
        
        stop() {
            this.isVisible = false;
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
                this.animationId = null;
            }
        }
        
        start() {
            if (!this.isVisible) {
                this.isVisible = true;
                this.animate();
            }
        }
        
        destroy() {
            this.stop();
            if (this.canvas && this.canvas.parentNode) {
                this.canvas.parentNode.removeChild(this.canvas);
            }
        }
    }

    // ─────────────────────────────────────────────
    // Parallax System (Idle Optimization)
    // ─────────────────────────────────────────────
    class ParallaxSystem {
        constructor(heroSection) {
            this.hero = heroSection;
            this.elements = {
                orbs: this.hero.querySelectorAll('.orb'),
                aurora: this.hero.querySelectorAll('.aurora-beam'),
                content: this.hero.querySelector('.hero-content'),
                particles: this.hero.querySelector('.hero-particles'),
                scrollIndicator: this.hero.querySelector('.scroll-indicator')
            };
            
            this.mouse = { x: 0.5, y: 0.5 };
            this.targetMouse = { x: 0.5, y: 0.5 };
            this.scroll = 0;
            this.rafId = null;
            this.idleTimeout = null;
            this.isActive = false;
            
            if (prefersReducedMotion()) return;
            
            this.init();
        }
        
        init() {
            window.addEventListener('mousemove', (e) => {
                this.targetMouse.x = e.clientX / window.innerWidth;
                this.targetMouse.y = e.clientY / window.innerHeight;
                this.activateLoop();
            }, { passive: true });
            
            window.addEventListener('scroll', () => {
                this.scroll = window.scrollY;
                this.activateLoop();
            }, { passive: true });
            
            // Initial activation
            this.activateLoop();
        }
        
        activateLoop() {
            if (!this.isActive) {
                this.isActive = true;
                this.animate();
            }
            
            // Clear previous idle timeout
            clearTimeout(this.idleTimeout);
            
            // Stop loop after 400ms of inactivity to save resources
            this.idleTimeout = setTimeout(() => {
                this.isActive = false;
                if (this.rafId) {
                    cancelAnimationFrame(this.rafId);
                    this.rafId = null;
                }
            }, 400);
        }
        
        animate() {
            if (!this.isActive) return;
            
            this.mouse.x = lerp(this.mouse.x, this.targetMouse.x, 0.05);
            this.mouse.y = lerp(this.mouse.y, this.targetMouse.y, 0.05);
            
            const heroHeight = this.hero.offsetHeight;
            const scrollProgress = clamp(this.scroll / heroHeight, 0, 1);
            
            // Optimize: only update styles if actually visible
            this.elements.orbs.forEach((orb, i) => {
                const intensity = (i + 1) * 12;
                const x = (this.mouse.x - 0.5) * intensity;
                const y = (this.mouse.y - 0.5) * intensity;
                const scrollY = scrollProgress * 40 * (i + 1);
                orb.style.transform = `translate(${x}px, ${y + scrollY}px)`;
            });
            
            this.elements.aurora.forEach((beam, i) => {
                const intensity = (i + 1) * 15;
                const x = (this.mouse.x - 0.5) * intensity;
                beam.style.transform = `translateX(${x}px) rotate(${-15 + i * 15}deg)`;
            });
            
            if (this.elements.content && this.scroll < heroHeight) {
                const y = scrollProgress * 80;
                const opacity = 1 - scrollProgress * 1.5;
                this.elements.content.style.transform = `translateY(${y}px)`;
                this.elements.content.style.opacity = Math.max(0, opacity);
            }
            
            if (this.elements.scrollIndicator) {
                const indicatorOpacity = Math.max(0, 1 - this.scroll / 150);
                this.elements.scrollIndicator.style.opacity = indicatorOpacity;
            }
            
            this.rafId = requestAnimationFrame(() => this.animate());
        }
        
        destroy() {
            clearTimeout(this.idleTimeout);
            this.isActive = false;
            if (this.rafId) {
                cancelAnimationFrame(this.rafId);
            }
        }
    }

    // ─────────────────────────────────────────────
    // Magnetic Buttons (Optimized)
    // ─────────────────────────────────────────────
    class MagneticButtons {
        constructor() {
            this.buttons = document.querySelectorAll('.hero-actions .btn');
            this.boundHandlers = new Map();
            
            if (prefersReducedMotion()) return;
            
            this.init();
        }
        
        init() {
            this.buttons.forEach(button => {
                const handleMouseMove = (e) => {
                    const rect = button.getBoundingClientRect();
                    const x = e.clientX - rect.left - rect.width / 2;
                    const y = e.clientY - rect.top - rect.height / 2;
                    
                    button.style.transform = `
                        translateY(-4px) 
                        translate(${x * 0.08}px, ${y * 0.08}px)
                    `;
                };
                
                const handleMouseLeave = () => {
                    button.style.transform = '';
                };
                
                button.addEventListener('mousemove', handleMouseMove, { passive: true });
                button.addEventListener('mouseleave', handleMouseLeave);
                
                this.boundHandlers.set(button, { handleMouseMove, handleMouseLeave });
            });
        }
    }

    // ─────────────────────────────────────────────
    // Tilt Effect (Optimized)
    // ─────────────────────────────────────────────
    class TiltEffect {
        constructor() {
            this.card = document.querySelector('.hero-stats');
            this.active = false;
            
            if (prefersReducedMotion() || !this.card) return;
            
            this.init();
        }
        
        init() {
            const handleMouseEnter = () => {
                this.active = true;
                this.card.addEventListener('mousemove', handleMouseMove, { passive: true });
            };
            
            const handleMouseLeave = () => {
                this.active = false;
                this.card.style.transform = '';
                this.card.removeEventListener('mousemove', handleMouseMove);
            };
            
            const handleMouseMove = (e) => {
                if (!this.active) return;
                const rect = this.card.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width;
                const y = (e.clientY - rect.top) / rect.height;
                
                const tiltX = (y - 0.5) * 8;
                const tiltY = (x - 0.5) * -8;
                
                this.card.style.transform = `
                    perspective(1000px) 
                    rotateX(${tiltX}deg) 
                    rotateY(${tiltY}deg)
                    scale(1.01)
                `;
            };
            
            this.card.addEventListener('mouseenter', handleMouseEnter);
            this.card.addEventListener('mouseleave', handleMouseLeave);
        }
    }

    // ─────────────────────────────────────────────
    // Smooth Scroll
    // ─────────────────────────────────────────────
    class SmoothScroll {
        constructor() {
            this.init();
        }
        
        init() {
            const scrollIndicator = document.querySelector('.scroll-indicator');
            if (scrollIndicator) {
                scrollIndicator.style.cursor = 'pointer';
                scrollIndicator.addEventListener('click', () => {
                    const hero = document.querySelector('.hero-section');
                    const heroHeight = hero ? hero.offsetHeight : window.innerHeight;
                    window.scrollTo({
                        top: heroHeight,
                        behavior: prefersReducedMotion() ? 'auto' : 'smooth'
                    });
                });
            }
        }
    }

    // ─────────────────────────────────────────────
    // Initialize Everything with Visibility Observer
    // ─────────────────────────────────────────────
    class HeroController {
        constructor() {
            this.heroSection = document.querySelector('.hero-section');
            this.particleContainer = document.getElementById('hero-particles');
            
            if (!this.heroSection) return;
            
            this.particleSystem = null;
            this.parallaxSystem = null;
            this.visibilityObserver = null;
            
            this.init();
        }
        
        init() {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setup());
            } else {
                this.setup();
            }
        }
        
        setup() {
            // Initialize particle system
            if (this.particleContainer) {
                this.particleSystem = new ParticleSystem(this.particleContainer);
            }
            
            // Initialize other systems
            this.parallaxSystem = new ParallaxSystem(this.heroSection);
            this.smoothScroll = new SmoothScroll();
            this.magneticButtons = new MagneticButtons();
            this.tiltEffect = new TiltEffect();
            
            // Setup visibility observer to PAUSE animations when hero is not visible
            this.setupVisibilityObserver();
            
            // Add loaded class for CSS transitions
            requestAnimationFrame(() => {
                this.heroSection.classList.add('hero-loaded');
            });
            
            // Optimize: remove will-change after initial animation
            this.cleanupWillChange();
        }
        
        setupVisibilityObserver() {
            // Use IntersectionObserver to pause/resume heavy animations
            this.visibilityObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.resumeAnimations();
                    } else {
                        this.pauseAnimations();
                    }
                });
            }, { threshold: 0.05 });
            
            this.visibilityObserver.observe(this.heroSection);
        }
        
        pauseAnimations() {
            if (this.particleSystem) {
                this.particleSystem.stop();
            }
            if (this.parallaxSystem) {
                this.parallaxSystem.destroy();
            }
        }
        
        resumeAnimations() {
            if (this.particleSystem && !this.particleSystem.isVisible) {
                this.particleSystem.start();
            }
            if (this.parallaxSystem && !this.parallaxSystem.isActive) {
                this.parallaxSystem = new ParallaxSystem(this.heroSection);
            }
        }
        
        cleanupWillChange() {
            const elements = this.heroSection.querySelectorAll(
                '.hero-badge, .title-line, .hero-description-wrapper, .hero-actions, .hero-stats'
            );
            
            elements.forEach(el => {
                el.style.willChange = 'transform, opacity';
            });
            
            setTimeout(() => {
                elements.forEach(el => {
                    el.style.willChange = 'auto';
                });
            }, 3000);
        }
    }

    // ─────────────────────────────────────────────
    // Start the Application
    // ─────────────────────────────────────────────
    new HeroController();

})();