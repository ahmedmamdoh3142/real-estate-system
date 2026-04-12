// Frontend/global/js/api-client.js - الإصدار النهائي الثابت
(function () {
    'use strict';

    console.log('✅ api-client.js loaded - FINAL PRODUCTION VERSION');

    const API_CONFIG = {
        BASE_URL: '/api',   // ✅ الصح: عن طريق Nginx proxy
        TIMEOUT: 8000,
        MAX_RETRIES: 2,
        RETRY_DELAY: 1000,
        CACHE_DURATION: 60000
    };

    class APIClient {
        constructor() {
            this.baseURL = API_CONFIG.BASE_URL;
            this.isConnected = false;
            this.cache = new Map();
            this.cacheDuration = API_CONFIG.CACHE_DURATION;

            console.log('🚀 Ultimate API Client initialized');
            console.log('📍 Base URL:', this.baseURL);

            setTimeout(() => this.testConnection(), 1000);
        }

        normalizeEndpoint(endpoint) {
            if (!endpoint) return '/';
            let e = String(endpoint).trim();
            if (e.startsWith('/api/')) {
                e = e.slice(4);
            } else if (e === '/api') {
                e = '/';
            }
            if (!e.startsWith('/')) {
                e = '/' + e;
            }
            return e;
        }

        buildUrl(endpoint) {
            return `${this.baseURL}${this.normalizeEndpoint(endpoint)}`;
        }

        getCacheKey(endpoint, options = {}) {
            return `${this.normalizeEndpoint(endpoint)}_${JSON.stringify(options)}`;
        }

        async testConnection() {
            try {
                console.log('🔍 Testing connection...');
                const response = await fetch(this.buildUrl('/health'), {
                    method: 'GET',
                    headers: { 'Accept': 'application/json', 'Cache-Control': 'no-cache' }
                });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.json();
                console.log('✅ Server is alive:', data.message || 'Connected');
                this.isConnected = true;
                this.showStatus('success', '✅ الخادم متصل');
                return true;
            } catch (error) {
                console.warn('⚠️ Server connection warning:', error.message);
                this.isConnected = false;
                this.showStatus('warning', '⚠️ الخادم غير متصل - جاري استخدام البيانات المحلية');
                return false;
            }
        }

        showStatus(type, message) {
            if (window.Notifications && typeof window.Notifications.show === 'function') {
                window.Notifications.show({ type, title: type === 'success' ? 'تم بنجاح' : 'تنبيه', message, duration: 3000 });
            }
        }

        async request(endpoint, options = {}) {
            const normalized = this.normalizeEndpoint(endpoint);
            const url = this.buildUrl(normalized);
            const cacheKey = this.getCacheKey(normalized, options);

            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheDuration) {
                    console.log(`💾 استخدام cache: ${normalized}`);
                    return cached.data;
                }
            }

            const defaultOptions = {
                method: 'GET',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Accept-Language': 'ar' },
                cache: 'no-cache'
            };
            const finalOptions = { ...defaultOptions, ...options, headers: { ...defaultOptions.headers, ...(options.headers || {}) } };

            try {
                console.log(`🌐 Request: ${finalOptions.method} ${url}`);
                const response = await fetch(url, finalOptions);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const contentType = response.headers.get('content-type') || '';
                const data = contentType.includes('application/json') ? await response.json() : await response.text();
                this.cache.set(cacheKey, { data, timestamp: Date.now() });
                return data;
            } catch (error) {
                console.error(`❌ Request failed: ${normalized}`, error.message);
                const fallback = this.getFallbackData(normalized);
                if (fallback) {
                    console.log(`🔄 استخدام بيانات احتياطية لـ ${normalized}`);
                    return fallback;
                }
                throw error;
            }
        }

        getFallbackData(endpoint) {
            const e = this.normalizeEndpoint(endpoint);
            const fallbacks = {
                '/public/home/stats': {
                    success: true,
                    data: { totalProjects: 7, totalUnits: 70, totalClients: 2, totalCities: 3 },
                    source: 'fallback_data'
                },
                '/public/home/featured-projects': {
                    success: true,
                    data: {
                        projects: [
                            { id: 1, projectName: 'فيلات النخيل', city: 'الرياض', area: 450, price: 3500000, priceType: 'شراء', mainImage: '/global/assets/images/project-placeholder.jpg' },
                            { id: 2, projectName: 'أبراج الأعمال', city: 'الرياض', area: 200, price: 12000, priceType: 'إيجار', mainImage: '/global/assets/images/project-placeholder.jpg' }
                        ],
                        pagination: { total: 2, page: 1, pages: 1, limit: 6 }
                    },
                    source: 'fallback_data'
                }
            };
            return fallbacks[e] || null;
        }

        async getStats() { return this.request('/public/home/stats'); }
        async getFeaturedProjects(page = 1, limit = 6) { return this.request(`/public/home/featured-projects?page=${page}&limit=${limit}&_t=${Date.now()}`); }
        async subscribeNewsletter(email) { return this.request('/public/home/newsletter', { method: 'POST', body: JSON.stringify({ email }) }); }
        async testDatabase() { return this.request('/public/home/test-db'); }
        async healthCheck() { return this.request('/health'); }
    }

    window.API = new APIClient();

    setTimeout(() => {
        console.log('🔍 Running quick API tests...');
        window.API.getStats().catch(() => console.log('📊 Stats test: fallback'));
        window.API.getFeaturedProjects().catch(() => console.log('🏢 Projects test: fallback'));
    }, 2000);
})();