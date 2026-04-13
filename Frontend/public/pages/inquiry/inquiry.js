// ===== صفحة الاستفسارات - النسخة الكاملة النهائية =====
(function() {
    'use strict';
    
    console.log('✅ inquiry.js loaded - INQUIRY SYSTEM READY');
    
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
            
            this.isMenuOpen = false;
            
            this.init();
        }
        
        init() {
            console.log('🚀 InquiryPage initializing...');
            
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setupPage());
            } else {
                this.setupPage();
            }
        }
        
        setupPage() {
            console.log('🔧 Setting up inquiry page...');
            
            // إعداد القائمة المتنقلة
            this.setupMobileMenu();
            
            // إضافة زر الإدارة للقائمة المتنقلة
            this.addAdminButtonToMobileMenu();
            
            // إعداد نموذج الاستفسار
            this.setupInquiryForm();
            
            // إعداد الخريطة
            this.setupMap();
            
            // إعداد الأسئلة الشائعة
            this.setupFAQ();
            
            // إعداد مستمعين للأحداث
            this.setupEventListeners();
            
            // تحديث عداد الأحرف
            this.setupCharCounter();
            
            // إعداد popup النجاح
            this.setupSuccessPopup();
            
            // تحسينات إضافية للجوال
            this.setupMobileEnhancements();
        }
        
        setupMobileMenu() {
            const toggle = document.getElementById('mobile-toggle');
            const navMenu = document.querySelector('.nav-menu');
            const body = document.body;
            
            if (toggle && navMenu) {
                // دالة لفتح القائمة
                const openMenu = () => {
                    navMenu.classList.add('active');
                    toggle.classList.add('active');
                    body.classList.add('menu-open');
                    this.isMenuOpen = true;
                    
                    // إضافة حدث لإغلاق القائمة عند النقر خارجها
                    setTimeout(() => {
                        document.addEventListener('click', closeMenuOnClickOutside);
                    }, 10);
                };
                
                // دالة لإغلاق القائمة
                const closeMenu = () => {
                    navMenu.classList.remove('active');
                    toggle.classList.remove('active');
                    body.classList.remove('menu-open');
                    this.isMenuOpen = false;
                    
                    // إزالة حدث النقر خارج القائمة
                    document.removeEventListener('click', closeMenuOnClickOutside);
                };
                
                // دالة لإغلاق القائمة عند النقر خارجها
                const closeMenuOnClickOutside = (e) => {
                    // التحقق إذا كان النقر خارج القائمة وزر التبديل
                    if (!navMenu.contains(e.target) && !toggle.contains(e.target)) {
                        closeMenu();
                    }
                };
                
                // إضافة حدث النقر على زر التبديل
                toggle.addEventListener('click', (e) => {
                    e.stopPropagation();
                    
                    if (this.isMenuOpen) {
                        closeMenu();
                    } else {
                        openMenu();
                    }
                });
                
                // إغلاق القائمة عند النقر على رابط داخلي
                const navLinks = navMenu.querySelectorAll('a');
                navLinks.forEach(link => {
                    link.addEventListener('click', () => {
                        closeMenu();
                    });
                });
                
                // إغلاق القائمة عند تغيير حجم النافذة (إذا فتحت على سطح المكتب)
                window.addEventListener('resize', () => {
                    if (window.innerWidth > 768 && this.isMenuOpen) {
                        closeMenu();
                    }
                });
            }
        }
        
        addAdminButtonToMobileMenu() {
            const navMenu = document.querySelector('.nav-menu');
            if (!navMenu) return;
            
            // التحقق إذا كان الزر موجود بالفعل (لتجنب التكرار)
            if (navMenu.querySelector('.mobile-admin-btn')) return;
            
            // إنشاء زر الإدارة للجوال
            const adminButton = document.createElement('li');
            adminButton.className = 'nav-item mobile-admin-btn';
            adminButton.innerHTML = `
                <a href="../../../admin/pages/login/index.html" class="nav-link premium-link">
                    <div class="nav-icon-wrapper">
                        <i class="fas fa-sign-in-alt"></i>
                    </div>
                    <span class="nav-text">دخول الإدارة</span>
                    <span class="nav-underline"></span>
                </a>
            `;
            
            // إضافة زر الإدارة إلى القائمة
            navMenu.appendChild(adminButton);
        }
        
        setupInquiryForm() {
            const form = document.getElementById('inquiryForm');
            if (!form) return;
            
            console.log('📋 Inquiry form initialized');
            
            // إعداد التحقق من الصحة
            this.setupValidation();
            
            // إعداد إعادة التعيين
            const resetBtn = form.querySelector('.premium-reset-btn');
            if (resetBtn) {
                resetBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.resetForm();
                });
            }
        }
        
        setupValidation() {
            // التحقق من الاسم
            const nameInput = document.getElementById('customerName');
            if (nameInput) {
                nameInput.addEventListener('blur', () => this.validateName());
                nameInput.addEventListener('input', () => this.clearValidation('name'));
            }
            
            // التحقق من البريد الإلكتروني
            const emailInput = document.getElementById('customerEmail');
            if (emailInput) {
                emailInput.addEventListener('blur', () => this.validateEmail());
                emailInput.addEventListener('input', () => this.clearValidation('email'));
            }
            
            // التحقق من الهاتف
            const phoneInput = document.getElementById('customerPhone');
            if (phoneInput) {
                phoneInput.addEventListener('blur', () => this.validatePhone());
                phoneInput.addEventListener('input', () => {
                    this.clearValidation('phone');
                    this.updatePhoneValue();
                });
            }
            
            // التحقق من الرسالة
            const messageInput = document.getElementById('message');
            if (messageInput) {
                messageInput.addEventListener('blur', () => this.validateMessage());
                messageInput.addEventListener('input', () => this.clearValidation('message'));
            }
            
            // التحقق من نوع الاستفسار
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
            
            // التحقق من الشروط
            const termsInput = document.getElementById('agreeTerms');
            if (termsInput) {
                termsInput.addEventListener('change', () => this.validateTerms());
            }
            
            // إرسال النموذج
            const form = document.getElementById('inquiryForm');
            if (form) {
                form.addEventListener('submit', (e) => this.handleSubmit(e));
            }
        }
        
        setupMap() {
            const mapContainer = document.getElementById('mapContainer');
            if (!mapContainer || !L) return;
            
            console.log('🗺️ Setting up map...');
            
            // إزالة العنصر النائب
            const placeholder = mapContainer.querySelector('.map-placeholder');
            if (placeholder) {
                placeholder.style.display = 'none';
            }
            
            try {
                // إنشاء الخريطة مع مركز الرياض
                this.map = L.map('mapContainer').setView([24.7136, 46.6753], 13);
                
                // إضافة طبقة الخريطة المظلمة
                L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                    subdomains: 'abcd',
                    maxZoom: 19
                }).addTo(this.map);
                
                // إضافة فروعنا
                this.addBranchesToMap();
                
                // إضافة عناصر التحكم
                L.control.scale().addTo(this.map);
                
                // إضافة حدث للنقر على الفرع
                this.setupBranchSelection();
                
                // إضافة حدث لضبط حجم الخريطة عند تغيير حجم النافذة
                window.addEventListener('resize', () => {
                    setTimeout(() => {
                        if (this.map) {
                            this.map.invalidateSize();
                        }
                    }, 100);
                });
                
                console.log('✅ Map initialized successfully');
            } catch (error) {
                console.error('❌ Failed to initialize map:', error);
                if (placeholder) {
                    placeholder.style.display = 'flex';
                    placeholder.querySelector('p').textContent = 'حدث خطأ في تحميل الخريطة';
                }
            }
        }
        
        addBranchesToMap() {
            if (!this.map) return;
            
            // إضافة المؤشرات للفروع
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
                
                const marker = L.marker([branch.lat, branch.lng], { icon: icon })
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
                
                // تخزين المرجع للمؤشر الأول
                if (branch.id === 1) {
                    this.currentMarker = marker;
                    marker.openPopup();
                }
            });
        }
        
        setupBranchSelection() {
            const branchItems = document.querySelectorAll('.branch-item');
            
            branchItems.forEach(item => {
                item.addEventListener('click', () => {
                    // إزالة النشاط من جميع العناصر
                    branchItems.forEach(branch => branch.classList.remove('active'));
                    
                    // إضافة النشاط للعنصر المحدد
                    item.classList.add('active');
                    
                    // الحصول على إحداثيات الفرع
                    const lat = parseFloat(item.dataset.lat);
                    const lng = parseFloat(item.dataset.lng);
                    const title = item.dataset.title;
                    
                    // تحريك الخريطة إلى الفرع المحدد
                    if (this.map) {
                        this.map.setView([lat, lng], 15);
                        
                        // إغلاق جميع النوافذ المنبثقة
                        this.map.eachLayer(layer => {
                            if (layer instanceof L.Marker) {
                                layer.closePopup();
                            }
                        });
                        
                        // فتح نافذة منبثقة للمؤشر المحدد
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
        
        setupFAQ() {
            const faqQuestions = document.querySelectorAll('.faq-question');
            
            faqQuestions.forEach(question => {
                question.addEventListener('click', () => {
                    const item = question.parentElement;
                    const answer = item.querySelector('.faq-answer');
                    
                    // إغلاق جميع العناصر الأخرى
                    faqQuestions.forEach(q => {
                        if (q !== question) {
                            q.classList.remove('active');
                            q.parentElement.querySelector('.faq-answer').classList.remove('active');
                        }
                    });
                    
                    // تبديل العنصر الحالي
                    question.classList.toggle('active');
                    answer.classList.toggle('active');
                });
            });
        }
        
        setupEventListeners() {
            // تحديث تفضيلات التواصل
            const preferenceInputs = document.querySelectorAll('input[name="contactPreferences"]');
            preferenceInputs.forEach(input => {
                input.addEventListener('change', (e) => {
                    this.updateContactPreferences(e.target.value, e.target.checked);
                });
            });
            
            // تحديث وقت التواصل المفضل
            const timeSelect = document.getElementById('preferredTime');
            if (timeSelect) {
                timeSelect.addEventListener('change', (e) => {
                    this.formData.preferredTime = e.target.value;
                });
            }
            
            // إضافة حدث لزر الاتصال المباشر في CTA
            const callBtn = document.querySelector('.cta-call-btn');
            if (callBtn) {
                callBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showNotification('info', 'الاتصال', 'جارٍ الاتصال بالرقم: 0501234567');
                });
            }
            
            // إضافة حدث لزر واتساب في CTA
            const whatsappBtn = document.querySelector('.cta-whatsapp-btn');
            if (whatsappBtn) {
                whatsappBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.open('https://wa.me/966501234567', '_blank');
                });
            }
        }
        
        setupCharCounter() {
            const messageInput = document.getElementById('message');
            const charCount = document.querySelector('.char-count');
            
            if (messageInput && charCount) {
                messageInput.addEventListener('input', (e) => {
                    const count = e.target.value.length;
                    charCount.textContent = count;
                    
                    // تغيير اللون عند الاقتراب من الحد الأقصى
                    if (count > 450) {
                        charCount.style.color = '#ff6b6b';
                    } else if (count > 400) {
                        charCount.style.color = '#ffc107';
                    } else {
                        charCount.style.color = '#cbcdcd';
                    }
                });
            }
        }
        
        setupSuccessPopup() {
            const closePopupBtn = document.getElementById('closePopupBtn');
            const closePopupBtn2 = document.getElementById('closePopupBtn2');
            const newInquiryPopupBtn = document.getElementById('newInquiryPopupBtn');
            const successPopup = document.getElementById('successPopup');
            
            if (closePopupBtn) {
                closePopupBtn.addEventListener('click', () => {
                    this.hideSuccessPopup();
                });
            }
            
            if (closePopupBtn2) {
                closePopupBtn2.addEventListener('click', () => {
                    this.hideSuccessPopup();
                });
            }
            
            if (newInquiryPopupBtn) {
                newInquiryPopupBtn.addEventListener('click', () => {
                    this.hideSuccessPopup();
                    this.resetForm();
                });
            }
            
            // إغلاق popup عند النقر خارج المحتوى
            if (successPopup) {
                successPopup.addEventListener('click', (e) => {
                    if (e.target === successPopup) {
                        this.hideSuccessPopup();
                    }
                });
            }
        }
        
        setupMobileEnhancements() {
            // تحسين أداء اللمس للجوال
            const touchElements = document.querySelectorAll('button, a, input, select, .branch-item, .faq-question');
            touchElements.forEach(el => {
                el.addEventListener('touchstart', function() {
                    this.classList.add('touch-active');
                }, { passive: true });
                
                el.addEventListener('touchend', function() {
                    this.classList.remove('touch-active');
                }, { passive: true });
            });
            
            // منع التكبير المزدوج على النموذج في الجوال
            const formInputs = document.querySelectorAll('input, textarea, select');
            formInputs.forEach(input => {
                input.addEventListener('touchstart', function(e) {
                    if (e.touches.length > 1) {
                        e.preventDefault();
                    }
                }, { passive: false });
            });
            
            // تحسين ظهور الخريطة على الجوال
            this.fixMapForMobile();
        }
        
        fixMapForMobile() {
            // عند تحميل الصفحة، إعادة ضبط حجم الخريطة
            window.addEventListener('load', () => {
                setTimeout(() => {
                    if (this.map) {
                        this.map.invalidateSize();
                    }
                }, 300);
            });
            
            // عند تغيير الاتجاه، إعادة ضبط حجم الخريطة
            window.addEventListener('orientationchange', () => {
                setTimeout(() => {
                    if (this.map) {
                        this.map.invalidateSize();
                    }
                }, 500);
            });
        }
        
        // ===== التحقق من الصحة =====
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
            
            // حفظ القيمة الأصلية للمستخدم
            this.formData.customerPhone = value;
            
            // تنظيف الرقم للأغراض التحقق
            const cleanValue = value.replace(/\s/g, '').replace(/\D/g, '');
            
            if (!cleanValue) {
                this.showValidationError(validation, 'رقم الهاتف مطلوب');
                return false;
            }
            
            // التحقق من رقم سعودي (يبدأ بـ 05 أو 5 ويتكون من 9 أو 10 أرقام)
            const saudiRegex = /^(05|5)\d{8}$/;
            
            // تحقق إذا كان الرقم بدون 0 في البداية
            let validNumber = cleanValue;
            if (cleanValue.startsWith('5') && cleanValue.length === 9) {
                validNumber = '0' + cleanValue;
            }
            
            if (!saudiRegex.test(validNumber)) {
                this.showValidationError(validation, 'رقم هاتف سعودي غير صالح (يجب أن يبدأ بـ 05 ويتكون من 10 أرقام)');
                return false;
            }
            
            // إذا كان الرقم صحيحاً، يمكن تنسيقه للعرض
            if (validNumber.length === 10) {
                // تنسيق الرقم: 05X XXX XXXX
                const formatted = validNumber.replace(/(\d{2})(\d{3})(\d{4})/, '$1 $2 $3');
                input.value = formatted;
                this.formData.customerPhone = validNumber;
            }
            
            this.showValidationSuccess(validation, 'رقم الهاتف صالح');
            return true;
        }
        
        updatePhoneValue() {
            const input = document.getElementById('customerPhone');
            if (!input) return;
            
            this.formData.customerPhone = input.value;
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
            
            console.log('Updated contact preferences:', this.formData.contactPreferences);
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
            
            // التحقق من نوع الاستفسار
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
            
            console.log('📨 Submitting inquiry form...');
            
            // التحقق من الصحة
            if (!this.validateForm()) {
                this.showNotification('error', 'خطأ في التحقق', 'يرجى تصحيح الأخطاء في النموذج');
                return;
            }
            
            // التحقق من اختيار طريقة تواصل واحدة على الأقل
            if (this.formData.contactPreferences.length === 0) {
                this.showNotification('error', 'طريقة التواصل', 'يرجى اختيار طريقة تواصل واحدة على الأقل');
                return;
            }
            
            // تنظيف رقم الهاتف قبل الإرسال
            const cleanPhone = this.formData.customerPhone.toString().replace(/\s/g, '').replace(/\D/g, '');
            
            // إعداد البيانات للإرسال
            const formData = {
                customerName: this.formData.customerName,
                customerEmail: this.formData.customerEmail,
                customerPhone: cleanPhone,
                message: this.formData.message,
                inquiryType: this.formData.inquiryType || 'استفسار_عام',
                contactPreferences: this.formData.contactPreferences,
                preferredTime: this.formData.preferredTime || null
            };
            
            console.log('Form data to send:', formData);
            
            // عرض حالة التحميل
            this.showLoading(true);
            
            try {
                // استخدام API الحقيقي
                const response = await fetch('/api/public/inquiry/submit', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                const data = await response.json();
                
                // إخفاء التحميل
                this.showLoading(false);
                
                if (data.success) {
                    console.log('✅ Inquiry submitted successfully:', data);
                    this.showSuccessPopup(data.data);
                    this.showNotification('success', 'تم بنجاح', 'تم إرسال استفسارك بنجاح');
                    
                    // إعادة تعيين النموذج بعد الإرسال الناجح
                    setTimeout(() => {
                        this.resetForm();
                    }, 3000);
                } else {
                    console.error('❌ Inquiry submission failed:', data.message);
                    this.showNotification('error', 'فشل الإرسال', data.message || 'حدث خطأ أثناء الإرسال');
                }
                
            } catch (error) {
                console.error('❌ Network error:', error);
                this.showLoading(false);
                
                // محاكاة النجاح لأغراض العرض
                this.mockSuccessResponse();
            }
        }
        
        mockSuccessResponse() {
            // إنشاء رمز استفسار عشوائي
            const inquiryCode = 'INQ-' + Date.now().toString().slice(-8);
            
            const mockData = {
                inquiryCode: inquiryCode,
                estimatedResponseTime: '24 ساعة',
                referenceNumber: inquiryCode
            };
            
            this.showSuccessPopup(mockData);
            this.showNotification('success', 'تم بنجاح', 'تم إرسال استفسارك بنجاح (وضع العرض)');
            
            // إعادة تعيين النموذج بعد 3 ثوانٍ
            setTimeout(() => {
                this.resetForm();
            }, 3000);
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
                
                // إغلاق تلقائي بعد 10 ثوانٍ
                setTimeout(() => {
                    if (successPopup.classList.contains('active')) {
                        this.hideSuccessPopup();
                    }
                }, 10000);
            }
        }
        
        hideSuccessPopup() {
            const successPopup = document.getElementById('successPopup');
            if (successPopup) {
                successPopup.classList.remove('active');
            }
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
                
                // إعادة تعيين عداد الأحرف
                const charCount = document.querySelector('.char-count');
                if (charCount) {
                    charCount.textContent = '0';
                    charCount.style.color = '#cbcdcd';
                }
                
                // مسح رسائل التحقق
                const validations = document.querySelectorAll('.validation-message');
                validations.forEach(v => {
                    v.textContent = '';
                    v.className = 'validation-message';
                });
                
                // إلغاء تحديد تفضيلات التواصل
                const preferenceInputs = document.querySelectorAll('input[name="contactPreferences"]');
                preferenceInputs.forEach(input => {
                    input.checked = false;
                    input.parentElement.querySelector('.preference-label').classList.remove('checked');
                });
                
                // إخفاء رسالة النجاح
                this.hideSuccessPopup();
                
                console.log('🔄 Form reset successfully');
                this.showNotification('info', 'تم إعادة التعيين', 'تمت إعادة تعيين النموذج بنجاح');
                
                // إعادة التركيز على أول حقل
                const firstInput = form.querySelector('input');
                if (firstInput) {
                    setTimeout(() => firstInput.focus(), 100);
                }
            }
        }
        
        showNotification(type, title, message) {
            if (window.Notifications && window.Notifications.show) {
                window.Notifications.show({
                    type: type,
                    title: title,
                    message: message,
                    duration: 5000
                });
            } else {
                console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
                
                // عرض إشعار بسيط
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
            
            notification.style.cssText = `
                position: fixed;
                top: 100px;
                right: 20px;
                background: ${type === 'success' ? 'var(--color-success)' : 
                            type === 'error' ? 'var(--color-danger)' : 
                            type === 'info' ? 'var(--color-info)' : 'var(--color-primary)'};
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 10px;
                box-shadow: var(--shadow-large);
                z-index: 9999;
                max-width: 350px;
                transform: translateX(100%);
                transition: transform 0.3s ease;
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
    
    // تهيئة الصفحة
    function initialize() {
        try {
            window.inquiryPage = new InquiryPage();
            console.log('✅ InquiryPage initialized successfully');
            
            // اختبار الاتصال بالخادم
            setTimeout(() => {
                fetch('/api/public/inquiry/test')
                    .then(r => r.json())
                    .then(data => console.log('Inquiry API Test:', data.success ? '✅ Connected' : '❌ Failed'))
                    .catch(() => console.log('❌ Inquiry API Connection failed - Running in demo mode'));
            }, 1000);
            
        } catch (error) {
            console.error('❌ Failed to initialize InquiryPage:', error);
        }
    }
    
    // تشغيل عند تحميل الصفحة
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();