// ===== صفحة تسجيل الدخول - النظام المعدل (بدون محاكاة) =====
(function() {
    'use strict';
    
    console.log('✅ login.js loaded - Authentication System (API only)');
    
    class LoginPage {
        constructor() {
            this.apiClient = window.API || null;
            this.authManager = window.AuthManager || null;
            this.isSubmitting = false;
            
            this.init();
        }
        
        init() {
            console.log('🚀 تهيئة صفحة تسجيل الدخول...');
            
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setupPage());
            } else {
                this.setupPage();
            }
        }
        
        setupPage() {
            console.log('🔧 إعداد صفحة تسجيل الدخول...');
            
            // تهيئة العناصر
            this.elements = {
                loginForm: document.getElementById('login-form'),
                usernameInput: document.getElementById('username'),
                passwordInput: document.getElementById('password'),
                passwordToggle: document.getElementById('password-toggle'),
                loginButton: document.getElementById('login-button'),
                loginLoader: document.getElementById('login-loader'),
                rememberMe: document.getElementById('remember-me'),
                usernameError: document.getElementById('username-error'),
                passwordError: document.getElementById('password-error')
            };
            
            // إعداد الأحداث
            this.setupEvents();
            
            // تحديث الوقت
            this.updateServerTime();
            setInterval(() => this.updateServerTime(), 1000);
            
            // محاولة استعادة بيانات الدخول المحفوظة
            this.restoreSavedCredentials();
            
            // اختبار الاتصال بالخادم
            this.testServerConnection();
        }
        
        setupEvents() {
            console.log('🎮 إعداد أحداث النموذج...');
            
            // إرسال النموذج
            if (this.elements.loginForm) {
                this.elements.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
            }
            
            // تبديل إظهار كلمة المرور
            if (this.elements.passwordToggle) {
                this.elements.passwordToggle.addEventListener('click', () => this.togglePasswordVisibility());
            }
            
            // التحقق الفوري للمدخلات
            if (this.elements.usernameInput) {
                this.elements.usernameInput.addEventListener('input', () => this.validateUsername());
            }
            
            if (this.elements.passwordInput) {
                this.elements.passwordInput.addEventListener('input', () => this.validatePassword());
            }
        }
        
        async testServerConnection() {
            try {
                console.log('🔍 اختبار الاتصال بالخادم...');
                
                const response = await fetch('/api/health');
                if (response.ok) {
                    console.log('✅ الخادم متصل ويعمل');
                    this.updateServerStatus('connected', 'الخادم متصل');
                } else {
                    throw new Error('الخادم غير متصل');
                }
            } catch (error) {
                console.warn('⚠️ الخادم غير متصل:', error.message);
                this.updateServerStatus('error', 'الخادم غير متصل، الرجاء المحاولة لاحقاً');
                this.showNotification('warning', 'تنبيه', 'الخادم غير متصل، لا يمكن تسجيل الدخول حالياً');
            }
        }
        
        updateServerStatus(status, message) {
            const serverStatus = document.getElementById('server-status');
            if (!serverStatus) return;
            
            const textElement = serverStatus.querySelector('.status-text');
            
            serverStatus.classList.remove('connected', 'error');
            serverStatus.classList.add(status);
            
            if (textElement) {
                textElement.textContent = message;
            }
        }
        
        updateServerTime() {
            const serverTime = document.getElementById('server-time');
            if (!serverTime) return;
            
            const now = new Date();
            const timeString = now.toLocaleTimeString('ar-SA', {
                hour12: true,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            
            const timeElement = serverTime.querySelector('span');
            if (timeElement) {
                timeElement.textContent = timeString;
            }
        }
        
        togglePasswordVisibility() {
            if (!this.elements.passwordInput || !this.elements.passwordToggle) return;
            
            const passwordInput = this.elements.passwordInput;
            const toggleIcon = this.elements.passwordToggle.querySelector('i');
            
            if (!toggleIcon) return;
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                toggleIcon.classList.remove('fa-eye');
                toggleIcon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                toggleIcon.classList.remove('fa-eye-slash');
                toggleIcon.classList.add('fa-eye');
            }
        }
        
        validateUsername() {
            if (!this.elements.usernameInput) return false;
            
            const username = this.elements.usernameInput.value.trim();
            
            if (!username) {
                this.showError('username', 'اسم المستخدم مطلوب');
                return false;
            }
            
            if (username.length < 3) {
                this.showError('username', 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل');
                return false;
            }
            
            this.clearError('username');
            return true;
        }
        
        validatePassword() {
            if (!this.elements.passwordInput) return false;
            
            const password = this.elements.passwordInput.value;
            
            if (!password) {
                this.showError('password', 'كلمة المرور مطلوبة');
                return false;
            }
            
            if (password.length < 6) {
                this.showError('password', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
                return false;
            }
            
            this.clearError('password');
            return true;
        }
        
        showError(field, message) {
            const inputElement = this.elements[`${field}Input`];
            const errorElement = this.elements[`${field}Error`];
            
            if (inputElement) {
                inputElement.classList.add('error');
            }
            
            if (errorElement) {
                errorElement.textContent = message;
                errorElement.classList.add('show');
            }
        }
        
        clearError(field) {
            const inputElement = this.elements[`${field}Input`];
            const errorElement = this.elements[`${field}Error`];
            
            if (inputElement) {
                inputElement.classList.remove('error');
            }
            
            if (errorElement) {
                errorElement.textContent = '';
                errorElement.classList.remove('show');
            }
        }
        
        async handleLogin(e) {
            e.preventDefault();
            
            console.log('🔐 معالجة تسجيل الدخول...');
            
            // التحقق من صحة المدخلات
            const isUsernameValid = this.validateUsername();
            const isPasswordValid = this.validatePassword();
            
            if (!isUsernameValid || !isPasswordValid) {
                this.showNotification('error', 'خطأ في المدخلات', 'يرجى تصحيح الأخطاء في النموذج');
                return;
            }
            
            // منع إرسال متعدد
            if (this.isSubmitting) {
                console.log('⚠️ طلب تسجيل دخول قيد المعالجة بالفعل');
                return;
            }
            
            this.isSubmitting = true;
            this.setLoading(true);
            
            try {
                // جمع بيانات النموذج
                const formData = {
                    username: this.elements.usernameInput ? this.elements.usernameInput.value.trim() : '',
                    password: this.elements.passwordInput ? this.elements.passwordInput.value : '',
                    rememberMe: this.elements.rememberMe ? this.elements.rememberMe.checked : false
                };
                
                console.log('📤 إرسال بيانات تسجيل الدخول إلى الخادم...', {
                    username: formData.username,
                    rememberMe: formData.rememberMe
                });
                
                // حفظ بيانات الدخول إذا طلب المستخدم
                if (formData.rememberMe && formData.username) {
                    this.saveCredentials(formData.username);
                } else {
                    this.clearSavedCredentials();
                }
                
                // إرسال الطلب إلى الخادم الحقيقي
                const response = await fetch('/api/admin/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                console.log('📥 استجابة الخادم:', response.status);
                
                if (!response.ok) {
                    let errorMessage = `خطأ في الاستجابة: ${response.status}`;
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.message || errorMessage;
                    } catch (e) {}
                    throw new Error(errorMessage);
                }
                
                const result = await response.json();
                
                if (result.success) {
                    await this.handleLoginSuccess(result);
                } else {
                    throw new Error(result.message || 'فشل تسجيل الدخول');
                }
                
            } catch (error) {
                console.error('❌ خطأ في تسجيل الدخول:', error);
                this.handleLoginError(error.message || 'حدث خطأ أثناء تسجيل الدخول');
            } finally {
                this.isSubmitting = false;
                this.setLoading(false);
            }
        }
        
        async handleLoginSuccess(result) {
            console.log('✅ تسجيل الدخول ناجح:', result);
            
            // حفظ بيانات الجلسة
            if (result.data && result.data.token) {
                localStorage.setItem('auth_token', result.data.token);
                if (result.data.user) {
                    localStorage.setItem('user_data', JSON.stringify(result.data.user));
                }
                // حفظ الصلاحيات القادمة من الخادم
                if (result.data.permissions && Array.isArray(result.data.permissions)) {
                    localStorage.setItem('user_permissions', JSON.stringify(result.data.permissions));
                    console.log('🔑 تم حفظ الصلاحيات:', result.data.permissions);
                } else {
                    // في حالة عدم وجود صلاحيات، نخزن مصفوفة فارغة
                    localStorage.setItem('user_permissions', JSON.stringify([]));
                }
            }
            
            // عرض إشعار النجاح
            this.showNotification('success', 'تم تسجيل الدخول', 'جاري تحويلك حسب صلاحياتك...');
            
            // إعادة توجيه إلى لوحة التحكم (سيتم التعامل مع الصلاحيات هناك)
            setTimeout(() => {
                window.location.href = '../dashboard/index.html';
            }, 1500);
        }
        
        handleLoginError(errorMessage) {
            console.error('❌ فشل تسجيل الدخول:', errorMessage);
            
            // عرض رسالة الخطأ المناسبة
            let userMessage = errorMessage;
            
            if (errorMessage.includes('غير صحيحة') || errorMessage.includes('Invalid')) {
                userMessage = 'اسم المستخدم أو كلمة المرور غير صحيحة';
            } else if (errorMessage.includes('متصلة') || errorMessage.includes('connect')) {
                userMessage = 'لا يمكن الاتصال بالخادم. يرجى المحاولة لاحقاً';
            } else if (errorMessage.includes('معلق') || errorMessage.includes('suspended')) {
                userMessage = 'حسابك معلق. يرجى التواصل مع الدعم الفني';
            } else if (errorMessage.includes('مسار API')) {
                userMessage = 'الخادم غير متصل أو المسار غير صحيح. تأكد من تشغيل الخادم على المنفذ 3001';
            }
            
            this.showNotification('error', 'فشل تسجيل الدخول', userMessage);
            
            // اهتزاز النموذج
            this.shakeForm();
        }
        
        shakeForm() {
            const form = this.elements.loginForm;
            if (!form) return;
            
            form.classList.add('shake');
            
            setTimeout(() => {
                form.classList.remove('shake');
            }, 500);
        }
        
        setLoading(isLoading) {
            const button = this.elements.loginButton;
            const loader = this.elements.loginLoader;
            
            if (button) {
                if (isLoading) {
                    button.classList.add('loading');
                    button.disabled = true;
                } else {
                    button.classList.remove('loading');
                    button.disabled = false;
                }
            }
            
            if (loader) {
                loader.style.display = isLoading ? 'inline-block' : 'none';
            }
        }
        
        saveCredentials(username) {
            try {
                localStorage.setItem('saved_username', username);
                localStorage.setItem('remember_me', 'true');
                console.log('💾 حفظ بيانات الدخول:', username);
            } catch (error) {
                console.error('❌ خطأ في حفظ بيانات الدخول:', error);
            }
        }
        
        clearSavedCredentials() {
            try {
                localStorage.removeItem('saved_username');
                localStorage.removeItem('remember_me');
                console.log('🗑️ حذف بيانات الدخول المحفوظة');
            } catch (error) {
                console.error('❌ خطأ في حذف بيانات الدخول:', error);
            }
        }
        
        restoreSavedCredentials() {
            try {
                const rememberMe = localStorage.getItem('remember_me');
                const savedUsername = localStorage.getItem('saved_username');
                
                console.log('📋 محاولة استعادة بيانات الدخول:', { rememberMe, savedUsername });
                
                if (rememberMe === 'true' && savedUsername) {
                    if (this.elements.usernameInput) {
                        this.elements.usernameInput.value = savedUsername;
                    }
                    
                    if (this.elements.rememberMe) {
                        this.elements.rememberMe.checked = true;
                    }
                    
                    console.log('✅ تم استعادة بيانات الدخول المحفوظة');
                }
            } catch (error) {
                console.error('❌ خطأ في استعادة بيانات الدخول:', error);
            }
        }
        
        showNotification(type, title, message) {
            // إنشاء إشعار بسيط
            const notificationArea = document.getElementById('notification-area');
            if (!notificationArea) {
                const area = document.createElement('div');
                area.id = 'notification-area';
                area.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 9999;
                    max-width: 400px;
                `;
                document.body.appendChild(area);
            }
            
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.style.cssText = `
                background: ${type === 'success' ? '#d4edda' : 
                            type === 'error' ? '#f8d7da' : 
                            type === 'warning' ? '#fff3cd' : '#d1ecf1'};
                border: 1px solid ${type === 'success' ? '#c3e6cb' : 
                              type === 'error' ? '#f5c6cb' : 
                              type === 'warning' ? '#ffeeba' : '#bee5eb'};
                color: ${type === 'success' ? '#155724' : 
                        type === 'error' ? '#721c24' : 
                        type === 'warning' ? '#856404' : '#0c5460'};
                padding: 15px;
                margin-bottom: 10px;
                border-radius: 5px;
                display: flex;
                align-items: center;
                animation: slideIn 0.3s ease-out;
            `;
            
            notification.innerHTML = `
                <div style="margin-left: 10px; flex-grow: 1;">
                    <strong>${title}</strong>
                    <p style="margin: 5px 0 0 0;">${message}</p>
                </div>
                <button onclick="this.parentElement.remove()" style="background: none; border: none; cursor: pointer; font-size: 16px;">
                    ✕
                </button>
            `;
            
            notificationArea.appendChild(notification);
            
            // إزالة الإشعار تلقائياً بعد 5 ثواني
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 5000);
        }
    }
    
    // تهيئة صفحة تسجيل الدخول
    function initialize() {
        try {
            console.log('🚀 تهيئة نظام تسجيل الدخول...');
            
            window.loginPage = new LoginPage();
            console.log('✅ LoginPage initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize LoginPage:', error);
        }
    }
    
    // تشغيل عند تحميل الصفحة
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
    // إضافة تأثير الاهتزاز للنماذج
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
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
        
        .shake {
            animation: shake 0.5s ease-in-out;
        }
        
        .form-group input.error {
            border-color: #dc3545 !important;
        }
        
        .error-message {
            color: #dc3545;
            font-size: 14px;
            margin-top: 5px;
            display: none;
        }
        
        .error-message.show {
            display: block;
        }
    `;
    document.head.appendChild(style);

})();