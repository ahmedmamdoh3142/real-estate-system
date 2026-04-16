// chat.js - نظام التواصل الفوري مع اتصال حقيقي بقاعدة البيانات
// تم التعديل: إصلاح أخطاء العناصر غير الموجودة (null references)
// وإضافة فحص أمان لجميع الـ Event Listeners

(function() {
    'use strict';

    console.log('✅ chat.js Loaded - Enhanced Authentication & Stability (Fixed Null Issues)');

    // ========== نظام الترجمة (مثل TaskFlow Pro) ==========
    const translations = {
        ar: {
            loading: "جاري التحميل...",
            noChats: "لا توجد محادثات",
            noContacts: "لا توجد جهات اتصال",
            noMessages: "لا توجد رسائل",
            online: "متصل الآن",
            offline: "غير متصل",
            participants: "مشارك",
            participantsCount: "{count} مشارك",
            group: "مجموعة",
            privateChat: "محادثة خاصة",
            image: "صورة",
            file: "ملف",
            voice: "رسالة صوتية",
            send: "إرسال",
            attach: "إرفاق",
            emoji: "ابتسامة",
            newChat: "محادثة جديدة",
            newGroup: "مجموعة جديدة",
            createGroup: "إنشاء مجموعة",
            cancel: "إلغاء",
            close: "إغلاق",
            save: "حفظ",
            delete: "حذف",
            leave: "مغادرة",
            add: "إضافة",
            remove: "إزالة",
            edit: "تعديل",
            success: "نجاح",
            error: "خطأ",
            warning: "تحذير",
            info: "معلومات",
            messageSent: "تم إرسال الرسالة",
            fileUploaded: "تم رفع الملف",
            groupCreated: "تم إنشاء المجموعة بنجاح",
            groupLeft: "تمت المغادرة بنجاح",
            chatDeleted: "تم حذف المحادثة",
            participantAdded: "تمت إضافة الأعضاء",
            participantRemoved: "تمت إزالة العضو",
            groupNameUpdated: "تم تحديث اسم المجموعة",
            groupAvatarUpdated: "تم تحديث صورة المجموعة",
            groupInfo: "معلومات المجموعة",
            members: "الأعضاء",
            addMembers: "إضافة أعضاء",
            confirmTitle: "تأكيد",
            confirmLeave: "هل أنت متأكد من مغادرة المجموعة؟",
            confirmDelete: "هل أنت متأكد من حذف المجموعة؟ سيتم حذفها نهائياً.",
            confirmRemoveMember: "هل أنت متأكد من إزالة هذا العضو من المجموعة؟",
            groupNamePlaceholder: "اسم المجموعة",
            searchPlaceholder: "بحث...",
            searchEmployee: "ابحث عن موظف...",
            you: "أنت",
            now: "الآن",
            ago: "منذ",
            minute: "دقيقة",
            hour: "ساعة",
            day: "يوم",
            yesterday: "أمس",
            required: "مطلوب",
            selectAtLeastOne: "يجب اختيار مشارك واحد على الأقل",
            noEmployeesFound: "لا يوجد موظفون بهذا الاسم",
            backToMyChats: "العودة لشاتاتي",
            imageView: "عرض الصورة",
            download: "تحميل",
            changePhoto: "تغيير الصورة",
            selectParticipants: "اختر المشاركين",
            searchPeople: "ابحث عن أشخاص...",
            groupName: "اسم المجموعة",
            enterGroupName: "أدخل اسم المجموعة",
            create: "إنشاء",
            failedToLoadEmployees: "فشل تحميل قائمة الموظفين",
            failedToLoadChats: "فشل تحميل المحادثات",
            failedToLoadMessages: "فشل تحميل الرسائل",
            failedToSend: "فشل الإرسال",
            failedToCreateGroup: "فشل إنشاء المجموعة",
            failedToLeave: "فشلت المغادرة",
            failedToDelete: "فشل الحذف",
            failedToAddMember: "فشلت إضافة العضو",
            failedToRemoveMember: "فشلت إزالة العضو",
            failedToUpdateGroupName: "فشل تحديث اسم المجموعة",
            failedToUpdateGroupAvatar: "فشل تحديث صورة المجموعة",
            failedToLoadParticipants: "فشل تحميل قائمة الأعضاء",
            chatArea: "منطقة المحادثة",
            welcomeTitle: "التواصل الفوري",
            welcomeDescription: "اختر محادثة من القائمة لبدء الدردشة",
            startChat: "بدء محادثة جديدة",
            typeMessage: "اكتب رسالة...",
            attachFile: "إرفاق",
            searchContacts: "ابحث عن شخص...",
            participantsCountLabel: "{count} مشارك",
            creationDate: "تاريخ الإنشاء:",
            removeParticipant: "إزالة",
            noParticipantsFound: "لا يوجد أعضاء",
            addMember: "إضافة عضو",
            noUsersFound: "لا يوجد مستخدمون",
            groupAvatar: "صورة المجموعة",
            editGroupName: "تعديل اسم المجموعة",
            saveChanges: "حفظ التغييرات",
            viewingMode: "وضع المشاهدة - لا يمكنك إرسال رسائل",
            reply: "رد",
            replyingTo: "الرد على: {name}",
            cancelReply: "إلغاء الرد",
            globalSearch: "بحث عام",
            globalSearchPlaceholder: "ابحث في جميع المحادثات...",
            noResultsFound: "لا توجد نتائج",
            searchInChat: "بحث في المحادثة",
            previousMatch: "السابق",
            nextMatch: "التالي",
            matchCount: "{current} من {total}",
            recordVoice: "تسجيل صوتي",
            holdToRecord: "اضغط مع الاستمرار للتسجيل",
            releaseToSend: "ارفع لإرسال التسجيل",
            cancelRecord: "إلغاء التسجيل",
            voiceMessage: "رسالة صوتية",
            seconds: "ثانية",
            chatInfo: "معلومات الشات",
            media: "الوسائط",
            files: "الملفات",
            voiceMessages: "الصوتيات",
            noMedia: "لا توجد وسائط",
            noFiles: "لا توجد ملفات",
            noVoiceMessages: "لا توجد رسائل صوتية",
            noMembers: "لا يوجد أعضاء"
        },
        en: {
            loading: "Loading...",
            noChats: "No chats",
            noContacts: "No contacts",
            noMessages: "No messages",
            online: "Online",
            offline: "Offline",
            participants: "participants",
            participantsCount: "{count} participants",
            group: "Group",
            privateChat: "Private chat",
            image: "Image",
            file: "File",
            voice: "Voice message",
            send: "Send",
            attach: "Attach",
            emoji: "Emoji",
            newChat: "New chat",
            newGroup: "New group",
            createGroup: "Create group",
            cancel: "Cancel",
            close: "Close",
            save: "Save",
            delete: "Delete",
            leave: "Leave",
            add: "Add",
            remove: "Remove",
            edit: "Edit",
            success: "Success",
            error: "Error",
            warning: "Warning",
            info: "Info",
            messageSent: "Message sent",
            fileUploaded: "File uploaded",
            groupCreated: "Group created successfully",
            groupLeft: "Left group successfully",
            chatDeleted: "Chat deleted",
            participantAdded: "Members added",
            participantRemoved: "Member removed",
            groupNameUpdated: "Group name updated",
            groupAvatarUpdated: "Group avatar updated",
            groupInfo: "Group info",
            members: "Members",
            addMembers: "Add members",
            confirmTitle: "Confirm",
            confirmLeave: "Are you sure you want to leave the group?",
            confirmDelete: "Are you sure you want to delete the group? It will be permanently deleted.",
            confirmRemoveMember: "Are you sure you want to remove this member from the group?",
            groupNamePlaceholder: "Group name",
            searchPlaceholder: "Search...",
            searchEmployee: "Search employee...",
            you: "You",
            now: "now",
            ago: "ago",
            minute: "minute",
            hour: "hour",
            day: "day",
            yesterday: "yesterday",
            required: "required",
            selectAtLeastOne: "You must select at least one participant",
            noEmployeesFound: "No employees found with that name",
            backToMyChats: "Back to my chats",
            imageView: "View Image",
            download: "Download",
            changePhoto: "Change photo",
            selectParticipants: "Select participants",
            searchPeople: "Search people...",
            groupName: "Group name",
            enterGroupName: "Enter group name",
            create: "Create",
            failedToLoadEmployees: "Failed to load employees list",
            failedToLoadChats: "Failed to load chats",
            failedToLoadMessages: "Failed to load messages",
            failedToSend: "Failed to send",
            failedToCreateGroup: "Failed to create group",
            failedToLeave: "Failed to leave group",
            failedToDelete: "Failed to delete",
            failedToAddMember: "Failed to add member",
            failedToRemoveMember: "Failed to remove member",
            failedToUpdateGroupName: "Failed to update group name",
            failedToUpdateGroupAvatar: "Failed to update group avatar",
            failedToLoadParticipants: "Failed to load participants list",
            chatArea: "Chat area",
            welcomeTitle: "Instant Messaging",
            welcomeDescription: "Select a chat from the list to start messaging",
            startChat: "Start new chat",
            typeMessage: "Type a message...",
            attachFile: "Attach file",
            searchContacts: "Search for a person...",
            participantsCountLabel: "{count} participants",
            creationDate: "Creation date:",
            removeParticipant: "Remove",
            noParticipantsFound: "No participants found",
            addMember: "Add member",
            noUsersFound: "No users found",
            groupAvatar: "Group avatar",
            editGroupName: "Edit group name",
            saveChanges: "Save changes",
            viewingMode: "Viewing mode - you cannot send messages",
            reply: "Reply",
            replyingTo: "Replying to: {name}",
            cancelReply: "Cancel reply",
            globalSearch: "Global search",
            globalSearchPlaceholder: "Search all chats...",
            noResultsFound: "No results found",
            searchInChat: "Search in chat",
            previousMatch: "Previous",
            nextMatch: "Next",
            matchCount: "{current} of {total}",
            recordVoice: "Record voice",
            holdToRecord: "Hold to record",
            releaseToSend: "Release to send",
            cancelRecord: "Cancel recording",
            voiceMessage: "Voice message",
            seconds: "sec",
            chatInfo: "Chat info",
            media: "Media",
            files: "Files",
            voiceMessages: "Voice messages",
            noMedia: "No media",
            noFiles: "No files",
            noVoiceMessages: "No voice messages",
            noMembers: "No members"
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
                        el.textContent = translations[currentLang][key];
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
        updateDynamicTexts();
    }

    function updateDynamicTexts() {
        const confirmTitle = document.getElementById('confirm-title');
        if (confirmTitle && confirmTitle.dataset.i18n) {
            confirmTitle.textContent = translations[currentLang][confirmTitle.dataset.i18n] || confirmTitle.textContent;
        }
        const confirmMessage = document.getElementById('confirm-message');
        if (confirmMessage && confirmMessage.dataset.i18n) {
            confirmMessage.textContent = translations[currentLang][confirmMessage.dataset.i18n] || confirmMessage.textContent;
        }
        const confirmOkBtn = document.getElementById('confirm-ok');
        if (confirmOkBtn && confirmOkBtn.dataset.i18n) {
            confirmOkBtn.textContent = translations[currentLang][confirmOkBtn.dataset.i18n] || confirmOkBtn.textContent;
        }
        const confirmCancelBtn = document.getElementById('confirm-cancel');
        if (confirmCancelBtn && confirmCancelBtn.dataset.i18n) {
            confirmCancelBtn.textContent = translations[currentLang][confirmCancelBtn.dataset.i18n] || confirmCancelBtn.textContent;
        }
    }

    function translate(key, options = {}) {
        let text = translations[currentLang][key];
        if (!text) return key;
        if (options) {
            Object.keys(options).forEach(k => {
                text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), options[k]);
            });
        }
        return text;
    }

    class ChatManager {
        constructor() {
            this.baseURL = '';
            this.apiClient = null;
            this.currentUser = null;
            this.allUsers = [];
            this.chats = [];
            this.activeChatId = null;
            this.activeChatType = null;
            this.activeChatCreatorId = null;
            this.viewingUserId = null;
            this.pollingInterval = null;
            this.confirmResolve = null;

            this.replyToMessage = null;

            this.searchMatches = [];
            this.currentMatchIndex = -1;
            this.isSearchActive = false;
            this.searchQuery = '';

            this.mediaRecorder = null;
            this.audioChunks = [];
            this.isRecording = false;
            this.recordStartTime = null;
            this.recordTimer = null;
            this.recordingBlob = null;
            this.recordingDuration = 0;
            this.audioStream = null;

            this.currentAudio = null;
            this.currentVoiceElement = null;

            // تعريف جميع العناصر التي سيتم استخدامها، مع تعيينها لاحقاً
            this.elements = {};

            currentLang = getCurrentLanguage();
            setLanguage(currentLang);
            this.init();
        }

        // Helper method to safely get element by ID or selector
        safeGetElement(selector, isId = true) {
            const element = isId ? document.getElementById(selector) : document.querySelector(selector);
            if (!element) {
                console.warn(`⚠️ Element not found: ${selector}`);
            }
            return element;
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

        // ========== جلب التوكن من localStorage ==========
        getAuthToken() {
            try {
                let token = localStorage.getItem('auth_token');
                if (token && token !== 'undefined' && token !== 'null') {
                    token = token.trim();
                    return token;
                }
                const userData = this.getCurrentUser();
                if (userData && userData.token && userData.token !== 'undefined') {
                    let t = userData.token.trim();
                    return t;
                }
                return null;
            } catch (error) {
                console.error('❌ خطأ في قراءة التوكن:', error);
            }
            return null;
        }

        async setupApiClient() {
            if (window.API && typeof window.API.request === 'function') {
                this.apiClient = window.API;
                console.log('✅ Using global API client');
            } else {
                console.log('⚠️ Global API client not found, using custom fetch client');
                const self = this;
                this.apiClient = {
                    request: async (endpoint, options = {}) => {
                        const token = self.getAuthToken();
                        const url = `${self.baseURL}${endpoint}`;
                        const headers = {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
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
                                delete headers['Content-Type'];
                                config.body = options.body;
                            } else {
                                config.body = JSON.stringify(options.body);
                            }
                        }

                        const response = await fetch(url, config);
                        const data = await response.json();
                        if (!response.ok) {
                            if (response.status === 401) {
                                localStorage.removeItem('auth_token');
                                localStorage.removeItem('user_data');
                                window.location.href = '../login/index.html';
                                throw new Error('جلسة غير صالحة، يرجى تسجيل الدخول مرة أخرى');
                            }
                            throw new Error(data.message || translate('error'));
                        }
                        return data;
                    }
                };
            }
        }

        async loadAllUsers() {
            if (this.currentUser.role !== 'مشرف_عام') {
                return;
            }
            try {
                const response = await this.apiClient.request('/api/admin/chat/users/all');
                this.allUsers = response.data || [];
                this.updateEmployeeSearchVisibility();
            } catch (error) {
                console.error('❌ Error loading all users:', error);
                this.showNotification('error', translate('error'), translate('failedToLoadEmployees'));
            }
        }

        async loadChats() {
            try {
                let url = '/api/admin/chat';
                if (this.viewingUserId && this.viewingUserId !== this.currentUser.id && this.currentUser.role === 'مشرف_عام') {
                    url += `?viewingUserId=${this.viewingUserId}`;
                }
                const response = await this.apiClient.request(url);
                this.chats = response.data || [];
                this.renderChatsList();
            } catch (error) {
                console.error('❌ Error loading chats:', error);
                this.showNotification('error', translate('error'), translate('failedToLoadChats'));
                throw error;
            }
        }

        async loadMessages(chatId) {
            try {
                let url = `/api/admin/chat/${chatId}/messages`;
                if (this.viewingUserId && this.viewingUserId !== this.currentUser.id && this.currentUser.role === 'مشرف_عام') {
                    url += `?viewingUserId=${this.viewingUserId}`;
                }
                const response = await this.apiClient.request(url);
                const messages = response.data || [];
                this.renderMessages(messages);
                await this.markMessagesAsRead(chatId);
                this.scrollToBottom();
                this.clearLocalSearch();
            } catch (error) {
                console.error('❌ Error loading messages:', error);
                this.showNotification('error', translate('error'), translate('failedToLoadMessages'));
            }
        }

        async markMessagesAsRead(chatId) {
            try {
                let url = `/api/admin/chat/${chatId}/read`;
                if (this.viewingUserId && this.viewingUserId !== this.currentUser.id && this.currentUser.role === 'مشرف_عام') {
                    url += `?viewingUserId=${this.viewingUserId}`;
                }
                await this.apiClient.request(url, { method: 'POST' });
                await this.loadChats();
            } catch (error) {
                console.error('❌ Error marking messages as read:', error);
            }
        }

        async sendTextMessage(chatId, content, replyToId = null) {
            if (this.viewingUserId && this.viewingUserId !== this.currentUser.id) {
                this.showNotification('warning', translate('warning'), translate('viewingMode'));
                return false;
            }

            const localMessage = {
                id: Date.now(),
                chatId: chatId,
                senderId: this.currentUser.id,
                senderName: this.currentUser.fullName,
                content: content,
                messageType: 'text',
                createdAt: new Date().toISOString(),
                isReadByAll: false,
                replyTo: null
            };
            if (replyToId && this.replyToMessage) {
                localMessage.replyTo = {
                    id: replyToId,
                    senderName: this.replyToMessage.senderName,
                    content: this.replyToMessage.preview,
                    messageType: 'text'
                };
            }
            this.appendMessageToActiveChat(localMessage);
            this.scrollToBottom();

            try {
                const body = { content };
                if (replyToId) body.replyToId = replyToId;
                const response = await this.apiClient.request(`/api/admin/chat/${chatId}/messages/text`, {
                    method: 'POST',
                    body
                });
                const newMessage = response.data;
                const tempMsg = this.elements.messagesList?.querySelector(`.message[data-msg-id="${localMessage.id}"]`);
                if (tempMsg) {
                    tempMsg.setAttribute('data-msg-id', newMessage.id);
                }
                this.updateChatsListAfterSend(chatId, newMessage);
                return true;
            } catch (error) {
                console.error('❌ Error sending message:', error);
                this.showNotification('error', translate('error'), translate('failedToSend'));
                const failedMsg = this.elements.messagesList?.querySelector(`.message[data-msg-id="${localMessage.id}"]`);
                if (failedMsg) failedMsg.remove();
                return false;
            }
        }

        async sendFileMessage(chatId, file, textContent = null, replyToId = null) {
            if (this.viewingUserId && this.viewingUserId !== this.currentUser.id) {
                this.showNotification('warning', translate('warning'), translate('viewingMode'));
                return false;
            }

            const duration = file.duration || null;

            const localMessage = {
                id: Date.now(),
                chatId: chatId,
                senderId: this.currentUser.id,
                senderName: this.currentUser.fullName,
                content: textContent || '',
                messageType: file.type && file.type.startsWith('audio/') ? 'voice' : (file.type && file.type.startsWith('image/') ? 'image' : 'file'),
                createdAt: new Date().toISOString(),
                isReadByAll: false,
                replyTo: null,
                fileName: file.name,
                fileSize: file.size,
                fileUrl: '#',
                duration: duration
            };
            if (replyToId && this.replyToMessage) {
                localMessage.replyTo = {
                    id: replyToId,
                    senderName: this.replyToMessage.senderName,
                    content: this.replyToMessage.preview,
                    messageType: 'text'
                };
            }
            this.appendMessageToActiveChat(localMessage);
            this.scrollToBottom();

            const formData = new FormData();
            formData.append('file', file);
            if (textContent) formData.append('content', textContent);
            if (replyToId) formData.append('replyToId', replyToId);
            if (duration) formData.append('duration', duration);
            try {
                const response = await this.apiClient.request(`/api/admin/chat/${chatId}/messages/file`, {
                    method: 'POST',
                    body: formData
                });
                const newMessage = response.data;
                const tempMsg = this.elements.messagesList?.querySelector(`.message[data-msg-id="${localMessage.id}"]`);
                if (tempMsg) {
                    const isOutgoing = true;
                    const newHtml = this.renderMessageHtml(newMessage, isOutgoing, this.activeChatType);
                    tempMsg.outerHTML = newHtml;
                }
                this.updateChatsListAfterSend(chatId, newMessage);
                return true;
            } catch (error) {
                console.error('❌ Error sending file:', error);
                this.showNotification('error', translate('error'), translate('failedToSend'));
                const failedMsg = this.elements.messagesList?.querySelector(`.message[data-msg-id="${localMessage.id}"]`);
                if (failedMsg) failedMsg.remove();
                return false;
            }
        }

        appendMessageToActiveChat(message) {
            if (this.activeChatId !== message.chatId) return;
            const container = this.elements.messagesList;
            if (!container) return;
            const isOutgoing = this.isOutgoingMessage(message.senderId);
            const messageHtml = this.renderMessageHtml(message, isOutgoing, this.activeChatType);
            container.insertAdjacentHTML('beforeend', messageHtml);
            this.scrollToBottom();
        }

        scrollToBottom() {
            if (this.elements.messagesContainer) {
                this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;
            }
        }

        updateChatsListAfterSend(chatId, newMessage) {
            const chatIndex = this.chats.findIndex(c => c.id === chatId);
            if (chatIndex !== -1) {
                let lastMessageText = '';
                if (newMessage.messageType === 'image') lastMessageText = translate('image');
                else if (newMessage.messageType === 'file') lastMessageText = translate('file');
                else if (newMessage.messageType === 'voice') lastMessageText = translate('voiceMessage');
                else lastMessageText = newMessage.content || '';
                this.chats[chatIndex].lastMessage = lastMessageText;
                this.chats[chatIndex].lastMessageType = newMessage.messageType;
                this.chats[chatIndex].lastMessageTime = newMessage.createdAt;
                this.chats[chatIndex].lastMessageSenderId = newMessage.senderId;
                this.chats.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
                this.renderChatsList();
            }
        }

        async startPrivateChat(contactId) {
            try {
                const response = await this.apiClient.request('/api/admin/chat/private', {
                    method: 'POST',
                    body: { contactId }
                });
                const { chatId, existing } = response.data;
                if (existing) {
                    this.setActiveChat(chatId);
                } else {
                    await this.loadChats();
                    this.setActiveChat(chatId);
                }
            } catch (error) {
                console.error('❌ Error starting private chat:', error);
                this.showNotification('error', translate('error'), error.message);
            }
        }

        async createGroup(groupName, participantIds, avatarFile = null) {
            try {
                const response = await this.apiClient.request('/api/admin/chat/group', {
                    method: 'POST',
                    body: { groupName, participantIds }
                });
                const { chatId } = response.data;
                if (avatarFile) {
                    const formData = new FormData();
                    formData.append('avatar', avatarFile);
                    await this.apiClient.request(`/api/admin/chat/${chatId}/avatar`, {
                        method: 'POST',
                        body: formData
                    });
                }
                await this.loadChats();
                this.setActiveChat(chatId);
                this.showNotification('success', translate('success'), translate('groupCreated'));
                return true;
            } catch (error) {
                console.error('❌ Error creating group:', error);
                this.showNotification('error', translate('error'), translate('failedToCreateGroup'));
                return false;
            }
        }

        async leaveGroup(chatId) {
            try {
                await this.apiClient.request(`/api/admin/chat/${chatId}/leave`, { method: 'DELETE' });
                await this.loadChats();
                if (this.activeChatId === chatId) {
                    this.activeChatId = null;
                    this.activeChatType = null;
                    if (this.elements.welcomeScreen) this.elements.welcomeScreen.style.display = 'flex';
                    if (this.elements.chatHeader) this.elements.chatHeader.style.display = 'none';
                    if (this.elements.messagesContainer) this.elements.messagesContainer.style.display = 'none';
                    if (this.elements.messageInputArea) this.elements.messageInputArea.style.display = 'none';
                }
                this.showNotification('success', translate('success'), translate('groupLeft'));
            } catch (error) {
                console.error('❌ Error leaving group:', error);
                this.showNotification('error', translate('error'), translate('failedToLeave'));
            }
        }

        async deleteChat(chatId) {
            try {
                await this.apiClient.request(`/api/admin/chat/${chatId}`, { method: 'DELETE' });
                await this.loadChats();
                if (this.activeChatId === chatId) {
                    this.activeChatId = null;
                    this.activeChatType = null;
                    if (this.elements.welcomeScreen) this.elements.welcomeScreen.style.display = 'flex';
                    if (this.elements.chatHeader) this.elements.chatHeader.style.display = 'none';
                    if (this.elements.messagesContainer) this.elements.messagesContainer.style.display = 'none';
                    if (this.elements.messageInputArea) this.elements.messageInputArea.style.display = 'none';
                }
                this.showNotification('success', translate('success'), translate('chatDeleted'));
            } catch (error) {
                console.error('❌ Error deleting chat:', error);
                this.showNotification('error', translate('error'), translate('failedToDelete'));
            }
        }

        async switchViewToUser(userId) {
            if (userId === this.viewingUserId) return;
            if (this.currentUser.role !== 'مشرف_عام') {
                this.showNotification('error', translate('error'), 'ليس لديك صلاحية عرض شاتات الآخرين');
                return;
            }
            this.viewingUserId = userId;
            await this.loadChats();
            this.activeChatId = null;
            this.activeChatType = null;
            if (this.elements.welcomeScreen) this.elements.welcomeScreen.style.display = 'flex';
            if (this.elements.chatHeader) this.elements.chatHeader.style.display = 'none';
            if (this.elements.messagesContainer) this.elements.messagesContainer.style.display = 'none';
            if (this.elements.messageInputArea) this.elements.messageInputArea.style.display = 'none';
            this.updateViewIndicator();
            this.updateInputAreaForViewingMode();
            this.showNotification('success', `عرض شاتات ${this.getUserNameById(userId)}`, '');
        }

        resetViewToCurrentUser() {
            if (this.viewingUserId === this.currentUser.id) return;
            this.viewingUserId = this.currentUser.id;
            this.loadChats();
            this.activeChatId = null;
            this.activeChatType = null;
            if (this.elements.welcomeScreen) this.elements.welcomeScreen.style.display = 'flex';
            if (this.elements.chatHeader) this.elements.chatHeader.style.display = 'none';
            if (this.elements.messagesContainer) this.elements.messagesContainer.style.display = 'none';
            if (this.elements.messageInputArea) this.elements.messageInputArea.style.display = 'none';
            this.updateViewIndicator();
            this.updateInputAreaForViewingMode();
            this.showNotification('info', translate('info'), '');
        }

        updateViewIndicator() {
            if (!this.elements.currentViewIndicator) return;
            if (!this.viewingUserId || this.viewingUserId === this.currentUser.id) {
                this.elements.currentViewIndicator.style.display = 'none';
            } else {
                this.elements.currentViewIndicator.style.display = 'flex';
                const userName = this.getUserNameById(this.viewingUserId);
                if (this.elements.viewingUserName) this.elements.viewingUserName.textContent = userName;
            }
        }

        updateInputAreaForViewingMode() {
            if (!this.elements.messageInput) return;
            const isViewing = (this.viewingUserId && this.viewingUserId !== this.currentUser.id);
            if (isViewing) {
                this.elements.messageInput.disabled = true;
                if (this.elements.sendBtn) this.elements.sendBtn.disabled = true;
                if (this.elements.attachBtn) this.elements.attachBtn.disabled = true;
                if (this.elements.voiceRecordBtn) this.elements.voiceRecordBtn.disabled = true;
                this.elements.messageInput.placeholder = translate('viewingMode');
                if (this.elements.chatStatus) {
                    this.elements.chatStatus.innerHTML = `<span class="viewing-badge">${translate('viewingMode')}</span>`;
                }
            } else {
                this.elements.messageInput.disabled = false;
                if (this.elements.sendBtn) this.elements.sendBtn.disabled = false;
                if (this.elements.attachBtn) this.elements.attachBtn.disabled = false;
                if (this.elements.voiceRecordBtn) this.elements.voiceRecordBtn.disabled = false;
                this.elements.messageInput.placeholder = translate('typeMessage');
                if (this.activeChatType === 'group' && this.elements.chatStatus) {
                    this.elements.chatStatus.textContent = translate('participantsCount', { count: this.chats.find(c => c.id === this.activeChatId)?.participantsCount || 0 });
                } else if (this.elements.chatStatus) {
                    this.elements.chatStatus.textContent = '';
                }
            }
        }

        getUserNameById(userId) {
            if (this.allUsers.length) {
                const user = this.allUsers.find(u => u.id === userId);
                if (user) return user.fullName;
            }
            return `مستخدم ${userId}`;
        }

        async searchEmployees(query) {
            if (!query || query.trim() === '') {
                this.hideEmployeeSearchResults();
                return;
            }
            let results = this.allUsers.filter(u =>
                u.fullName.toLowerCase().includes(query.toLowerCase()) ||
                (u.email && u.email.toLowerCase().includes(query.toLowerCase()))
            );
            this.renderEmployeeSearchResults(results);
        }

        renderEmployeeSearchResults(results) {
            const container = this.elements.employeeSearchResults;
            if (!container) return;
            if (results.length === 0) {
                container.innerHTML = `<div class="no-results">${translate('noEmployeesFound')}</div>`;
                container.classList.add('show');
                return;
            }
            let html = '';
            results.forEach(user => {
                const isActive = user.id === this.viewingUserId ? 'active' : '';
                const avatarLetter = this.getAvatarLetter(user.fullName);
                html += `
                    <div class="result-item ${isActive}" data-user-id="${user.id}">
                        <div class="result-avatar">${avatarLetter}</div>
                        <div class="result-info">
                            <div class="result-name">${this.escapeHtml(user.fullName)}</div>
                            <div class="result-role">${user.role}</div>
                        </div>
                        ${user.id === this.viewingUserId ? '<i class="fas fa-check" style="color:var(--color-accent); margin-right:auto;"></i>' : ''}
                    </div>
                `;
            });
            container.innerHTML = html;
            container.classList.add('show');
            container.querySelectorAll('.result-item').forEach(item => {
                item.addEventListener('click', () => {
                    const userId = parseInt(item.dataset.userId);
                    this.switchViewToUser(userId);
                });
            });
        }

        hideEmployeeSearchResults() {
            if (this.elements.employeeSearchResults) {
                this.elements.employeeSearchResults.classList.remove('show');
            }
        }

        async searchUsersForNewChat(query) {
            if (!query || query.length < 2) return [];
            try {
                const response = await this.apiClient.request(`/api/admin/chat/users/search?q=${encodeURIComponent(query)}`);
                return response.data || [];
            } catch (error) {
                console.error('❌ Error searching users:', error);
                return [];
            }
        }

        async renderContacts(filter = '') {
            if (!this.elements.contactsList) return;
            let contacts = [];
            if (filter.length >= 2) {
                contacts = await this.searchUsersForNewChat(filter);
            } else {
                if (this.allUsers.length) {
                    contacts = this.allUsers.filter(u => u.id !== this.currentUser.id);
                }
            }
            let html = '';
            contacts.forEach(contact => {
                html += `
                    <div class="contact-item" data-contact-id="${contact.id}">
                        <div class="contact-avatar">${this.getAvatarLetter(contact.fullName)}</div>
                        <div class="contact-info">
                            <div class="contact-name">${this.escapeHtml(contact.fullName)}</div>
                            <div class="contact-role">${contact.role}</div>
                        </div>
                    </div>
                `;
            });
            if (contacts.length === 0) {
                html = `<div class="empty-contacts">${translate('noContacts')}</div>`;
            }
            this.elements.contactsList.innerHTML = html;
            document.querySelectorAll('.contact-item').forEach(item => {
                item.addEventListener('click', () => {
                    const contactId = parseInt(item.dataset.contactId);
                    this.startPrivateChat(contactId);
                    this.closeModal(this.elements.newChatModal);
                });
            });
        }

        async renderParticipants(filter = '') {
            if (!this.elements.participantsList) return;
            let users = [];
            if (filter.length >= 2) {
                users = await this.searchUsersForNewChat(filter);
            } else {
                if (this.allUsers.length) {
                    users = this.allUsers.filter(u => u.id !== this.currentUser.id);
                }
            }
            let html = '';
            users.forEach(user => {
                html += `
                    <div class="participant-item">
                        <input type="checkbox" id="participant-${user.id}" value="${user.id}">
                        <label for="participant-${user.id}">${this.escapeHtml(user.fullName)} (${user.role})</label>
                    </div>
                `;
            });
            if (users.length === 0) {
                html = `<div>${translate('noContacts')}</div>`;
            }
            this.elements.participantsList.innerHTML = html;
        }

        renderChatsList() {
            if (!this.elements.chatsList) return;
            let html = '';
            const activeUserId = this.getActiveUserId();
            this.chats.forEach(chat => {
                const isActive = chat.id === this.activeChatId ? 'active' : '';
                let lastMessageText = '';
                if (chat.lastMessageType === 'image') {
                    lastMessageText = `📷 ${translate('image')}`;
                } else if (chat.lastMessageType === 'file') {
                    lastMessageText = `📎 ${translate('file')}`;
                } else if (chat.lastMessageType === 'voice') {
                    lastMessageText = `🎤 ${translate('voiceMessage')}`;
                } else {
                    lastMessageText = chat.lastMessage || translate('noMessages');
                }
                const lastTime = this.formatTimeRelative(chat.lastMessageTime);
                const unreadBadge = chat.unreadCount > 0 ? `<span class="unread-badge">${chat.unreadCount}</span>` : '';
                const avatarLetter = this.getAvatarLetter(chat.chatName || (chat.chatType === 'private' ? chat.otherParticipantName : translate('group')));
                const chatName = chat.chatType === 'private' ? (chat.otherParticipantName || translate('privateChat')) : (chat.chatName || translate('group'));
                let avatarHtml = '';
                if (chat.avatar) {
                    avatarHtml = `<img src="${this.baseURL}${chat.avatar}" alt="${chatName}" style="width:50px;height:50px;border-radius:50%;object-fit:cover;">`;
                } else {
                    avatarHtml = `<div class="avatar-placeholder ${chat.chatType === 'group' ? 'group-avatar' : ''}">${avatarLetter}</div>`;
                }
                html += `
                    <div class="chat-item ${isActive}" data-chat-id="${chat.id}">
                        <div class="chat-item-avatar">
                            ${avatarHtml}
                        </div>
                        <div class="chat-item-info">
                            <div class="chat-item-header">
                                <span class="chat-item-name">${this.escapeHtml(chatName)} ${chat.chatType === 'group' ? '<i class="fas fa-users" style="font-size:0.8rem; margin-right:0.3rem;"></i>' : ''}</span>
                                <span class="chat-item-time">${lastTime}</span>
                            </div>
                            <div class="chat-item-last-message">
                                ${chat.lastMessageSenderId === activeUserId ? '<i class="fas fa-check"></i>' : ''}
                                <span>${this.truncate(lastMessageText, 50)}</span>
                            </div>
                        </div>
                        ${unreadBadge}
                    </div>
                `;
            });
            if (this.chats.length === 0) {
                html = '<div class="empty-chats" style="text-align:center; padding:2rem; color:var(--color-text-secondary);">' + translate('noChats') + '</div>';
            }
            this.elements.chatsList.innerHTML = html;
            document.querySelectorAll('.chat-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    const chatId = parseInt(item.dataset.chatId);
                    this.setActiveChat(chatId);
                });
            });
        }

        async setActiveChat(chatId) {
            const chat = this.chats.find(c => c.id === chatId);
            if (!chat) return;
            this.activeChatId = chatId;
            this.activeChatType = chat.chatType;
            this.activeChatCreatorId = chat.createdBy;
            document.querySelectorAll('.chat-item').forEach(el => el.classList.remove('active'));
            const activeChatItem = document.querySelector(`.chat-item[data-chat-id="${chatId}"]`);
            if (activeChatItem) activeChatItem.classList.add('active');
            if (this.elements.welcomeScreen) this.elements.welcomeScreen.style.display = 'none';
            if (this.elements.chatHeader) this.elements.chatHeader.style.display = 'flex';
            if (this.elements.messagesContainer) this.elements.messagesContainer.style.display = 'block';
            if (this.elements.messageInputArea) this.elements.messageInputArea.style.display = 'block';
            const chatName = chat.chatType === 'private' ? (chat.otherParticipantName || translate('privateChat')) : (chat.chatName || translate('group'));
            if (this.elements.chatName) this.elements.chatName.textContent = chatName;
            if (chat.avatar) {
                if (this.elements.chatAvatarImg) {
                    this.elements.chatAvatarImg.src = this.baseURL + chat.avatar;
                    this.elements.chatAvatarImg.style.display = 'block';
                }
                if (this.elements.chatAvatarPlaceholder) this.elements.chatAvatarPlaceholder.style.display = 'none';
            } else {
                if (this.elements.chatAvatarImg) this.elements.chatAvatarImg.style.display = 'none';
                if (this.elements.chatAvatarPlaceholder) {
                    this.elements.chatAvatarPlaceholder.style.display = 'flex';
                    this.elements.chatAvatarPlaceholder.textContent = this.getAvatarLetter(chatName);
                }
            }
            if (chat.chatType === 'group') {
                if (this.elements.chatStatus) this.elements.chatStatus.textContent = translate('participantsCount', { count: chat.participantsCount });
                if (this.elements.chatHeaderInfo) this.elements.chatHeaderInfo.style.cursor = 'pointer';
            } else {
                const status = chat.otherParticipantStatus === 'online' ? translate('online') : translate('offline');
                if (this.elements.chatStatus) this.elements.chatStatus.textContent = status;
                if (this.elements.chatHeaderInfo) this.elements.chatHeaderInfo.style.cursor = 'default';
            }
            await this.loadMessages(chatId);
            if (this.isMobile() && this.elements.chatArea) {
                this.elements.chatArea.classList.add('active');
                document.body.classList.add('chat-open');
            }
            this.updateInputAreaForViewingMode();
            this.clearReply();
        }

        renderMessages(messages) {
            if (!this.elements.messagesList) return;
            let html = '';
            messages.forEach(msg => {
                const isOutgoing = this.isOutgoingMessage(msg.senderId);
                html += this.renderMessageHtml(msg, isOutgoing, this.activeChatType);
            });
            this.elements.messagesList.innerHTML = html;
            this.scrollToBottom();
        }

        renderMessageHtml(msg, isOutgoing, chatType) {
            const messageClass = isOutgoing ? 'outgoing' : 'incoming';
            const time = this.formatTime(msg.createdAt);
            let statusIcon = '';
            if (isOutgoing) {
                if (msg.isReadByAll) {
                    statusIcon = '<i class="fas fa-check-double" style="color:var(--color-tick);"></i>';
                } else {
                    statusIcon = '<i class="fas fa-check"></i>';
                }
            }
            let content = '';
            let senderNameHtml = '';
            if (chatType === 'group' && !isOutgoing && msg.senderName) {
                senderNameHtml = `<div class="message-sender-name">${this.escapeHtml(msg.senderName)}</div>`;
            }

            let replyHtml = '';
            if (msg.replyTo) {
                const replySender = msg.replyTo.senderName || translate('you');
                const replyText = this.truncate(msg.replyTo.content || (msg.replyTo.messageType === 'image' ? translate('image') : (msg.replyTo.messageType === 'file' ? translate('file') : (msg.replyTo.messageType === 'voice' ? translate('voiceMessage') : ''))), 50);
                replyHtml = `
                    <div class="message-reply" data-reply-to-id="${msg.replyTo.id}">
                        <div class="reply-sender">↩️ ${replySender}</div>
                        <div class="reply-text">${this.escapeHtml(replyText)}</div>
                    </div>
                `;
            }

            if (msg.messageType === 'image') {
                content = `
                    <img src="${this.baseURL}${msg.fileUrl}" class="message-image" alt="${translate('image')}" onclick="window.chatManager.openImageViewer('${this.baseURL}${msg.fileUrl}')">
                `;
                if (msg.content) {
                    content = `<div class="message-text">${this.escapeHtml(msg.content)}</div>` + content;
                }
            } else if (msg.messageType === 'file') {
                const fileSize = this.formatFileSize(msg.fileSize);
                const fileIcon = this.getFileIcon(msg.fileName);
                content = `
                    <div class="message-file" onclick="window.open('${this.baseURL}${msg.fileUrl}')">
                        <i class="fas ${fileIcon}"></i>
                        <div class="message-file-info">
                            <div class="message-file-name">${this.escapeHtml(msg.fileName)}</div>
                            <div class="message-file-size">${fileSize}</div>
                        </div>
                    </div>
                `;
                if (msg.content) {
                    content = `<div class="message-text">${this.escapeHtml(msg.content)}</div>` + content;
                }
            } else if (msg.messageType === 'voice') {
                const duration = msg.duration ? this.formatDuration(msg.duration) : '0:00';
                const audioUrl = this.baseURL + msg.fileUrl;
                const voiceId = `voice-${msg.id}`;
                content = `
                    <div class="message-voice" data-audio-url="${audioUrl}" data-duration="${msg.duration || 0}" data-voice-id="${voiceId}">
                        <button class="voice-play-btn"><i class="fas fa-play"></i></button>
                        <div class="voice-wave"><span></span><span></span><span></span><span></span><span></span></div>
                        <div class="voice-progress-container"><div class="voice-progress"></div></div>
                        <span class="voice-duration">${duration}</span>
                        <span class="voice-time-left" style="display:none;"></span>
                    </div>
                `;
                if (msg.content) {
                    content = `<div class="message-text">${this.escapeHtml(msg.content)}</div>` + content;
                }
            } else {
                content = `<div class="message-text">${this.escapeHtml(msg.content)}</div>`;
            }

            let previewText = '';
            if (msg.messageType === 'image') {
                previewText = translate('image');
            } else if (msg.messageType === 'file') {
                previewText = translate('file');
            } else if (msg.messageType === 'voice') {
                previewText = translate('voiceMessage');
            } else {
                previewText = msg.content || '';
            }
            const replyButton = !isOutgoing ? `<div class="reply-indicator"><button class="reply-btn" data-msg-id="${msg.id}" data-sender="${this.escapeHtml(msg.senderName)}" data-preview="${this.escapeHtml(previewText)}"><i class="fas fa-reply"></i></button></div>` : '';

            return `
                <div class="message ${messageClass}" data-msg-id="${msg.id}">
                    ${replyButton}
                    <div class="message-bubble">
                        ${senderNameHtml}
                        ${replyHtml}
                        ${content}
                        <div class="message-meta">
                            <span class="message-time">${time}</span>
                            <span class="message-status">${statusIcon}</span>
                        </div>
                    </div>
                </div>
            `;
        }

        async sendMessage() {
            if (!this.elements.messageInput) return;
            const text = this.elements.messageInput.value.trim();
            const replyToId = this.replyToMessage ? this.replyToMessage.id : null;
            if (text) {
                await this.sendTextMessage(this.activeChatId, text, replyToId);
                this.elements.messageInput.value = '';
                this.clearReply();
            }
        }

        async sendFile(file, text = null) {
            const replyToId = this.replyToMessage ? this.replyToMessage.id : null;
            if (this.activeChatId) {
                await this.sendFileMessage(this.activeChatId, file, text, replyToId);
                this.clearReply();
            }
        }

        startPolling() {
            this.pollingInterval = setInterval(async () => {
                if (this.activeChatId) {
                    await this.pollNewMessages();
                }
            }, 5000);
        }

        async pollNewMessages() {
            if (!this.activeChatId) return;
            try {
                let url = `/api/admin/chat/${this.activeChatId}/messages?limit=50`;
                if (this.viewingUserId && this.viewingUserId !== this.currentUser.id && this.currentUser.role === 'مشرف_عام') {
                    url += `&viewingUserId=${this.viewingUserId}`;
                }
                const response = await this.apiClient.request(url);
                const newMessages = response.data;
                const currentMessages = Array.from(this.elements.messagesList?.querySelectorAll('.message') || []).map(el => parseInt(el.dataset.msgId));
                const lastMsgId = currentMessages.length ? Math.max(...currentMessages) : 0;
                const newMsgs = newMessages.filter(m => m.id > lastMsgId);
                if (newMsgs.length && this.elements.messagesList) {
                    for (let msg of newMsgs) {
                        const isOutgoing = this.isOutgoingMessage(msg.senderId);
                        const html = this.renderMessageHtml(msg, isOutgoing, this.activeChatType);
                        this.elements.messagesList.insertAdjacentHTML('beforeend', html);
                    }
                    this.scrollToBottom();
                    await this.markMessagesAsRead(this.activeChatId);
                }
                await this.loadChats();
            } catch (error) {
                console.error('Polling error:', error);
            }
        }

        getAvatarLetter(name) {
            if (!name) return '?';
            return name.charAt(0);
        }

        formatTime(timestamp) {
            const date = new Date(timestamp);
            return date.toLocaleTimeString(currentLang === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' });
        }

        formatTimeRelative(timestamp) {
            if (!timestamp) return '';
            const now = new Date();
            const date = new Date(timestamp);
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);
            if (diffMins < 1) return translate('now');
            if (diffMins < 60) return diffMins + ' ' + translate('minute');
            if (diffHours < 24) return diffHours + ' ' + translate('hour');
            if (diffDays === 1) return translate('yesterday');
            return diffDays + ' ' + translate('day');
        }

        formatFileSize(bytes) {
            if (bytes < 1024) return bytes + ' B';
            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
            return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        }

        formatDuration(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        }

        getFileIcon(fileName) {
            const ext = fileName.split('.').pop().toLowerCase();
            const icons = {
                pdf: 'fa-file-pdf',
                doc: 'fa-file-word',
                docx: 'fa-file-word',
                xls: 'fa-file-excel',
                xlsx: 'fa-file-excel',
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

        truncate(str, len) {
            if (!str) return '';
            return str.length > len ? str.substring(0, len) + '…' : str;
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

        isMobile() {
            return window.innerWidth <= 768;
        }

        openModal(modal) {
            if (modal) modal.classList.add('active');
        }

        closeModal(modal) {
            if (modal) modal.classList.remove('active');
        }

        showConfirmation(title, message) {
            return new Promise((resolve) => {
                this.confirmResolve = resolve;
                if (this.elements.confirmTitle) this.elements.confirmTitle.textContent = title;
                if (this.elements.confirmMessage) this.elements.confirmMessage.textContent = message;
                this.openModal(this.elements.confirmationModal);
            });
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

        updateUserInfo() {
            // These elements may not exist in chat.html, so we just skip if not found
            const currentUserName = document.getElementById('current-user-name');
            if (currentUserName && this.currentUser) {
                currentUserName.textContent = this.currentUser.fullName;
            }
            const currentUserRole = document.getElementById('current-user-role');
            if (currentUserRole && this.currentUser) {
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
                currentUserRole.textContent = roleMap[this.currentUser.role] || this.currentUser.role;
            }
            this.updateEmployeeSearchVisibility();
        }

        updateEmployeeSearchVisibility() {
            const searchContainer = this.elements.employeeSearchInput?.closest('.employee-search-container');
            if (this.currentUser.role === 'مشرف_عام') {
                if (searchContainer) searchContainer.style.display = 'block';
                if (this.elements.employeeSearchInput) this.elements.employeeSearchInput.style.display = 'block';
            } else {
                if (searchContainer) searchContainer.style.display = 'none';
                if (this.elements.employeeSearchInput) this.elements.employeeSearchInput.style.display = 'none';
            }
        }

        updateSystemTime() {
            const systemTimeElement = document.getElementById('system-time');
            if (systemTimeElement) {
                const now = new Date();
                const timeStr = now.toLocaleTimeString(currentLang === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' });
                const dateStr = now.toLocaleDateString(currentLang === 'ar' ? 'ar-SA' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' });
                systemTimeElement.textContent = `${timeStr} - ${dateStr}`;
            }
        }

        openImageViewer(imageUrl) {
            if (this.elements.imageViewerImg) {
                this.elements.imageViewerImg.src = imageUrl;
                if (this.elements.imageViewerDownload) this.elements.imageViewerDownload.href = imageUrl;
                this.openModal(this.elements.imageViewerModal);
            }
        }

        async showGroupInfo() {
            if (this.activeChatType !== 'group') return;
            const chat = this.chats.find(c => c.id === this.activeChatId);
            if (!chat) return;

            let participants = [];
            try {
                const response = await this.apiClient.request(`/api/admin/chat/${this.activeChatId}/participants`);
                participants = response.data || [];
            } catch (error) {
                console.error('Error loading participants:', error);
                this.showNotification('error', translate('error'), translate('failedToLoadParticipants'));
                return;
            }

            const isCreator = (this.currentUser.id === chat.createdBy);
            
            let membersHtml = `<h4 style="margin-bottom: 1rem;">${translate('members')}</h4><ul class="participants-list-modal">`;
            participants.forEach(p => {
                const avatarLetter = this.getAvatarLetter(p.fullName);
                membersHtml += `
                    <li>
                        <div class="participant-info">
                            <div class="participant-avatar">${avatarLetter}</div>
                            <div class="participant-details">
                                <div class="participant-name">${this.escapeHtml(p.fullName)}</div>
                                <div class="participant-role">${p.role}</div>
                            </div>
                        </div>
                        ${isCreator && p.id !== this.currentUser.id ? `<button class="btn-icon-small remove-participant" data-user-id="${p.id}" title="${translate('remove')}"><i class="fas fa-user-minus"></i></button>` : ''}
                    </li>
                `;
            });
            membersHtml += '</ul>';
            if (isCreator) {
                membersHtml += `<button class="btn btn-outline btn-sm" id="add-participant-from-info" style="margin-top: 1rem; width: 100%;"><i class="fas fa-plus-circle"></i> ${translate('addMembers')}</button>`;
            }

            let avatarHtml = '';
            if (chat.avatar) {
                avatarHtml = `<img src="${this.baseURL}${chat.avatar}" alt="${translate('groupAvatar')}">`;
            } else {
                avatarHtml = `<i class="fas fa-users"></i>`;
            }

            let bodyHtml = `
                <div class="group-info-section" style="text-align: center;">
                    <div class="group-avatar-large" id="group-avatar-large">
                        ${avatarHtml}
                        ${isCreator ? '<div class="change-avatar-overlay"><i class="fas fa-camera"></i></div>' : ''}
                    </div>
                    <input type="file" id="group-avatar-input" style="display:none;" accept="image/*">
                </div>
                <div class="group-info-section">
                    <label>${translate('groupName')}:</label>
                    ${isCreator ? `<input type="text" id="edit-group-name" value="${this.escapeHtml(chat.chatName)}" class="edit-group-name-input" placeholder="${translate('groupNamePlaceholder')}">` : `<p style="font-size:1.1rem; font-weight:500;">${this.escapeHtml(chat.chatName)}</p>`}
                </div>
                <div class="group-info-section">
                    <label>${translate('creationDate')}</label>
                    <p>${new Date(chat.createdAt).toLocaleDateString(currentLang === 'ar' ? 'ar-SA' : 'en-US')}</p>
                </div>
                <div class="group-info-section">
                    ${membersHtml}
                </div>
            `;

            let footerHtml = '';
            if (isCreator) {
                footerHtml = `
                    <button class="btn btn-primary" id="save-group-name-btn">${translate('save')}</button>
                    <button class="btn btn-danger" id="delete-group-btn">${translate('delete')}</button>
                `;
            } else {
                footerHtml = `<button class="btn btn-secondary" id="leave-group-btn">${translate('leave')}</button>`;
            }

            if (this.elements.groupInfoBody) this.elements.groupInfoBody.innerHTML = bodyHtml;
            if (this.elements.groupInfoFooter) this.elements.groupInfoFooter.innerHTML = footerHtml;
            this.openModal(this.elements.groupInfoModal);

            if (isCreator) {
                const avatarLarge = document.getElementById('group-avatar-large');
                const avatarInput = document.getElementById('group-avatar-input');
                if (avatarLarge && avatarInput) {
                    avatarLarge.addEventListener('click', () => {
                        avatarInput.click();
                    });
                    avatarInput.addEventListener('change', async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                            const formData = new FormData();
                            formData.append('avatar', file);
                            try {
                                await this.apiClient.request(`/api/admin/chat/${this.activeChatId}/avatar`, {
                                    method: 'POST',
                                    body: formData
                                });
                                this.showNotification('success', translate('success'), translate('groupAvatarUpdated'));
                                await this.loadChats();
                                const updatedChat = this.chats.find(c => c.id === this.activeChatId);
                                if (updatedChat && updatedChat.avatar) {
                                    const img = avatarLarge.querySelector('img');
                                    if (img) img.src = this.baseURL + updatedChat.avatar;
                                    else avatarLarge.innerHTML = `<img src="${this.baseURL}${updatedChat.avatar}" alt="${translate('groupAvatar')}"><div class="change-avatar-overlay"><i class="fas fa-camera"></i></div>`;
                                }
                                if (updatedChat.avatar) {
                                    if (this.elements.chatAvatarImg) {
                                        this.elements.chatAvatarImg.src = this.baseURL + updatedChat.avatar;
                                        this.elements.chatAvatarImg.style.display = 'block';
                                    }
                                    if (this.elements.chatAvatarPlaceholder) this.elements.chatAvatarPlaceholder.style.display = 'none';
                                } else {
                                    if (this.elements.chatAvatarImg) this.elements.chatAvatarImg.style.display = 'none';
                                    if (this.elements.chatAvatarPlaceholder) this.elements.chatAvatarPlaceholder.style.display = 'flex';
                                }
                            } catch (err) {
                                console.error(err);
                                this.showNotification('error', translate('error'), translate('failedToUpdateGroupAvatar'));
                            }
                        }
                    });
                }

                const saveGroupNameBtn = document.getElementById('save-group-name-btn');
                if (saveGroupNameBtn) {
                    saveGroupNameBtn.addEventListener('click', async () => {
                        const newName = document.getElementById('edit-group-name')?.value.trim();
                        if (newName && newName !== chat.chatName) {
                            try {
                                await this.apiClient.request(`/api/admin/chat/${this.activeChatId}`, {
                                    method: 'PUT',
                                    body: { chatName: newName }
                                });
                                chat.chatName = newName;
                                this.renderChatsList();
                                if (this.elements.chatName) this.elements.chatName.textContent = newName;
                                this.showNotification('success', translate('success'), translate('groupNameUpdated'));
                            } catch (err) {
                                console.error(err);
                                this.showNotification('error', translate('error'), translate('failedToUpdateGroupName'));
                            }
                        }
                        this.closeModal(this.elements.groupInfoModal);
                    });
                }

                const deleteGroupBtn = document.getElementById('delete-group-btn');
                if (deleteGroupBtn) {
                    deleteGroupBtn.addEventListener('click', async () => {
                        const confirmed = await this.showConfirmation(translate('confirmTitle'), translate('confirmDelete'));
                        if (confirmed) {
                            try {
                                await this.apiClient.request(`/api/admin/chat/${this.activeChatId}`, { method: 'DELETE' });
                                await this.loadChats();
                                this.activeChatId = null;
                                this.activeChatType = null;
                                if (this.elements.welcomeScreen) this.elements.welcomeScreen.style.display = 'flex';
                                if (this.elements.chatHeader) this.elements.chatHeader.style.display = 'none';
                                if (this.elements.messagesContainer) this.elements.messagesContainer.style.display = 'none';
                                if (this.elements.messageInputArea) this.elements.messageInputArea.style.display = 'none';
                                this.showNotification('success', translate('success'), translate('chatDeleted'));
                            } catch (err) {
                                console.error(err);
                                this.showNotification('error', translate('error'), translate('failedToDelete'));
                            }
                            this.closeModal(this.elements.groupInfoModal);
                        }
                    });
                }

                const addParticipantBtn = document.getElementById('add-participant-from-info');
                if (addParticipantBtn) {
                    addParticipantBtn.addEventListener('click', () => {
                        this.showAddParticipantModal();
                    });
                }
            } else {
                const leaveGroupBtn = document.getElementById('leave-group-btn');
                if (leaveGroupBtn) {
                    leaveGroupBtn.addEventListener('click', async () => {
                        const confirmed = await this.showConfirmation(translate('confirmTitle'), translate('confirmLeave'));
                        if (confirmed) {
                            await this.leaveGroup(this.activeChatId);
                            this.closeModal(this.elements.groupInfoModal);
                        }
                    });
                }
            }

            document.querySelectorAll('.remove-participant').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const userId = parseInt(btn.dataset.userId);
                    const confirmed = await this.showConfirmation(translate('confirmTitle'), translate('confirmRemoveMember'));
                    if (confirmed) {
                        try {
                            await this.apiClient.request(`/api/admin/chat/${this.activeChatId}/participants/${userId}`, {
                                method: 'DELETE'
                            });
                            this.showNotification('success', translate('success'), translate('participantRemoved'));
                            this.showGroupInfo();
                        } catch (err) {
                            console.error(err);
                            this.showNotification('error', translate('error'), translate('failedToRemoveMember'));
                        }
                    }
                });
            });
        }

        async showAddParticipantModal() {
            await this.renderAddParticipantList();
            this.openModal(this.elements.addParticipantModal);
        }

        async renderAddParticipantList(filter = '') {
            let users = [];
            if (filter.length >= 2) {
                users = await this.searchUsersForNewChat(filter);
            } else {
                if (this.allUsers.length) {
                    users = this.allUsers.filter(u => u.id !== this.currentUser.id);
                }
            }
            try {
                const currentParticipants = await this.apiClient.request(`/api/admin/chat/${this.activeChatId}/participants`);
                const currentIds = currentParticipants.data.map(p => p.id);
                users = users.filter(u => !currentIds.includes(u.id));
            } catch (err) {
                console.error(err);
            }

            let html = '';
            users.forEach(user => {
                const avatarLetter = this.getAvatarLetter(user.fullName);
                html += `
                    <div class="participant-item">
                        <div class="participant-avatar">${avatarLetter}</div>
                        <label for="add-participant-${user.id}">${this.escapeHtml(user.fullName)} (${user.role})</label>
                        <input type="checkbox" id="add-participant-${user.id}" value="${user.id}">
                    </div>
                `;
            });
            if (users.length === 0) {
                html = `<div style="text-align:center; padding:1rem;">${translate('noUsersFound')}</div>`;
            }
            if (this.elements.addParticipantList) this.elements.addParticipantList.innerHTML = html;
        }

        setReplyTo(messageId, senderName, preview) {
            this.replyToMessage = { id: messageId, senderName, preview };
            if (this.elements.replyPreview) this.elements.replyPreview.style.display = 'flex';
            if (this.elements.replyText) this.elements.replyText.textContent = translate('replyingTo', { name: senderName }) + `: ${preview}`;
        }

        clearReply() {
            this.replyToMessage = null;
            if (this.elements.replyPreview) this.elements.replyPreview.style.display = 'none';
            if (this.elements.replyText) this.elements.replyText.textContent = '';
        }

        performLocalSearch(query) {
            if (!query || query.trim() === '') {
                this.clearLocalSearch();
                return;
            }
            this.searchQuery = query.toLowerCase();
            this.searchMatches = [];
            const messages = document.querySelectorAll('.message');
            messages.forEach((msg, idx) => {
                const textElem = msg.querySelector('.message-text');
                if (textElem) {
                    const text = textElem.innerText.toLowerCase();
                    if (text.includes(this.searchQuery)) {
                        this.searchMatches.push(msg);
                        this.highlightText(textElem, this.searchQuery);
                    }
                }
            });
            if (this.searchMatches.length > 0) {
                this.currentMatchIndex = 0;
                this.updateSearchCounterDisplay();
                this.scrollToMatch(0);
            } else {
                this.showNotification('info', translate('info'), translate('noResultsFound'));
                this.clearLocalSearch();
            }
        }

        highlightText(element, query) {
            const original = element.innerText;
            const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
            element.innerHTML = original.replace(regex, `<span class="search-highlight">$1</span>`);
        }

        escapeRegex(str) {
            return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }

        clearLocalSearch() {
            this.searchMatches = [];
            this.currentMatchIndex = -1;
            this.isSearchActive = false;
            this.searchQuery = '';
            if (this.elements.searchNavigation) this.elements.searchNavigation.style.display = 'none';
            if (this.elements.localSearchBar) this.elements.localSearchBar.style.display = 'none';
            const highlights = document.querySelectorAll('.search-highlight');
            highlights.forEach(span => {
                const parent = span.parentNode;
                parent.innerHTML = parent.innerText;
            });
        }

        showLocalSearchBar() {
            if (this.elements.localSearchBar) {
                this.elements.localSearchBar.style.display = 'flex';
                if (this.elements.localSearchInput) this.elements.localSearchInput.value = '';
                if (this.elements.localSearchInput) this.elements.localSearchInput.focus();
                if (this.elements.localSearchCounter) this.elements.localSearchCounter.textContent = '0/0';
            }
        }

        updateSearchCounterDisplay() {
            const total = this.searchMatches.length;
            const current = this.currentMatchIndex + 1;
            if (this.elements.localSearchCounter) this.elements.localSearchCounter.textContent = translate('matchCount', { current, total });
        }

        scrollToMatch(index) {
            if (!this.searchMatches.length) return;
            const msg = this.searchMatches[index];
            msg.scrollIntoView({ behavior: 'smooth', block: 'center' });
            document.querySelectorAll('.search-highlight').forEach(el => el.classList.remove('active'));
            const highlights = msg.querySelectorAll('.search-highlight');
            highlights.forEach(el => el.classList.add('active'));
            this.updateSearchCounterDisplay();
        }

        nextMatch() {
            if (this.searchMatches.length === 0) return;
            this.currentMatchIndex = (this.currentMatchIndex + 1) % this.searchMatches.length;
            this.scrollToMatch(this.currentMatchIndex);
        }

        prevMatch() {
            if (this.searchMatches.length === 0) return;
            this.currentMatchIndex = (this.currentMatchIndex - 1 + this.searchMatches.length) % this.searchMatches.length;
            this.scrollToMatch(this.currentMatchIndex);
        }

        async performGlobalSearch() {
            const query = this.elements.globalSearchQuery?.value.trim();
            if (!query) {
                if (this.elements.globalSearchResults) this.elements.globalSearchResults.innerHTML = `<div style="text-align:center; padding:1rem;">${translate('noResultsFound')}</div>`;
                return;
            }
            try {
                let url = `/api/admin/chat/search?q=${encodeURIComponent(query)}`;
                if (this.viewingUserId && this.viewingUserId !== this.currentUser.id && this.currentUser.role === 'مشرف_عام') {
                    url += `&viewingUserId=${this.viewingUserId}`;
                }
                const response = await this.apiClient.request(url);
                const results = response.data || [];
                this.renderGlobalSearchResults(results, query);
            } catch (error) {
                console.error('Global search error:', error);
                this.showNotification('error', translate('error'), 'فشل البحث');
            }
        }

        renderGlobalSearchResults(results, query) {
            const container = this.elements.globalSearchResults;
            if (!container) return;
            if (!results.length) {
                container.innerHTML = `<div style="text-align:center; padding:1rem;">${translate('noResultsFound')}</div>`;
                return;
            }
            let html = '';
            results.forEach(res => {
                const chatName = res.chatName || (res.chatType === 'private' ? (res.otherParticipantName || translate('privateChat')) : translate('group'));
                let messagePreview = res.content || (res.messageType === 'image' ? translate('image') : (res.messageType === 'file' ? translate('file') : (res.messageType === 'voice' ? translate('voiceMessage') : '')));
                const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
                messagePreview = messagePreview.replace(regex, `<span class="result-message-highlight">$1</span>`);
                html += `
                    <div class="search-result-item" data-chat-id="${res.chatId}" data-message-id="${res.id}">
                        <div class="result-chat-info">
                            <i class="fas ${res.chatType === 'group' ? 'fa-users' : 'fa-user'}"></i>
                            <span class="result-chat-name">${this.escapeHtml(chatName)}</span>
                            <span class="result-time">${this.formatTime(res.createdAt)}</span>
                        </div>
                        <div class="result-message-preview">${messagePreview}</div>
                    </div>
                `;
            });
            container.innerHTML = html;
            container.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', async () => {
                    const chatId = parseInt(item.dataset.chatId);
                    const messageId = parseInt(item.dataset.messageId);
                    await this.setActiveChat(chatId);
                    setTimeout(() => {
                        const targetMsg = document.querySelector(`.message[data-msg-id="${messageId}"]`);
                        if (targetMsg) {
                            targetMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            targetMsg.classList.add('search-highlight');
                            setTimeout(() => targetMsg.classList.remove('search-highlight'), 2000);
                        }
                    }, 500);
                    this.closeModal(this.elements.globalSearchModal);
                });
            });
        }

        async requestMicrophonePermission() {
            if (this.audioStream) {
                return true;
            }
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                this.audioStream = stream;
                console.log('✅ Microphone permission granted');
                return true;
            } catch (err) {
                console.error('Microphone permission error:', err);
                this.showNotification('error', translate('error'), 'تعذر الحصول على إذن استخدام الميكروفون');
                return false;
            }
        }

        async startVoiceRecording() {
            const hasPermission = await this.requestMicrophonePermission();
            if (!hasPermission) return;

            if (!this.audioStream) {
                this.showNotification('error', translate('error'), 'لم يتم الحصول على الميكروفون');
                return;
            }

            try {
                this.mediaRecorder = new MediaRecorder(this.audioStream);
                this.audioChunks = [];
                this.mediaRecorder.ondataavailable = (event) => {
                    this.audioChunks.push(event.data);
                };
                this.mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                    this.recordingDuration = Math.floor((Date.now() - this.recordStartTime) / 1000);
                    if (this.recordingDuration < 1) {
                        this.showNotification('warning', translate('warning'), 'التسجيل قصير جداً');
                        this.hideRecordingIndicator();
                        return;
                    }
                    this.recordingBlob = audioBlob;
                    this.sendVoiceMessage();
                };
                this.mediaRecorder.start();
                this.isRecording = true;
                this.recordStartTime = Date.now();
                if (this.elements.voiceRecordBtn) this.elements.voiceRecordBtn.classList.add('recording');
                this.showRecordingIndicator();
                this.startRecordTimer();
            } catch (err) {
                console.error('Voice recording error:', err);
                this.showNotification('error', translate('error'), 'تعذر بدء التسجيل');
            }
        }

        stopVoiceRecording() {
            if (this.mediaRecorder && this.isRecording) {
                this.mediaRecorder.stop();
                this.isRecording = false;
                if (this.elements.voiceRecordBtn) this.elements.voiceRecordBtn.classList.remove('recording');
                this.stopRecordTimer();
            }
        }

        cancelVoiceRecording() {
            if (this.mediaRecorder && this.isRecording) {
                this.mediaRecorder.stop();
                this.isRecording = false;
                if (this.elements.voiceRecordBtn) this.elements.voiceRecordBtn.classList.remove('recording');
                this.stopRecordTimer();
                this.hideRecordingIndicator();
                this.recordingBlob = null;
                this.recordingDuration = 0;
                this.audioChunks = [];
            }
        }

        showRecordingIndicator() {
            if (this.elements.voiceRecordingIndicator) {
                this.elements.voiceRecordingIndicator.style.display = 'flex';
                if (this.elements.recordingTimer) this.elements.recordingTimer.textContent = '00:00';
            }
        }

        hideRecordingIndicator() {
            if (this.elements.voiceRecordingIndicator) {
                this.elements.voiceRecordingIndicator.style.display = 'none';
            }
        }

        startRecordTimer() {
            this.recordTimer = setInterval(() => {
                if (this.recordStartTime) {
                    const elapsed = Math.floor((Date.now() - this.recordStartTime) / 1000);
                    if (this.elements.recordingTimer) {
                        this.elements.recordingTimer.textContent = this.formatDuration(elapsed);
                    }
                }
            }, 1000);
        }

        stopRecordTimer() {
            if (this.recordTimer) {
                clearInterval(this.recordTimer);
                this.recordTimer = null;
            }
        }

        async sendVoiceMessage() {
            if (!this.recordingBlob) return;
            const file = new File([this.recordingBlob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
            file.duration = this.recordingDuration;
            await this.sendFileMessage(this.activeChatId, file, null, this.replyToMessage ? this.replyToMessage.id : null);
            this.hideRecordingIndicator();
            this.recordingBlob = null;
            this.recordingDuration = 0;
            this.clearReply();
        }

        async showChatInfo() {
            if (!this.activeChatId) return;
            const chat = this.chats.find(c => c.id === this.activeChatId);
            if (!chat) return;

            let media = [], files = [], voices = [], members = [];
            try {
                const response = await this.apiClient.request(`/api/admin/chat/${this.activeChatId}/media`);
                const data = response.data || [];
                media = data.filter(m => m.messageType === 'image');
                files = data.filter(m => m.messageType === 'file');
                voices = data.filter(m => m.messageType === 'voice');
            } catch (err) {
                console.error('Error loading chat media:', err);
            }

            if (chat.chatType === 'group') {
                try {
                    const resp = await this.apiClient.request(`/api/admin/chat/${this.activeChatId}/participants`);
                    members = resp.data || [];
                } catch (err) {
                    console.error('Error loading members:', err);
                }
            }

            this.renderChatInfoTabs(media, files, voices, members, chat.chatType);
            this.openModal(this.elements.chatInfoModal);
        }

        renderChatInfoTabs(media, files, voices, members, chatType) {
            const tabsContainer = this.elements.chatInfoBody?.querySelector('.chat-info-tabs');
            const contentContainer = this.elements.chatInfoBody?.querySelector('.chat-info-content');
            if (!tabsContainer || !contentContainer) return;

            const membersTab = document.getElementById('members-tab-btn');
            if (membersTab) {
                membersTab.style.display = chatType === 'group' ? 'inline-flex' : 'none';
            }

            this.renderMediaTab(media);
            
            const btns = tabsContainer.querySelectorAll('.tab-btn');
            btns.forEach(btn => {
                btn.addEventListener('click', () => {
                    btns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    const tab = btn.dataset.tab;
                    if (tab === 'media') this.renderMediaTab(media);
                    else if (tab === 'files') this.renderFilesTab(files);
                    else if (tab === 'voice') this.renderVoiceTab(voices);
                    else if (tab === 'members') this.renderMembersTab(members);
                });
            });
        }

        renderMediaTab(media) {
            const container = this.elements.chatInfoBody?.querySelector('.chat-info-content');
            if (!container) return;
            if (media.length === 0) {
                container.innerHTML = `<div class="empty-state">${translate('noMedia')}</div>`;
                return;
            }
            let html = '<div class="media-grid">';
            media.forEach(img => {
                html += `
                    <div class="media-item" data-url="${this.baseURL}${img.fileUrl}">
                        <img src="${this.baseURL}${img.fileUrl}" alt="${translate('image')}">
                    </div>
                `;
            });
            html += '</div>';
            container.innerHTML = html;
            container.querySelectorAll('.media-item').forEach(item => {
                item.addEventListener('click', () => {
                    this.openImageViewer(item.dataset.url);
                });
            });
        }

        renderFilesTab(files) {
            const container = this.elements.chatInfoBody?.querySelector('.chat-info-content');
            if (!container) return;
            if (files.length === 0) {
                container.innerHTML = `<div class="empty-state">${translate('noFiles')}</div>`;
                return;
            }
            let html = '<div class="file-list">';
            files.forEach(file => {
                const icon = this.getFileIcon(file.fileName);
                const size = this.formatFileSize(file.fileSize);
                html += `
                    <div class="file-item" data-url="${this.baseURL}${file.fileUrl}">
                        <div class="file-icon"><i class="fas ${icon}"></i></div>
                        <div class="file-info">
                            <div class="file-name">${this.escapeHtml(file.fileName)}</div>
                            <div class="file-size">${size}</div>
                        </div>
                        <i class="fas fa-download"></i>
                    </div>
                `;
            });
            html += '</div>';
            container.innerHTML = html;
            container.querySelectorAll('.file-item').forEach(item => {
                item.addEventListener('click', () => {
                    window.open(item.dataset.url, '_blank');
                });
            });
        }

        renderVoiceTab(voices) {
            const container = this.elements.chatInfoBody?.querySelector('.chat-info-content');
            if (!container) return;
            if (voices.length === 0) {
                container.innerHTML = `<div class="empty-state">${translate('noVoiceMessages')}</div>`;
                return;
            }
            let html = '<div class="voice-list">';
            voices.forEach(voice => {
                const duration = this.formatDuration(voice.duration || 0);
                const senderName = voice.senderName || translate('unknown');
                html += `
                    <div class="voice-item" data-url="${this.baseURL}${voice.fileUrl}" data-duration="${voice.duration || 0}">
                        <div class="voice-icon"><i class="fas fa-microphone"></i></div>
                        <div class="voice-info">
                            <div class="voice-sender">${this.escapeHtml(senderName)}</div>
                            <div class="voice-duration">${duration}</div>
                        </div>
                        <button class="voice-play-mini"><i class="fas fa-play"></i></button>
                    </div>
                `;
            });
            html += '</div>';
            container.innerHTML = html;
            container.querySelectorAll('.voice-item').forEach(item => {
                const audio = new Audio(item.dataset.url);
                let playing = false;
                const btn = item.querySelector('.voice-play-mini');
                btn.addEventListener('click', () => {
                    if (playing) {
                        audio.pause();
                        btn.innerHTML = '<i class="fas fa-play"></i>';
                        playing = false;
                    } else {
                        document.querySelectorAll('.voice-play-mini i').forEach(icon => {
                            icon.className = 'fas fa-play';
                        });
                        audio.currentTime = 0;
                        audio.play();
                        btn.innerHTML = '<i class="fas fa-pause"></i>';
                        playing = true;
                        audio.onended = () => {
                            btn.innerHTML = '<i class="fas fa-play"></i>';
                            playing = false;
                        };
                    }
                });
            });
        }

        renderMembersTab(members) {
            const container = this.elements.chatInfoBody?.querySelector('.chat-info-content');
            if (!container) return;
            if (members.length === 0) {
                container.innerHTML = `<div class="empty-state">${translate('noMembers')}</div>`;
                return;
            }
            let html = '<div class="member-list">';
            members.forEach(m => {
                const avatarLetter = this.getAvatarLetter(m.fullName);
                html += `
                    <div class="member-item">
                        <div class="member-avatar">${avatarLetter}</div>
                        <div class="member-details">
                            <div class="member-name">${this.escapeHtml(m.fullName)}</div>
                            <div class="member-role">${m.role}</div>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            container.innerHTML = html;
        }

        getActiveUserId() {
            if (this.viewingUserId && this.viewingUserId !== this.currentUser.id && this.currentUser.role === 'مشرف_عام') {
                return this.viewingUserId;
            }
            return this.currentUser.id;
        }

        isOutgoingMessage(senderId) {
            return senderId === this.getActiveUserId();
        }

        setupSwipeReply() {
            const container = this.elements.messagesContainer;
            if (!container) return;
            let touchStartX = 0;
            let touchStartY = 0;
            let currentMessage = null;
            container.addEventListener('touchstart', (e) => {
                const target = e.target.closest('.message');
                if (!target) return;
                currentMessage = target;
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
            });
            container.addEventListener('touchmove', (e) => {
                if (!currentMessage) return;
                const diffX = e.touches[0].clientX - touchStartX;
                const diffY = e.touches[0].clientY - touchStartY;
                if (Math.abs(diffX) > Math.abs(diffY) && diffX > 30) {
                    e.preventDefault();
                    const msgId = currentMessage.dataset.msgId;
                    const msg = this.getCurrentMessageById(parseInt(msgId));
                    if (msg && !this.isOutgoingMessage(msg.id)) {
                        const replyBtn = currentMessage.querySelector('.reply-btn');
                        if (replyBtn) replyBtn.click();
                    }
                    currentMessage.classList.add('swipe-reply');
                    setTimeout(() => currentMessage.classList.remove('swipe-reply'), 300);
                    currentMessage = null;
                }
            });
            container.addEventListener('touchend', () => {
                currentMessage = null;
            });
        }

        getCurrentMessageById(msgId) {
            const messages = Array.from(this.elements.messagesList?.querySelectorAll('.message') || []).map(el => ({
                id: parseInt(el.dataset.msgId),
                element: el
            }));
            const found = messages.find(m => m.id === msgId);
            if (found) {
                const senderNameElem = found.element.querySelector('.message-sender-name');
                const senderName = senderNameElem ? senderNameElem.textContent : this.currentUser.fullName;
                const previewElem = found.element.querySelector('.message-text');
                const preview = previewElem ? previewElem.textContent : '';
                return { id: msgId, senderName, preview };
            }
            return null;
        }

        setupVoicePlayback() {
            document.addEventListener('click', (e) => {
                const playBtn = e.target.closest('.voice-play-btn');
                if (playBtn) {
                    const voiceDiv = playBtn.closest('.message-voice');
                    if (voiceDiv) {
                        const audioUrl = voiceDiv.dataset.audioUrl;
                        const audio = new Audio(audioUrl);
                        const icon = playBtn.querySelector('i');
                        const waveContainer = voiceDiv.querySelector('.voice-wave');
                        const progressContainer = voiceDiv.querySelector('.voice-progress-container');
                        const progressBar = voiceDiv.querySelector('.voice-progress');
                        const durationSpan = voiceDiv.querySelector('.voice-duration');
                        const timeLeftSpan = voiceDiv.querySelector('.voice-time-left');
                        const totalDuration = parseFloat(voiceDiv.dataset.duration) || 0;

                        if (this.currentAudio && this.currentAudio !== audio) {
                            this.currentAudio.pause();
                            this.currentAudio.currentTime = 0;
                            if (this.currentVoiceElement) {
                                const oldIcon = this.currentVoiceElement.querySelector('.voice-play-btn i');
                                const oldWave = this.currentVoiceElement.querySelector('.voice-wave');
                                if (oldIcon) oldIcon.className = 'fas fa-play';
                                if (oldWave) oldWave.classList.remove('active');
                            }
                        }

                        if (icon.classList.contains('fa-play')) {
                            if (this.currentAudio && this.currentAudio !== audio) {
                                this.currentAudio = null;
                                this.currentVoiceElement = null;
                            }
                            this.currentAudio = audio;
                            this.currentVoiceElement = voiceDiv;
                            
                            if (progressBar) progressBar.style.width = '0%';
                            if (timeLeftSpan) {
                                timeLeftSpan.style.display = 'inline';
                                timeLeftSpan.textContent = this.formatDuration(totalDuration);
                            }
                            
                            audio.currentTime = 0;
                            audio.play();
                            icon.className = 'fas fa-pause';
                            if (waveContainer) waveContainer.classList.add('active');
                            
                            const updateProgress = () => {
                                if (audio.duration && !isNaN(audio.duration)) {
                                    const percent = (audio.currentTime / audio.duration) * 100;
                                    if (progressBar) progressBar.style.width = `${percent}%`;
                                    const remaining = audio.duration - audio.currentTime;
                                    if (timeLeftSpan) {
                                        timeLeftSpan.textContent = this.formatDuration(remaining);
                                    }
                                }
                                if (!audio.paused && !audio.ended) {
                                    requestAnimationFrame(updateProgress);
                                }
                            };
                            audio.addEventListener('timeupdate', updateProgress);
                            
                            audio.onended = () => {
                                icon.className = 'fas fa-play';
                                if (waveContainer) waveContainer.classList.remove('active');
                                if (progressBar) progressBar.style.width = '0%';
                                if (timeLeftSpan) {
                                    timeLeftSpan.style.display = 'none';
                                }
                                if (this.currentAudio === audio) {
                                    this.currentAudio = null;
                                    this.currentVoiceElement = null;
                                }
                            };
                        } else {
                            audio.pause();
                            icon.className = 'fas fa-play';
                            if (waveContainer) waveContainer.classList.remove('active');
                            if (this.currentAudio === audio) {
                                this.currentAudio = null;
                                this.currentVoiceElement = null;
                            }
                        }
                    }
                }
            });
        }

        async init() {
            try {
                this.currentUser = this.getCurrentUser();
                if (!this.currentUser || !this.currentUser.id) {
                    console.error('❌ No logged in user found');
                    window.location.href = '../login/index.html';
                    return;
                }
                console.log('👤 Current user:', this.currentUser);
                this.viewingUserId = this.currentUser.id;

                await this.setupApiClient();

                // إضافة عناصر مفقودة بشكل ديناميكي لتجنب أخطاء null
                this.ensureRequiredElements();

                // تعيين جميع المراجع للعناصر بعد التأكد من وجودها
                this.elements = {
                    chatsList: this.safeGetElement('chats-list'),
                    welcomeScreen: this.safeGetElement('welcome-screen'),
                    chatHeader: this.safeGetElement('chat-header'),
                    messagesContainer: this.safeGetElement('messages-container'),
                    messageInputArea: this.safeGetElement('message-input-area'),
                    messagesList: this.safeGetElement('messages-list'),
                    chatName: this.safeGetElement('chat-name'),
                    chatStatus: this.safeGetElement('chat-status'),
                    chatAvatarPlaceholder: this.safeGetElement('chat-avatar-placeholder'),
                    chatAvatarImg: this.safeGetElement('chat-avatar-img'),
                    messageInput: this.safeGetElement('message-input'),
                    sendBtn: this.safeGetElement('send-message-btn'),
                    chatsSearchInput: this.safeGetElement('chats-search-input'),
                    newChatBtn: this.safeGetElement('new-chat-btn'),
                    newGroupBtn: this.safeGetElement('new-group-btn'),
                    newChatModal: this.safeGetElement('new-chat-modal'),
                    newGroupModal: this.safeGetElement('new-group-modal'),
                    contactsList: this.safeGetElement('contacts-list'),
                    participantsList: this.safeGetElement('participants-list'),
                    createGroupBtn: this.safeGetElement('create-group-btn'),
                    cancelGroupBtn: this.safeGetElement('cancel-group-btn'),
                    groupNameInput: this.safeGetElement('group-name-input'),
                    participantsSearchInput: this.safeGetElement('participants-search-input'),
                    newChatSearchInput: this.safeGetElement('new-chat-search-input'),
                    newChatModalClose: this.safeGetElement('new-chat-modal-close'),
                    newGroupModalClose: this.safeGetElement('new-group-modal-close'),
                    startChatBtn: this.safeGetElement('start-chat-btn'),
                    menuToggle: this.safeGetElement('menu-toggle'),
                    sidebar: this.safeGetElement('dashboard-sidebar'),
                    sidebarClose: this.safeGetElement('sidebar-close'),
                    sidebarBackdrop: this.safeGetElement('sidebar-backdrop') || this.createSidebarBackdrop(),
                    userProfileBtn: this.safeGetElement('user-profile-btn'),
                    userDropdown: this.safeGetElement('.user-dropdown-content', false),
                    emojiBtn: this.safeGetElement('emoji-btn'),
                    attachBtn: this.safeGetElement('attach-btn'),
                    emojiPanel: this.safeGetElement('emoji-panel'),
                    imageViewerModal: this.safeGetElement('image-viewer-modal'),
                    imageViewerImg: this.safeGetElement('image-viewer-img'),
                    imageViewerDownload: this.safeGetElement('image-viewer-download'),
                    imageViewerClose: this.safeGetElement('image-viewer-close'),
                    chatArea: this.safeGetElement('chat-area'),
                    mobileBackBtn: this.safeGetElement('mobile-back-btn'),
                    employeeSearchInput: this.safeGetElement('employee-search-input'),
                    employeeSearchResults: this.safeGetElement('employee-search-results'),
                    currentViewIndicator: this.safeGetElement('current-view-indicator'),
                    viewingUserName: this.safeGetElement('viewing-user-name'),
                    resetViewBtn: this.safeGetElement('reset-view-btn'),
                    groupInfoModal: this.safeGetElement('group-info-modal'),
                    groupInfoBody: this.safeGetElement('group-info-body'),
                    groupInfoFooter: this.safeGetElement('group-info-footer'),
                    groupInfoClose: this.safeGetElement('group-info-close'),
                    chatHeaderInfo: this.safeGetElement('chat-header-info'),
                    addParticipantModal: this.safeGetElement('add-participant-modal'),
                    addParticipantSearch: this.safeGetElement('add-participant-search'),
                    addParticipantList: this.safeGetElement('add-participant-list'),
                    cancelAddParticipantBtn: this.safeGetElement('cancel-add-participant-btn'),
                    confirmAddParticipantBtn: this.safeGetElement('confirm-add-participant-btn'),
                    addParticipantClose: this.safeGetElement('add-participant-close'),
                    confirmationModal: this.safeGetElement('confirmation-modal'),
                    confirmTitle: this.safeGetElement('confirm-title'),
                    confirmMessage: this.safeGetElement('confirm-message'),
                    confirmOk: this.safeGetElement('confirm-ok'),
                    confirmCancel: this.safeGetElement('confirm-cancel'),
                    confirmClose: this.safeGetElement('confirm-close'),
                    replyPreview: this.safeGetElement('reply-preview'),
                    replyText: document.querySelector('#reply-preview .reply-text'),
                    cancelReplyBtn: this.safeGetElement('cancel-reply-btn'),
                    localSearchBtn: this.safeGetElement('local-search-btn'),
                    searchNavigation: this.safeGetElement('search-navigation'),
                    searchPrev: this.safeGetElement('search-prev'),
                    searchNext: this.safeGetElement('search-next'),
                    searchCounter: this.safeGetElement('search-counter'),
                    globalSearchBtn: this.safeGetElement('global-search-btn'),
                    globalSearchModal: this.safeGetElement('global-search-modal'),
                    globalSearchClose: this.safeGetElement('global-search-close'),
                    globalSearchQuery: this.safeGetElement('global-search-query'),
                    globalSearchResults: this.safeGetElement('global-search-results'),
                    localSearchBar: this.safeGetElement('local-search-bar'),
                    localSearchInput: this.safeGetElement('local-search-input'),
                    localSearchCounter: this.safeGetElement('local-search-counter'),
                    localSearchPrev: this.safeGetElement('local-search-prev'),
                    localSearchNext: this.safeGetElement('local-search-next'),
                    localSearchClose: this.safeGetElement('local-search-close'),
                    voiceRecordBtn: this.safeGetElement('voice-record-btn'),
                    voiceRecordingIndicator: this.safeGetElement('voice-recording-indicator'),
                    recordingTimer: this.safeGetElement('recording-timer'),
                    cancelRecordingBtn: this.safeGetElement('cancel-recording-btn'),
                    chatInfoBtn: this.safeGetElement('chat-info-btn'),
                    chatInfoModal: this.safeGetElement('chat-info-modal'),
                    chatInfoBody: this.safeGetElement('chat-info-body'),
                    chatInfoClose: this.safeGetElement('chat-info-close')
                };

                this.updateUserInfo();

                await this.loadAllUsers();

                await this.loadChats();

                this.startPolling();

                this.updateSystemTime();
                setInterval(() => this.updateSystemTime(), 1000);

                this.setupEventListeners();
                this.setupMobileEnhancements();
                this.setupSwipeReply();
                this.setupVoicePlayback();
                this.updateBackButtonIcon();

            } catch (error) {
                console.error('❌ Error initializing chat:', error);
                this.showNotification('error', translate('error'), 'حدث خطأ أثناء تحميل الشات. يرجى تسجيل الدخول مرة أخرى.');
                setTimeout(() => {
                    if (!this.currentUser) {
                        window.location.href = '../login/index.html';
                    }
                }, 3000);
            }
        }

        // إنشاء العناصر المفقودة ديناميكياً
        ensureRequiredElements() {
            if (!document.getElementById('sidebar-backdrop')) {
                const backdrop = document.createElement('div');
                backdrop.id = 'sidebar-backdrop';
                backdrop.className = 'sidebar-backdrop';
                backdrop.style.display = 'none';
                document.body.appendChild(backdrop);
                console.log('✅ Created missing sidebar-backdrop element');
            }
        }

        createSidebarBackdrop() {
            let backdrop = document.getElementById('sidebar-backdrop');
            if (!backdrop) {
                backdrop = document.createElement('div');
                backdrop.id = 'sidebar-backdrop';
                backdrop.className = 'sidebar-backdrop';
                backdrop.style.display = 'none';
                document.body.appendChild(backdrop);
            }
            return backdrop;
        }

        setupEventListeners() {
            // زر الإرسال
            if (this.elements.sendBtn) {
                this.elements.sendBtn.addEventListener('click', () => this.sendMessage());
            }

            // حقل الإدخال (Enter)
            if (this.elements.messageInput) {
                this.elements.messageInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.sendMessage();
                });
            }

            // البحث في المحادثات
            if (this.elements.chatsSearchInput) {
                this.elements.chatsSearchInput.addEventListener('input', (e) => {
                    const term = e.target.value.toLowerCase();
                    const items = document.querySelectorAll('.chat-item');
                    items.forEach(item => {
                        const name = item.querySelector('.chat-item-name')?.textContent.toLowerCase() || '';
                        if (name.includes(term)) item.style.display = 'flex';
                        else item.style.display = 'none';
                    });
                });
            }

            // أزرار المحادثة الجديدة والمجموعة
            if (this.elements.newChatBtn) {
                this.elements.newChatBtn.addEventListener('click', () => {
                    this.renderContacts();
                    this.openModal(this.elements.newChatModal);
                });
            }

            if (this.elements.newGroupBtn) {
                this.elements.newGroupBtn.addEventListener('click', () => {
                    this.renderParticipants();
                    this.openModal(this.elements.newGroupModal);
                });
            }

            // إغلاق المودالات
            if (this.elements.newChatModalClose) {
                this.elements.newChatModalClose.addEventListener('click', () => this.closeModal(this.elements.newChatModal));
            }
            if (this.elements.newGroupModalClose) {
                this.elements.newGroupModalClose.addEventListener('click', () => this.closeModal(this.elements.newGroupModal));
            }
            if (this.elements.cancelGroupBtn) {
                this.elements.cancelGroupBtn.addEventListener('click', () => this.closeModal(this.elements.newGroupModal));
            }

            // البحث في مودال المحادثة الجديدة
            let searchTimeout;
            if (this.elements.newChatSearchInput) {
                this.elements.newChatSearchInput.addEventListener('input', (e) => {
                    clearTimeout(searchTimeout);
                    const val = e.target.value;
                    searchTimeout = setTimeout(() => this.renderContacts(val), 300);
                });
            }

            if (this.elements.participantsSearchInput) {
                this.elements.participantsSearchInput.addEventListener('input', (e) => {
                    clearTimeout(searchTimeout);
                    const val = e.target.value;
                    searchTimeout = setTimeout(() => this.renderParticipants(val), 300);
                });
            }

            // إنشاء مجموعة
            if (this.elements.createGroupBtn) {
                this.elements.createGroupBtn.addEventListener('click', async () => {
                    const groupName = this.elements.groupNameInput?.value.trim();
                    const selected = [];
                    document.querySelectorAll('#participants-list input:checked').forEach(cb => {
                        selected.push(parseInt(cb.value));
                    });
                    if (!groupName) {
                        this.showNotification('error', translate('error'), `${translate('groupNamePlaceholder')} ${translate('required')}`);
                        return;
                    }
                    if (selected.length === 0) {
                        this.showNotification('error', translate('error'), translate('selectAtLeastOne'));
                        return;
                    }
                    await this.createGroup(groupName, selected, null);
                    this.closeModal(this.elements.newGroupModal);
                    if (this.elements.groupNameInput) this.elements.groupNameInput.value = '';
                });
            }

            // زر بدء محادثة جديدة من شاشة الترحيب
            if (this.elements.startChatBtn) {
                this.elements.startChatBtn.addEventListener('click', () => {
                    if (this.elements.newChatBtn) this.elements.newChatBtn.click();
                });
            }

            // الإيموجي
            if (this.elements.emojiBtn && this.elements.emojiPanel) {
                this.elements.emojiBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const panel = this.elements.emojiPanel;
                    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
                });

                document.querySelectorAll('.emoji-item').forEach(item => {
                    item.addEventListener('click', () => {
                        if (this.elements.messageInput) {
                            this.elements.messageInput.value += item.textContent;
                            this.elements.messageInput.focus();
                        }
                        if (this.elements.emojiPanel) this.elements.emojiPanel.style.display = 'none';
                    });
                });

                document.addEventListener('click', (e) => {
                    if (this.elements.emojiBtn && !this.elements.emojiBtn.contains(e.target) && this.elements.emojiPanel && !this.elements.emojiPanel.contains(e.target)) {
                        this.elements.emojiPanel.style.display = 'none';
                    }
                });
            }

            // إرفاق ملف
            if (this.elements.attachBtn) {
                this.elements.attachBtn.addEventListener('click', () => {
                    const fileInput = document.createElement('input');
                    fileInput.type = 'file';
                    fileInput.accept = 'image/*, .pdf, .doc, .docx, .xls, .xlsx, .txt, .zip, .rar, audio/*';
                    fileInput.onchange = (e) => {
                        const file = fileInput.files[0];
                        if (file) this.sendFile(file);
                    };
                    fileInput.click();
                });
            }

            // التسجيل الصوتي
            if (this.elements.voiceRecordBtn) {
                let pressTimer = null;
                const startRecord = () => {
                    pressTimer = setTimeout(() => {
                        this.startVoiceRecording();
                    }, 200);
                };
                const stopRecord = () => {
                    if (pressTimer) clearTimeout(pressTimer);
                    if (this.isRecording) this.stopVoiceRecording();
                };
                const cancelRecord = () => {
                    if (pressTimer) clearTimeout(pressTimer);
                    if (this.isRecording) this.cancelVoiceRecording();
                };

                this.elements.voiceRecordBtn.addEventListener('mousedown', startRecord);
                this.elements.voiceRecordBtn.addEventListener('mouseup', stopRecord);
                this.elements.voiceRecordBtn.addEventListener('mouseleave', cancelRecord);

                this.elements.voiceRecordBtn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    startRecord();
                });
                this.elements.voiceRecordBtn.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    stopRecord();
                });
                this.elements.voiceRecordBtn.addEventListener('touchcancel', (e) => {
                    e.preventDefault();
                    cancelRecord();
                });
            }

            if (this.elements.cancelRecordingBtn) {
                this.elements.cancelRecordingBtn.addEventListener('click', () => {
                    this.cancelVoiceRecording();
                });
            }

            // القائمة الجانبية (في حالة وجودها في الصفحة)
            if (this.elements.menuToggle && this.elements.sidebar) {
                this.elements.menuToggle.addEventListener('click', () => {
                    this.elements.sidebar.classList.add('active');
                    if (this.elements.sidebarBackdrop) this.elements.sidebarBackdrop.classList.add('active');
                    document.body.style.overflow = 'hidden';
                });
            }
            if (this.elements.sidebarClose && this.elements.sidebar) {
                this.elements.sidebarClose.addEventListener('click', () => {
                    this.elements.sidebar.classList.remove('active');
                    if (this.elements.sidebarBackdrop) this.elements.sidebarBackdrop.classList.remove('active');
                    document.body.style.overflow = '';
                });
            }
            if (this.elements.sidebarBackdrop) {
                this.elements.sidebarBackdrop.addEventListener('click', () => {
                    if (this.elements.sidebar) this.elements.sidebar.classList.remove('active');
                    this.elements.sidebarBackdrop.classList.remove('active');
                    document.body.style.overflow = '';
                });
            }

            // القائمة المنسدلة للمستخدم
            if (this.elements.userProfileBtn && this.elements.userDropdown) {
                this.elements.userProfileBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.elements.userDropdown.classList.toggle('show');
                });
                document.addEventListener('click', (e) => {
                    if (!this.elements.userProfileBtn.contains(e.target) && this.elements.userDropdown) {
                        this.elements.userDropdown.classList.remove('show');
                    }
                });
            }

            // تسجيل الخروج
            const logoutLink = document.querySelector('.dropdown-item.logout');
            if (logoutLink) {
                logoutLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('user_data');
                    window.location.href = '../login/index.html';
                });
            }

            // إغلاق مودال عرض الصورة
            if (this.elements.imageViewerClose) {
                this.elements.imageViewerClose.addEventListener('click', () => this.closeModal(this.elements.imageViewerModal));
            }

            // زر الرجوع للجوال
            if (this.elements.mobileBackBtn) {
                this.elements.mobileBackBtn.addEventListener('click', () => {
                    if (this.isMobile() && this.elements.chatArea) {
                        this.elements.chatArea.classList.remove('active');
                        document.body.classList.remove('chat-open');
                    }
                });
            }

            window.addEventListener('resize', () => {
                if (window.innerWidth > 768 && this.elements.chatArea && this.elements.chatArea.classList.contains('active')) {
                    this.elements.chatArea.classList.remove('active');
                    document.body.classList.remove('chat-open');
                }
            });

            // معلومات المجموعة
            if (this.elements.chatHeaderInfo) {
                this.elements.chatHeaderInfo.addEventListener('click', () => {
                    if (this.activeChatType === 'group') {
                        this.showGroupInfo();
                    }
                });
            }

            if (this.elements.groupInfoClose) {
                this.elements.groupInfoClose.addEventListener('click', () => this.closeModal(this.elements.groupInfoModal));
            }

            // إضافة أعضاء للمجموعة
            if (this.elements.addParticipantClose) {
                this.elements.addParticipantClose.addEventListener('click', () => this.closeModal(this.elements.addParticipantModal));
            }
            if (this.elements.cancelAddParticipantBtn) {
                this.elements.cancelAddParticipantBtn.addEventListener('click', () => this.closeModal(this.elements.addParticipantModal));
            }
            if (this.elements.confirmAddParticipantBtn) {
                this.elements.confirmAddParticipantBtn.addEventListener('click', async () => {
                    const selected = [];
                    document.querySelectorAll('#add-participant-list input:checked').forEach(cb => {
                        selected.push(parseInt(cb.value));
                    });
                    if (selected.length === 0) {
                        this.showNotification('error', translate('error'), translate('selectAtLeastOne'));
                        return;
                    }
                    try {
                        await this.apiClient.request(`/api/admin/chat/${this.activeChatId}/participants`, {
                            method: 'POST',
                            body: { userIds: selected }
                        });
                        this.showNotification('success', translate('success'), translate('participantAdded'));
                        this.closeModal(this.elements.addParticipantModal);
                        this.showGroupInfo();
                    } catch (err) {
                        console.error(err);
                        this.showNotification('error', translate('error'), translate('failedToAddMember'));
                    }
                });
            }
            if (this.elements.addParticipantSearch) {
                let timeout;
                this.elements.addParticipantSearch.addEventListener('input', (e) => {
                    clearTimeout(timeout);
                    timeout = setTimeout(() => {
                        this.renderAddParticipantList(e.target.value);
                    }, 300);
                });
            }

            // تأكيد الحوار
            if (this.elements.confirmOk) {
                this.elements.confirmOk.addEventListener('click', () => {
                    if (this.confirmResolve) {
                        this.confirmResolve(true);
                        this.confirmResolve = null;
                    }
                    this.closeModal(this.elements.confirmationModal);
                });
            }
            if (this.elements.confirmCancel) {
                this.elements.confirmCancel.addEventListener('click', () => {
                    if (this.confirmResolve) {
                        this.confirmResolve(false);
                        this.confirmResolve = null;
                    }
                    this.closeModal(this.elements.confirmationModal);
                });
            }
            if (this.elements.confirmClose) {
                this.elements.confirmClose.addEventListener('click', () => {
                    if (this.confirmResolve) {
                        this.confirmResolve(false);
                        this.confirmResolve = null;
                    }
                    this.closeModal(this.elements.confirmationModal);
                });
            }

            // الرد على رسالة
            document.addEventListener('click', (e) => {
                const replyBtn = e.target.closest('.reply-btn');
                if (replyBtn) {
                    const msgId = parseInt(replyBtn.dataset.msgId);
                    const sender = replyBtn.dataset.sender;
                    const preview = replyBtn.dataset.preview;
                    this.setReplyTo(msgId, sender, preview);
                    e.preventDefault();
                }
            });
            if (this.elements.cancelReplyBtn) {
                this.elements.cancelReplyBtn.addEventListener('click', () => this.clearReply());
            }

            // البحث المحلي
            if (this.elements.localSearchBtn) {
                this.elements.localSearchBtn.addEventListener('click', () => {
                    this.showLocalSearchBar();
                });
            }
            if (this.elements.localSearchClose) {
                this.elements.localSearchClose.addEventListener('click', () => {
                    this.clearLocalSearch();
                });
            }
            if (this.elements.localSearchInput) {
                this.elements.localSearchInput.addEventListener('input', (e) => {
                    this.performLocalSearch(e.target.value);
                });
            }
            if (this.elements.localSearchPrev) {
                this.elements.localSearchPrev.addEventListener('click', () => this.prevMatch());
            }
            if (this.elements.localSearchNext) {
                this.elements.localSearchNext.addEventListener('click', () => this.nextMatch());
            }

            // البحث العام
            if (this.elements.globalSearchBtn) {
                this.elements.globalSearchBtn.addEventListener('click', () => {
                    this.openModal(this.elements.globalSearchModal);
                    if (this.elements.globalSearchQuery) this.elements.globalSearchQuery.value = '';
                    if (this.elements.globalSearchResults) this.elements.globalSearchResults.innerHTML = '';
                });
            }
            if (this.elements.globalSearchClose) {
                this.elements.globalSearchClose.addEventListener('click', () => this.closeModal(this.elements.globalSearchModal));
            }
            if (this.elements.globalSearchQuery) {
                this.elements.globalSearchQuery.addEventListener('input', () => this.performGlobalSearch());
            }

            // معلومات الشات
            if (this.elements.chatInfoBtn) {
                this.elements.chatInfoBtn.addEventListener('click', () => {
                    this.showChatInfo();
                });
            }
            if (this.elements.chatInfoClose) {
                this.elements.chatInfoClose.addEventListener('click', () => this.closeModal(this.elements.chatInfoModal));
            }

            // البحث عن الموظفين (للمشرف العام)
            if (this.elements.employeeSearchInput) {
                this.elements.employeeSearchInput.addEventListener('input', (e) => {
                    this.searchEmployees(e.target.value);
                });
                this.elements.employeeSearchInput.addEventListener('focus', () => {
                    if (this.elements.employeeSearchInput.value.trim() !== '') {
                        if (this.elements.employeeSearchResults) this.elements.employeeSearchResults.classList.add('show');
                    }
                });
                document.addEventListener('click', (e) => {
                    if (this.elements.employeeSearchInput && !this.elements.employeeSearchInput.contains(e.target) &&
                        this.elements.employeeSearchResults && !this.elements.employeeSearchResults.contains(e.target)) {
                        this.hideEmployeeSearchResults();
                    }
                });
            }

            if (this.elements.resetViewBtn) {
                this.elements.resetViewBtn.addEventListener('click', () => this.resetViewToCurrentUser());
            }
        }

        setupMobileEnhancements() {
            if ('ontouchstart' in window) {
                document.addEventListener('touchstart', (e) => {
                    const btn = e.target.closest('.btn, .btn-icon, .btn-send');
                    if (btn && !btn.disabled) {
                        btn.style.transform = 'scale(0.95)';
                        btn.style.transition = 'transform 0.1s ease';
                    }
                }, { passive: true });
                document.addEventListener('touchend', (e) => {
                    const btn = e.target.closest('.btn, .btn-icon, .btn-send');
                    if (btn) setTimeout(() => btn.style.transform = '', 150);
                }, { passive: true });
            }
            if (this.isMobile()) document.body.classList.add('mobile-view');
            window.addEventListener('resize', () => {
                if (this.isMobile()) document.body.classList.add('mobile-view');
                else document.body.classList.remove('mobile-view');
            });
        }

        updateBackButtonIcon() {
            if (this.elements.mobileBackBtn) {
                const icon = this.elements.mobileBackBtn.querySelector('i');
                if (icon) icon.className = 'fas fa-arrow-right';
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.chatManager = new ChatManager();
        });
    } else {
        window.chatManager = new ChatManager();
    }
})();