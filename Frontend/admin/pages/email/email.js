// Frontend/admin/pages/email/email.js
// email.js - نظام البريد الإلكتروني الداخلي مع اتصال بقاعدة البيانات
// تم التعديل لجعل التوقيع الافتراضي ديناميكياً وعرض بيانات المستخدم الحقيقي
// وإصلاح مشكلة التوكن لاستخدام المفتاح الصحيح "auth_token"
// وتحديث شارات البريد بشكل صحيح
// تحسين إضافة التوقيع للحفاظ على التنسيق
// إضافة دعم اللغة العربية/الإنجليزية مع نفس مفتاح TaskFlow Pro
// تحسين الاقتراحات (autocomplete) بشكل احترافي
// تحديث التوقيع: تحسين الهيكل وجعل اسم الشركة ABH HOLDING GROUP
// إضافة حاوية signature-wrapper للحفاظ على تنسيق التوقيع بعد الإرسال

(function() {
    'use strict';

    console.log('✅ Email Client Loaded - Real Database Integration');

    // ========== نظام الترجمة (i18n) ==========
    const translations = {
        ar: {
            appName: "البريد الإلكتروني | نظام إدارة العقارات",
            main: "الرئيسية",
            dashboard: "لوحة التحكم",
            propertyManagement: "إدارة العقارات",
            projects: "المشاريع",
            contracts: "العقود",
            payments: "المدفوعات",
            bills: "الفواتير",
            customerManagement: "إدارة العملاء",
            inquiries: "الاستفسارات",
            clients: "العملاء",
            administration: "الإدارة",
            users: "المستخدمين",
            instantMessaging: "التواصل الفوري",
            email: "البريد الإلكتروني",
            systemActive: "متصل",
            compose: "جديد",
            inbox: "صندوق الوارد",
            sent: "المرسلة",
            searchEmails: "بحث في البريد...",
            welcomeEmailTitle: "البريد الإلكتروني",
            welcomeEmailDescription: "اختر رسالة لقراءتها",
            composeNew: "كتابة بريد جديد",
            composeNewMessage: "رسالة جديدة",
            to: "إلى",
            cc: "Cc",
            bcc: "Bcc",
            subject: "الموضوع",
            messageBody: "نص الرسالة",
            attachments: "المرفقات",
            saveDraft: "حفظ كمسودة",
            send: "إرسال",
            signatureSettings: "إعدادات التوقيع",
            signatureHtml: "رمز HTML للتوقيع",
            signaturePreview: "معاينة التوقيع",
            autoAddSignature: "إضافة التوقيع تلقائياً في نهاية الرسائل الجديدة",
            signatureHelp: "يمكنك لصق أي كود HTML وسيتم إدراجه كما هو.",
            resetDefault: "استعادة التوقيع الافتراضي",
            save: "حفظ التوقيع",
            imageView: "عرض الصورة",
            download: "تحميل",
            signature: "التوقيع:",
            reply: "رد",
            replyAll: "رد للكل",
            forward: "إعادة توجيه"
        },
        en: {
            appName: "Email | Real Estate Management System",
            main: "Main",
            dashboard: "Dashboard",
            propertyManagement: "Property Management",
            projects: "Projects",
            contracts: "Contracts",
            payments: "Payments",
            bills: "Bills",
            customerManagement: "Customer Management",
            inquiries: "Inquiries",
            clients: "Clients",
            administration: "Administration",
            users: "Users",
            instantMessaging: "Instant Messaging",
            email: "Email",
            systemActive: "Online",
            compose: "New",
            inbox: "Inbox",
            sent: "Sent",
            searchEmails: "Search emails...",
            welcomeEmailTitle: "Email",
            welcomeEmailDescription: "Select a message to read",
            composeNew: "Write new email",
            composeNewMessage: "New Message",
            to: "To",
            cc: "Cc",
            bcc: "Bcc",
            subject: "Subject",
            messageBody: "Message Body",
            attachments: "Attachments",
            saveDraft: "Save Draft",
            send: "Send",
            signatureSettings: "Signature Settings",
            signatureHtml: "Signature HTML Code",
            signaturePreview: "Signature Preview",
            autoAddSignature: "Automatically add signature to new messages",
            signatureHelp: "You can paste any HTML code and it will be inserted as is.",
            resetDefault: "Restore Default Signature",
            save: "Save",
            imageView: "View Image",
            download: "Download",
            signature: "Signature:",
            reply: "Reply",
            replyAll: "Reply All",
            forward: "Forward"
        }
    };

    let currentLang = 'ar';

    function getCurrentLanguage() {
        try {
            // أولاً نقرأ من مفتاح TaskFlow Pro
            const taskflowLang = localStorage.getItem('taskflow_lang');
            if (taskflowLang && (taskflowLang === 'ar' || taskflowLang === 'en')) {
                return taskflowLang;
            }
            // ثم من user_data.language إن وجد
            const userData = localStorage.getItem('user_data');
            if (userData) {
                const user = JSON.parse(userData);
                if (user.language && (user.language === 'ar' || user.language === 'en')) {
                    return user.language;
                }
            }
            // أخيراً من app_lang للتوافق
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
                    if (el.getAttribute('placeholder') !== undefined) {
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
        document.querySelectorAll('.mobile-title, .welcome-title, .modal-title').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (key && translations[currentLang][key]) el.textContent = translations[currentLang][key];
        });
    }

    class EmailManager {
        constructor() {
            this.baseURL = 'http://localhost:3001';
            this.apiClient = null;
            this.currentUser = null;
            this.currentFolder = 'inbox';
            this.currentEmailId = null;
            this.emails = [];
            this.page = 1;
            this.limit = 25;
            this.totalPages = 1;
            this.totalItems = 0;
            this.searchQuery = '';
            this.signature = {
                html: '',
                enabled: true
            };
            this.init();
        }

        // ========== جلب المستخدم الحالي من localStorage ==========
        getCurrentUser() {
            try {
                const userData = localStorage.getItem('user_data');
                if (userData) {
                    return JSON.parse(userData);
                }
                if (window.AuthManager && window.AuthManager.getCurrentUser) {
                    return window.AuthManager.getCurrentUser();
                }
            } catch (error) {
                console.error('❌ خطأ في قراءة بيانات المستخدم:', error);
            }
            return null;
        }

        // ========== جلب التوكن من localStorage (تم التعديل) ==========
        getAuthToken() {
            try {
                let token = localStorage.getItem('auth_token');
                if (token && token !== 'undefined' && token !== 'null') {
                    return token;
                }
                const userData = this.getCurrentUser();
                if (userData && userData.token && userData.token !== 'undefined') {
                    return userData.token;
                }
                return null;
            } catch (error) {
                console.error('❌ خطأ في قراءة التوكن:', error);
            }
            return null;
        }

        // ========== إنشاء توقيع افتراضي ديناميكي مع اسم الشركة ABH HOLDING GROUP ==========
        getDefaultSignatureHtml() {
            if (!this.currentUser) return '';
            const fullName = this.escapeHtml(this.currentUser.fullName || this.currentUser.username || 'مستخدم');
            const email = this.escapeHtml(this.currentUser.email || '');
            const phone = this.escapeHtml(this.currentUser.phone || 'غير متاح');
            const role = this.currentUser.role || '';
            const roleMap = {
                'مشرف_عام': 'مشرف عام',
                'مدير_مشاريع': 'مدير مشاريع',
                'محاسب': 'محاسب',
                'موظف_استقبال': 'موظف استقبال',
                'خدمة_عملاء': 'خدمة عملاء',
                'مبيعات': 'مبيعات',
                'موارد_بشرية': 'موارد بشرية',
                'موظف': 'موظف'
            };
            const roleName = this.escapeHtml(roleMap[role] || role || '');
            
            // بناء التوقيع بشكل منظم (كل عنصر في سطر منفصل، مع إمكانية إخفاء السطر إذا كانت القيمة فارغة)
            let roleHtml = '';
            if (roleName) {
                roleHtml = `<div style="margin-bottom: 4px;">${roleName}</div>`;
            }
            
            return `<div style="border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 0; font-size: 13px; color: #4a5568; direction: rtl; font-family: 'Tajawal', sans-serif; line-height: 1.5;">
    <div style="margin-bottom: 4px;"><strong>${fullName}</strong></div>
    ${roleHtml}
    <div style="margin-bottom: 4px; font-weight: 500;">ABH HOLDING GROUP</div>
    <div style="margin: 4px 0; color: #2c7da0;">هاتف: ${phone} &nbsp;|&nbsp; البريد الإلكتروني: ${email}</div>
    <div style="margin-top: 4px; font-size: 11px;">هذه الرسالة مرسلة من نظام إدارة العقارات</div>
</div>`;
        }

        // ========== إضافة التوقيع داخل حاوية للحفاظ على التنسيق ==========
        getBodyWithSignature(body) {
            if (this.signature.enabled && this.signature.html && this.signature.html.trim()) {
                // تجنب إضافة التوقيع مرتين
                if (!body.includes(this.signature.html.trim())) {
                    // إضافة حاوية خارجية للتوقيع مع هوامش وأنماط ثابتة
                    return body + '<div class="signature-wrapper" style="margin-top:20px;">' + this.signature.html + '</div>';
                }
            }
            return body;
        }

        async init() {
            await this.checkAuth();
            await this.setupApiClient();
            await this.loadSignature();
            this.setupEventListeners();
            this.setupUI();
            await this.loadEmails();
            this.updateSystemTime();
            setInterval(() => this.updateSystemTime(), 1000);
            // تهيئة اللغة
            currentLang = getCurrentLanguage();
            setLanguage(currentLang);
        }

        async checkAuth() {
            try {
                const user = this.getCurrentUser();
                if (user && user.id) {
                    this.currentUser = user;
                } else {
                    window.location.href = '../login/index.html';
                    return;
                }
                this.updateUserInfo();
            } catch (error) {
                console.error('❌ Auth check failed:', error);
            }
        }

        async setupApiClient() {
            const token = this.getAuthToken();
            if (window.API && typeof window.API.request === 'function') {
                this.apiClient = window.API;
            } else {
                this.apiClient = {
                    request: async (endpoint, options = {}) => {
                        const url = `${this.baseURL}${endpoint}`;
                        const headers = {
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
                            if (options.body instanceof FormData) {
                                config.body = options.body;
                            } else {
                                headers['Content-Type'] = 'application/json';
                                config.body = JSON.stringify(options.body);
                            }
                        }

                        const response = await fetch(url, config);
                        const data = await response.json();
                        if (!response.ok) {
                            throw new Error(data.message || 'خطأ في الطلب');
                        }
                        return data;
                    }
                };
            }
        }

        updateUserInfo() {
            const userNameElement = document.getElementById('current-user-name');
            const userRoleElement = document.getElementById('current-user-role');
            if (userNameElement && this.currentUser) {
                userNameElement.textContent = this.currentUser.fullName || this.currentUser.username || 'مستخدم';
            }
            if (userRoleElement && this.currentUser) {
                const roleMap = {
                    'مشرف_عام': 'مشرف عام',
                    'مدير_مشاريع': 'مدير مشاريع',
                    'محاسب': 'محاسب',
                    'خدمة_عملاء': 'خدمة عملاء',
                    'مبيعات': 'مبيعات',
                    'موارد_بشرية': 'موارد بشرية',
                    'موظف': 'موظف',
                    'موظف_استقبال': 'موظف استقبال'
                };
                userRoleElement.textContent = roleMap[this.currentUser.role] || this.currentUser.role;
            }
        }

        async loadEmails() {
            try {
                this.showLoading();
                const response = await this.apiClient.request(`/api/admin/email/${this.currentFolder}?page=${this.page}&limit=${this.limit}`);
                this.emails = response.data || [];
                this.totalItems = response.pagination?.totalItems || 0;
                this.totalPages = response.pagination?.totalPages || 1;
                this.renderEmailsList();
                await this.updateFolderBadges();
            } catch (error) {
                console.error('❌ Error loading emails:', error);
                this.showNotification('error', 'خطأ', 'فشل تحميل الرسائل');
            }
        }

        renderEmailsList() {
            const container = document.getElementById('emails-list');
            if (!container) return;

            let html = '';
            if (this.emails.length === 0) {
                html = `<div class="empty-folder" style="text-align:center; padding:2rem; color:var(--color-text-secondary);">لا توجد رسائل في هذا المجلد</div>`;
            } else {
                this.emails.forEach(email => {
                    const fromName = this.currentFolder === 'sent' ? (email.recipients?.[0]?.fullName || email.recipients?.[0]?.email || 'غير معروف') : email.senderName;
                    const avatarLetter = fromName.charAt(0);
                    const dateStr = this.formatDateRelative(email.createdAt);
                    const unreadClass = (this.currentFolder === 'inbox' && !email.isRead) ? 'email-item-unread' : '';

                    html += `
                        <div class="email-item ${unreadClass}" data-email-id="${email.id}">
                            <div class="email-item-avatar">${avatarLetter}</div>
                            <div class="email-item-content">
                                <div class="email-item-header">
                                    <span class="email-item-sender">${this.escapeHtml(fromName)}</span>
                                    <span class="email-item-date">${dateStr}</span>
                                </div>
                                <div class="email-item-subject">${this.escapeHtml(email.subject || '(بدون موضوع)')}</div>
                                <div class="email-item-preview">${this.escapeHtml(this.truncate(email.body, 60))}</div>
                            </div>
                            ${!email.isRead && this.currentFolder === 'inbox' ? '<span class="unread-dot"></span>' : ''}
                        </div>
                    `;
                });
            }
            container.innerHTML = html;

            document.querySelectorAll('.email-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    const emailId = parseInt(item.dataset.emailId);
                    this.openEmail(emailId);
                });
            });
        }

        async openEmail(emailId) {
            try {
                const response = await this.apiClient.request(`/api/admin/email/${emailId}`);
                const email = response.data;
                if (!email) throw new Error('البريد غير موجود');
                this.currentEmailId = emailId;

                this.displayEmailContent(email);

                document.getElementById('welcome-email-screen').style.display = 'none';
                document.getElementById('email-view-header').style.display = 'flex';
                document.getElementById('email-content').style.display = 'block';

                if (this.currentFolder === 'inbox') {
                    await this.loadEmails();
                } else {
                    await this.updateFolderBadges();
                }
            } catch (error) {
                console.error('❌ Error opening email:', error);
                this.showNotification('error', 'خطأ', 'فشل فتح البريد');
            }
        }

        displayEmailContent(email) {
            document.getElementById('email-subject').textContent = email.subject || '(بدون موضوع)';
            document.getElementById('email-from-name').textContent = email.senderName;
            document.getElementById('email-from-email').textContent = `<${email.senderEmail}>`;
            document.getElementById('email-date').textContent = this.formatDateFull(email.createdAt);
            document.getElementById('email-from-avatar').textContent = email.senderName.charAt(0);

            const toRecipients = (email.recipients || []).filter(r => r.recipientType === 'to');
            const ccRecipients = (email.recipients || []).filter(r => r.recipientType === 'cc');
            const bccRecipients = (email.recipients || []).filter(r => r.recipientType === 'bcc');

            const toList = toRecipients.map(r => `${r.fullName} <${r.email}>`).join('، ');
            const ccList = ccRecipients.map(r => `${r.fullName} <${r.email}>`).join('، ');
            const bccList = bccRecipients.map(r => `${r.fullName} <${r.email}>`).join('، ');

            let recipientsHtml = `<strong>إلى:</strong> ${toList || '—'}`;
            if (ccList) recipientsHtml += `<br><strong>نسخة:</strong> ${ccList}`;
            if (bccList) recipientsHtml += `<br><strong>بنسخة مخفية:</strong> ${bccList}`;
            document.getElementById('email-to').innerHTML = recipientsHtml;

            const emailBodyElement = document.getElementById('email-body');
            emailBodyElement.innerHTML = email.body || '';

            const attachmentsContainer = document.getElementById('email-attachments');
            const attachmentsList = document.getElementById('attachments-list');
            if (email.attachments && email.attachments.length > 0) {
                attachmentsContainer.style.display = 'block';
                let attachHtml = '';
                email.attachments.forEach(att => {
                    const icon = this.getFileIcon(att.fileName);
                    const size = this.formatFileSize(att.fileSize);
                    attachHtml += `
                        <div class="attachment-item" data-file-url="${att.fileUrl}" data-file-name="${this.escapeHtml(att.fileName)}">
                            <i class="fas ${icon}"></i>
                            <div class="attachment-info">
                                <div class="attachment-name">${this.escapeHtml(att.fileName)}</div>
                                <div class="attachment-size">${size}</div>
                            </div>
                        </div>
                    `;
                });
                attachmentsList.innerHTML = attachHtml;
                document.querySelectorAll('.attachment-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const url = item.dataset.fileUrl;
                        if (url) window.open(this.baseURL + url, '_blank');
                    });
                });
            } else {
                attachmentsContainer.style.display = 'none';
            }
        }

        async sendEmail() {
            const to = document.getElementById('compose-to').value.trim();
            const subject = document.getElementById('compose-subject').value.trim();
            let body = document.getElementById('compose-body').value.trim();

            if (!to && !subject && !body) {
                this.showNotification('error', 'خطأ', 'لا يمكن إرسال بريد فارغ');
                return;
            }

            // إضافة التوقيع بشكل منسق مع الحفاظ على HTML الأصلي
            body = this.getBodyWithSignature(body);

            const toArray = to.split(',').map(s => s.trim()).filter(s => s);
            const ccArray = document.getElementById('compose-cc').value.split(',').map(s => s.trim()).filter(s => s);
            const bccArray = document.getElementById('compose-bcc').value.split(',').map(s => s.trim()).filter(s => s);

            const formData = new FormData();
            formData.append('subject', subject);
            formData.append('body', body);
            formData.append('to', JSON.stringify(toArray));
            formData.append('cc', JSON.stringify(ccArray));
            formData.append('bcc', JSON.stringify(bccArray));
            formData.append('isDraft', 'false');

            if (this.attachmentsToUpload && this.attachmentsToUpload.length) {
                for (const file of this.attachmentsToUpload) {
                    formData.append('attachments', file);
                }
            }

            try {
                const response = await this.apiClient.request('/api/admin/email/send', {
                    method: 'POST',
                    body: formData
                });
                this.showNotification('success', 'تم الإرسال', 'تم إرسال البريد بنجاح');
                this.closeModal(document.getElementById('compose-modal'));
                await this.loadEmails();
                if (this.currentFolder === 'sent') this.renderEmailsList();
                await this.updateFolderBadges();
                this.attachmentsToUpload = [];
                document.getElementById('attachments-preview').innerHTML = '';
            } catch (error) {
                console.error('❌ Error sending email:', error);
                this.showNotification('error', 'خطأ', error.message || 'فشل الإرسال');
            }
        }

        async saveDraft() {
            const to = document.getElementById('compose-to').value.trim();
            const subject = document.getElementById('compose-subject').value.trim();
            const body = document.getElementById('compose-body').value.trim();

            const toArray = to.split(',').map(s => s.trim()).filter(s => s);
            const ccArray = document.getElementById('compose-cc').value.split(',').map(s => s.trim()).filter(s => s);
            const bccArray = document.getElementById('compose-bcc').value.split(',').map(s => s.trim()).filter(s => s);

            const formData = new FormData();
            formData.append('subject', subject);
            formData.append('body', body);
            formData.append('to', JSON.stringify(toArray));
            formData.append('cc', JSON.stringify(ccArray));
            formData.append('bcc', JSON.stringify(bccArray));
            formData.append('isDraft', 'true');

            if (this.attachmentsToUpload && this.attachmentsToUpload.length) {
                for (const file of this.attachmentsToUpload) {
                    formData.append('attachments', file);
                }
            }

            try {
                const response = await this.apiClient.request('/api/admin/email/send', {
                    method: 'POST',
                    body: formData
                });
                this.showNotification('success', 'تم الحفظ', 'تم حفظ المسودة');
                this.closeModal(document.getElementById('compose-modal'));
                await this.loadEmails();
                if (this.currentFolder === 'drafts') this.renderEmailsList();
                await this.updateFolderBadges();
                this.attachmentsToUpload = [];
                document.getElementById('attachments-preview').innerHTML = '';
            } catch (error) {
                console.error('❌ Error saving draft:', error);
                this.showNotification('error', 'خطأ', error.message || 'فشل حفظ المسودة');
            }
        }

        async deleteCurrentEmail() {
            if (!this.currentEmailId) return;
            try {
                await this.apiClient.request(`/api/admin/email/${this.currentEmailId}`, { method: 'DELETE' });
                this.showNotification('info', 'تم الحذف', 'تم نقل البريد إلى المهملات');
                this.currentEmailId = null;
                await this.loadEmails();
                await this.updateFolderBadges();
                document.getElementById('welcome-email-screen').style.display = 'flex';
                document.getElementById('email-view-header').style.display = 'none';
                document.getElementById('email-content').style.display = 'none';
            } catch (error) {
                console.error('❌ Error deleting email:', error);
                this.showNotification('error', 'خطأ', 'فشل حذف البريد');
            }
        }

        reply() {
            const email = this.emails.find(e => e.id === this.currentEmailId);
            if (!email) return;
            const replyTo = email.senderEmail;
            const subject = `رد: ${email.subject}`;
            const body = `\n\n-------- رسالة أصلية --------\nمن: ${email.senderName} <${email.senderEmail}>\nالتاريخ: ${this.formatDateFull(email.createdAt)}\n\n${email.body}`;
            this.openCompose({ to: replyTo, subject, body });
        }

        replyAll() {
            const email = this.emails.find(e => e.id === this.currentEmailId);
            if (!email) return;
            const toList = [email.senderEmail];
            const ccList = (email.recipients?.filter(r => r.recipientType === 'cc') || []).map(r => r.email);
            const subject = `رد للكل: ${email.subject}`;
            const body = `\n\n-------- رسالة أصلية --------\nمن: ${email.senderName} <${email.senderEmail}>\nالتاريخ: ${this.formatDateFull(email.createdAt)}\n\n${email.body}`;
            this.openCompose({ to: toList.join(', '), cc: ccList.join(', '), subject, body });
        }

        forward() {
            const email = this.emails.find(e => e.id === this.currentEmailId);
            if (!email) return;
            const subject = `توجيه: ${email.subject}`;
            const body = `\n\n-------- رسالة مُعادة توجيه --------\nمن: ${email.senderName} <${email.senderEmail}>\nالتاريخ: ${this.formatDateFull(email.createdAt)}\n\n${email.body}`;
            this.openCompose({ subject, body });
        }

        openCompose(initialData = {}) {
            this.resetComposeForm();
            if (initialData.to) document.getElementById('compose-to').value = initialData.to;
            if (initialData.cc) document.getElementById('compose-cc').value = initialData.cc;
            if (initialData.subject) document.getElementById('compose-subject').value = initialData.subject;
            if (initialData.body) document.getElementById('compose-body').value = initialData.body;
            this.updateComposeSignaturePreview();
            this.openModal(document.getElementById('compose-modal'));
        }

        resetComposeForm() {
            document.getElementById('compose-to').value = '';
            document.getElementById('compose-cc').value = '';
            document.getElementById('compose-bcc').value = '';
            document.getElementById('compose-subject').value = '';
            document.getElementById('compose-body').value = '';
            document.getElementById('attachments-preview').innerHTML = '';
            this.attachmentsToUpload = [];
        }

        updateComposeSignaturePreview() {
            const previewDiv = document.getElementById('compose-signature-preview-content');
            if (previewDiv) {
                previewDiv.innerHTML = this.signature.html || '';
            }
        }

        async searchUsers(query, callback) {
            if (!query || query.length < 2) return callback([]);
            try {
                const response = await this.apiClient.request(`/api/admin/email/users/search?q=${encodeURIComponent(query)}`);
                callback(response.data || []);
            } catch (error) {
                console.error('❌ Error searching users:', error);
                callback([]);
            }
        }

        loadSignature() {
            const userKey = `signature_${this.currentUser?.email}`;
            const saved = localStorage.getItem(userKey);
            if (saved) {
                try {
                    const sig = JSON.parse(saved);
                    this.signature.html = sig.html || '';
                    this.signature.enabled = sig.enabled !== undefined ? sig.enabled : true;
                } catch (e) {
                    this.signature.html = this.getDefaultSignatureHtml();
                    this.signature.enabled = true;
                }
            } else {
                this.signature.html = this.getDefaultSignatureHtml();
                this.signature.enabled = true;
            }
            this.updateSignaturePreview();
        }

        saveSignature() {
            const html = document.getElementById('signature-html').value;
            const enabled = document.getElementById('signature-enabled').checked;
            this.signature.html = html;
            this.signature.enabled = enabled;
            const userKey = `signature_${this.currentUser?.email}`;
            localStorage.setItem(userKey, JSON.stringify(this.signature));
            this.updateSignaturePreview();
            this.updateComposeSignaturePreview();
            this.showNotification('success', 'تم الحفظ', 'تم حفظ التوقيع');
        }

        updateSignaturePreview() {
            const preview = document.getElementById('signature-preview');
            if (preview) preview.innerHTML = this.signature.html || 'لا يوجد توقيع';
        }

        async switchFolder(folder) {
            this.currentFolder = folder;
            this.page = 1;
            await this.loadEmails();
            document.querySelectorAll('.folder-item').forEach(el => el.classList.remove('active'));
            const activeFolder = document.querySelector(`.folder-item[data-folder="${folder}"]`);
            if (activeFolder) activeFolder.classList.add('active');
            document.getElementById('welcome-email-screen').style.display = 'flex';
            document.getElementById('email-view-header').style.display = 'none';
            document.getElementById('email-content').style.display = 'none';
        }

        async updateFolderBadges() {
            try {
                const response = await this.apiClient.request('/api/admin/email/stats');
                const stats = response.data;
                const inboxBadge = document.getElementById('inbox-badge');
                if (inboxBadge) inboxBadge.textContent = stats.unread || 0;
                const sentBadge = document.getElementById('sent-badge');
                if (sentBadge) sentBadge.textContent = stats.sent || 0;
                const draftsBadge = document.getElementById('drafts-badge');
                if (draftsBadge) draftsBadge.textContent = stats.drafts || 0;
                const trashBadge = document.getElementById('trash-badge');
                if (trashBadge) trashBadge.textContent = stats.trash || 0;
            } catch (error) {
                console.error('❌ Error loading stats:', error);
            }
        }

        truncate(text, length) {
            if (!text) return '';
            const plainText = text.replace(/<[^>]*>/g, '');
            return plainText.length > length ? plainText.substring(0, length) + '…' : plainText;
        }

        formatDateRelative(isoDate) {
            const date = new Date(isoDate);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            if (diffMins < 1) return 'الآن';
            if (diffMins < 60) return diffMins + ' د';
            if (diffHours < 24) return diffHours + ' س';
            if (diffDays === 1) return 'أمس';
            if (diffDays < 7) return diffDays + ' أيام';
            return date.toLocaleDateString(currentLang === 'ar' ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'short' });
        }

        formatDateFull(isoDate) {
            const date = new Date(isoDate);
            return date.toLocaleString(currentLang === 'ar' ? 'ar-SA' : 'en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        formatFileSize(bytes) {
            if (bytes < 1024) return bytes + ' B';
            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
            return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        }

        getFileIcon(fileName) {
            const ext = fileName.split('.').pop().toLowerCase();
            const icons = {
                pdf: 'fa-file-pdf',
                doc: 'fa-file-word',
                docx: 'fa-file-word',
                xls: 'fa-file-excel',
                xlsx: 'fa-file-excel',
                ppt: 'fa-file-powerpoint',
                pptx: 'fa-file-powerpoint',
                jpg: 'fa-file-image',
                jpeg: 'fa-file-image',
                png: 'fa-file-image',
                gif: 'fa-file-image',
                zip: 'fa-file-archive',
                rar: 'fa-file-archive',
                txt: 'fa-file-alt',
                default: 'fa-file'
            };
            return icons[ext] || icons.default;
        }

        openModal(modal) {
            if (modal) modal.classList.add('active');
        }

        closeModal(modal) {
            if (modal) modal.classList.remove('active');
        }

        showNotification(type, title, message) {
            const area = document.getElementById('notification-area');
            if (!area) return;
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.innerHTML = `
                <i class="fas ${this.getNotificationIcon(type)}"></i>
                <div class="notification-content">
                    <h4>${title}</h4>
                    <p>${message}</p>
                </div>
                <button class="notification-close"><i class="fas fa-times"></i></button>
            `;
            area.appendChild(notification);
            setTimeout(() => notification.classList.add('show'), 10);
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, 5000);
            notification.querySelector('.notification-close').addEventListener('click', () => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            });
        }

        getNotificationIcon(type) {
            const map = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
            return map[type] || 'fa-info-circle';
        }

        setupEventListeners() {
            document.querySelectorAll('.folder-item').forEach(item => {
                item.addEventListener('click', () => {
                    const folder = item.dataset.folder;
                    if (folder) this.switchFolder(folder);
                });
            });

            const composeBtns = ['compose-btn', 'mobile-compose-btn', 'start-compose-btn'];
            composeBtns.forEach(id => {
                const btn = document.getElementById(id);
                if (btn) btn.addEventListener('click', () => this.openCompose());
            });

            const sendBtn = document.getElementById('send-email-btn');
            if (sendBtn) sendBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.sendEmail();
            });

            const draftBtn = document.getElementById('save-draft-btn');
            if (draftBtn) draftBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.saveDraft();
            });

            const replyBtn = document.getElementById('reply-btn');
            if (replyBtn) replyBtn.addEventListener('click', () => this.reply());

            const replyAllBtn = document.getElementById('reply-all-btn');
            if (replyAllBtn) replyAllBtn.addEventListener('click', () => this.replyAll());

            const forwardBtn = document.getElementById('forward-btn');
            if (forwardBtn) forwardBtn.addEventListener('click', () => this.forward());

            const attachBtn = document.getElementById('attach-file-btn');
            const fileInput = document.getElementById('file-input');
            if (attachBtn && fileInput) {
                attachBtn.addEventListener('click', () => fileInput.click());
                fileInput.addEventListener('change', (e) => {
                    const files = e.target.files;
                    if (!files) return;
                    this.attachmentsToUpload = Array.from(files);
                    const preview = document.getElementById('attachments-preview');
                    if (preview) {
                        preview.innerHTML = '';
                        this.attachmentsToUpload.forEach(file => {
                            const div = document.createElement('div');
                            div.className = 'attachment-preview-item';
                            div.innerHTML = `<i class="fas ${this.getFileIcon(file.name)}"></i><span>${this.escapeHtml(file.name)}</span><i class="fas fa-times remove-attachment"></i>`;
                            preview.appendChild(div);
                        });
                        document.querySelectorAll('.remove-attachment').forEach(btn => {
                            btn.addEventListener('click', (e) => {
                                const span = e.target.closest('.attachment-preview-item');
                                const fileName = span.querySelector('span')?.textContent;
                                this.attachmentsToUpload = this.attachmentsToUpload.filter(f => f.name !== fileName);
                                span.remove();
                            });
                        });
                    }
                });
            }

            const closeModals = () => {
                document.querySelectorAll('.modal').forEach(modal => modal.classList.remove('active'));
            };
            document.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', closeModals));

            const refreshBtn = document.getElementById('refresh-btn');
            if (refreshBtn) refreshBtn.addEventListener('click', () => this.loadEmails());

            const searchInput = document.getElementById('emails-search-input');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    this.searchQuery = e.target.value;
                    this.page = 1;
                });
            }

            const signatureBtn = document.getElementById('signature-settings-btn');
            const signatureModal = document.getElementById('signature-modal');
            if (signatureBtn && signatureModal) {
                signatureBtn.addEventListener('click', () => {
                    document.getElementById('signature-html').value = this.signature.html;
                    document.getElementById('signature-enabled').checked = this.signature.enabled;
                    this.updateSignaturePreview();
                    this.openModal(signatureModal);
                });
                document.getElementById('signature-save')?.addEventListener('click', () => {
                    this.saveSignature();
                    this.closeModal(signatureModal);
                });
                document.getElementById('signature-reset-default')?.addEventListener('click', () => {
                    document.getElementById('signature-html').value = this.getDefaultSignatureHtml();
                    document.getElementById('signature-enabled').checked = true;
                    this.updateSignaturePreview();
                });
                document.getElementById('signature-modal-close')?.addEventListener('click', () => this.closeModal(signatureModal));
            }

            const menuToggle = document.getElementById('menu-toggle');
            const sidebar = document.getElementById('dashboard-sidebar');
            const sidebarClose = document.getElementById('sidebar-close');
            const backdrop = document.getElementById('sidebar-backdrop');
            if (menuToggle && sidebar) {
                menuToggle.addEventListener('click', () => sidebar.classList.toggle('active'));
                if (sidebarClose) sidebarClose.addEventListener('click', () => sidebar.classList.remove('active'));
                if (backdrop) backdrop.addEventListener('click', () => sidebar.classList.remove('active'));
            }

            const emailSidebarBackdrop = document.getElementById('email-sidebar-backdrop');
            const emailSidebar = document.getElementById('email-sidebar');
            if (emailSidebarBackdrop && emailSidebar) {
                emailSidebarBackdrop.addEventListener('click', () => {
                    emailSidebar.classList.remove('active');
                    emailSidebarBackdrop.classList.remove('active');
                });
                document.getElementById('menu-toggle-email')?.addEventListener('click', () => {
                    emailSidebar.classList.add('active');
                    emailSidebarBackdrop.classList.add('active');
                });
            }

            this.setupAutocomplete('compose-to', 'to-suggestions');
            this.setupAutocomplete('compose-cc', 'cc-suggestions');
            this.setupAutocomplete('compose-bcc', 'bcc-suggestions');
        }

        setupAutocomplete(inputId, suggestionsId) {
            const input = document.getElementById(inputId);
            const suggestionsDiv = document.getElementById(suggestionsId);
            if (!input || !suggestionsDiv) return;

            let currentTimeout = null;

            input.addEventListener('input', (e) => {
                const query = e.target.value.split(',').pop().trim();
                if (currentTimeout) clearTimeout(currentTimeout);
                if (query.length < 2) {
                    suggestionsDiv.innerHTML = '';
                    suggestionsDiv.style.display = 'none';
                    return;
                }
                currentTimeout = setTimeout(() => {
                    this.searchUsers(query, (users) => {
                        if (users.length === 0) {
                            suggestionsDiv.innerHTML = '';
                            suggestionsDiv.style.display = 'none';
                            return;
                        }
                        let html = '';
                        users.forEach(user => {
                            const avatarLetter = user.fullName ? user.fullName.charAt(0) : 'م';
                            html += `
                                <div class="suggestion-item" data-email="${this.escapeHtml(user.email)}" data-name="${this.escapeHtml(user.fullName)}">
                                    <div class="suggestion-avatar">${avatarLetter}</div>
                                    <div class="suggestion-info">
                                        <div class="suggestion-name">${this.escapeHtml(user.fullName)}</div>
                                        <div class="suggestion-email">${this.escapeHtml(user.email)}</div>
                                        <div class="suggestion-role">${this.escapeHtml(user.role || 'مستخدم')}</div>
                                    </div>
                                </div>
                            `;
                        });
                        suggestionsDiv.innerHTML = html;
                        suggestionsDiv.style.display = 'block';
                        document.querySelectorAll(`#${suggestionsId} .suggestion-item`).forEach(item => {
                            item.addEventListener('click', () => {
                                const email = item.dataset.email;
                                const currentValue = input.value;
                                const parts = currentValue.split(',').map(p => p.trim());
                                parts[parts.length - 1] = email;
                                input.value = parts.join(', ');
                                suggestionsDiv.innerHTML = '';
                                suggestionsDiv.style.display = 'none';
                            });
                        });
                    });
                }, 300);
            });

            document.addEventListener('click', (e) => {
                if (!input.contains(e.target) && !suggestionsDiv.contains(e.target)) {
                    suggestionsDiv.style.display = 'none';
                }
            });
        }

        escapeHtml(str) {
            if (!str) return '';
            return str.replace(/[&<>]/g, function(m) {
                if (m === '&') return '&amp;';
                if (m === '<') return '&lt;';
                if (m === '>') return '&gt;';
                return m;
            }).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, function(c) {
                return c;
            });
        }

        setupUI() {
            this.updateSystemTime();
        }

        updateSystemTime() {
            const systemTimeElement = document.getElementById('system-time');
            if (systemTimeElement) {
                const now = new Date();
                const timeString = now.toLocaleTimeString(currentLang === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' });
                const dateString = now.toLocaleDateString(currentLang === 'ar' ? 'ar-SA' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                systemTimeElement.textContent = `${timeString} - ${dateString}`;
            }
        }

        showLoading() {
            const container = document.getElementById('emails-list');
            if (container) {
                container.innerHTML = '<div class="loading-spinner" style="text-align:center; padding:2rem;"><i class="fas fa-spinner fa-spin"></i> جاري التحميل...</div>';
            }
        }
    }

    window.emailManager = new EmailManager();
})();