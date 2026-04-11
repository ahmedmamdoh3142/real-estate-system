// ===== مدير المصادقة للنظام العقاري =====
(function() {
    'use strict';
    
    console.log('✅ auth-manager.js loaded successfully');
    
    // تعريف كائن AuthManager
    function AuthManager() {
        this.currentUser = null;
        this.permissions = [];
        this.tokenKey = 'realestate_auth_token';
        this.userKey = 'realestate_user';
        this.permissionsKey = 'user_permissions';
        this.init();
    }
    
    // تهيئة المدير
    AuthManager.prototype.init = function() {
        this.loadUserFromStorage();
    };
    
    // تحميل المستخدم من التخزين المحلي
    AuthManager.prototype.loadUserFromStorage = function() {
        try {
            var token = localStorage.getItem(this.tokenKey);
            var userJson = localStorage.getItem(this.userKey);
            var permsJson = localStorage.getItem(this.permissionsKey);
            
            if (token && userJson) {
                this.currentUser = JSON.parse(userJson);
                this.permissions = permsJson ? JSON.parse(permsJson) : [];
                this.setAuthHeader(token);
            } else {
                this.currentUser = null;
                this.permissions = [];
                this.removeAuthHeader();
            }
        } catch (error) {
            console.error('❌ Failed to load user from storage:', error);
            this.clearAuth();
        }
    };
    
    // تعيين رأس المصادقة
    AuthManager.prototype.setAuthHeader = function(token) {
        if (window.API && window.API.defaultHeaders) {
            window.API.defaultHeaders['Authorization'] = 'Bearer ' + token;
        }
    };
    
    // إزالة رأس المصادقة
    AuthManager.prototype.removeAuthHeader = function() {
        if (window.API && window.API.defaultHeaders) {
            delete window.API.defaultHeaders['Authorization'];
        }
    };
    
    // تسجيل الدخول
    AuthManager.prototype.login = function(credentials) {
        var self = this;
        
        return new Promise(function(resolve, reject) {
            if (!window.API) {
                return reject({
                    success: false,
                    message: 'API Client غير متاح'
                });
            }
            
            window.API.post('/admin/auth/login', credentials)
                .then(function(response) {
                    if (response.success && response.data) {
                        var token = response.data.token;
                        var user = response.data.user;
                        var permissions = response.data.permissions || [];
                        
                        // حفظ في التخزين المحلي
                        localStorage.setItem(self.tokenKey, token);
                        localStorage.setItem(self.userKey, JSON.stringify(user));
                        localStorage.setItem(self.permissionsKey, JSON.stringify(permissions));
                        
                        // تحديث الحالة الحالية
                        self.currentUser = user;
                        self.permissions = permissions;
                        self.setAuthHeader(token);
                        
                        resolve({
                            success: true,
                            message: 'تم تسجيل الدخول بنجاح',
                            data: { user: user, token: token, permissions: permissions }
                        });
                    } else {
                        resolve({
                            success: false,
                            message: response.message || 'فشل تسجيل الدخول'
                        });
                    }
                })
                .catch(function(error) {
                    reject({
                        success: false,
                        message: error.message || 'حدث خطأ أثناء تسجيل الدخول'
                    });
                });
        });
    };
    
    // تسجيل الخروج
    AuthManager.prototype.logout = function() {
        try {
            // مسح التخزين المحلي
            localStorage.removeItem(this.tokenKey);
            localStorage.removeItem(this.userKey);
            localStorage.removeItem(this.permissionsKey);
            
            // إعادة تعيين الحالة
            this.currentUser = null;
            this.permissions = [];
            this.removeAuthHeader();
            
            return true;
        } catch (error) {
            console.error('❌ Logout error:', error);
            return false;
        }
    };
    
    // مسح بيانات المصادقة
    AuthManager.prototype.clearAuth = function() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        localStorage.removeItem(this.permissionsKey);
        this.currentUser = null;
        this.permissions = [];
        this.removeAuthHeader();
    };
    
    // التحقق من حالة المصادقة
    AuthManager.prototype.isAuthenticated = function() {
        return !!this.currentUser;
    };
    
    // التحقق من صلاحية معينة
    AuthManager.prototype.hasPermission = function(permissionName) {
        return this.permissions.includes(permissionName);
    };
    
    // الحصول على جميع الصلاحيات
    AuthManager.prototype.getPermissions = function() {
        return this.permissions;
    };
    
    // الحصول على المستخدم الحالي
    AuthManager.prototype.getCurrentUser = function() {
        return this.currentUser;
    };
    
    // الحصول على الرمز
    AuthManager.prototype.getToken = function() {
        return localStorage.getItem(this.tokenKey);
    };
    
    // حماية الطرق (للإدارة فقط)
    AuthManager.prototype.protectRoute = function() {
        if (!this.isAuthenticated()) {
            return false;
        }
        return true;
    };
    
    // تعريف الكائن عمومياً
    window.AuthManager = new AuthManager();
})();