/**
 * ============================================
 * ABH HOLDING GROUP - Home Page JavaScript
 * Version: 4.0.0 - ULTRA PREMIUM REDESIGN
 * Performance: Optimized & Lightweight
 * ============================================
 */
 
(function() {
  'use strict';
  
  // ─────────────────────────────────────────────
  // HomePage Class
  // ─────────────────────────────────────────────
  class HomePage {
    constructor() {
      this.apiClient = window.API || null;
      // ✅ رابط الخادم الخلفي - فاضي لأن Nginx بيعمل proxy للـ /api/ و /uploads/
      this.baseURL = '';
      this.featuredProjects = [];
      this.stats = null;
      this.isMenuOpen = false;
      this.observers = [];
      this.rafIds = [];
      this.hasAnimatedHeroStats = false;
      
      this.init();
    }
    
    // ✅ دالة تحويل مسار الصورة إلى رابط صحيح - معالجة كل الحالات
    getFullImageUrl(imageUrl) {
      // لو مفيش صورة
      if (!imageUrl) return '/global/assets/images/project-placeholder.jpg';
      
      // لو الرابط فيه localhost أو 127.0.0.1 (بيانات قديمة من اللوكال)
      // نستخرج المسار بعد البورت فقط
      if (imageUrl.includes('localhost') || imageUrl.includes('127.0.0.1')) {
        try {
          const url = new URL(imageUrl);
          // نرجع المسار فقط بدون الـ host عشان Nginx يخدمه
          return url.pathname;
        } catch (e) {
          // لو URL مش valid نكمل للبدائل
        }
      }
      
      // لو الرابط مطلق بالفعل (https أو http لكن مش localhost)
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
      }
      
      // لو مسار Windows (بيبدأ بـ C:\ أو D:\ إلخ) - بيانات مرفوعة من ويندوز
      if (/^[A-Za-z]:[\\\/]/.test(imageUrl)) {
        // نحاول نستخرج جزء uploads من المسار
        const uploadsMatch = imageUrl.match(/[\\\/]uploads[\\\/](.*)/);
        if (uploadsMatch) {
          return '/uploads/' + uploadsMatch[1].replace(/\\/g, '/');
        }
        return '/global/assets/images/project-placeholder.jpg';
      }
      
      // لو مسار نسبي يبدأ بـ / - نرجعه كما هو (Nginx هيخدمه)
      if (imageUrl.startsWith('/')) {
        return imageUrl;
      }
      
      // لو مسار نسبي من غير / في الأول
      if (imageUrl.startsWith('uploads/')) {
        return '/' + imageUrl;
      }
      
      // أي حالة تانية نرجعه كما هو
      return imageUrl;
    }
    
    init() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setupPage());
      } else {
        this.setupPage();
      }
    }
    
    setupPage() {
      // Setup mobile menu
      this.setupMobileMenu();
      
      // Setup scroll effects
      this.setupScrollEffects();
      
      // Initialize AOS
      this.initAOS();
      
      // Prioritize statistics loading for Hero section
      this.loadStatistics();
      
      // Load featured projects with slight delay for smooth page load
      requestAnimationFrame(() => {
        setTimeout(() => {
          this.loadFeaturedProjects();
        }, 200);
      });
      
      // Setup intersection observer for hero counter animation
      this.setupHeroStatsObserver();
      
      // Setup hero parallax effects
      this.setupHeroParallax();
      
      // Setup premium card interactions
      this.setupCardInteractions();
    }
    
    // ─────────────────────────────────────────────
    // AOS Initialization
    // ─────────────────────────────────────────────
    initAOS() {
      if (typeof AOS !== 'undefined') {
        AOS.init({
          duration: 700,
          easing: 'ease-out-cubic',
          once: true,
          mirror: false,
          offset: 80,
          disable: function() {
            return window.innerWidth < 768;
          }
        });
      }
    }
    
    // ─────────────────────────────────────────────
    // Premium Card Interactions (Mouse tracking)
    // ─────────────────────────────────────────────
    setupCardInteractions() {
      // Only enable on non-touch devices for performance
      if (window.matchMedia('(hover: hover)').matches && 
          !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        
        document.addEventListener('mousemove', (e) => {
          const cards = document.querySelectorAll('.project-card-grid');
          cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Only apply effect if mouse is near the card
            if (x >= -50 && x <= rect.width + 50 && y >= -50 && y <= rect.height + 50) {
              card.style.setProperty('--mouse-x', `${x}px`);
              card.style.setProperty('--mouse-y', `${y}px`);
            }
          });
        }, { passive: true });
      }
    }
    
    // ─────────────────────────────────────────────
    // Hero Parallax Effects
    // ─────────────────────────────────────────────
    setupHeroParallax() {
      const hero = document.querySelector('.hero-section');
      if (!hero) return;
      
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      
      let ticking = false;
      
      const updateParallax = () => {
        const scrollY = window.scrollY;
        const heroHeight = hero.offsetHeight;
        
        if (scrollY < heroHeight) {
          const particles = hero.querySelector('.hero-particles');
          const gradient = hero.querySelector('.hero-gradient-overlay');
          const scrollIndicator = hero.querySelector('.scroll-indicator');
          
          if (particles) {
            particles.style.transform = `translateY(${scrollY * 0.25}px)`;
          }
          if (gradient) {
            gradient.style.opacity = Math.max(0.3, 1 - (scrollY / heroHeight) * 0.7);
          }
          if (scrollIndicator) {
            scrollIndicator.style.opacity = Math.max(0, 0.7 - (scrollY / 200));
          }
        }
        
        ticking = false;
      };
      
      const onScroll = () => {
        if (!ticking) {
          requestAnimationFrame(updateParallax);
          ticking = true;
        }
      };
      
      window.addEventListener('scroll', onScroll, { passive: true });
    }
    
    // ─────────────────────────────────────────────
    // Scroll Effects
    // ─────────────────────────────────────────────
    setupScrollEffects() {
      const navbar = document.querySelector('.navbar');
      if (!navbar) return;
      
      let lastScroll = 0;
      let ticking = false;
      
      const updateNavbar = () => {
        const scrollY = window.scrollY;
        
        if (scrollY > 50) {
          navbar.classList.add('scrolled');
        } else {
          navbar.classList.remove('scrolled');
        }
        
        lastScroll = scrollY;
        ticking = false;
      };
      
      window.addEventListener('scroll', () => {
        if (!ticking) {
          requestAnimationFrame(updateNavbar);
          ticking = true;
        }
      }, { passive: true });
    }
    
    // ─────────────────────────────────────────────
    // Mobile Menu
    // ─────────────────────────────────────────────
    setupMobileMenu() {
      const toggle = document.getElementById('mobile-toggle');
      const navMenu = document.querySelector('.nav-menu');
      
      if (!toggle || !navMenu) return;
      
      const openMenu = () => {
        navMenu.classList.add('active');
        toggle.classList.add('active');
        toggle.setAttribute('aria-expanded', 'true');
        this.isMenuOpen = true;
        document.body.style.overflow = 'hidden';
        
        setTimeout(() => {
          document.addEventListener('click', closeMenuOnClickOutside);
          document.addEventListener('keydown', closeMenuOnEscape);
        }, 10);
      };
      
      const closeMenu = () => {
        navMenu.classList.remove('active');
        toggle.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
        this.isMenuOpen = false;
        document.body.style.overflow = '';
        
        document.removeEventListener('click', closeMenuOnClickOutside);
        document.removeEventListener('keydown', closeMenuOnEscape);
      };
      
      const closeMenuOnClickOutside = (e) => {
        if (!navMenu.contains(e.target) && !toggle.contains(e.target)) {
          closeMenu();
        }
      };
      
      const closeMenuOnEscape = (e) => {
        if (e.key === 'Escape') {
          closeMenu();
          toggle.focus();
        }
      };
      
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        this.isMenuOpen ? closeMenu() : openMenu();
      });
      
      navMenu.addEventListener('click', (e) => {
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
    
    // ─────────────────────────────────────────────
    // Hero Stats Observer & Dynamic Update
    // ─────────────────────────────────────────────
    setupHeroStatsObserver() {
      const heroStatsContainer = document.getElementById('hero-stats-container');
      if (!heroStatsContainer) return;
      
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !this.hasAnimatedHeroStats) {
            this.hasAnimatedHeroStats = true;
            this.animateHeroStatsCounters();
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.3 });
      
      observer.observe(heroStatsContainer);
      this.observers.push(observer);
    }
    
    animateHeroStatsCounters() {
      const counters = document.querySelectorAll('#hero-stats-container .stat-number[data-target]');
      counters.forEach(counter => {
        const target = parseInt(counter.dataset.target) || 0;
        if (target > 0) {
          this.animateCounter(counter, 0, target);
        }
      });
    }
    
    // ─────────────────────────────────────────────
    // Statistics Loading (Dynamic Hero Stats)
    // ─────────────────────────────────────────────
    async loadStatistics() {
      try {
        const response = await fetch('/api/public/home/stats');
        if (!response.ok) throw new Error('Failed to load stats');
        
        const data = await response.json();
        
        if (data.success) {
          this.displayStatistics(data.data);
        } else {
          console.warn('Stats API returned unsuccessful response');
        }
      } catch (error) {
        console.warn('Stats load error:', error.message);
      }
    }
    
    displayStatistics(stats) {
      // Map API data to Hero Stats elements
      const heroMapping = [
        { id: 'hero-stat-units', value: stats.totalProjects || 0 },
        { id: 'hero-stat-cities', value: stats.totalCities || 0 },
        { id: 'hero-stat-clients', value: stats.totalClients || 0 }
      ];
      
      let needsReanimation = false;
      
      heroMapping.forEach(({ id, value }) => {
        const element = document.getElementById(id);
        if (element) {
          const currentTarget = parseInt(element.dataset.target) || 0;
          if (currentTarget !== value) {
            element.dataset.target = value;
            needsReanimation = true;
          }
        }
      });
      
      // If data changed and initial animation already ran, re-animate updated counters
      if (needsReanimation && this.hasAnimatedHeroStats) {
        heroMapping.forEach(({ id }) => {
          const element = document.getElementById(id);
          if (element && parseInt(element.dataset.target) > 0) {
            this.animateSingleCounterFromCurrent(element);
          }
        });
      }
    }
    
    animateSingleCounterFromCurrent(element) {
      const target = parseInt(element.dataset.target) || 0;
      const currentText = element.textContent.replace(/[^0-9]/g, '');
      const start = parseInt(currentText) || 0;
      
      if (start === target) return;
      
      this.animateCounter(element, start, target);
    }
    
    animateCounter(element, start, end) {
      if (!element) return;
      
      const duration = 1500;
      const startTime = performance.now();
      
      const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);
      
      const update = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutQuart(progress);
        
        const current = Math.floor(start + (end - start) * easedProgress);
        element.textContent = current.toLocaleString('ar-SA') + '+';
        
        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          element.textContent = end.toLocaleString('ar-SA') + '+';
        }
      };
      
      requestAnimationFrame(update);
    }
    
    // ─────────────────────────────────────────────
    // Featured Projects Loading
    // ─────────────────────────────────────────────
    async loadFeaturedProjects() {
      const container = document.getElementById('featured-projects-grid');
      if (!container) return;
      
      try {
        const response = await fetch('/api/public/home/featured-projects');
        if (!response.ok) throw new Error('Failed to load projects');
        
        const data = await response.json();
        
        if (data.success && data.data?.projects?.length > 0) {
          this.displayProjects(data.data.projects);
        } else {
          this.showFallbackProjects();
        }
      } catch (error) {
        console.warn('Projects load error:', error.message);
        this.showFallbackProjects();
      }
    }
    
    // ─────────────────────────────────────────────
    // Display Projects - ULTRA PREMIUM CARD DESIGN
    // ─────────────────────────────────────────────
    displayProjects(projects) {
      const container = document.getElementById('featured-projects-grid');
      if (!container) return;
      
      const html = projects.map((project, index) => {
        const id = project.id || 0;
        const name = project.projectName || 'عقار مميز';
        const type = this.getPropertyType(project.projectType);
        const city = project.city || 'الرياض';
        const district = project.district || '';
        const area = project.area || 0;
        const bedrooms = project.bedrooms || 0;
        const bathrooms = project.bathrooms || 0;
        const price = project.price || 0;
        const priceType = this.getPriceType(project.priceType);
        // ✅ استخدام getFullImageUrl للحصول على رابط الصورة الصحيح
        const image = this.getFullImageUrl(project.mainImage);
        const isFeatured = Boolean(project.isFeatured);
        const status = this.getStatus(project.status);
        
        const formattedPrice = this.formatPrice(price);
        const priceText = priceType === 'إيجار' ? 'ريال/شهري' : 'ريال';
        const location = district ? `${city}، ${district}` : city;
        const aosDelay = 100 + (index * 100);
        
        // Generate unique details based on property data
        const detailsHTML = this.generateDetailsHTML(area, bedrooms, bathrooms);
        
        return `
          <article class="project-card-grid" data-project-id="${id}" data-aos="fade-up" data-aos-delay="${aosDelay}" role="listitem">
            <!-- Card Image Section -->
            <div class="project-image-grid">
              <img src="${image}" alt="${name}" loading="lazy" decoding="async" onerror="this.src='/global/assets/images/project-placeholder.jpg'">
              <div class="project-overlay-grid">
                <span class="project-badge-grid ${isFeatured ? 'featured' : 'available'}">
                  <i class="fas fa-${isFeatured ? 'star' : 'check-circle'}" aria-hidden="true"></i>
                  <span>${isFeatured ? 'مميز' : 'متاح'}</span>
                </span>
                <span class="project-status-grid">${status}</span>
              </div>
            </div>
            
            <!-- Card Content Section -->
            <div class="project-content-grid">
              <header class="project-header-grid">
                <h3 class="project-title-grid">${name}</h3>
                <span class="project-type-grid">${type}</span>
              </header>
              
              <div class="project-location-grid">
                <i class="fas fa-map-marker-alt location-icon" aria-hidden="true"></i>
                <span class="location-text">${location}</span>
              </div>
              
              <div class="project-details-grid">
                ${detailsHTML}
              </div>
              
              <footer class="project-footer-grid">
                <div class="project-price-grid">
                  <span class="price-value">${formattedPrice}</span>
                  <span class="price-period">${priceText}</span>
                </div>
                <div class="project-action-grid">
                  <a href="../project-details/index.html?id=${id}" class="btn btn-primary btn-sm">
                    <i class="fas fa-eye" aria-hidden="true"></i>
                    <span>تفاصيل</span>
                  </a>
                </div>
              </footer>
            </div>
          </article>
        `;
      }).join('');
      
      container.innerHTML = html;
      
      // Refresh AOS for dynamically added elements
      if (typeof AOS !== 'undefined') {
        setTimeout(() => AOS.refresh(), 50);
      }
      
      // Re-setup card interactions for new cards
      this.setupCardInteractions();
    }
    
    // Generate details HTML based on available data
    generateDetailsHTML(area, bedrooms, bathrooms) {
      let html = '';
      
      // Area is always shown
      html += `
        <div class="detail-item">
          <i class="fas fa-expand-arrows-alt detail-icon" aria-hidden="true"></i>
          <span>${area} م²</span>
        </div>
      `;
      
      // Bedrooms (only if > 0)
      if (bedrooms > 0) {
        html += `
          <div class="detail-item">
            <i class="fas fa-bed detail-icon" aria-hidden="true"></i>
            <span>${bedrooms} غرف</span>
          </div>
        `;
      }
      
      // Bathrooms (only if > 0)
      if (bathrooms > 0) {
        html += `
          <div class="detail-item">
            <i class="fas fa-bath detail-icon" aria-hidden="true"></i>
            <span>${bathrooms} حمام</span>
          </div>
        `;
      }
      
      return html;
    }
    
    showFallbackProjects() {
      const fallbackProjects = [
        {
          id: 1,
          projectName: 'فيلات النخيل الراقية',
          projectType: 'سكني',
          city: 'الرياض',
          district: 'النخيل',
          area: 450,
          bedrooms: 5,
          bathrooms: 4,
          price: 3500000,
          priceType: 'شراء',
          isFeatured: true,
          status: 'جاهز',
          mainImage: '/global/assets/images/project-placeholder.jpg'
        },
        {
          id: 2,
          projectName: 'أبراج الأعمال التجارية',
          projectType: 'تجاري',
          city: 'الرياض',
          district: 'المركز',
          area: 200,
          bedrooms: 0,
          bathrooms: 0,
          price: 12000,
          priceType: 'إيجار',
          isFeatured: true,
          status: 'مكتمل',
          mainImage: '/global/assets/images/project-placeholder.jpg'
        },
        {
          id: 3,
          projectName: 'شقق الريان السكنية',
          projectType: 'سكني',
          city: 'جدة',
          district: 'الريان',
          area: 180,
          bedrooms: 3,
          bathrooms: 2,
          price: 4500,
          priceType: 'إيجار',
          isFeatured: true,
          status: 'نشط',
          mainImage: '/global/assets/images/project-placeholder.jpg'
        }
      ];
      
      this.displayProjects(fallbackProjects);
    }
    
    // ─────────────────────────────────────────────
    // Utility Functions
    // ─────────────────────────────────────────────
    getPropertyType(type) {
      const types = {
        'سكني': 'سكني',
        'تجاري': 'تجاري',
        'صناعي': 'صناعي',
        'فندقي': 'فندق',
        'فندق': 'فندق',
        'residential': 'سكني',
        'commercial': 'تجاري'
      };
      return types[type] || type || 'عقار';
    }
    
    getPriceType(type) {
      const rentTypes = ['تأجير', 'إيجار', 'إيجار_تشغيلي', 'rent'];
      return rentTypes.includes(type) ? 'إيجار' : 'شراء';
    }
    
    getStatus(status) {
      const statuses = {
        'نشط': 'نشط',
        'جاهز': 'جاهز',
        'مكتمل': 'مكتمل',
        'مباع': 'مباع',
        'قيد_الإنشاء': 'قيد الإنشاء'
      };
      return statuses[status] || status || 'نشط';
    }
    
    formatPrice(price) {
      if (!price) return '---';
      
      const num = parseFloat(price);
      if (isNaN(num)) return '---';
      
      if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace('.0', '') + ' مليون';
      }
      if (num >= 1000) {
        return (num / 1000).toFixed(0) + ' ألف';
      }
      
      return num.toLocaleString('ar-SA');
    }
    
    // ─────────────────────────────────────────────
    // Cleanup
    // ─────────────────────────────────────────────
    destroy() {
      this.observers.forEach(observer => observer.disconnect());
      this.observers = [];
      this.rafIds.forEach(id => cancelAnimationFrame(id));
      this.rafIds = [];
    }
  }
  
  // ─────────────────────────────────────────────
  // Initialize
  // ─────────────────────────────────────────────
  function initialize() {
    try {
      window.homePage = new HomePage();
    } catch (error) {
      console.error('HomePage initialization failed:', error);
    }
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
  
})();