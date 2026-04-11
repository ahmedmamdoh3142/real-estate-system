// ===== نظام الإشعارات للنظام العقاري =====
(function() {
    'use strict';
    
    console.log('✅ notifications.js loaded successfully');
    
    // تعريف كائن NotificationManager
    function NotificationManager() {
        this.notificationArea = null;
        this.createNotificationArea();
        this.addStyles();
    }
    
    // إنشاء منطقة الإشعارات
    NotificationManager.prototype.createNotificationArea = function() {
        if (!document.getElementById('notification-area')) {
            this.notificationArea = document.createElement('div');
            this.notificationArea.id = 'notification-area';
            this.notificationArea.className = 'notification-container';
            document.body.appendChild(this.notificationArea);
        } else {
            this.notificationArea = document.getElementById('notification-area');
        }
    };
    
    // إضافة أنماط CSS
    NotificationManager.prototype.addStyles = function() {
        if (document.getElementById('notification-styles')) {
            return; // الأنماط موجودة مسبقاً
        }
        
        var style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification-container {
                position: fixed;
                top: 20px;
                left: 20px;
                right: 20px;
                max-width: 400px;
                margin: 0 auto;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                pointer-events: none;
            }
            
            .notification {
                background: var(--color-surface);
                border: 1px solid var(--color-border);
                border-radius: 8px;
                padding: 16px;
                margin-bottom: 12px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                display: flex;
                align-items: flex-start;
                gap: 12px;
                width: 100%;
                pointer-events: auto;
                transform: translateX(100%);
                opacity: 0;
                transition: transform 0.3s ease, opacity 0.3s ease;
                border-right: 4px solid;
            }
            
            .notification.show {
                transform: translateX(0);
                opacity: 1;
            }
            
            .notification-success {
                border-right-color: #10b981;
            }
            
            .notification-error {
                border-right-color: #ef4444;
            }
            
            .notification-warning {
                border-right-color: #f59e0b;
            }
            
            .notification-info {
                border-right-color: #3b82f6;
            }
            
            .notification-icon {
                font-size: 20px;
                flex-shrink: 0;
                margin-top: 4px;
            }
            
            .notification-success .notification-icon {
                color: #10b981;
            }
            
            .notification-error .notification-icon {
                color: #ef4444;
            }
            
            .notification-warning .notification-icon {
                color: #f59e0b;
            }
            
            .notification-info .notification-icon {
                color: #3b82f6;
            }
            
            .notification-content {
                flex: 1;
            }
            
            .notification-title {
                font-weight: 600;
                color: var(--color-text-primary);
                margin-bottom: 4px;
                font-size: 15px;
            }
            
            .notification-message {
                color: var(--color-text-secondary);
                font-size: 14px;
                line-height: 1.4;
                margin: 0;
            }
            
            .notification-close {
                background: none;
                border: none;
                color: var(--color-text-secondary);
                cursor: pointer;
                padding: 4px;
                font-size: 14px;
                flex-shrink: 0;
                margin-top: 4px;
            }
            
            .notification-close:hover {
                color: var(--color-text-primary);
            }
        `;
        document.head.appendChild(style);
    };
    
    // عرض إشعار
    NotificationManager.prototype.show = function(options) {
        var config = {
            type: 'info',
            title: '',
            message: '',
            duration: 5000
        };
        
        // دمج الإعدادات
        for (var key in options) {
            if (options.hasOwnProperty(key)) {
                config[key] = options[key];
            }
        }
        
        // إنشاء عنصر الإشعار
        var notification = document.createElement('div');
        notification.className = 'notification notification-' + config.type;
        
        // تحديد الأيقونة حسب النوع
        var icon = 'fa-info-circle';
        switch(config.type) {
            case 'success':
                icon = 'fa-check-circle';
                break;
            case 'error':
                icon = 'fa-exclamation-circle';
                break;
            case 'warning':
                icon = 'fa-exclamation-triangle';
                break;
            case 'info':
                icon = 'fa-info-circle';
                break;
        }
        
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="fas ${icon}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${config.title}</div>
                <div class="notification-message">${config.message}</div>
            </div>
            <button class="notification-close" aria-label="إغلاق">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // إضافة للإشعارات
        if (this.notificationArea) {
            this.notificationArea.appendChild(notification);
        } else {
            document.body.appendChild(notification);
        }
        
        // إظهار مع تأثير
        setTimeout(function() {
            notification.classList.add('show');
        }, 10);
        
        // إضافة حدث الإغلاق
        var closeBtn = notification.querySelector('.notification-close');
        var self = this;
        closeBtn.addEventListener('click', function() {
            self.hide(notification);
        });
        
        // إخفاء تلقائي بعد المدة
        if (config.duration > 0) {
            setTimeout(function() {
                self.hide(notification);
            }, config.duration);
        }
        
        return notification;
    };
    
    // إخفاء إشعار
    NotificationManager.prototype.hide = function(notification) {
        if (!notification || !notification.parentNode) return;
        
        notification.classList.remove('show');
        
        setTimeout(function() {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    };
    
    // طرق مساعدة سريعة
    NotificationManager.prototype.success = function(title, message) {
        return this.show({
            type: 'success',
            title: title,
            message: message
        });
    };
    
    NotificationManager.prototype.error = function(title, message) {
        return this.show({
            type: 'error',
            title: title,
            message: message
        });
    };
    
    NotificationManager.prototype.warning = function(title, message) {
        return this.show({
            type: 'warning',
            title: title,
            message: message
        });
    };
    
    NotificationManager.prototype.info = function(title, message) {
        return this.show({
            type: 'info',
            title: title,
            message: message
        });
    };
    
    // تعريف الكائن عمومياً
    window.Notifications = new NotificationManager();
})();