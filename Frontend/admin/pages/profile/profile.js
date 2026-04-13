// 📁 المسار: Frontend/admin/pages/profile/profile.js
// ===== صفحة الملف الشخصي - نظام إدارة العقارات =====
// تم التحديث لإضافة عرض التقييم الإجمالي والمهام والجزاءات مع تقييماتها
// إضافة نظام ترجمة (i18n) كامل يدعم العربية والإنجليزية
// تحديث: المستخدم العادي يمكنه تعديل البريد الإلكتروني ورقم الهاتف فقط، أما الاسم والدور والقسم فللمشرف العام فقط

(function() {
    'use strict';
    
    console.log('✅ profile.js loaded - USER PROFILE MANAGEMENT with ratings, tasks, penalties and i18n');

    // ========== نظام الترجمة (i18n) ==========
    const translations = {
        ar: {
            // عام
            appName: "الملف الشخصي | نظام إدارة العقارات",
            loading: "جاري التحميل...",
            save: "حفظ",
            cancel: "إلغاء",
            close: "إغلاق",
            edit: "تعديل",
            delete: "حذف",
            refresh: "تحديث",
            back: "رجوع",
            send: "إرسال",
            search: "بحث",
            // عناوين الصفحة
            pageTitle: "الملف الشخصي",
            pageDescription: "إدارة معلومات حسابك الشخصية وتحديث كلمة المرور وعرض التقييمات والجزاءات والمهام",
            // معلومات الحساب
            accountInfo: "معلومات الحساب",
            username: "اسم المستخدم",
            joinDate: "تاريخ التسجيل",
            lastLogin: "آخر تسجيل دخول",
            accountStatus: "حالة الحساب",
            active: "نشط",
            inactive: "غير نشط",
            // التقييم الإجمالي
            myOverallRating: "الإجمالي تقييمي",
            outOfTen: "من 10",
            noRatings: "لا توجد تقييمات",
            ratingCount: "تقييم",
            // الجزاءات
            penalties: "الجزاءات",
            financialPenalty: "جزاء مالي (خصم)",
            nonFinancialPenalty: "جزاء غير مالي",
            penaltyPercentage: "نسبة الخصم",
            penaltyReason: "السبب",
            penaltyDate: "تاريخ الإصدار",
            penaltyResolvedDate: "تاريخ الحل",
            penaltyStatus: "الحالة",
            statusActivePenalty: "نشط",
            statusResolved: "تم الحل",
            statusCancelled: "ملغي",
            noPenalties: "لا توجد جزاءات مسجلة",
            // المعلومات الشخصية
            personalInfo: "المعلومات الشخصية",
            fullName: "الاسم الكامل",
            email: "البريد الإلكتروني",
            phone: "رقم الهاتف",
            department: "القسم",
            role: "الدور الوظيفي",
            requiredField: "مطلوب",
            saveChanges: "حفظ التغييرات",
            // تغيير كلمة المرور
            changePassword: "تغيير كلمة المرور",
            currentPassword: "كلمة المرور الحالية",
            newPassword: "كلمة المرور الجديدة",
            confirmPassword: "تأكيد كلمة المرور",
            passwordRequirements: "متطلبات كلمة المرور:",
            minLength: "٨ أحرف على الأقل",
            uppercase: "حرف كبير واحد على الأقل",
            lowercase: "حرف صغير واحد على الأقل",
            number: "رقم واحد على الأقل",
            specialChar: "رمز خاص واحد على الأقل",
            passwordStrength: "قوة كلمة المرور:",
            weak: "ضعيفة",
            medium: "متوسطة",
            strong: "قوية",
            veryWeak: "ضعيفة جداً",
            veryStrong: "قوية جداً",
            // المهام
            myTasksAndRatings: "مهامي وتقييماتها",
            noTasks: "لا توجد مهام لعرضها",
            taskStatus: "الحالة",
            taskPriority: "الأولوية",
            taskDueDate: "تاريخ الاستحقاق",
            taskCompletionDate: "تاريخ الإنجاز",
            taskProgress: "التقدم",
            taskDescription: "الوصف",
            notSpecified: "غير محدد",
            notRated: "لم يتم تقييم هذه المهمة بعد",
            ratingFinal: "الدرجة النهائية",
            ratingQuality: "جودة العمل",
            ratingTime: "الوقت المستغرق",
            ratingDifficulty: "وزن الصعوبة",
            ratingNotes: "ملاحظات التقييم",
            ratingDate: "تاريخ التقييم",
            viewDetails: "عرض التفاصيل",
            // حالات المهام
            statusTodo: "معلقة",
            statusInProgress: "قيد التنفيذ",
            statusReview: "مراجعة",
            statusDone: "مكتملة",
            statusArchived: "مؤرشفة",
            // الأولويات
            priorityUrgent: "عاجل",
            priorityHigh: "مرتفعة",
            priorityMedium: "متوسطة",
            priorityLow: "منخفضة",
            // الإشعارات
            success: "تم بنجاح",
            error: "خطأ",
            warning: "تنبيه",
            info: "معلومة",
            profileSaved: "تم حفظ التغييرات بنجاح",
            profileSaveFailed: "فشل في حفظ التغييرات",
            passwordChanged: "تم تغيير كلمة المرور بنجاح",
            passwordChangeFailed: "فشل في تغيير كلمة المرور",
            pictureChanged: "تم تغيير الصورة الشخصية بنجاح",
            pictureChangeFailed: "فشل في تغيير الصورة الشخصية",
            tasksRefreshed: "تم تحديث قائمة المهام",
            penaltiesRefreshed: "تم تحديث قائمة الجزاءات",
            fillRequiredFields: "يرجى ملء جميع الحقول المطلوبة",
            passwordsDoNotMatch: "كلمات المرور غير متطابقة",
            passwordMinLength: "كلمة المرور يجب أن تكون 8 أحرف على الأقل",
            selectImage: "يرجى اختيار صورة فقط",
            imageMaxSize: "حجم الصورة يجب أن يكون أقل من 10MB",
            // الفلاتر
            filterByStatus: "تصفية حسب الحالة",
            filterByRating: "تصفية حسب التقييم",
            all: "الكل",
            rated: "تم تقييمها",
            unrated: "غير مقيمة",
            // أزرار
            changePicture: "تغيير الصورة",
            refreshTasks: "تحديث",
            refreshPenalties: "تحديث",
            // دور الوظيفي
            roleSupervisor: "مشرف عام",
            roleProjectManager: "مدير مشاريع",
            roleAccountant: "محاسب",
            roleReceptionist: "موظف استقبال",
            roleCustomerService: "خدمة عملاء",
            roleSales: "مبيعات",
            roleHR: "موارد بشرية",
            roleEmployee: "موظف",
            // ملاحظات الصلاحيات
            roleEditNote: "يمكنك تعديل الدور الوظيفي لأنك مشرف عام",
            roleEditDisabled: "لا يمكن تعديل الدور الوظيفي (متاح فقط للمشرف العام)",
            deptEditNote: "يمكنك تعديل القسم لأنك مشرف عام",
            deptEditDisabled: "لا يمكن تعديل القسم (متاح فقط للمشرف العام)",
            nameEditNote: "يمكنك تعديل الاسم الكامل لأنك مشرف عام",
            nameEditDisabled: "لا يمكن تعديل الاسم الكامل (متاح فقط للمشرف العام)",
            emailEditEnabled: "يمكنك تعديل البريد الإلكتروني",
            phoneEditEnabled: "يمكنك تعديل رقم الهاتف",
            // نظام الوقت
            now: "الآن",
            minutesAgo: "دقيقة",
            hoursAgo: "ساعة",
            yesterday: "أمس",
            daysAgo: "يوم",
            // رسائل فارغة
            noDescription: "لا يوجد وصف",
            unknown: "غير معروف"
        },
        en: {
            // General
            appName: "Profile | Real Estate Management System",
            loading: "Loading...",
            save: "Save",
            cancel: "Cancel",
            close: "Close",
            edit: "Edit",
            delete: "Delete",
            refresh: "Refresh",
            back: "Back",
            send: "Send",
            search: "Search",
            // Page titles
            pageTitle: "Profile",
            pageDescription: "Manage your personal account information, update password, and view ratings, penalties and tasks",
            // Account info
            accountInfo: "Account Information",
            username: "Username",
            joinDate: "Join Date",
            lastLogin: "Last Login",
            accountStatus: "Account Status",
            active: "Active",
            inactive: "Inactive",
            // Overall rating
            myOverallRating: "My Overall Rating",
            outOfTen: "out of 10",
            noRatings: "No ratings",
            ratingCount: "rating",
            // Penalties
            penalties: "Penalties",
            financialPenalty: "Financial Penalty (Deduction)",
            nonFinancialPenalty: "Non-Financial Penalty",
            penaltyPercentage: "Deduction Percentage",
            penaltyReason: "Reason",
            penaltyDate: "Issue Date",
            penaltyResolvedDate: "Resolved Date",
            penaltyStatus: "Status",
            statusActivePenalty: "Active",
            statusResolved: "Resolved",
            statusCancelled: "Cancelled",
            noPenalties: "No penalties recorded",
            // Personal info
            personalInfo: "Personal Information",
            fullName: "Full Name",
            email: "Email",
            phone: "Phone Number",
            department: "Department",
            role: "Role",
            requiredField: "Required",
            saveChanges: "Save Changes",
            // Change password
            changePassword: "Change Password",
            currentPassword: "Current Password",
            newPassword: "New Password",
            confirmPassword: "Confirm Password",
            passwordRequirements: "Password Requirements:",
            minLength: "At least 8 characters",
            uppercase: "At least one uppercase letter",
            lowercase: "At least one lowercase letter",
            number: "At least one number",
            specialChar: "At least one special character",
            passwordStrength: "Password Strength:",
            weak: "Weak",
            medium: "Medium",
            strong: "Strong",
            veryWeak: "Very Weak",
            veryStrong: "Very Strong",
            // Tasks
            myTasksAndRatings: "My Tasks & Ratings",
            noTasks: "No tasks to display",
            taskStatus: "Status",
            taskPriority: "Priority",
            taskDueDate: "Due Date",
            taskCompletionDate: "Completion Date",
            taskProgress: "Progress",
            taskDescription: "Description",
            notSpecified: "Not specified",
            notRated: "This task has not been rated yet",
            ratingFinal: "Final Score",
            ratingQuality: "Work Quality",
            ratingTime: "Time Taken",
            ratingDifficulty: "Difficulty Weight",
            ratingNotes: "Rating Notes",
            ratingDate: "Rating Date",
            viewDetails: "View Details",
            // Task statuses
            statusTodo: "To Do",
            statusInProgress: "In Progress",
            statusReview: "Review",
            statusDone: "Done",
            statusArchived: "Archived",
            // Priorities
            priorityUrgent: "Urgent",
            priorityHigh: "High",
            priorityMedium: "Medium",
            priorityLow: "Low",
            // Notifications
            success: "Success",
            error: "Error",
            warning: "Warning",
            info: "Info",
            profileSaved: "Changes saved successfully",
            profileSaveFailed: "Failed to save changes",
            passwordChanged: "Password changed successfully",
            passwordChangeFailed: "Failed to change password",
            pictureChanged: "Profile picture changed successfully",
            pictureChangeFailed: "Failed to change profile picture",
            tasksRefreshed: "Task list refreshed",
            penaltiesRefreshed: "Penalties list refreshed",
            fillRequiredFields: "Please fill all required fields",
            passwordsDoNotMatch: "Passwords do not match",
            passwordMinLength: "Password must be at least 8 characters",
            selectImage: "Please select an image file only",
            imageMaxSize: "Image size must be less than 10MB",
            // Filters
            filterByStatus: "Filter by Status",
            filterByRating: "Filter by Rating",
            all: "All",
            rated: "Rated",
            unrated: "Unrated",
            // Buttons
            changePicture: "Change Picture",
            refreshTasks: "Refresh",
            refreshPenalties: "Refresh",
            // Roles
            roleSupervisor: "Supervisor",
            roleProjectManager: "Project Manager",
            roleAccountant: "Accountant",
            roleReceptionist: "Receptionist",
            roleCustomerService: "Customer Service",
            roleSales: "Sales",
            roleHR: "HR",
            roleEmployee: "Employee",
            // Permission notes
            roleEditNote: "You can edit the role because you are a supervisor",
            roleEditDisabled: "Role editing is only available for supervisors",
            deptEditNote: "You can edit the department because you are a supervisor",
            deptEditDisabled: "Department editing is only available for supervisors",
            nameEditNote: "You can edit the full name because you are a supervisor",
            nameEditDisabled: "Full name editing is only available for supervisors",
            emailEditEnabled: "You can edit the email",
            phoneEditEnabled: "You can edit the phone number",
            // Time system
            now: "Now",
            minutesAgo: "minute(s) ago",
            hoursAgo: "hour(s) ago",
            yesterday: "Yesterday",
            daysAgo: "day(s) ago",
            // Empty messages
            noDescription: "No description",
            unknown: "Unknown"
        }
    };

    let currentLang = 'ar';

    function getCurrentLanguage() {
        try {
            const taskflowLang = localStorage.getItem('taskflow_lang');
            if (taskflowLang && (taskflowLang === 'ar' || taskflowLang === 'en')) {
                return taskflowLang;
            }
            const userData = localStorage.getItem('user_data');
            if (userData) {
                const user = JSON.parse(userData);
                if (user.language && (user.language === 'ar' || user.language === 'en')) {
                    return user.language;
                }
            }
            const appLang = localStorage.getItem('app_lang');
            if (appLang && (appLang === 'ar' || appLang === 'en')) {
                return appLang;
            }
        } catch(e) {}
        return 'ar';
    }

    function setLanguage(lang) {
        if (lang !== 'ar' && lang !== 'en') return;
        currentLang = lang;
        localStorage.setItem('taskflow_lang', lang);
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        translatePage();
    }

    function translatePage() {
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[currentLang][key]) {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    if (el.hasAttribute('placeholder')) {
                        el.setAttribute('placeholder', translations[currentLang][key]);
                    } else {
                        el.value = translations[currentLang][key];
                    }
                } else {
                    el.textContent = translations[currentLang][key];
                }
            }
        });

        const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
        placeholders.forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (translations[currentLang][key]) {
                el.setAttribute('placeholder', translations[currentLang][key]);
            }
        });

        const pageTitle = document.querySelector('.page-title');
        if (pageTitle) {
            const iconSpan = pageTitle.querySelector('.page-title-icon');
            if (iconSpan) {
                pageTitle.innerHTML = `<i class="fas fa-user-circle page-title-icon"></i> ${translations[currentLang].pageTitle}`;
            } else {
                pageTitle.textContent = translations[currentLang].pageTitle;
            }
        }
        const pageDesc = document.querySelector('.page-description');
        if (pageDesc) pageDesc.textContent = translations[currentLang].pageDescription;

        const accountInfoTitle = document.querySelector('.profile-info-section .profile-section-title');
        if (accountInfoTitle) {
            accountInfoTitle.innerHTML = `<i class="fas fa-id-card"></i> ${translations[currentLang].accountInfo}`;
        }
        const infoLabels = document.querySelectorAll('.profile-info-label');
        if (infoLabels.length >= 4) {
            infoLabels[0].innerHTML = `<i class="fas fa-user-tag"></i> ${translations[currentLang].username}:`;
            infoLabels[1].innerHTML = `<i class="fas fa-calendar-alt"></i> ${translations[currentLang].joinDate}:`;
            infoLabels[2].innerHTML = `<i class="fas fa-sign-in-alt"></i> ${translations[currentLang].lastLogin}:`;
            infoLabels[3].innerHTML = `<i class="fas fa-history"></i> ${translations[currentLang].accountStatus}:`;
        }
        const statusValue = document.querySelector('.profile-info-value.status-active');
        if (statusValue) {
            statusValue.innerHTML = `<i class="fas fa-check-circle"></i> ${translations[currentLang].active}`;
        }

        const ratingCardTitle = document.querySelector('#profile-rating-card .card-title');
        if (ratingCardTitle) {
            ratingCardTitle.innerHTML = `<i class="fas fa-star rating-card-icon"></i> ${translations[currentLang].myOverallRating}`;
        }
        const ratingMax = document.querySelector('.rating-max');
        if (ratingMax) ratingMax.textContent = translations[currentLang].outOfTen;

        const personalInfoTitle = document.querySelector('.profile-forms .main-content-card:first-child .card-title');
        if (personalInfoTitle) {
            personalInfoTitle.innerHTML = `<i class="fas fa-user-edit card-title-icon"></i> ${translations[currentLang].personalInfo}`;
        }
        const fullNameLabel = document.querySelector('label[for="fullName"]');
        if (fullNameLabel) fullNameLabel.innerHTML = `${translations[currentLang].fullName} *`;
        const emailLabel = document.querySelector('label[for="email"]');
        if (emailLabel) emailLabel.innerHTML = `${translations[currentLang].email} *`;
        const phoneLabel = document.querySelector('label[for="phone"]');
        if (phoneLabel) phoneLabel.textContent = translations[currentLang].phone;
        const deptLabel = document.querySelector('label[for="department"]');
        if (deptLabel) deptLabel.textContent = translations[currentLang].department;
        const roleLabel = document.querySelector('label[for="role"]');
        if (roleLabel) roleLabel.textContent = translations[currentLang].role;
        const saveBtn = document.querySelector('#save-profile-btn');
        if (saveBtn) {
            saveBtn.innerHTML = `<i class="fas fa-save"></i> <span>${translations[currentLang].saveChanges}</span>`;
        }

        const passwordTitle = document.querySelector('.profile-forms .main-content-card:nth-child(2) .card-title');
        if (passwordTitle) {
            passwordTitle.innerHTML = `<i class="fas fa-key card-title-icon"></i> ${translations[currentLang].changePassword}`;
        }
        const currentPwLabel = document.querySelector('label[for="current-password"]');
        if (currentPwLabel) currentPwLabel.textContent = `${translations[currentLang].currentPassword} *`;
        const newPwLabel = document.querySelector('label[for="new-password"]');
        if (newPwLabel) newPwLabel.textContent = `${translations[currentLang].newPassword} *`;
        const confirmPwLabel = document.querySelector('label[for="confirm-password"]');
        if (confirmPwLabel) confirmPwLabel.textContent = `${translations[currentLang].confirmPassword} *`;
        const requirementsTitle = document.querySelector('.password-requirements h6');
        if (requirementsTitle) requirementsTitle.textContent = translations[currentLang].passwordRequirements;
        const requirementItems = document.querySelectorAll('.requirement span');
        if (requirementItems.length >= 5) {
            requirementItems[0].textContent = translations[currentLang].minLength;
            requirementItems[1].textContent = translations[currentLang].uppercase;
            requirementItems[2].textContent = translations[currentLang].lowercase;
            requirementItems[3].textContent = translations[currentLang].number;
            requirementItems[4].textContent = translations[currentLang].specialChar;
        }
        const changePwBtn = document.querySelector('#change-password-btn');
        if (changePwBtn) {
            changePwBtn.innerHTML = `<i class="fas fa-key"></i> ${translations[currentLang].changePassword}`;
        }

        const penaltiesTitle = document.querySelector('.penalties-card .card-title');
        if (penaltiesTitle) {
            penaltiesTitle.innerHTML = `<i class="fas fa-gavel card-title-icon"></i> ${translations[currentLang].penalties}`;
        }
        const refreshPenaltiesBtn = document.querySelector('#refresh-penalties-btn');
        if (refreshPenaltiesBtn) {
            refreshPenaltiesBtn.innerHTML = `<i class="fas fa-sync-alt"></i> ${translations[currentLang].refreshPenalties}`;
        }

        const tasksTitle = document.querySelector('.tasks-ratings-card .card-title');
        if (tasksTitle) {
            tasksTitle.innerHTML = `<i class="fas fa-tasks card-title-icon"></i> ${translations[currentLang].myTasksAndRatings}`;
        }
        const refreshTasksBtn = document.querySelector('#refresh-tasks-btn');
        if (refreshTasksBtn) {
            refreshTasksBtn.innerHTML = `<i class="fas fa-sync-alt"></i> ${translations[currentLang].refreshTasks}`;
        }

        const statusFilterLabel = document.querySelector('label[for="task-status-filter"]');
        if (statusFilterLabel) statusFilterLabel.textContent = translations[currentLang].filterByStatus;
        const ratingFilterLabel = document.querySelector('label[for="task-rating-filter"]');
        if (ratingFilterLabel) ratingFilterLabel.textContent = translations[currentLang].filterByRating;

        const footerCopyright = document.querySelector('.footer-copyright p:first-child');
        if (footerCopyright) footerCopyright.textContent = `© 2024 ${translations[currentLang].appName.split('|')[1] || 'Real Estate Management System'}. ${translations[currentLang].allRightsReserved || 'All rights reserved.'}`;
        const helpLink = document.querySelector('.footer-links a:nth-child(1)');
        if (helpLink) helpLink.textContent = translations[currentLang].help || 'Help';
        const supportLink = document.querySelector('.footer-links a:nth-child(2)');
        if (supportLink) supportLink.textContent = translations[currentLang].technicalSupport || 'Support';
    }

    class ProfileManager {
        constructor() {
            this.baseURL = '/api';
            this.apiClient = null;
            this.currentUser = null;
            this.userProfile = null;
            this.userRating = null;
            this.userTasks = [];
            this.filteredTasks = [];
            this.userPenalties = [];
            this.currentLang = getCurrentLanguage();
            setLanguage(this.currentLang);
            this.init();
        }

        getCurrentUserFromStorage() {
            try {
                const userData = localStorage.getItem('user_data');
                if (userData) {
                    const user = JSON.parse(userData);
                    if (user && user.id) {
                        console.log('📌 Retrieved user from user_data:', user.id);
                        return user;
                    }
                }
                const currUser = localStorage.getItem('currentUser');
                if (currUser) {
                    const user = JSON.parse(currUser);
                    if (user && user.id) {
                        console.log('📌 Retrieved user from currentUser:', user.id);
                        return user;
                    }
                }
                if (window.AuthManager && typeof window.AuthManager.getCurrentUser === 'function') {
                    const user = window.AuthManager.getCurrentUser();
                    if (user && user.id) return user;
                }
                console.warn('⚠️ No user data found in storage');
                return null;
            } catch (error) {
                console.error('❌ Error reading user from storage:', error);
                return null;
            }
        }

        createApiClient() {
            const token = this.getAuthToken();
            return {
                request: async (endpoint, options = {}) => {
                    const url = `${this.baseURL}${endpoint}`;
                    const headers = {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    };
                    if (token) {
                        headers['Authorization'] = `Bearer ${token}`;
                    }

                    const config = {
                        method: options.method || 'GET',
                        headers,
                        mode: 'cors',
                        credentials: 'omit'
                    };
                    if (options.body) {
                        config.body = options.body;
                    }

                    console.log(`🌐 API Request: ${config.method} ${url}`);
                    
                    try {
                        const response = await fetch(url, config);
                        const data = await response.json();
                        if (!response.ok) {
                            throw new Error(data.message || `HTTP error ${response.status}`);
                        }
                        return data;
                    } catch (error) {
                        console.error('❌ API Error:', error.message);
                        throw error;
                    }
                }
            };
        }

        getAuthToken() {
            try {
                let token = localStorage.getItem('auth_token');
                if (token && token !== 'undefined' && token !== 'null') {
                    return token;
                }
                const user = this.getCurrentUserFromStorage();
                if (user && user.token && user.token !== 'undefined') {
                    return user.token;
                }
                return null;
            } catch(e) {
                return null;
            }
        }
        
        async init() {
            console.log('🚀 ProfileManager initializing...');
            await this.setupPage();
        }
        
        async setupPage() {
            console.log('🔧 Setting up profile page with real API...');
            
            await this.checkAuth();
            await this.loadProfileData();
            await this.loadUserRating();
            await this.loadUserTasks();
            await this.loadUserPenalties();
            
            this.setupUI();
            this.updateUIWithProfileData();
            this.updateRatingUI();
            this.renderTasksList();
            this.renderPenaltiesList();
            this.applyEditPermissions();
            this.setupTasksFilters();
            this.setupMobileEnhancements();
            this.translatePageContent();
        }
        
        translatePageContent() {
            translatePage();
        }

        async checkAuth() {
            try {
                const user = this.getCurrentUserFromStorage();
                if (user && user.id) {
                    this.currentUser = user;
                } else {
                    console.warn('⚠️ No user found, redirecting to login...');
                    window.location.href = '../login/index.html';
                    return;
                }
                this.updateUserInfo();
                console.log('✅ Authenticated user ID:', this.currentUser.id);
            } catch (error) {
                console.error('❌ Authentication error:', error);
                this.currentUser = null;
            }
        }
        
        updateUserInfo() {
            const userNameElement = document.getElementById('current-user-name');
            const userRoleElement = document.getElementById('current-user-role');
            
            if (userNameElement && this.currentUser) {
                userNameElement.textContent = this.currentUser.fullName || this.currentUser.username || translations[currentLang].unknown;
            }
            
            if (userRoleElement && this.currentUser) {
                const roleMap = {
                    'مشرف_عام': translations[currentLang].roleSupervisor,
                    'مدير_مشاريع': translations[currentLang].roleProjectManager,
                    'محاسب': translations[currentLang].roleAccountant,
                    'موظف_استقبال': translations[currentLang].roleReceptionist,
                    'خدمة_عملاء': translations[currentLang].roleCustomerService,
                    'مبيعات': translations[currentLang].roleSales,
                    'موارد_بشرية': translations[currentLang].roleHR,
                    'موظف': translations[currentLang].roleEmployee
                };
                userRoleElement.textContent = roleMap[this.currentUser.role] || this.currentUser.role;
            }
        }
        
        async loadProfileData() {
            try {
                if (!this.currentUser || !this.currentUser.id) {
                    throw new Error('لا يوجد مستخدم مسجل الدخول');
                }
                
                console.log(`📥 Loading profile data for user ID: ${this.currentUser.id}`);
                this.apiClient = this.createApiClient();
                
                const response = await this.apiClient.request(`/api/admin/profile/me?userId=${this.currentUser.id}`);
                
                if (response.success) {
                    this.userProfile = response.data;
                    console.log('✅ Loaded profile data from API');
                } else {
                    throw new Error(response.message || 'فشل تحميل البيانات');
                }
                
            } catch (error) {
                console.error('❌ Error loading profile data:', error);
                this.showNotification('error', translations[currentLang].error, translations[currentLang].profileSaveFailed);
                this.loadFallbackData();
            }
        }
        
        loadFallbackData() {
            console.log('🔄 Using fallback profile data...');
            this.userProfile = {
                id: this.currentUser?.id || 1,
                username: this.currentUser?.username || 'user',
                fullName: this.currentUser?.fullName || translations[currentLang].unknown,
                email: this.currentUser?.email || 'user@example.com',
                phone: this.currentUser?.phone || '',
                role: this.currentUser?.role || 'موظف',
                department: this.currentUser?.department || '',
                isActive: true,
                lastLogin: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                profileImage: null
            };
        }
        
        async loadUserRating() {
            try {
                console.log('📊 Loading user rating...');
                const response = await this.apiClient.request(`/api/admin/profile/me/rating?userId=${this.currentUser.id}`);
                if (response.success && response.data) {
                    this.userRating = response.data;
                    console.log('✅ Loaded rating:', this.userRating);
                } else {
                    this.userRating = { averageRating: null, totalRatings: 0 };
                }
            } catch (error) {
                console.error('❌ Error loading rating:', error);
                this.userRating = { averageRating: null, totalRatings: 0 };
            }
        }
        
        async loadUserTasks() {
            try {
                console.log('📋 Loading user tasks with ratings...');
                const response = await this.apiClient.request(`/api/admin/profile/me/tasks-with-ratings?userId=${this.currentUser.id}`);
                if (response.success && response.data) {
                    this.userTasks = response.data;
                    this.filteredTasks = [...this.userTasks];
                    console.log(`✅ Loaded ${this.userTasks.length} tasks`);
                } else {
                    this.userTasks = [];
                    this.filteredTasks = [];
                }
            } catch (error) {
                console.error('❌ Error loading tasks:', error);
                this.userTasks = [];
                this.filteredTasks = [];
            }
        }
        
        // ========== دوال الجزاءات الجديدة (مع التصحيح) ==========
        async loadUserPenalties() {
            try {
                console.log('⚠️ Loading user penalties...');
                const response = await this.apiClient.request(`/api/admin/profile/me/penalties?userId=${this.currentUser.id}`);
                if (response.success && response.data) {
                    this.userPenalties = response.data;
                    console.log(`✅ Loaded ${this.userPenalties.length} penalties`);
                } else {
                    this.userPenalties = [];
                }
            } catch (error) {
                console.error('❌ Error loading penalties:', error);
                this.userPenalties = [];
            }
        }
        
        renderPenaltiesList() {
            const container = document.getElementById('penalties-list-container');
            if (!container) return;
            
            if (this.userPenalties.length === 0) {
                container.innerHTML = `
                    <div class="empty-penalties">
                        <i class="fas fa-check-circle"></i>
                        <p>${translations[currentLang].noPenalties}</p>
                    </div>
                `;
                return;
            }
            
            let html = '';
            for (const penalty of this.userPenalties) {
                const isFinancial = penalty.type === 'financial';
                const typeClass = isFinancial ? 'type-financial' : 'type-non-financial';
                const typeIcon = isFinancial ? 'fa-percent' : 'fa-exclamation-triangle';
                const typeText = isFinancial ? translations[currentLang].financialPenalty : translations[currentLang].nonFinancialPenalty;
                
                let deductionHtml = '';
                if (isFinancial && penalty.percentage !== null && penalty.percentage !== undefined) {
                    deductionHtml = `<span class="penalty-amount"><i class="fas fa-percent"></i> ${penalty.percentage} ${translations[currentLang].penaltyPercentage}</span>`;
                }
                
                let statusClass = '';
                let statusText = '';
                if (penalty.status === 'active') {
                    statusClass = 'status-active-penalty';
                    statusText = translations[currentLang].statusActivePenalty;
                } else if (penalty.status === 'resolved') {
                    statusClass = 'status-resolved';
                    statusText = translations[currentLang].statusResolved;
                } else if (penalty.status === 'cancelled') {
                    statusClass = 'status-cancelled';
                    statusText = translations[currentLang].statusCancelled;
                } else {
                    statusClass = 'status-active-penalty';
                    statusText = penalty.status;
                }
                
                const issueDate = penalty.issuedAt ? this.formatDate(penalty.issuedAt) : '--';
                const resolvedDate = penalty.resolvedAt ? this.formatDate(penalty.resolvedAt) : '--';
                
                html += `
                    <div class="penalty-item">
                        <div class="penalty-header">
                            <div class="penalty-type-badge ${typeClass}">
                                <i class="fas ${typeIcon}"></i> ${typeText}
                            </div>
                            ${deductionHtml}
                            <span class="penalty-status-badge ${statusClass}">${statusText}</span>
                        </div>
                        <div class="penalty-body">
                            <div class="penalty-reason">
                                <i class="fas fa-comment-dots"></i> ${this.escapeHtml(penalty.reason)}
                            </div>
                            <div class="penalty-meta">
                                <div class="penalty-meta-item">
                                    <i class="fas fa-calendar-alt"></i> ${translations[currentLang].penaltyDate}: ${issueDate}
                                </div>
                                ${penalty.resolvedAt ? `<div class="penalty-meta-item"><i class="fas fa-check-circle"></i> ${translations[currentLang].penaltyResolvedDate}: ${resolvedDate}</div>` : ''}
                            </div>
                        </div>
                    </div>
                `;
            }
            
            container.innerHTML = html;
        }
        // ========== نهاية دوال الجزاءات ==========
        
        updateRatingUI() {
            const ratingValue = this.userRating?.averageRating;
            const totalRatings = this.userRating?.totalRatings || 0;
            
            const ratingNumberEl = document.getElementById('overall-rating-value');
            const ratingCountEl = document.getElementById('rating-count');
            const ratingStarsEl = document.getElementById('overall-rating-stars');
            
            if (ratingNumberEl) {
                if (ratingValue !== null && ratingValue !== undefined && !isNaN(ratingValue)) {
                    ratingNumberEl.textContent = ratingValue.toFixed(1);
                } else {
                    ratingNumberEl.textContent = '--';
                }
            }
            
            if (ratingCountEl) {
                const span = ratingCountEl.querySelector('span');
                if (span) {
                    if (totalRatings === 0) {
                        span.textContent = translations[currentLang].noRatings;
                    } else {
                        span.textContent = `${totalRatings} ${translations[currentLang].ratingCount}`;
                    }
                }
            }
            
            if (ratingStarsEl && ratingValue !== null && !isNaN(ratingValue)) {
                const fullStars = Math.floor(ratingValue / 2);
                const halfStar = (ratingValue % 2) >= 1;
                ratingStarsEl.innerHTML = '';
                for (let i = 0; i < 5; i++) {
                    if (i < fullStars) {
                        ratingStarsEl.innerHTML += '<i class="fas fa-star"></i>';
                    } else if (i === fullStars && halfStar) {
                        ratingStarsEl.innerHTML += '<i class="fas fa-star-half-alt"></i>';
                    } else {
                        ratingStarsEl.innerHTML += '<i class="far fa-star"></i>';
                    }
                }
            } else if (ratingStarsEl) {
                ratingStarsEl.innerHTML = '<i class="far fa-star"></i><i class="far fa-star"></i><i class="far fa-star"></i><i class="far fa-star"></i><i class="far fa-star"></i>';
            }
        }
        
        renderTasksList() {
            const container = document.getElementById('tasks-list-container');
            if (!container) return;
            
            if (this.filteredTasks.length === 0) {
                container.innerHTML = `
                    <div class="empty-tasks">
                        <i class="fas fa-clipboard-list"></i>
                        <p>${translations[currentLang].noTasks}</p>
                    </div>
                `;
                return;
            }
            
            let html = '';
            for (const task of this.filteredTasks) {
                const priorityClass = this.getPriorityClass(task.priority);
                const priorityText = this.getPriorityText(task.priority);
                const statusClass = this.getStatusClass(task.status);
                const statusText = this.getStatusText(task.status);
                const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString(currentLang === 'ar' ? 'ar-SA' : 'en-US') : translations[currentLang].notSpecified;
                const completedDate = task.completedAt ? new Date(task.completedAt).toLocaleDateString(currentLang === 'ar' ? 'ar-SA' : 'en-US') : '--';
                const progress = task.progress || 0;
                const hasRating = task.rating !== null;
                const ratingScore = hasRating ? task.rating.finalScore.toFixed(1) : null;
                const qualityScore = hasRating ? task.rating.qualityScore : null;
                const timeScore = hasRating ? task.rating.timeScore : null;
                const difficultyWeight = hasRating ? task.rating.difficultyWeight : null;
                
                html += `
                    <div class="task-item" data-task-id="${task.id}">
                        <div class="task-header">
                            <div class="task-title-section">
                                <span class="task-priority-badge ${priorityClass}">${priorityText}</span>
                                <span class="task-title">${this.escapeHtml(task.title)}</span>
                            </div>
                            <span class="task-status-badge ${statusClass}">${statusText}</span>
                        </div>
                        <div class="task-body">
                            <div class="task-description">
                                ${task.description ? this.escapeHtml(task.description.substring(0, 150)) + (task.description.length > 150 ? '...' : '') : translations[currentLang].noDescription}
                            </div>
                            <div class="task-meta">
                                <div class="task-meta-item">
                                    <i class="fas fa-calendar-alt"></i>
                                    <span>${translations[currentLang].taskDueDate}: ${dueDate}</span>
                                </div>
                                ${task.completedAt ? `
                                <div class="task-meta-item">
                                    <i class="fas fa-check-circle"></i>
                                    <span>${translations[currentLang].taskCompletionDate}: ${completedDate}</span>
                                </div>
                                ` : ''}
                                <div class="task-meta-item task-progress">
                                    <i class="fas fa-chart-simple"></i>
                                    <div class="progress-bar-wrapper">
                                        <div class="progress-bar-fill" style="width: ${progress}%"></div>
                                    </div>
                                    <span class="progress-text">${progress}%</span>
                                </div>
                            </div>
                        </div>
                        <div class="task-rating-section">
                            <div class="rating-info">
                                ${hasRating ? `
                                    <div class="rating-score">
                                        <i class="fas fa-star"></i>
                                        <span>${ratingScore}</span>
                                        <small>/10</small>
                                    </div>
                                    <div class="rating-details">
                                        <span><i class="fas fa-trophy"></i> ${translations[currentLang].ratingQuality}: ${qualityScore}/10</span>
                                        <span><i class="fas fa-clock"></i> ${translations[currentLang].ratingTime}: ${timeScore}</span>
                                        <span><i class="fas fa-weight-hanging"></i> ${translations[currentLang].ratingDifficulty}: ${difficultyWeight}</span>
                                    </div>
                                ` : `
                                    <div class="no-rating">
                                        <i class="fas fa-star-of-life"></i>
                                        ${translations[currentLang].notRated}
                                    </div>
                                `}
                            </div>
                        </div>
                    </div>
                `;
            }
            
            container.innerHTML = html;
            
            document.querySelectorAll('.view-task-link').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const taskId = e.currentTarget.dataset.taskId;
                    this.showTaskDetails(taskId);
                });
            });
        }
        
        showTaskDetails(taskId) {
            const task = this.userTasks.find(t => t.id == taskId);
            if (!task) return;
            
            const hasRating = task.rating !== null;
            const ratingScore = hasRating ? task.rating.finalScore.toFixed(1) : null;
            
            const modalHtml = `
                <div class="modal-overlay" id="task-detail-modal">
                    <div class="modal-container">
                        <div class="modal-header">
                            <h3>${this.escapeHtml(task.title)}</h3>
                            <button class="modal-close-btn" onclick="this.closest('.modal-overlay').remove()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <div class="task-detail-section">
                                <h4>${translations[currentLang].taskDescription}</h4>
                                <p>${task.description ? this.escapeHtml(task.description) : translations[currentLang].noDescription}</p>
                            </div>
                            <div class="task-detail-grid">
                                <div class="detail-item">
                                    <span class="detail-label">${translations[currentLang].taskStatus}:</span>
                                    <span class="detail-value ${this.getStatusClass(task.status)}">${this.getStatusText(task.status)}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">${translations[currentLang].taskPriority}:</span>
                                    <span class="detail-value ${this.getPriorityClass(task.priority)}">${this.getPriorityText(task.priority)}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">${translations[currentLang].taskProgress}:</span>
                                    <span class="detail-value">${task.progress || 0}%</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">${translations[currentLang].taskDueDate}:</span>
                                    <span class="detail-value">${task.dueDate ? new Date(task.dueDate).toLocaleDateString(currentLang === 'ar' ? 'ar-SA' : 'en-US') : translations[currentLang].notSpecified}</span>
                                </div>
                                ${task.completedAt ? `
                                <div class="detail-item">
                                    <span class="detail-label">${translations[currentLang].taskCompletionDate}:</span>
                                    <span class="detail-value">${new Date(task.completedAt).toLocaleDateString(currentLang === 'ar' ? 'ar-SA' : 'en-US')}</span>
                                </div>
                                ` : ''}
                                <div class="detail-item">
                                    <span class="detail-label">${translations[currentLang].joinDate}:</span>
                                    <span class="detail-value">${new Date(task.createdAt).toLocaleDateString(currentLang === 'ar' ? 'ar-SA' : 'en-US')}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">${translations[currentLang].assigneeCount || 'عدد المنفذين'}:</span>
                                    <span class="detail-value">${task.assigneeCount || 1}</span>
                                </div>
                            </div>
                            ${hasRating ? `
                            <div class="task-detail-section rating-detail-section">
                                <h4><i class="fas fa-star" style="color: #FFD700;"></i> ${translations[currentLang].myOverallRating}</h4>
                                <div class="rating-detail-grid">
                                    <div class="rating-detail-item">
                                        <span class="rating-detail-label">${translations[currentLang].ratingFinal}:</span>
                                        <span class="rating-detail-value">${ratingScore} / 10</span>
                                    </div>
                                    <div class="rating-detail-item">
                                        <span class="rating-detail-label">${translations[currentLang].ratingQuality}:</span>
                                        <span class="rating-detail-value">${task.rating.qualityScore} / 10</span>
                                    </div>
                                    <div class="rating-detail-item">
                                        <span class="rating-detail-label">${translations[currentLang].ratingTime}:</span>
                                        <span class="rating-detail-value">${task.rating.timeScore}</span>
                                    </div>
                                    <div class="rating-detail-item">
                                        <span class="rating-detail-label">${translations[currentLang].ratingDifficulty}:</span>
                                        <span class="rating-detail-value">${task.rating.difficultyWeight}</span>
                                    </div>
                                    <div class="rating-detail-item full-width">
                                        <span class="rating-detail-label">${translations[currentLang].ratingNotes}:</span>
                                        <span class="rating-detail-value">${task.rating.notes ? this.escapeHtml(task.rating.notes) : '—'}</span>
                                    </div>
                                    <div class="rating-detail-item">
                                        <span class="rating-detail-label">${translations[currentLang].ratingDate}:</span>
                                        <span class="rating-detail-value">${new Date(task.rating.ratedAt).toLocaleDateString(currentLang === 'ar' ? 'ar-SA' : 'en-US')}</span>
                                    </div>
                                </div>
                            </div>
                            ` : `
                            <div class="task-detail-section no-rating-section">
                                <i class="fas fa-star-of-life"></i>
                                <p>${translations[currentLang].notRated}</p>
                            </div>
                            `}
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">${translations[currentLang].close}</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            const modal = document.getElementById('task-detail-modal');
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.remove();
            });
        }
        
        getPriorityClass(priority) {
            const map = {
                'urgent': 'priority-urgent',
                'high': 'priority-high',
                'medium': 'priority-medium',
                'low': 'priority-low'
            };
            return map[priority] || 'priority-medium';
        }
        
        getPriorityText(priority) {
            const map = {
                'urgent': translations[currentLang].priorityUrgent,
                'high': translations[currentLang].priorityHigh,
                'medium': translations[currentLang].priorityMedium,
                'low': translations[currentLang].priorityLow
            };
            return map[priority] || priority;
        }
        
        getStatusClass(status) {
            const map = {
                'todo': 'status-todo',
                'in-progress': 'status-in-progress',
                'review': 'status-review',
                'done': 'status-done',
                'archived': 'status-archived'
            };
            return map[status] || 'status-todo';
        }
        
        getStatusText(status) {
            const map = {
                'todo': translations[currentLang].statusTodo,
                'in-progress': translations[currentLang].statusInProgress,
                'review': translations[currentLang].statusReview,
                'done': translations[currentLang].statusDone,
                'archived': translations[currentLang].statusArchived
            };
            return map[status] || status;
        }
        
        setupTasksFilters() {
            const statusFilter = document.getElementById('task-status-filter');
            const ratingFilter = document.getElementById('task-rating-filter');
            const refreshBtn = document.getElementById('refresh-tasks-btn');
            
            if (statusFilter) {
                statusFilter.addEventListener('change', () => this.applyFilters());
            }
            if (ratingFilter) {
                ratingFilter.addEventListener('change', () => this.applyFilters());
            }
            if (refreshBtn) {
                refreshBtn.addEventListener('click', async () => {
                    await this.loadUserTasks();
                    this.applyFilters();
                    this.showNotification('success', translations[currentLang].success, translations[currentLang].tasksRefreshed);
                });
            }
        }
        
        applyFilters() {
            const statusFilter = document.getElementById('task-status-filter')?.value || 'all';
            const ratingFilter = document.getElementById('task-rating-filter')?.value || 'all';
            
            this.filteredTasks = this.userTasks.filter(task => {
                if (statusFilter !== 'all' && task.status !== statusFilter) return false;
                if (ratingFilter === 'rated' && task.rating === null) return false;
                if (ratingFilter === 'unrated' && task.rating !== null) return false;
                return true;
            });
            
            this.renderTasksList();
        }
        
        updateUIWithProfileData() {
            if (!this.userProfile) return;
            
            document.getElementById('info-username').textContent = this.userProfile.username || '--';
            document.getElementById('info-join-date').textContent = this.formatDate(this.userProfile.createdAt);
            document.getElementById('info-last-login').textContent = this.formatRelativeTime(this.userProfile.lastLogin);
            
            document.getElementById('fullName').value = this.userProfile.fullName || '';
            document.getElementById('email').value = this.userProfile.email || '';
            document.getElementById('phone').value = this.userProfile.phone || '';
            
            const departmentInput = document.getElementById('department');
            if (departmentInput) {
                departmentInput.value = this.userProfile.department || '';
            }
            
            const roleSelect = document.getElementById('role');
            if (roleSelect) {
                roleSelect.value = this.userProfile.role || '';
            }
            
            if (this.userProfile.profileImage) {
                const profilePicture = document.getElementById('profile-picture');
                profilePicture.innerHTML = `<img src="${this.baseURL}${this.userProfile.profileImage}" alt="${translations[currentLang].profilePictureAlt || 'Profile Picture'}">`;
            }
        }
        
        applyEditPermissions() {
            const isSupervisor = (this.currentUser?.role === 'مشرف_عام');
            
            const fullNameInput = document.getElementById('fullName');
            const emailInput = document.getElementById('email');
            const phoneInput = document.getElementById('phone');
            const roleSelect = document.getElementById('role');
            const departmentInput = document.getElementById('department');
            
            const nameNote = document.getElementById('name-edit-note');
            const emailNote = document.getElementById('email-edit-note');
            const phoneNote = document.getElementById('phone-edit-note');
            const roleNote = document.getElementById('role-edit-note');
            const deptNote = document.getElementById('department-edit-note');
            
            if (!isSupervisor) {
                if (fullNameInput) {
                    fullNameInput.disabled = true;
                    fullNameInput.title = translations[currentLang].nameEditDisabled;
                    if (nameNote) nameNote.textContent = translations[currentLang].nameEditDisabled;
                }
                if (roleSelect) {
                    roleSelect.disabled = true;
                    roleSelect.title = translations[currentLang].roleEditDisabled;
                    if (roleNote) roleNote.textContent = translations[currentLang].roleEditDisabled;
                }
                if (departmentInput) {
                    departmentInput.disabled = true;
                    departmentInput.title = translations[currentLang].deptEditDisabled;
                    if (deptNote) deptNote.textContent = translations[currentLang].deptEditDisabled;
                }
                if (emailInput) {
                    emailInput.disabled = false;
                    if (emailNote) emailNote.textContent = translations[currentLang].emailEditEnabled;
                }
                if (phoneInput) {
                    phoneInput.disabled = false;
                    if (phoneNote) phoneNote.textContent = translations[currentLang].phoneEditEnabled;
                }
            } else {
                if (fullNameInput) {
                    fullNameInput.disabled = false;
                    if (nameNote) nameNote.textContent = translations[currentLang].nameEditNote;
                }
                if (emailInput) {
                    emailInput.disabled = false;
                    if (emailNote) emailNote.textContent = '';
                }
                if (phoneInput) {
                    phoneInput.disabled = false;
                    if (phoneNote) phoneNote.textContent = '';
                }
                if (roleSelect) {
                    roleSelect.disabled = false;
                    if (roleNote) roleNote.textContent = translations[currentLang].roleEditNote;
                }
                if (departmentInput) {
                    departmentInput.disabled = false;
                    if (deptNote) deptNote.textContent = translations[currentLang].deptEditNote;
                }
            }
        }
        
        setupUI() {
            this.setupDropdowns();
            this.setupProfilePicture();
            this.setupPasswordChange();
            this.setupForms();
            this.setupPenaltiesRefresh();
        }
        
        setupPenaltiesRefresh() {
            const refreshPenaltiesBtn = document.getElementById('refresh-penalties-btn');
            if (refreshPenaltiesBtn) {
                refreshPenaltiesBtn.addEventListener('click', async () => {
                    await this.loadUserPenalties();
                    this.renderPenaltiesList();
                    this.showNotification('success', translations[currentLang].success, translations[currentLang].penaltiesRefreshed);
                });
            }
        }
        
        setupDropdowns() {
            const userBtn = document.getElementById('user-profile-btn');
            const userDropdown = document.getElementById('user-dropdown');
            
            if (userBtn && userDropdown) {
                userBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    userDropdown.classList.toggle('show');
                    
                    const closeDropdown = (event) => {
                        if (!userBtn.contains(event.target) && !userDropdown.contains(event.target)) {
                            userDropdown.classList.remove('show');
                            document.removeEventListener('click', closeDropdown);
                        }
                    };
                    
                    if (userDropdown.classList.contains('show')) {
                        setTimeout(() => document.addEventListener('click', closeDropdown), 10);
                    }
                });
            }
        }
        
        setupProfilePicture() {
            const changePictureBtn = document.getElementById('change-picture-btn');
            const pictureInput = document.getElementById('picture-input');
            
            if (changePictureBtn && pictureInput) {
                changePictureBtn.addEventListener('click', () => {
                    pictureInput.click();
                });
                
                pictureInput.addEventListener('change', (e) => {
                    this.handleProfilePictureChange(e.target.files[0]);
                });
            }
        }
        
        async handleProfilePictureChange(file) {
            if (!file) return;
            if (!file.type.match('image.*')) {
                this.showNotification('error', translations[currentLang].error, translations[currentLang].selectImage);
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                this.showNotification('error', translations[currentLang].error, translations[currentLang].imageMaxSize);
                return;
            }
            
            try {
                const formData = new FormData();
                formData.append('profileImage', file);
                formData.append('userId', this.currentUser.id);
                
                const token = this.getAuthToken();
                const response = await fetch(`${this.baseURL}/api/admin/profile/me/picture`, {
                    method: 'POST',
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                    body: formData
                });
                
                const result = await response.json();
                if (result.success) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const profilePicture = document.getElementById('profile-picture');
                        profilePicture.innerHTML = `<img src="${e.target.result}" alt="${translations[currentLang].profilePictureAlt || 'Profile Picture'}">`;
                        this.showNotification('success', translations[currentLang].success, translations[currentLang].pictureChanged);
                    };
                    reader.readAsDataURL(file);
                    if (result.data && result.data.profileImage) {
                        this.userProfile.profileImage = result.data.profileImage;
                    }
                } else {
                    throw new Error(result.message || 'فشل في رفع الصورة');
                }
            } catch (error) {
                console.error('❌ Error uploading profile picture:', error);
                this.showNotification('error', translations[currentLang].error, error.message || translations[currentLang].pictureChangeFailed);
            }
        }
        
        setupPasswordChange() {
            const changePasswordBtn = document.getElementById('change-password-btn');
            const newPasswordInput = document.getElementById('new-password');
            const confirmPasswordInput = document.getElementById('confirm-password');
            const passwordToggleButtons = document.querySelectorAll('.password-toggle');
            
            passwordToggleButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const targetId = e.target.closest('.password-toggle').dataset.target;
                    const input = document.getElementById(targetId);
                    if (input.type === 'password') {
                        input.type = 'text';
                        e.target.innerHTML = '<i class="fas fa-eye-slash"></i>';
                    } else {
                        input.type = 'password';
                        e.target.innerHTML = '<i class="fas fa-eye"></i>';
                    }
                });
            });
            
            if (newPasswordInput) {
                newPasswordInput.addEventListener('input', () => {
                    this.checkPasswordStrength(newPasswordInput.value);
                });
            }
            
            if (changePasswordBtn) {
                changePasswordBtn.addEventListener('click', () => {
                    this.changePassword();
                });
            }
        }
        
        checkPasswordStrength(password) {
            const strengthBar = document.querySelector('.strength-bar');
            const strengthText = document.querySelector('.strength-text');
            const requirements = document.querySelectorAll('.requirement');
            
            if (!password) {
                if(strengthBar) strengthBar.style.width = '0%';
                if(strengthBar) strengthBar.style.backgroundColor = '#e74c3c';
                if(strengthText) strengthText.textContent = `${translations[currentLang].passwordStrength} -`;
                return;
            }
            
            let score = 0;
            const requirementsMet = {
                length: password.length >= 8,
                uppercase: /[A-Z]/.test(password),
                lowercase: /[a-z]/.test(password),
                number: /[0-9]/.test(password),
                special: /[^A-Za-z0-9]/.test(password)
            };
            
            requirements.forEach(req => {
                const requirement = req.dataset.requirement;
                const icon = req.querySelector('i');
                if (requirementsMet[requirement]) {
                    icon.className = 'fas fa-check-circle requirement-met';
                    score++;
                } else {
                    icon.className = 'fas fa-times-circle requirement-not-met';
                }
            });
            
            const percentage = (score / 5) * 100;
            if(strengthBar) strengthBar.style.width = `${percentage}%`;
            
            if (percentage < 20) {
                if(strengthBar) strengthBar.style.backgroundColor = '#e74c3c';
                if(strengthText) strengthText.textContent = `${translations[currentLang].passwordStrength} ${translations[currentLang].veryWeak}`;
            } else if (percentage < 40) {
                if(strengthBar) strengthBar.style.backgroundColor = '#ff6b6b';
                if(strengthText) strengthText.textContent = `${translations[currentLang].passwordStrength} ${translations[currentLang].weak}`;
            } else if (percentage < 60) {
                if(strengthBar) strengthBar.style.backgroundColor = '#f1c40f';
                if(strengthText) strengthText.textContent = `${translations[currentLang].passwordStrength} ${translations[currentLang].medium}`;
            } else if (percentage < 80) {
                if(strengthBar) strengthBar.style.backgroundColor = '#3498db';
                if(strengthText) strengthText.textContent = `${translations[currentLang].passwordStrength} ${translations[currentLang].strong}`;
            } else {
                if(strengthBar) strengthBar.style.backgroundColor = '#2ecc71';
                if(strengthText) strengthText.textContent = `${translations[currentLang].passwordStrength} ${translations[currentLang].veryStrong}`;
            }
        }
        
        async changePassword() {
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            
            if (!currentPassword || !newPassword || !confirmPassword) {
                this.showNotification('error', translations[currentLang].error, translations[currentLang].fillRequiredFields);
                return;
            }
            if (newPassword !== confirmPassword) {
                this.showNotification('error', translations[currentLang].error, translations[currentLang].passwordsDoNotMatch);
                return;
            }
            if (newPassword.length < 8) {
                this.showNotification('error', translations[currentLang].error, translations[currentLang].passwordMinLength);
                return;
            }
            
            try {
                const response = await this.apiClient.request('/api/admin/profile/me/password', {
                    method: 'POST',
                    body: JSON.stringify({
                        userId: this.currentUser.id,
                        currentPassword,
                        newPassword
                    })
                });
                
                if (response.success) {
                    document.getElementById('current-password').value = '';
                    document.getElementById('new-password').value = '';
                    document.getElementById('confirm-password').value = '';
                    const strengthBar = document.querySelector('.strength-bar');
                    const strengthText = document.querySelector('.strength-text');
                    if(strengthBar) strengthBar.style.width = '0%';
                    if(strengthText) strengthText.textContent = `${translations[currentLang].passwordStrength} -`;
                    this.showNotification('success', translations[currentLang].success, translations[currentLang].passwordChanged);
                }
            } catch (error) {
                console.error('❌ Error changing password:', error);
                this.showNotification('error', translations[currentLang].error, error.message || translations[currentLang].passwordChangeFailed);
            }
        }
        
        setupForms() {
            const saveProfileBtn = document.getElementById('save-profile-btn');
            if (saveProfileBtn) {
                saveProfileBtn.addEventListener('click', () => {
                    this.saveProfile();
                });
            }
        }
        
        async saveProfile() {
            const profileForm = document.getElementById('profile-form');
            if (!profileForm.checkValidity()) {
                this.showNotification('error', translations[currentLang].error, translations[currentLang].fillRequiredFields);
                return;
            }
            
            const isSupervisor = (this.currentUser?.role === 'مشرف_عام');
            
            const updatedProfile = {
                userId: this.currentUser.id
            };
            
            if (isSupervisor) {
                updatedProfile.fullName = document.getElementById('fullName').value;
                updatedProfile.email = document.getElementById('email').value;
                updatedProfile.phone = document.getElementById('phone').value;
                updatedProfile.role = document.getElementById('role').value;
                updatedProfile.department = document.getElementById('department').value;
            } else {
                updatedProfile.email = document.getElementById('email').value;
                updatedProfile.phone = document.getElementById('phone').value;
            }
            
            try {
                console.log('💾 Saving profile updates...');
                const response = await this.apiClient.request('/api/admin/profile/me', {
                    method: 'PUT',
                    body: JSON.stringify(updatedProfile)
                });
                
                if (response.success) {
                    this.userProfile = { ...this.userProfile, ...updatedProfile };
                    this.currentUser.email = updatedProfile.email;
                    this.currentUser.phone = updatedProfile.phone;
                    if (isSupervisor) {
                        this.currentUser.fullName = updatedProfile.fullName;
                        this.currentUser.role = updatedProfile.role;
                        this.currentUser.department = updatedProfile.department;
                    }
                    this.updateUserInfo();
                    this.showNotification('success', translations[currentLang].success, translations[currentLang].profileSaved);
                }
            } catch (error) {
                console.error('❌ Error saving profile:', error);
                this.showNotification('error', translations[currentLang].error, error.message || translations[currentLang].profileSaveFailed);
            }
        }
        
        formatDate(dateString) {
            if (!dateString) return '--';
            try {
                const date = new Date(dateString);
                return date.toLocaleDateString(currentLang === 'ar' ? 'ar-SA' : 'en-US', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                });
            } catch (error) {
                return dateString;
            }
        }
        
        formatRelativeTime(dateString) {
            if (!dateString) return '--';
            try {
                const date = new Date(dateString);
                const now = new Date();
                const diffMs = now - date;
                const diffMins = Math.floor(diffMs / 60000);
                const diffHours = Math.floor(diffMs / 3600000);
                const diffDays = Math.floor(diffMs / 86400000);
                
                if (diffMins < 1) return translations[currentLang].now;
                if (diffMins < 60) return `${diffMins} ${translations[currentLang].minutesAgo}`;
                if (diffHours < 24) return `${diffHours} ${translations[currentLang].hoursAgo}`;
                if (diffDays === 1) return translations[currentLang].yesterday;
                if (diffDays < 7) return `${diffDays} ${translations[currentLang].daysAgo}`;
                return this.formatDate(dateString);
            } catch (error) {
                return dateString;
            }
        }
        
        showNotification(type, title, message) {
            if (window.Notifications && typeof window.Notifications.show === 'function') {
                window.Notifications.show({
                    type: type,
                    title: title,
                    message: message,
                    duration: 3000
                });
            } else {
                const area = document.getElementById('notification-area');
                if (area) {
                    const notification = document.createElement('div');
                    notification.className = `notification notification-${type}`;
                    notification.innerHTML = `
                        <div class="notification-icon"><i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i></div>
                        <div class="notification-content"><h4>${title}</h4><p>${message}</p></div>
                        <button class="notification-close"><i class="fas fa-times"></i></button>
                    `;
                    area.appendChild(notification);
                    setTimeout(() => {
                        notification.style.opacity = '0';
                        setTimeout(() => notification.remove(), 300);
                    }, 5000);
                    notification.querySelector('.notification-close').onclick = () => notification.remove();
                }
            }
        }
        
        escapeHtml(str) {
            if (!str) return '';
            return str.replace(/[&<>]/g, function(m) {
                if (m === '&') return '&amp;';
                if (m === '<') return '&lt;';
                if (m === '>') return '&gt;';
                return m;
            });
        }
        
        setupMobileEnhancements() {
            this.setupMobileMenu();
            this.setupMobileButtonEffects();
            this.detectMobile();
            this.updateSystemTime();
            setInterval(() => this.updateSystemTime(), 60000);
        }
        
        setupMobileMenu() {
            if (!document.querySelector('.menu-toggle')) {
                const branding = document.querySelector('.admin-branding');
                if (branding) {
                    const menuToggle = document.createElement('button');
                    menuToggle.className = 'menu-toggle';
                    menuToggle.id = 'menu-toggle';
                    menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
                    branding.prepend(menuToggle);
                    
                    const sidebar = document.createElement('div');
                    sidebar.className = 'dashboard-sidebar';
                    sidebar.id = 'dashboard-sidebar';
                    sidebar.innerHTML = `
                        <div class="sidebar-header">
                            <button class="sidebar-close" id="sidebar-close"><i class="fas fa-times"></i></button>
                        </div>
                        <div class="sidebar-nav">
                            <div class="nav-section">
                                <h3 class="section-title">${translations[currentLang].main || 'الرئيسية'}</h3>
                                <ul class="nav-links">
                                    <li class="nav-item"><a href="../dashboard/index.html" class="nav-link"><span class="nav-icon"><i class="fas fa-chart-pie"></i></span><span class="nav-text">${translations[currentLang].dashboard || 'لوحة التحكم'}</span></a></li>
                                    <li class="nav-item"><a href="../projects/index.html" class="nav-link"><span class="nav-icon"><i class="fas fa-building"></i></span><span class="nav-text">${translations[currentLang].projects || 'المشاريع'}</span></a></li>
                                    <li class="nav-item"><a href="../contracts/index.html" class="nav-link"><span class="nav-icon"><i class="fas fa-file-contract"></i></span><span class="nav-text">${translations[currentLang].contracts || 'العقود'}</span></a></li>
                                    <li class="nav-item active"><a href="index.html" class="nav-link"><span class="nav-icon"><i class="fas fa-user"></i></span><span class="nav-text">${translations[currentLang].pageTitle || 'الملف الشخصي'}</span></a></li>
                                    <li class="nav-item"><a href="../login/index.html" class="nav-link logout"><span class="nav-icon"><i class="fas fa-sign-out-alt"></i></span><span class="nav-text">${translations[currentLang].logout || 'تسجيل الخروج'}</span></a></li>
                                </ul>
                            </div>
                        </div>
                        <div class="sidebar-footer">
                            <div class="system-status">
                                <span class="status-indicator active"></span>
                                <span class="status-text">${translations[currentLang].systemActive || 'النظام متصل'}</span>
                            </div>
                            <div class="system-time" id="system-time">${translations[currentLang].loading}</div>
                        </div>
                    `;
                    document.body.appendChild(sidebar);
                    
                    menuToggle.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        sidebar.classList.toggle('active');
                        menuToggle.classList.toggle('active');
                        this.toggleSidebarBackdrop();
                        if (sidebar.classList.contains('active')) {
                            document.body.style.overflow = 'hidden';
                            document.body.classList.add('sidebar-open');
                        } else {
                            document.body.style.overflow = '';
                            document.body.classList.remove('sidebar-open');
                        }
                    });
                    
                    const sidebarClose = document.getElementById('sidebar-close');
                    if (sidebarClose) {
                        sidebarClose.addEventListener('click', (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            sidebar.classList.remove('active');
                            menuToggle.classList.remove('active');
                            document.body.style.overflow = '';
                            document.body.classList.remove('sidebar-open');
                            this.removeSidebarBackdrop();
                        });
                    }
                    
                    document.addEventListener('click', (e) => {
                        const backdrop = document.querySelector('.sidebar-backdrop');
                        if (backdrop && backdrop.contains(e.target) && sidebar.classList.contains('active')) {
                            sidebar.classList.remove('active');
                            menuToggle.classList.remove('active');
                            document.body.style.overflow = '';
                            document.body.classList.remove('sidebar-open');
                            this.removeSidebarBackdrop();
                        }
                    });
                    
                    document.addEventListener('keydown', (e) => {
                        if (e.key === 'Escape' && sidebar.classList.contains('active')) {
                            sidebar.classList.remove('active');
                            menuToggle.classList.remove('active');
                            document.body.style.overflow = '';
                            document.body.classList.remove('sidebar-open');
                            this.removeSidebarBackdrop();
                        }
                    });
                }
            }
        }
        
        toggleSidebarBackdrop() {
            let backdrop = document.querySelector('.sidebar-backdrop');
            if (!backdrop) {
                backdrop = document.createElement('div');
                backdrop.className = 'sidebar-backdrop';
                document.body.appendChild(backdrop);
                setTimeout(() => backdrop.classList.add('active'), 10);
            } else {
                backdrop.classList.toggle('active');
            }
        }
        
        removeSidebarBackdrop() {
            const backdrop = document.querySelector('.sidebar-backdrop');
            if (backdrop) {
                backdrop.classList.remove('active');
                setTimeout(() => backdrop.remove(), 300);
            }
        }
        
        setupMobileButtonEffects() {
            if ('ontouchstart' in window) {
                document.addEventListener('touchstart', (e) => {
                    const btn = e.target.closest('.btn, .change-picture-btn, .password-toggle, .view-task-link');
                    if (btn && !btn.disabled) {
                        btn.style.transform = 'scale(0.95)';
                        btn.style.transition = 'transform 0.1s ease';
                    }
                }, { passive: true });
                
                document.addEventListener('touchend', (e) => {
                    const btn = e.target.closest('.btn, .change-picture-btn, .password-toggle, .view-task-link');
                    if (btn) {
                        setTimeout(() => btn.style.transform = '', 150);
                    }
                }, { passive: true });
            }
        }
        
        detectMobile() {
            const isMobile = window.innerWidth <= 768;
            if (isMobile) {
                document.body.classList.add('mobile-view');
                this.optimizeForMobile();
            }
            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    const currentIsMobile = window.innerWidth <= 768;
                    if (currentIsMobile !== document.body.classList.contains('mobile-view')) {
                        if (currentIsMobile) {
                            document.body.classList.add('mobile-view');
                            this.optimizeForMobile();
                        } else {
                            document.body.classList.remove('mobile-view');
                        }
                    }
                }, 250);
            });
        }
        
        optimizeForMobile() {
            document.querySelectorAll('.btn, .change-picture-btn, .password-toggle, .view-task-link').forEach(el => {
                if (!el.style.minHeight) el.style.minHeight = '44px';
            });
        }
        
        updateSystemTime() {
            const systemTimeElement = document.getElementById('system-time');
            if (systemTimeElement) {
                const now = new Date();
                const timeString = now.toLocaleTimeString(currentLang === 'ar' ? 'ar-SA' : 'en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });
                const dateString = now.toLocaleDateString(currentLang === 'ar' ? 'ar-SA' : 'en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                systemTimeElement.textContent = `${timeString} - ${dateString}`;
            }
        }
    }
    
    function initialize() {
        try {
            window.profileManager = new ProfileManager();
            console.log('✅ ProfileManager initialized successfully with ratings, tasks, penalties and i18n');
        } catch (error) {
            console.error('❌ Failed to initialize ProfileManager:', error);
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();