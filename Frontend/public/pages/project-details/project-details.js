// Frontend/public/pages/project-details/project-details.js - النسخة النهائية مع إضافة حقول التواصل وتحسين التحقق
(function() {
    'use strict';
    
    console.log('✅ project-details.js loaded - PROFESSIONAL VERSION 5.2 (with contact preferences and live validation)');
    
    class ProjectDetailsPage {
        constructor() {
            this.apiBaseUrl = '/api/public';
            this.projectId = this.getProjectIdFromURL();
            this.projectData = null;
            this.relatedProjects = [];
            this.isMenuOpen = false;
            
            this.init();
        }
        
        init() {
            console.log('🚀 ProjectDetailsPage initializing...');
            console.log('📌 Project ID:', this.projectId);
            
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setupPage());
            } else {
                this.setupPage();
            }
        }
        
        getProjectIdFromURL() {
            const urlParams = new URLSearchParams(window.location.search);
            const id = urlParams.get('id');
            return id ? parseInt(id) : 1;
        }
        
        setupPage() {
            console.log('🔧 Setting up project details page...');
            
            this.setupMobileMenu();
            this.addAdminButtonToMobileMenu();
            this.setupEventListeners();
            this.loadProjectDetails();
        }
        
        setupMobileMenu() {
            const toggle = document.getElementById('mobile-toggle');
            const navMenu = document.querySelector('.nav-menu');
            
            if (toggle && navMenu) {
                const openMenu = () => {
                    navMenu.classList.add('active');
                    toggle.classList.add('active');
                    this.isMenuOpen = true;
                    
                    setTimeout(() => {
                        document.addEventListener('click', closeMenuOnClickOutside);
                    }, 10);
                };
                
                const closeMenu = () => {
                    navMenu.classList.remove('active');
                    toggle.classList.remove('active');
                    this.isMenuOpen = false;
                    
                    document.removeEventListener('click', closeMenuOnClickOutside);
                };
                
                const closeMenuOnClickOutside = (e) => {
                    if (!navMenu.contains(e.target) && !toggle.contains(e.target)) {
                        closeMenu();
                    }
                };
                
                toggle.addEventListener('click', (e) => {
                    e.stopPropagation();
                    
                    if (this.isMenuOpen) {
                        closeMenu();
                    } else {
                        openMenu();
                    }
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
        }
        
        addAdminButtonToMobileMenu() {
            const navMenu = document.querySelector('.nav-menu');
            if (!navMenu) return;
            
            if (navMenu.querySelector('.mobile-admin-btn')) return;
            
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
            
            navMenu.appendChild(adminButton);
            
            this.addMobileAdminButtonStyles();
        }
        
        addMobileAdminButtonStyles() {
            const style = document.createElement('style');
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
        
        setupEventListeners() {
            const shareBtn = document.getElementById('share-button');
            if (shareBtn) shareBtn.addEventListener('click', () => this.shareProject());
            
            const printBtn = document.getElementById('print-button');
            if (printBtn) printBtn.addEventListener('click', () => this.printProjectDetails());
            
            const downloadBtn = document.getElementById('download-button');
            if (downloadBtn) downloadBtn.addEventListener('click', () => this.downloadProjectDetails());
            
            const form = document.getElementById('inquiry-form');
            if (form) {
                console.log('📝 إعداد نموذج الاستفسار...');
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    console.log('📤 نموذج الاستفسار تم إرساله');
                    this.submitInquiryForm();
                });
            }
            
            const resetBtn = document.getElementById('reset-form');
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    this.resetInquiryForm();
                });
            }
            
            const newInquiryBtn = document.getElementById('new-inquiry');
            if (newInquiryBtn) {
                newInquiryBtn.addEventListener('click', () => {
                    this.showInquiryForm();
                });
            }
            
            // تحقق من المدخلات في الوقت الفعلي
            this.setupFormValidation();
            
            this.setupGalleryModal();
        }
        
        setupFormValidation() {
            const form = document.getElementById('inquiry-form');
            if (!form) return;
            
            const inputs = form.querySelectorAll('input, textarea, select');
            
            inputs.forEach(input => {
                input.addEventListener('input', () => {
                    this.validateField(input);
                });
                
                input.addEventListener('blur', () => {
                    this.validateField(input);
                });
            });
            
            // تحقق خاص لحقول الراديو
            const radioButtons = document.querySelectorAll('input[name="contactPreference"]');
            radioButtons.forEach(radio => {
                radio.addEventListener('change', () => {
                    const errorEl = document.getElementById('contactPref-error');
                    if (errorEl) {
                        errorEl.textContent = '';
                        errorEl.classList.remove('active');
                    }
                });
            });

            // تحقق خاص لرقم الجوال مع تغيير لون الحدود
            const phoneInput = document.getElementById('customer-phone');
            if (phoneInput) {
                phoneInput.addEventListener('input', () => {
                    this.validatePhoneField(phoneInput);
                });
                phoneInput.addEventListener('blur', () => {
                    this.validatePhoneField(phoneInput);
                });
            }
        }

        validatePhoneField(input) {
            const value = input.value.trim();
            const errorElement = document.getElementById('phone-error');
            
            // إزالة الألوان السابقة
            input.classList.remove('valid', 'invalid');
            
            if (!value) {
                if (input.required) {
                    errorElement.textContent = 'هذا الحقل مطلوب';
                    errorElement.classList.add('active');
                    input.classList.add('invalid');
                }
                return false;
            }

            // regex متساهل: 05xxxxxxxx أو 5xxxxxxxx (10 أرقام أو 9 أرقام إذا بدأ بـ 5)
            const phoneRegex = /^(05|5)([0-9]{8,9})$/;
            const cleaned = value.replace(/\s+/g, '');
            
            if (phoneRegex.test(cleaned)) {
                errorElement.textContent = '';
                errorElement.classList.remove('active');
                input.classList.add('valid');
                return true;
            } else {
                errorElement.textContent = 'رقم الجوال غير صالح (يجب أن يبدأ بـ 05 ويتكون من 10 أرقام)';
                errorElement.classList.add('active');
                input.classList.add('invalid');
                return false;
            }
        }
        
        validateField(input) {
            const errorElement = document.getElementById(`${input.name}-error`);
            if (!errorElement) return true;
            
            const value = input.value.trim();
            
            errorElement.textContent = '';
            errorElement.classList.remove('active');
            input.style.borderColor = '';
            
            if (input.required && !value) {
                errorElement.textContent = 'هذا الحقل مطلوب';
                errorElement.classList.add('active');
                input.style.borderColor = '#ff6b6b';
                return false;
            }
            
            if (input.type === 'email' && value) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    errorElement.textContent = 'البريد الإلكتروني غير صالح';
                    errorElement.classList.add('active');
                    input.style.borderColor = '#ff6b6b';
                    return false;
                }
            }
            
            // لا نتحقق من الرقم هنا لأنه تم في validatePhoneField
            return true;
        }
        
        async loadProjectDetails() {
            try {
                console.log(`🔍 جلب تفاصيل العقار ID: ${this.projectId}`);
                console.log(`🔗 URL: ${this.apiBaseUrl}/project-details/${this.projectId}`);
                
                this.showLoadingState();
                
                const response = await fetch(`${this.apiBaseUrl}/project-details/${this.projectId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`Failed to load project details: ${response.status} ${response.statusText}`);
                }
                
                const data = await response.json();
                console.log('✅ Project details loaded:', data);
                
                if (data.success && data.data) {
                    this.projectData = data.data;
                    this.renderProjectDetails();
                    this.initializeGallery();
                    this.loadRelatedProjects();
                } else {
                    throw new Error('No project data found');
                }
                
            } catch (error) {
                console.error('❌ Error loading project details:', error);
                this.showFallbackProjectDetails();
            }
        }
        
        async loadRelatedProjects() {
            try {
                console.log('🏢 جلب العقارات المشابهة...');
                
                const response = await fetch(`${this.apiBaseUrl}/project-details/${this.projectId}/related`, {
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    console.warn('⚠️ Failed to load related projects');
                    this.relatedProjects = [];
                    this.renderRelatedProjects();
                    return;
                }
                
                const data = await response.json();
                
                if (data.success && data.data?.projects?.length > 0) {
                    this.relatedProjects = data.data.projects.filter(project => project.id !== this.projectId);
                    this.renderRelatedProjects();
                } else {
                    this.relatedProjects = [];
                    this.renderRelatedProjects();
                }
                
            } catch (error) {
                console.error('❌ Error loading related projects:', error);
                this.relatedProjects = [];
                this.renderRelatedProjects();
            }
        }
        
        async submitInquiryForm() {
            const form = document.getElementById('inquiry-form');
            const submitBtn = document.getElementById('submit-inquiry');
            const loadingEl = document.getElementById('inquiry-loading');
            
            if (!form || !submitBtn || !loadingEl) {
                console.error('❌ عناصر النموذج غير موجودة');
                this.showNotification('خطأ في تحميل النموذج', 'error');
                return;
            }
            
            // التحقق من صحة جميع الحقول
            let isValid = true;
            const inputs = form.querySelectorAll('input[required], textarea[required]');
            
            inputs.forEach(input => {
                if (input.name === 'customerPhone') {
                    if (!this.validatePhoneField(input)) isValid = false;
                } else {
                    if (!this.validateField(input)) isValid = false;
                }
            });
            
            // التحقق من اختيار طريقة تواصل
            const contactPref = document.querySelector('input[name="contactPreference"]:checked');
            if (!contactPref) {
                const errorEl = document.getElementById('contactPref-error');
                if (errorEl) {
                    errorEl.textContent = 'يرجى اختيار طريقة التواصل المفضلة';
                    errorEl.classList.add('active');
                }
                isValid = false;
            }
            
            if (!isValid) {
                this.showNotification('يرجى ملء جميع الحقول المطلوبة بشكل صحيح', 'error');
                return;
            }
            
            // جمع البيانات
            const formData = {
                customerName: document.getElementById('customer-name').value.trim(),
                customerEmail: document.getElementById('customer-email').value.trim(),
                customerPhone: document.getElementById('customer-phone').value.trim().replace(/\s+/g, ''),
                message: document.getElementById('inquiry-message').value.trim(),
                inquiryType: 'استفسار_عام',
                contactPreference: contactPref ? contactPref.value : 'phone',
                preferredTime: document.getElementById('preferredTime').value || null
            };
            
            console.log('📤 بيانات الاستفسار المجمعة:', formData);
            
            submitBtn.disabled = true;
            loadingEl.style.display = 'flex';
            
            try {
                const url = `${this.apiBaseUrl}/project-details/${this.projectId}/inquiry`;
                console.log(`🔗 إرسال إلى: ${url}`);
                
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                console.log('📥 Response Status:', response.status);
                console.log('📥 Response Headers:', response.headers);
                
                const responseText = await response.text();
                console.log('📥 Response Text:', responseText);
                
                let data;
                try {
                    data = JSON.parse(responseText);
                } catch (parseError) {
                    console.error('❌ فشل في تحليل JSON:', parseError);
                    throw new Error('استجابة غير صالحة من الخادم');
                }
                
                console.log('📥 Response Data:', data);
                
                if (!response.ok) {
                    throw new Error(data.message || `فشل في إرسال الاستفسار: ${response.status}`);
                }
                
                if (data.success) {
                    this.showInquirySuccess();
                    this.resetInquiryForm();
                    
                    let successMessage = '✅ تم إرسال استفسارك بنجاح. سيتواصل معك فريقنا قريباً.';
                    if (data.source === 'temp_mode' || data.source === 'debug_mode') {
                        successMessage += ' (بيانات مؤقتة للاختبار)';
                    }
                    this.showNotification(successMessage, 'success');
                    
                    console.log('✅ استفسار ناجح:', data.data);
                    
                    if (data.data && data.data.note) {
                        console.log('📝 ملاحظة:', data.data.note);
                    }
                } else {
                    throw new Error(data.message || 'فشل غير معروف');
                }
                
            } catch (error) {
                console.error('❌ Error submitting inquiry:', error);
                
                // محاولة بديلة إذا فشلت الأولى
                try {
                    console.log('🔄 محاولة بديلة مع test-inquiry...');
                    const testResponse = await fetch(`${this.apiBaseUrl}/project-details/test-inquiry`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify({
                            ...formData,
                            projectId: this.projectId,
                            testMode: true
                        })
                    });
                    
                    if (testResponse.ok) {
                        this.showInquirySuccess();
                        this.resetInquiryForm();
                        this.showNotification('✅ تم إرسال استفسارك بنجاح (وضع الاختبار).', 'success');
                        console.log('✅ test-inquiry ناجح');
                    } else {
                        throw error;
                    }
                } catch (testError) {
                    this.showNotification(
                        error.message || 'حدث خطأ أثناء إرسال الاستفسار. يرجى المحاولة مرة أخرى أو التواصل مع الدعم.',
                        'error'
                    );
                }
            } finally {
                submitBtn.disabled = false;
                loadingEl.style.display = 'none';
            }
        }
        
        resetInquiryForm() {
            const form = document.getElementById('inquiry-form');
            if (!form) return;
            
            form.reset();
            
            const errorElements = document.querySelectorAll('.form-error');
            errorElements.forEach(el => {
                el.textContent = '';
                el.classList.remove('active');
            });
            
            const inputs = form.querySelectorAll('input, textarea');
            inputs.forEach(input => {
                input.style.borderColor = '';
                input.classList.remove('valid', 'invalid');
            });
            
            // إعادة تعيين الراديو
            document.querySelectorAll('input[name="contactPreference"]').forEach(radio => {
                radio.checked = false;
            });
            document.getElementById('preferredTime').value = '';
        }
        
        showInquirySuccess() {
            const form = document.getElementById('inquiry-form');
            const success = document.getElementById('inquiry-success');
            
            if (form) form.style.display = 'none';
            if (success) success.style.display = 'block';
        }
        
        showInquiryForm() {
            const form = document.getElementById('inquiry-form');
            const success = document.getElementById('inquiry-success');
            
            if (success) success.style.display = 'none';
            if (form) {
                form.style.display = 'block';
                form.reset();
            }
        }
        
        showNotification(message, type = 'info') {
            let notification = document.getElementById('custom-notification');
            
            if (!notification) {
                notification = document.createElement('div');
                notification.id = 'custom-notification';
                notification.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 15px 20px;
                    border-radius: 5px;
                    color: white;
                    font-weight: bold;
                    z-index: 9999;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    animation: slideIn 0.3s ease-out;
                    font-family: 'Tajawal', sans-serif;
                    direction: rtl;
                    text-align: right;
                    max-width: 500px;
                    white-space: pre-line;
                `;
                document.body.appendChild(notification);
            }
            
            let backgroundColor;
            switch(type) {
                case 'success':
                    backgroundColor = '#2ecc71';
                    break;
                case 'error':
                    backgroundColor = '#e74c3c';
                    break;
                case 'warning':
                    backgroundColor = '#f39c12';
                    break;
                default:
                    backgroundColor = '#3498db';
            }
            
            notification.style.backgroundColor = backgroundColor;
            notification.textContent = message;
            notification.style.display = 'block';
            
            setTimeout(() => {
                notification.style.display = 'none';
            }, 7000);
            
            if (!document.getElementById('notification-styles')) {
                const style = document.createElement('style');
                style.id = 'notification-styles';
                style.textContent = `
                    @keyframes slideIn {
                        from {
                            transform: translateX(100%);
                            opacity: 0;
                        }
                        to {
                            transform: translateX(0);
                            opacity: 1;
                        }
                    }
                `;
                document.head.appendChild(style);
            }
        }
        
        showLoadingState() {
            const titleElement = document.getElementById('project-title');
            if (titleElement) {
                titleElement.textContent = 'جاري تحميل العقار...';
            }
        }
        
        renderProjectDetails() {
            if (!this.projectData) return;
            
            const project = this.projectData;
            
            const titleElement = document.getElementById('project-title');
            if (titleElement) {
                titleElement.textContent = project.projectName;
            }
            
            document.title = `${project.projectName} | نظام إدارة العقارات`;
            
            this.updateQuickInfo(project);
            this.updatePropertyBadges(project);
            this.updateDescription(project);
            this.updateFeatures(project);
            this.updateSpecifications(project);
            this.updateLocation(project);
            this.updateInquiryForm(project);
            this.hideLoadingStates();
        }
        
        updateQuickInfo(project) {
            const priceElement = document.getElementById('quick-price');
            const areaElement = document.getElementById('quick-area');
            const locationElement = document.getElementById('quick-location');
            const statusElement = document.getElementById('quick-status');
            
            if (priceElement) priceElement.textContent = this.formatPrice(project.price, project.priceType);
            if (areaElement) areaElement.textContent = `${project.area} ${project.areaUnit || 'م²'}`;
            if (locationElement) locationElement.textContent = project.city || 'غير محدد';
            if (statusElement) statusElement.textContent = project.status || 'نشط';
        }
        
        updatePropertyBadges(project) {
            const badgesContainer = document.getElementById('property-badges');
            if (!badgesContainer) return;
            
            let badgesHTML = '';
            
            if (project.isFeatured) {
                badgesHTML += `
                    <span class="property-badge featured">
                        <i class="fas fa-star"></i>
                        <span>مميز</span>
                    </span>
                `;
            }
            
            const status = project.status?.toLowerCase();
            if (status === 'مباع' || status === 'sold') {
                badgesHTML += `
                    <span class="property-badge sold">
                        <i class="fas fa-tag"></i>
                        <span>مباع</span>
                    </span>
                `;
            } else if (status === 'جاهز' || status === 'جاهز_للتسليم') {
                badgesHTML += `
                    <span class="property-badge available">
                        <i class="fas fa-check"></i>
                        <span>جاهز للتسليم</span>
                    </span>
                `;
            } else {
                badgesHTML += `
                    <span class="property-badge available">
                        <i class="fas fa-check-circle"></i>
                        <span>متاح</span>
                    </span>
                `;
            }
            
            badgesHTML += `
                <span class="property-badge">
                    <i class="fas fa-building"></i>
                    <span>${project.projectType || 'عقار'}</span>
                </span>
            `;
            
            badgesContainer.innerHTML = badgesHTML;
        }
        
        updateDescription(project) {
            const descriptionElement = document.getElementById('project-description');
            if (!descriptionElement) return;
            
            if (project.description && project.description.trim() !== '') {
                descriptionElement.innerHTML = `
                    <p>${project.description.replace(/\n/g, '</p><p>')}</p>
                `;
            } else {
                descriptionElement.innerHTML = `
                    <p>لا يوجد وصف متوفر لهذا العقار حالياً.</p>
                    <p>للحصول على مزيد من المعلومات، يرجى التواصل مع فريق المبيعات.</p>
                `;
            }
        }
        
        updateFeatures(project) {
            const featuresContainer = document.getElementById('features-grid');
            if (!featuresContainer) return;
            
            if (project.features && project.features.length > 0) {
                let featuresHTML = '';
                
                project.features.forEach(feature => {
                    featuresHTML += `
                        <div class="feature-item">
                            <div class="feature-icon">
                                <i class="${feature.icon || 'fas fa-check'}"></i>
                            </div>
                            <div class="feature-content">
                                <span class="feature-name">${feature.name}</span>
                                <span class="feature-value">${feature.value || ''}</span>
                            </div>
                        </div>
                    `;
                });
                
                featuresContainer.innerHTML = featuresHTML;
            } else {
                featuresContainer.innerHTML = `
                    <div class="no-features">
                        <i class="fas fa-info-circle"></i>
                        <p>لا توجد مميزات مسجلة لهذا العقار حالياً.</p>
                    </div>
                `;
            }
        }
        
        updateSpecifications(project) {
            const specsContainer = document.getElementById('specs-grid');
            if (!specsContainer) return;
            
            const specs = [
                { label: 'نوع العقار', value: project.projectType, icon: 'fas fa-home' },
                { label: 'المساحة', value: `${project.area} ${project.areaUnit || 'م²'}`, icon: 'fas fa-expand-arrows-alt' },
                { label: 'الغرف', value: project.bedrooms > 0 ? `${project.bedrooms} غرفة` : 'غير محدد', icon: 'fas fa-bed' },
                { label: 'الحمامات', value: project.bathrooms > 0 ? `${project.bathrooms} حمام` : 'غير محدد', icon: 'fas fa-bath' },
                { label: 'نوع المعاملة', value: this.getPriceTypeText(project.priceType), icon: 'fas fa-exchange-alt' },
                { label: 'الكود', value: project.projectCode || `PJ-${project.id}`, icon: 'fas fa-hashtag' },
                { label: 'تاريخ الإضافة', value: this.formatDate(project.createdAt), icon: 'fas fa-calendar-plus' },
                { label: 'الوحدات المتاحة', value: `${project.availableUnits || 0} من ${project.totalUnits || 0}`, icon: 'fas fa-building' }
            ];
            
            let specsHTML = '';
            specs.forEach(spec => {
                if (spec.value) {
                    specsHTML += `
                        <div class="spec-item">
                            <span class="spec-label">
                                <i class="${spec.icon}"></i>
                                <span>${spec.label}</span>
                            </span>
                            <span class="spec-value">${spec.value}</span>
                        </div>
                    `;
                }
            });
            
            specsContainer.innerHTML = specsHTML;
        }
        
        updateLocation(project) {
            const locationContainer = document.getElementById('location-details');
            if (!locationContainer) return;
            
            let locationHTML = `
                <div class="location-address">
                    <div class="address-item">
                        <div class="address-icon">
                            <i class="fas fa-map-marker-alt"></i>
                        </div>
                        <div class="address-content">
                            <span class="address-label">العنوان الكامل</span>
                            <span class="address-value">${project.fullAddress || project.location || 'غير محدد'}</span>
                        </div>
                    </div>
                    
                    <div class="address-item">
                        <div class="address-icon">
                            <i class="fas fa-city"></i>
                        </div>
                        <div class="address-content">
                            <span class="address-label">المدينة</span>
                            <span class="address-value">${project.city || 'غير محدد'}</span>
                        </div>
                    </div>
                    
                    ${project.district ? `
                    <div class="address-item">
                        <div class="address-icon">
                            <i class="fas fa-location-arrow"></i>
                        </div>
                        <div class="address-content">
                            <span class="address-label">الحي</span>
                            <span class="address-value">${project.district}</span>
                        </div>
                    </div>
                    ` : ''}
                </div>
            `;
            
            locationContainer.innerHTML = locationHTML;
            this.updateMap(project);
        }
        
        updateMap(project) {
            const mapContainer = document.getElementById('location-map');
            if (!mapContainer) return;
            
            // التحقق من وجود locationLink
            if (project.locationLink) {
                // رابط موجود - عرض زر مباشر
                mapContainer.innerHTML = `
                    <div class="map-placeholder" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                        <i class="fas fa-map-marked-alt" style="font-size: 3rem; color: var(--color-primary); margin-bottom: 1rem;"></i>
                        <span style="font-size: 1.2rem; font-weight: 600; margin-bottom: 0.5rem;">الموقع متاح</span>
                        <p style="color: var(--color-text-secondary); margin-bottom: 1.5rem;">انقر على الزر لفتح الموقع على الخريطة</p>
                        <a href="${project.locationLink}" target="_blank" class="btn btn-primary" style="background: linear-gradient(135deg, #cbcdcd, #a6a8a8); color: #1a1a1a; padding: 0.8rem 2rem;">
                            <i class="fas fa-external-link-alt"></i>
                            <span>عرض على الخريطة</span>
                        </a>
                    </div>
                `;
            } else {
                // لا يوجد رابط - رسالة احترافية
                mapContainer.innerHTML = `
                    <div class="map-placeholder" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                        <i class="fas fa-map" style="font-size: 3rem; color: var(--color-text-tertiary); margin-bottom: 1rem;"></i>
                        <span style="font-size: 1.2rem; font-weight: 600; margin-bottom: 0.5rem;">الموقع غير متوفر</span>
                        <p style="color: var(--color-text-secondary); max-width: 80%; text-align: center;">لم يقم المالك بإضافة رابط الموقع بعد. يمكنك التواصل معنا للاستفسار عن العنوان الدقيق.</p>
                        <button class="btn btn-outline btn-sm" onclick="document.getElementById('inquiry-form').scrollIntoView({behavior: 'smooth'});" style="margin-top: 1rem;">
                            <i class="fas fa-question-circle"></i>
                            <span>استفسر عن الموقع</span>
                        </button>
                    </div>
                `;
            }
        }
        
        updateInquiryForm(project) {
            const projectIdInput = document.getElementById('project-id');
            const projectNameInput = document.getElementById('project-name-input');
            
            if (projectIdInput) projectIdInput.value = project.id;
            if (projectNameInput) projectNameInput.value = project.projectName;
        }
        
        initializeGallery() {
            const project = this.projectData;
            if (!project) return;
            
            const noImagesElement = document.getElementById('no-images');
            const mainImageContainer = document.getElementById('main-image-container');
            const imageCountElement = document.getElementById('image-count');
            
            if (!project.images || project.images.length === 0) {
                if (noImagesElement) noImagesElement.style.display = 'block';
                if (mainImageContainer) mainImageContainer.style.display = 'none';
                if (imageCountElement) imageCountElement.textContent = '0 صورة';
                return;
            }
            
            if (imageCountElement) {
                imageCountElement.textContent = `${project.images.length} صورة`;
            }
            
            const mainImage = document.getElementById('main-image');
            const viewGalleryBtn = document.getElementById('view-gallery-btn');
            
            if (mainImage && project.images[0].url) {
                mainImage.src = project.images[0].url;
                mainImage.alt = project.projectName;
            } else if (mainImage) {
                mainImage.src = '/global/assets/images/project-placeholder.jpg';
            }
            
            if (mainImageContainer) {
                mainImageContainer.style.display = 'block';
            }
            
            const galleryImages = document.getElementById('gallery-images');
            if (galleryImages) {
                galleryImages.innerHTML = '';
                
                project.images.forEach((image, index) => {
                    const img = document.createElement('img');
                    img.src = image.url || '/global/assets/images/project-placeholder.jpg';
                    img.alt = `${project.projectName} - صورة ${index + 1}`;
                    img.loading = 'lazy';
                    galleryImages.appendChild(img);
                });
            }
        }
        
        setupGalleryModal() {
            const modal = document.getElementById('gallery-modal');
            const openBtn = document.getElementById('view-gallery-btn');
            const closeBtn = document.getElementById('close-modal');
            
            if (openBtn && modal) {
                openBtn.addEventListener('click', () => {
                    modal.classList.add('active');
                    document.body.style.overflow = 'hidden';
                });
            }
            
            if (closeBtn && modal) {
                closeBtn.addEventListener('click', () => {
                    modal.classList.remove('active');
                    document.body.style.overflow = 'auto';
                });
            }
            
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.classList.remove('active');
                        document.body.style.overflow = 'auto';
                    }
                });
            }
        }
        
        hideLoadingStates() {
            const loadingElements = document.querySelectorAll('.loading-line, .loading-features, .loading-specs, .loading-location, .loading-projects');
            loadingElements.forEach(el => {
                el.style.display = 'none';
            });
        }
        
        renderRelatedProjects() {
            const container = document.getElementById('related-projects');
            const noRelatedContainer = document.getElementById('no-related-projects');
            
            if (!container || !noRelatedContainer) return;
            
            if (!this.relatedProjects || this.relatedProjects.length === 0) {
                container.style.display = 'none';
                noRelatedContainer.style.display = 'block';
                return;
            }
            
            container.style.display = 'grid';
            noRelatedContainer.style.display = 'none';
            
            let projectsHTML = '';
            
            this.relatedProjects.forEach(project => {
                projectsHTML += `
                    <a href="index.html?id=${project.id}" class="project-card-grid">
                        <div class="project-image-grid">
                            <img src="${project.mainImage || project.images?.[0]?.url || '/global/assets/images/project-placeholder.jpg'}" 
                                 alt="${project.projectName}"
                                 loading="lazy">
                            <div class="project-overlay-grid">
                                ${project.isFeatured ? `
                                <span class="project-badge-grid featured">
                                    <i class="fas fa-star"></i>
                                    <span>مميز</span>
                                </span>
                                ` : ''}
                                <span class="project-status-grid ${project.status === 'جاهز' ? 'available' : ''}">
                                    ${project.status || 'متاح'}
                                </span>
                            </div>
                        </div>
                        <div class="project-content-grid">
                            <div class="project-header-grid">
                                <h3 class="project-title-grid">${project.projectName}</h3>
                                ${project.projectType ? `
                                <span class="project-type-grid">${project.projectType}</span>
                                ` : ''}
                            </div>
                            <div class="project-location-grid">
                                <i class="fas fa-map-marker-alt location-icon"></i>
                                <span class="location-text">${project.city || ''}${project.district ? '، ' + project.district : ''}</span>
                            </div>
                            <div class="project-details-grid">
                                ${project.area ? `
                                <div class="detail-item">
                                    <i class="fas fa-expand-arrows-alt detail-icon"></i>
                                    <span>${project.area} م²</span>
                                </div>
                                ` : ''}
                                ${project.bedrooms ? `
                                <div class="detail-item">
                                    <i class="fas fa-bed detail-icon"></i>
                                    <span>${project.bedrooms} غرف</span>
                                </div>
                                ` : ''}
                                ${project.bathrooms ? `
                                <div class="detail-item">
                                    <i class="fas fa-bath detail-icon"></i>
                                    <span>${project.bathrooms} حمام</span>
                                </div>
                                ` : ''}
                            </div>
                            <div class="project-footer-grid">
                                <div class="project-price-grid">
                                    <span class="price-value">${this.formatPrice(project.price, project.priceType)}</span>
                                    <span class="price-period">${this.getPriceTypeText(project.priceType) === 'إيجار' ? 'ريال/شهري' : 'ريال'}</span>
                                </div>
                                <div class="project-action-grid">
                                    <span class="btn btn-outline"> تفاصيل</span>
                                </div>
                            </div>
                        </div>
                    </a>
                `;
            });
            
            container.innerHTML = projectsHTML;
        }
        
        shareProject() {
            const project = this.projectData;
            const url = window.location.href;
            const title = project.projectName;
            const text = `تفاصيل العقار: ${project.projectName} - ${project.description?.substring(0, 100)}...`;
            
            if (navigator.share) {
                navigator.share({
                    title: title,
                    text: text,
                    url: url
                })
                .then(() => console.log('✅ تمت المشاركة بنجاح'))
                .catch((error) => console.log('❌ خطأ في المشاركة:', error));
            } else {
                navigator.clipboard.writeText(url)
                    .then(() => {
                        this.showNotification('تم نسخ رابط العقار إلى الحافظة', 'success');
                    })
                    .catch(() => {
                        const tempInput = document.createElement('input');
                        tempInput.value = url;
                        document.body.appendChild(tempInput);
                        tempInput.select();
                        document.execCommand('copy');
                        document.body.removeChild(tempInput);
                        this.showNotification('تم نسخ رابط العقار إلى الحافظة', 'success');
                    });
            }
        }
        
        printProjectDetails() {
            const project = this.projectData;
            
            const printContent = `
                <!DOCTYPE html>
                <html dir="rtl" lang="ar">
                <head>
                    <meta charset="UTF-8">
                    <title>${project.projectName} - طباعة التفاصيل</title>
                    <style>
                        body { font-family: 'Tajawal', sans-serif; padding: 20px; }
                        .print-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
                        .print-title { font-size: 24px; margin-bottom: 10px; }
                        .print-section { margin-bottom: 20px; }
                        .print-section h3 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
                        .print-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
                        .print-item { margin-bottom: 10px; }
                        .print-label { font-weight: bold; color: #555; }
                        .print-footer { margin-top: 40px; text-align: center; color: #666; font-size: 14px; }
                        @media print {
                            body { padding: 0; }
                        }
                    </style>
                </head>
                <body>
                    <div class="print-header">
                        <h1 class="print-title">${project.projectName}</h1>
                        <p>كود العقار: ${project.projectCode || `PJ-${project.id}`}</p>
                        <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')}</p>
                    </div>
                    
                    <div class="print-section">
                        <h3>المعلومات الأساسية</h3>
                        <div class="print-grid">
                            <div class="print-item">
                                <span class="print-label">نوع العقار:</span> ${project.projectType}
                            </div>
                            <div class="print-item">
                                <span class="print-label">المساحة:</span> ${project.area} ${project.areaUnit || 'م²'}
                            </div>
                            <div class="print-item">
                                <span class="print-label">السعر:</span> ${this.formatPrice(project.price, project.priceType)}
                            </div>
                            <div class="print-item">
                                <span class="print-label">الحالة:</span> ${project.status}
                            </div>
                            <div class="print-item">
                                <span class="print-label">الموقع:</span> ${project.fullAddress || project.city}
                            </div>
                            <div class="print-item">
                                <span class="print-label">تاريخ الإضافة:</span> ${this.formatDate(project.createdAt)}
                            </div>
                        </div>
                    </div>
                    
                    ${project.description ? `
                    <div class="print-section">
                        <h3>الوصف</h3>
                        <p>${project.description}</p>
                    </div>
                    ` : ''}
                    
                    ${project.features && project.features.length > 0 ? `
                    <div class="print-section">
                        <h3>المميزات</h3>
                        <div class="print-grid">
                            ${project.features.map(f => `
                                <div class="print-item">
                                    <span class="print-label">${f.name}:</span> ${f.value || ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}
                    
                    <div class="print-footer">
                        <p>© ${new Date().getFullYear()} إيواء العقارية - جميع الحقوق محفوظة</p>
                        <p>تمت الطباعة من: ${window.location.href}</p>
                    </div>
                </body>
                </html>
            `;
            
            const printWindow = window.open('', '_blank');
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.focus();
            
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);
        }
        
        downloadProjectDetails() {
            const project = this.projectData;
            const content = `
                تفاصيل العقار: ${project.projectName}
                =================================
                
                الكود: ${project.projectCode || `PJ-${project.id}`}
                النوع: ${project.projectType}
                المساحة: ${project.area} ${project.areaUnit || 'م²'}
                السعر: ${this.formatPrice(project.price, project.priceType)}
                الحالة: ${project.status}
                الموقع: ${project.fullAddress || project.city}
                
                ${project.description ? `
                الوصف:
                ${project.description}
                ` : ''}
                
                ${project.features && project.features.length > 0 ? `
                المميزات:
                ${project.features.map(f => `• ${f.name}: ${f.value || ''}`).join('\n')}
                ` : ''}
                
                ---
                تم التحميل من: ${window.location.href}
                تاريخ التحميل: ${new Date().toLocaleString('ar-SA')}
                © ${new Date().getFullYear()} إيواء العقارية
            `;
            
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${project.projectName.replace(/\s+/g, '_')}_details.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showNotification('تم تحميل التفاصيل بنجاح', 'success');
        }
        
        showFallbackProjectDetails() {
            console.log('🔄 Using fallback project details');
            
            this.projectData = {
                id: this.projectId,
                projectName: 'فيلات النخيل الراقية',
                projectType: 'سكني',
                description: 'مجمع فيلات فاخرة بمواصفات عالمية، موقع مميز مع إطلالة على الواجهة البحرية',
                city: 'الرياض',
                district: 'النخيل',
                fullAddress: 'الرياض، حي النخيل، شارع الأمير محمد بن سلمان',
                area: 450,
                areaUnit: 'م²',
                bedrooms: 5,
                bathrooms: 4,
                price: 3500000,
                priceType: 'شراء',
                isFeatured: true,
                status: 'جاهز',
                projectCode: 'PJ-2024-001',
                createdAt: '2024-01-15',
                locationLink: null, // تجربة حالة null
                images: [
                    { url: '/global/assets/images/project-placeholder.jpg', type: 'صورة رئيسية' }
                ],
                features: [
                    { name: 'المساحة', value: '450 م²', icon: 'fas fa-expand' },
                    { name: 'الغرف', value: '5 غرف نوم', icon: 'fas fa-bed' },
                    { name: 'الحمامات', value: '4 حمامات', icon: 'fas fa-bath' },
                    { name: 'مواقف السيارات', value: '4 مواقف مغطاة', icon: 'fas fa-parking' }
                ]
            };
            
            this.renderProjectDetails();
            this.initializeGallery();
        }
        
        formatPrice(price, priceType) {
            if (!price) return '---';
            
            const num = parseFloat(price);
            if (isNaN(num)) return '---';
            
            if (num >= 1000000) {
                return (num / 1000000).toFixed(1).replace('.0', '') + ' مليون ر.س';
            }
            if (num >= 1000) {
                return (num / 1000).toFixed(0) + ' ألف ر.س';
            }
            
            return num.toLocaleString('ar-SA') + ' ر.س';
        }
        
        getPriceTypeText(type) {
            if (!type) return 'شراء';
            
            const typeLower = type.toString().toLowerCase();
            if (typeLower.includes('إيجار') || typeLower.includes('تأجير') || typeLower === 'rent') {
                return 'إيجار';
            }
            return 'شراء';
        }
        
        formatDate(dateString) {
            if (!dateString) return 'غير محدد';
            
            try {
                const date = new Date(dateString);
                return date.toLocaleDateString('ar-SA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            } catch (error) {
                return 'غير محدد';
            }
        }
    }
    
    async function initialize() {
        try {
            window.projectDetailsPage = new ProjectDetailsPage();
            console.log('✅ ProjectDetailsPage initialized successfully');
            
            console.log('🔗 اختبار اتصال API...');
            try {
                const response = await fetch('/api/health');
                const data = await response.json();
                console.log('✅ حالة الخادم:', data);
            } catch (error) {
                console.warn('⚠️ لا يمكن الاتصال بالخادم:', error.message);
            }
            
        } catch (error) {
            console.error('❌ Failed to initialize ProjectDetailsPage:', error);
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();