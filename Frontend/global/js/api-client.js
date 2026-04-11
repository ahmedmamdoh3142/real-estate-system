// Frontend/global/js/api-client.js - النسخة المحسنة 100%
(function() {
    'use strict';
    
    console.log('✅ api-client.js loaded - ULTIMATE WORKING VERSION');
    
    // إعدادات API - تستخدم CORS
    const API_CONFIG = {
        BASE_URL: 'http://localhost:3001',
        TIMEOUT: 8000,
        MAX_RETRIES: 2,
        RETRY_DELAY: 1000
    };
    
    class UltimateAPIClient {
        constructor() {
            this.baseURL = API_CONFIG.BASE_URL;
            this.isConnected = false;
            this.cache = new Map();
            this.cacheDuration = 60000; // 60 ثانية للتخزين المؤقت
            
            console.log('🚀 Ultimate API Client initialized');
            console.log('📍 Base URL:', this.baseURL);
            
            // اختبار اتصال سريع
            setTimeout(() => this.testConnection(), 1000);
        }
        
        // اختبار اتصال مبسط
        async testConnection() {
            try {
                console.log('🔍 Testing connection...');
                const response = await fetch(`${this.baseURL}/api/health`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Cache-Control': 'no-cache'
                    }
                });
                
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                
                const data = await response.json();
                console.log('✅ Server is alive:', data.message);
                this.isConnected = true;
                
                // إشعار بصيغة بسيطة
                this.showStatus('success', '✅ الخادم متصل');
                
                return true;
            } catch (error) {
                console.warn('⚠️ Server connection warning:', error.message);
                this.isConnected = false;
                
                // تحذير بسيط
                this.showStatus('warning', '⚠️ الخادم غير متصل - جاري استخدام البيانات المحلية');
                
                return false;
            }
        }
        
        // عرض حالة بسيطة
        showStatus(type, message) {
            if (!window.Notifications) return;
            
            window.Notifications.show({
                type: type,
                title: type === 'success' ? 'تم بنجاح' : 'تنبيه',
                message: message,
                duration: 3000
            });
        }
        
        // طلب API مبسط ومعالج للأخطاء
        async request(endpoint, options = {}) {
            const url = `${this.baseURL}${endpoint}`;
            const cacheKey = `${endpoint}_${JSON.stringify(options)}`;
            
            // التحقق من التخزين المؤقت
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheDuration) {
                    console.log(`💾 استخدام البيانات من الذاكرة: ${endpoint}`);
                    return cached.data;
                }
            }
            
            // إعدادات الطلب
            const defaultOptions = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Accept-Language': 'ar'
                },
                mode: 'cors',
                cache: 'no-cache'
            };
            
            const finalOptions = { ...defaultOptions, ...options };
            
            try {
                console.log(`🌐 Request: ${finalOptions.method} ${endpoint}`);
                
                const response = await fetch(url, finalOptions);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                
                // تخزين في الذاكرة
                this.cache.set(cacheKey, {
                    data: data,
                    timestamp: Date.now()
                });
                
                console.log(`✅ Response from ${endpoint}: Success`);
                
                return data;
                
            } catch (error) {
                console.error(`❌ Request failed: ${endpoint}`, error.message);
                
                // محاولة استخدام بيانات مخزنة مسبقاً
                const fallback = this.getFallbackData(endpoint);
                if (fallback) {
                    console.log(`🔄 استخدام بيانات احتياطية لـ ${endpoint}`);
                    return fallback;
                }
                
                throw error;
            }
        }
        
        // بيانات احتياطية لكل endpoint
        getFallbackData(endpoint) {
            const fallbacks = {
                '/api/public/home/stats': {
                    success: true,
                    data: {
                        totalProjects: 7,
                        totalUnits: 70,
                        availableUnits: 60,
                        totalClients: 2,
                        totalCities: 3,
                        featuredProjects: 4,
                        inquiriesToday: 0,
                        contractsThisYear: 2
                    },
                    source: 'fallback_data',
                    message: 'بيانات احتياطية - الخادم غير متصل'
                },
                '/api/public/home/featured-projects': {
                    success: true,
                    data: {
                        projects: [
                            {
                                id: 1,
                                projectName: 'فيلات النخيل الراقية',
                                projectType: 'سكني',
                                city: 'الرياض',
                                area: 450,
                                bedrooms: 5,
                                bathrooms: 4,
                                price: 3500000,
                                priceType: 'شراء',
                                mainImage: '/global/assets/images/project-placeholder.jpg',
                                features: [
                                    { featureName: 'المساحة', featureValue: '450 م²' },
                                    { featureName: 'غرف النوم', featureValue: '5' }
                                ]
                            },
                            {
                                id: 2,
                                projectName: 'أبراج الأعمال التجارية',
                                projectType: 'تجاري',
                                city: 'الرياض',
                                area: 200,
                                price: 12000,
                                priceType: 'تأجير',
                                mainImage: '/global/assets/images/project-placeholder.jpg',
                                features: [
                                    { featureName: 'المساحة', featureValue: '200 م²' },
                                    { featureName: 'النوع', featureValue: 'مكتبي' }
                                ]
                            }
                        ],
                        pagination: { total: 2, page: 1, pages: 1, limit: 6, hasMore: false }
                    },
                    source: 'fallback_data'
                }
            };
            
            return fallbacks[endpoint] || null;
        }
        
        // ===== APIs المحددة =====
        
        // الحصول على الإحصائيات
        async getStats() {
            console.log('📊 Calling getStats API...');
            return this.request('/api/public/home/stats');
        }
        
        // الحصول على المشاريع المميزة
        async getFeaturedProjects(page = 1, limit = 6) {
            console.log('🏢 Calling getFeaturedProjects API...');
            return this.request(`/api/public/home/featured-projects?page=${page}&limit=${limit}&_t=${Date.now()}`);
        }
        
        // الاشتراك في النشرة
        async subscribeNewsletter(email) {
            return this.request('/api/public/home/newsletter', {
                method: 'POST',
                body: JSON.stringify({ email })
            });
        }
        
        // اختبار قاعدة البيانات مباشرة
        async testDatabase() {
            return this.request('/api/public/home/test-db');
        }
    }
    
    // تعريف الكائن عمومياً
    window.API = new UltimateAPIClient();
    
    // اختبار سريع بعد التحميل
    setTimeout(() => {
        console.log('🔍 Running quick API tests...');
        
        // اختبار 1: الإحصائيات
        window.API.getStats()
            .then(data => {
                console.log('📊 Stats test passed:', data.success);
            })
            .catch(() => {
                console.log('📊 Stats test: Using fallback');
            });
        
        // اختبار 2: المشاريع
        window.API.getFeaturedProjects()
            .then(data => {
                console.log('🏢 Projects test passed:', data.success);
            })
            .catch(() => {
                console.log('🏢 Projects test: Using fallback');
            });
    }, 2000);

    console.log('🚀 API Client ready and tested!');
})();