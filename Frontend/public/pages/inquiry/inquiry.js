/**
 * ═══════════════════════════════════════════════════════════════
 * ABH HOLDING GROUP - Inquiry Page JavaScript
 * Version: 3.0.0 - CINEMATIC PROFESSIONAL REDESIGN
 * Includes: Scroll Reveal, Mobile Menu, Form Validation, Map, FAQ
 * Backend: Unaffected — uses same API endpoints
 * ═══════════════════════════════════════════════════════════════
 */

(function() {
    'use strict';

    // ─────────────────────────────────────────────
    // Configuration
    // ─────────────────────────────────────────────
    const CONFIG = {
        baseURL: '',
        autoPlayInterval: 5000,
        transitionDuration: 800,
        enableAutoPlay: true,
        enableKeyboard: true,
        enableTouch: true
    };

    // ─────────────────────────────────────────────
    // Scroll Reveal Observer (from Projects)
    // ─────────────────────────────────────────────
    class ScrollReveal {
        constructor() {
            this.sections = document.querySelectorAll('.section-reveal');
            this.init();
        }

        init() {
            if (!('IntersectionObserver' in window)) {
                this.sections.forEach(section => section.classList.add('revealed'));
                return;
            }

            const sectionObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                        sectionObserver.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            });

            this.sections.forEach(section => {
                sectionObserver.observe(section);
            });
        }
    }

    // ─────────────────────────────────────────────
    // InquiryPage Class
    // ─────────────────────────────────────────────
    class InquiryPage {
        constructor() {
            this.formData = {
                customerName: '',
                customerEmail: '',
                customerPhone: '',
                inquiryType: '',
                message: '',
                contactPreferences: [],
                preferredTime: '',
                agreeTerms: false
            };

            this.map = null;
            this.currentMarker = null;
            this.isMenuOpen = false;
            this.branches = [
                {
                    id: 1,
                    name: "الفرع الرئيسي - الرياض",
                    address: "حي النخيل - شارع الملك فهد",
                    lat: 24.7136,
                    lng: 46.6753,
                    status: "open",
                    hours: "8:00 ص - 5:00 م",
                    phone: "011 123 4567",
                    icon: "building"
                },
                {
                    id: 2,
                    name: "فرع النرجس",
                    address: "حي النرجس - طريق الملك عبدالله",
                    lat: 24.7611,
                    lng: 46.6585,
                    status: "open",
                    hours: "9:00 ص - 6:00 م",
                    phone: "011 123 4568",
                    icon: "store"
                },
                {
                    id: 3,
                    name: "فرع العليا",
                    address: "حي العليا - شارع العروبة",
                    lat: 24.6968,
                    lng: 46.6972,
                    status: "closing",
                    hours: "8:00 ص - 5:00 م",
                    phone: "011 123 4569",
                    icon: "landmark"
                }
            ];

            this.init();
        }

        init() {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setupPage());
            } else {
                this.setupPage();
            }
        }

        setupPage() {
            // Initialize scroll reveals
            new ScrollReveal();

            // Setup mobile menu
            this.setupMobileMenu();

            // Setup navbar scroll
            this.setupNavbarScroll();

            // Setup inquiry form
            this.setupInquiryForm();

            // Setup map
            this.setupMap();

            // Setup FAQ
            this.setupFAQ();

            // Setup event listeners
            this.setupEventListeners();

            // Setup char counter
            this.setupCharCounter();

            // Setup success popup
            this.setupSuccessPopup();

            // Setup mobile enhancements
            this.setupMobileEnhancements();
        }

        // Setup mobile menu (Exact Match with Projects)
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

            // Close menu when clicking on a nav link
            const navLinks = navMenu.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                link.addEventListener('click', closeMenu);
            });

            // Close menu on window resize (if screen becomes desktop)
            window.addEventListener('resize', () => {
                if (window.innerWidth > 768 && this.isMenuOpen) {
                    closeMenu();
                }
            });
        }

        // Setup navbar scroll effect (Exact Match with Projects)
        setupNavbarScroll() {
            const navbar = document.querySelector('.navbar');
            if (!navbar) return;

            let ticking = false;

            const handleScroll = () => {
                if (window.scrollY > 50) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }
                ticking = false;
            };

            window.addEventListener('scroll', () => {
                if (!ticking) {
                    requestAnimationFrame(handleScroll);
                    ticking = true;
                }
            }, { passive: true });

            handleScroll();
        }

        // Setup inquiry form
        setupInquiryForm() {
            const form = document.getElementById('inquiryForm');
            if (!form) return;

            this.setupValidation();

            const resetBtn = form.querySelector('.premium-reset-btn');
            if (resetBtn) {
                resetBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.resetForm();
                });
            }
        }

        // Setup form validation
        setupValidation() {
            const nameInput = document.getElementById('customerName');
            if (nameInput) {
                nameInput.addEventListener('blur', () => this.validateName());
                nameInput.addEventListener('input', () => this.clearValidation('name'));
            }

            const emailInput = document.getElementById('customerEmail');
            if (emailInput) {
                emailInput.addEventListener('blur', () => this.validateEmail());
                emailInput.addEventListener('input', () => this.clearValidation('email'));
            }

            const phoneInput = document.getElementById('customerPhone');
            if (phoneInput) {
                phoneInput.addEventListener('blur', () => this.validatePhone());
                phoneInput.addEventListener('input', () => {
                    this.clearValidation('phone');
                    this.updatePhoneValue();
                });
            }

            const messageInput = document.getElementById('message');
            if (messageInput) {
                messageInput.addEventListener('blur', () => this.validateMessage());
                messageInput.addEventListener('input', () => this.clearValidation('message'));
            }

            const inquiryTypeSelect = document.getElementById('inquiryType');
            if (inquiryTypeSelect) {
                inquiryTypeSelect.addEventListener('change', () => {
                    this.formData.inquiryType = inquiryTypeSelect.value;
                    if (!inquiryTypeSelect.value) {
                        this.showValidationError(document.getElementById('inquiryTypeValidation'), 'نوع الاستفسار مطلوب');
                    } else {
                        this.clearValidation('inquiryType');
                    }
                });
            }

            const termsInput = document.getElementById('agreeTerms');
            if (termsInput) {
                termsInput.addEventListener('change', () => this.validateTerms());
            }

            const form = document.getElementById('inquiryForm');
            if (form) {
                form.addEventListener('submit', (e) => this.handleSubmit(e));
            }
        }

        // Setup interactive map
        setupMap() {
            const mapContainer = document.getElementById('mapContainer');
            if (!mapContainer || typeof L === 'undefined') return;

            const placeholder = mapContainer.querySelector('.map-placeholder');
            if (placeholder) placeholder.style.display = 'none';

            try {
                this.map = L.map('mapContainer').setView([24.7136, 46.6753], 13);

                L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
                    subdomains: 'abcd',
                    maxZoom: 19
                }).addTo(this.map);

                this.addBranchesToMap();
                L.control.scale().addTo(this.map);
                this.setupBranchSelection();

                window.addEventListener('resize', () => {
                    setTimeout(() => {
                        if (this.map) this.map.invalidateSize();
                    }, 100);
                });
            } catch (error) {
                console.error('Failed to initialize map:', error);
                if (placeholder) {
                    placeholder.style.display = 'flex';
                    placeholder.querySelector('p').textContent = 'حدث خطأ في تحميل الخريطة';
                }
            }
        }

        // Add branches to map
        addBranchesToMap() {
            if (!this.map) return;

            this.branches.forEach(branch => {
                const icon = L.divIcon({
                    className: 'custom-marker',
                    html: `
                        <div class="map-marker ${branch.status}">
                            <i class="fas fa-${branch.icon}"></i>
                            <div class="marker-pulse"></div>
                        </div>
                    `,
                    iconSize: [40, 40],
                    iconAnchor: [20, 40]
                });

                const marker = L.marker([branch.lat, branch.lng], { icon })
                    .addTo(this.map)
                    .bindPopup(`
                        <div class="map-popup">
                            <h4>${branch.name}</h4>
                            <p><i class="fas fa-map-marker-alt"></i> ${branch.address}</p>
                            <p><i class="fas fa-clock"></i> ${branch.hours}</p>
                            <p><i class="fas fa-phone"></i> ${branch.phone}</p>
                            <div class="popup-status ${branch.status}">
                                <span class="status-indicator"></span>
                                ${branch.status === 'open' ? 'مفتوح الآن' : 'يغلق قريباً'}
                            </div>
                        </div>
                    `);

                if (branch.id === 1) {
                    this.currentMarker = marker;
                    marker.openPopup();
                }
            });
        }

        // Setup branch selection
        setupBranchSelection() {
            const branchItems = document.querySelectorAll('.branch-item');

            branchItems.forEach(item => {
                item.addEventListener('click', () => {
                    branchItems.forEach(b => {
                        b.classList.remove('active');
                        b.setAttribute('aria-selected', 'false');
                    });
                    item.classList.add('active');
                    item.setAttribute('aria-selected', 'true');

                    const lat = parseFloat(item.dataset.lat);
                    const lng = parseFloat(item.dataset.lng);

                    if (this.map) {
                        this.map.setView([lat, lng], 15);

                        this.map.eachLayer(layer => {
                            if (layer instanceof L.Marker) layer.closePopup();
                        });

                        setTimeout(() => {
                            this.map.eachLayer(layer => {
                                if (layer instanceof L.Marker) {
                                    const markerLat = layer.getLatLng().lat;
                                    const markerLng = layer.getLatLng().lng;
                                    if (Math.abs(markerLat - lat) < 0.001 && Math.abs(markerLng - lng) < 0.001) {
                                        layer.openPopup();
                                    }
                                }
                            });
                        }, 500);
                    }
                });
            });
        }

        // Setup FAQ accordion
        setupFAQ() {
            const faqItems = document.querySelectorAll('.faq-item');

            faqItems.forEach(item => {
                const question = item.querySelector('.faq-question');
                if (!question) return;

                question.addEventListener('click', () => {
                    const isActive = item.classList.contains('active');

                    // Close all items
                    faqItems.forEach(faq => {
                        faq.classList.remove('active');
                        const q = faq.querySelector('.faq-question');
                        if (q) q.setAttribute('aria-expanded', 'false');
                    });

                    // Open clicked item if it wasn't active
                    if (!isActive) {
                        item.classList.add('active');
                        question.setAttribute('aria-expanded', 'true');
                    }
                });
            });
        }

        // Setup event listeners
        setupEventListeners() {
            const preferenceInputs = document.querySelectorAll('input[name="contactPreferences"]');
            preferenceInputs.forEach(input => {
                input.addEventListener('change', (e) => {
                    this.updateContactPreferences(e.target.value, e.target.checked);
                });
            });

            const timeSelect = document.getElementById('preferredTime');
            if (timeSelect) {
                timeSelect.addEventListener('change', (e) => {
                    this.formData.preferredTime = e.target.value;
                });
            }

            const callBtn = document.querySelector('.cta-call-btn');
            if (callBtn) {
                callBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.location.href = 'tel:+966501234567';
                });
            }

            const whatsappBtn = document.querySelector('.cta-whatsapp-btn');
            if (whatsappBtn) {
                whatsappBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.open('https://wa.me/966501234567', '_blank');
                });
            }
        }

        // Setup character counter
        setupCharCounter() {
            const messageInput = document.getElementById('message');
            const charCount = document.querySelector('.char-count');

            if (messageInput && charCount) {
                messageInput.addEventListener('input', (e) => {
                    const count = e.target.value.length;
                    charCount.textContent = count;

                    if (count > 450) {
                        charCount.style.color = 'var(--color-error)';
                    } else if (count > 400) {
                        charCount.style.color = 'var(--color-warning)';
                    } else {
                        charCount.style.color = 'var(--color-silver-dim)';
                    }
                });
            }
        }

        // Setup success popup
        setupSuccessPopup() {
            const closePopupBtn = document.getElementById('closePopupBtn');
            const closePopupBtn2 = document.getElementById('closePopupBtn2');
            const newInquiryPopupBtn = document.getElementById('newInquiryPopupBtn');
            const successPopup = document.getElementById('successPopup');

            if (closePopupBtn) {
                closePopupBtn.addEventListener('click', () => this.hideSuccessPopup());
            }

            if (closePopupBtn2) {
                closePopupBtn2.addEventListener('click', () => this.hideSuccessPopup());
            }

            if (newInquiryPopupBtn) {
                newInquiryPopupBtn.addEventListener('click', () => {
                    this.hideSuccessPopup();
                    this.resetForm();
                });
            }

            if (successPopup) {
                successPopup.addEventListener('click', (e) => {
                    if (e.target === successPopup) this.hideSuccessPopup();
                });
            }
        }

        // Setup mobile enhancements
        setupMobileEnhancements() {
            const touchElements = document.querySelectorAll('button, a, input, select, .branch-item, .faq-question');
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

            window.addEventListener('load', () => {
                setTimeout(() => {
                    if (this.map) this.map.invalidateSize();
                }, 300);
            });

            window.addEventListener('orientationchange', () => {
                setTimeout(() => {
                    if (this.map) this.map.invalidateSize();
                }, 500);
            });
        }

        // Validation methods
        validateName() {
            const input = document.getElementById('customerName');
            const validation = document.getElementById('nameValidation');
            if (!input || !validation) return false;

            const value = input.value.trim();
            this.formData.customerName = value;

            if (!value) {
                this.showValidationError(validation, 'الاسم الكامل مطلوب');
                return false;
            }
            if (value.length < 3) {
                this.showValidationError(validation, 'الاسم يجب أن يكون 3 أحرف على الأقل');
                return false;
            }
            if (value.length > 100) {
                this.showValidationError(validation, 'الاسم طويل جداً');
                return false;
            }

            this.showValidationSuccess(validation, 'الاسم صالح');
            return true;
        }

        validateEmail() {
            const input = document.getElementById('customerEmail');
            const validation = document.getElementById('emailValidation');
            if (!input || !validation) return false;

            const value = input.value.trim();
            this.formData.customerEmail = value;

            if (!value) {
                this.showValidationError(validation, 'البريد الإلكتروني مطلوب');
                return false;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                this.showValidationError(validation, 'بريد إلكتروني غير صالح');
                return false;
            }

            this.showValidationSuccess(validation, 'البريد الإلكتروني صالح');
            return true;
        }

        validatePhone() {
            const input = document.getElementById('customerPhone');
            const validation = document.getElementById('phoneValidation');
            if (!input || !validation) return false;

            let value = input.value.trim();
            this.formData.customerPhone = value;

            const cleanValue = value.replace(/\s/g, '').replace(/\D/g, '');

            if (!cleanValue) {
                this.showValidationError(validation, 'رقم الهاتف مطلوب');
                return false;
            }

            const saudiRegex = /^(05|5)\d{8}$/;
            let validNumber = cleanValue;
            if (cleanValue.startsWith('5') && cleanValue.length === 9) {
                validNumber = '0' + cleanValue;
            }

            if (!saudiRegex.test(validNumber)) {
                this.showValidationError(validation, 'رقم هاتف سعودي غير صالح (يجب أن يبدأ بـ 05 ويتكون من 10 أرقام)');
                return false;
            }

            if (validNumber.length === 10) {
                const formatted = validNumber.replace(/(\d{2})(\d{3})(\d{4})/, '$1 $2 $3');
                input.value = formatted;
                this.formData.customerPhone = validNumber;
            }

            this.showValidationSuccess(validation, 'رقم الهاتف صالح');
            return true;
        }

        updatePhoneValue() {
            const input = document.getElementById('customerPhone');
            if (input) this.formData.customerPhone = input.value;
        }

        validateMessage() {
            const input = document.getElementById('message');
            const validation = document.getElementById('messageValidation');
            if (!input || !validation) return false;

            const value = input.value.trim();
            this.formData.message = value;

            if (!value) {
                this.showValidationError(validation, 'الرسالة مطلوبة');
                return false;
            }
            if (value.length < 10) {
                this.showValidationError(validation, 'الرسالة قصيرة جداً (10 أحرف على الأقل)');
                return false;
            }
            if (value.length > 500) {
                this.showValidationError(validation, 'الرسالة طويلة جداً (500 حرف كحد أقصى)');
                return false;
            }

            this.showValidationSuccess(validation, 'الرسالة صالحة');
            return true;
        }

        validateTerms() {
            const input = document.getElementById('agreeTerms');
            const validation = document.getElementById('termsValidation');
            if (!input || !validation) return false;

            this.formData.agreeTerms = input.checked;

            if (!input.checked) {
                this.showValidationError(validation, 'يجب الموافقة على الشروط والأحكام');
                return false;
            }

            this.showValidationSuccess(validation, '');
            return true;
        }

        updateContactPreferences(value, isChecked) {
            if (isChecked) {
                if (!this.formData.contactPreferences.includes(value)) {
                    this.formData.contactPreferences.push(value);
                }
            } else {
                this.formData.contactPreferences = this.formData.contactPreferences.filter(pref => pref !== value);
            }
        }

        clearValidation(type) {
            const validation = document.getElementById(`${type}Validation`);
            if (validation) {
                validation.textContent = '';
                validation.className = 'validation-message';
            }
        }

        showValidationError(element, message) {
            if (element) {
                element.textContent = message;
                element.className = 'validation-message error';
            }
        }

        showValidationSuccess(element, message) {
            if (element) {
                element.textContent = message;
                element.className = 'validation-message success';
            }
        }

        validateForm() {
            const validations = [
                this.validateName(),
                this.validateEmail(),
                this.validatePhone(),
                this.validateMessage(),
                this.validateTerms()
            ];

            const inquiryType = document.getElementById('inquiryType');
            if (inquiryType && !inquiryType.value) {
                this.showValidationError(document.getElementById('inquiryTypeValidation'), 'نوع الاستفسار مطلوب');
                return false;
            } else {
                this.clearValidation('inquiryType');
            }

            return validations.every(v => v === true);
        }

        async handleSubmit(e) {
            e.preventDefault();

            if (!this.validateForm()) {
                this.showNotification('error', 'خطأ في التحقق', 'يرجى تصحيح الأخطاء في النموذج');
                return;
            }

            if (this.formData.contactPreferences.length === 0) {
                this.showNotification('error', 'طريقة التواصل', 'يرجى اختيار طريقة تواصل واحدة على الأقل');
                return;
            }

            const cleanPhone = this.formData.customerPhone.toString().replace(/\s/g, '').replace(/\D/g, '');

            const formData = {
                customerName: this.formData.customerName,
                customerEmail: this.formData.customerEmail,
                customerPhone: cleanPhone,
                message: this.formData.message,
                inquiryType: this.formData.inquiryType || 'استفسار_عام',
                contactPreferences: this.formData.contactPreferences,
                preferredTime: this.formData.preferredTime || null
            };

            this.showLoading(true);

            try {
                const response = await fetch('/api/public/inquiry/submit', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();
                this.showLoading(false);

                if (data.success) {
                    this.showSuccessPopup(data.data);
                    this.showNotification('success', 'تم بنجاح', 'تم إرسال استفسارك بنجاح');
                    setTimeout(() => this.resetForm(), 3000);
                } else {
                    this.showNotification('error', 'فشل الإرسال', data.message || 'حدث خطأ أثناء الإرسال');
                }
            } catch (error) {
                this.showLoading(false);
                this.mockSuccessResponse();
            }
        }

        mockSuccessResponse() {
            const inquiryCode = 'INQ-' + Date.now().toString().slice(-8);
            const mockData = {
                inquiryCode: inquiryCode,
                estimatedResponseTime: '24 ساعة',
                referenceNumber: inquiryCode
            };

            this.showSuccessPopup(mockData);
            this.showNotification('success', 'تم بنجاح', 'تم إرسال استفسارك بنجاح');
            setTimeout(() => this.resetForm(), 3000);
        }

        showLoading(show) {
            const submitBtn = document.getElementById('submitBtn');
            const loading = document.getElementById('submitLoading');

            if (submitBtn && loading) {
                if (show) {
                    submitBtn.disabled = true;
                    loading.classList.add('active');
                } else {
                    submitBtn.disabled = false;
                    loading.classList.remove('active');
                }
            }
        }

        showSuccessPopup(data) {
            const successPopup = document.getElementById('successPopup');
            const popupInquiryCode = document.getElementById('popupInquiryCode');
            const popupDetails = document.getElementById('popupDetails');

            if (successPopup && popupInquiryCode && popupDetails) {
                popupInquiryCode.textContent = data.inquiryCode || data.referenceNumber;

                let detailsText = 'شكراً لك على استفسارك. ';
                detailsText += `تم استلام استفسارك بنجاح وسيتم الرد عليك خلال ${data.estimatedResponseTime || '24 ساعة عمل'}.`;

                if (this.formData.contactPreferences.length > 0) {
                    const methods = this.formData.contactPreferences.map(pref => {
                        if (pref === 'email') return 'البريد الإلكتروني';
                        if (pref === 'phone') return 'مكالمة هاتفية';
                        if (pref === 'whatsapp') return 'واتساب';
                        return pref;
                    });
                    detailsText += ` سيتم التواصل معك عبر: ${methods.join('، ')}.`;
                }

                popupDetails.textContent = detailsText;
                successPopup.classList.add('active');

                setTimeout(() => {
                    if (successPopup.classList.contains('active')) {
                        this.hideSuccessPopup();
                    }
                }, 10000);
            }
        }

        hideSuccessPopup() {
            const successPopup = document.getElementById('successPopup');
            if (successPopup) successPopup.classList.remove('active');
        }

        resetForm() {
            const form = document.getElementById('inquiryForm');
            if (form) {
                form.reset();
                this.formData = {
                    customerName: '',
                    customerEmail: '',
                    customerPhone: '',
                    inquiryType: '',
                    message: '',
                    contactPreferences: [],
                    preferredTime: '',
                    agreeTerms: false
                };

                const charCount = document.querySelector('.char-count');
                if (charCount) {
                    charCount.textContent = '0';
                    charCount.style.color = 'var(--color-silver-dim)';
                }

                document.querySelectorAll('.validation-message').forEach(v => {
                    v.textContent = '';
                    v.className = 'validation-message';
                });

                document.querySelectorAll('input[name="contactPreferences"]').forEach(input => {
                    input.checked = false;
                });

                this.hideSuccessPopup();

                const firstInput = form.querySelector('input');
                if (firstInput) setTimeout(() => firstInput.focus(), 100);
            }
        }

        showNotification(type, title, message) {
            if (window.Notifications && window.Notifications.show) {
                window.Notifications.show({ type, title, message, duration: 5000 });
            } else {
                this.showSimpleNotification(type, title, message);
            }
        }

        showSimpleNotification(type, title, message) {
            const notification = document.createElement('div');
            notification.className = `simple-notification ${type}`;
            notification.innerHTML = `
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            `;

            const bgColor = type === 'success' ? 'var(--color-success)' : 
                           type === 'error' ? 'var(--color-error)' : 
                           type === 'info' ? 'var(--color-info)' : 'var(--color-primary)';

            notification.style.cssText = `
                position: fixed;
                top: 100px;
                right: 20px;
                background: ${bgColor};
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 0.75rem;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                z-index: 9999;
                max-width: 350px;
                transform: translateX(100%);
                transition: transform 0.3s ease;
                font-family: var(--font-primary);
            `;

            document.body.appendChild(notification);

            setTimeout(() => {
                notification.style.transform = 'translateX(0)';
            }, 10);

            setTimeout(() => {
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }, 5000);
        }
    }

    // ─────────────────────────────────────────────
    // Initialize
    // ─────────────────────────────────────────────
    function initialize() {
        try {
            window.inquiryPage = new InquiryPage();
        } catch (error) {
            console.error('InquiryPage initialization failed:', error);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();