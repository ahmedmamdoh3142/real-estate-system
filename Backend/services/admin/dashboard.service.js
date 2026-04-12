// 📁 Backend/services/admin/dashboard.service.js
const sql = require('mssql');

require('dotenv').config();

// الحصول على pool من app.locals (تم تعيينه في server.js)
function getPool() {
    const app = require('../../app');
    if (!app.locals.dbPool) {
        throw new Error('قاعدة البيانات غير متصلة');
    }
    return app.locals.dbPool;
}

class DashboardService {
    
    /**
     * دالة مساعدة للاستعلامات باستخدام mssql (Promise)
     * @param {string} sqlQuery - استعلام SQL
     * @returns {Promise} نتيجة الاستعلام
     */
    async queryAsync(sqlQuery) {
        const pool = getPool();
        try {
            console.log('📝 تنفيذ استعلام لوحة التحكم:', sqlQuery.substring(0, 100) + '...');
            const result = await pool.request().query(sqlQuery);
            console.log(`✅ تم جلب ${result.recordset.length} صف`);
            return result.recordset;
        } catch (err) {
            console.error('❌ خطأ في استعلام لوحة التحكم:', err.message);
            throw err;
        }
    }

    /**
     * دالة مساعدة لتنفيذ استعلامات لا تُرجع نتائج (INSERT, UPDATE, DELETE)
     * @param {string} query 
     * @returns {Promise}
     */
    async executeAsync(query) {
        const pool = getPool();
        try {
            const result = await pool.request().query(query);
            return result;
        } catch (err) {
            console.error('❌ خطأ في تنفيذ الأمر:', err.message);
            throw err;
        }
    }

    /**
     * @desc    جلب إحصائيات لوحة التحكم (وفق المتطلبات الجديدة)
     * @returns {Object} إحصائيات لوحة التحكم
     */
    async getDashboardStats() {
        try {
            console.log('📊 جلب إحصائيات لوحة التحكم من قاعدة البيانات (حسب المتطلبات)...');

            // استعلام شامل للإحصائيات
            const statsQuery = `
                SELECT 
                    -- إجمالي المشاريع
                    (SELECT COUNT(*) FROM Projects) as totalProjects,
                    -- إجمالي الوحدات المتاحة (مجموع availableUnits)
                    (SELECT ISNULL(SUM(availableUnits), 0) FROM Projects) as availableUnits,
                    
                    -- إجمالي العقود
                    (SELECT COUNT(*) FROM Contracts) as totalContracts,
                    -- العقود النشطة
                    (SELECT COUNT(*) FROM Contracts WHERE contractStatus = N'نشط') as activeContracts,
                    
                    -- إجمالي الإيرادات (المدفوعات المؤكدة)
                    (SELECT ISNULL(SUM(amount), 0) FROM Payments WHERE status = N'مؤكد') as totalRevenue,
                    -- الإيرادات الشهر الحالي
                    (SELECT ISNULL(SUM(amount), 0) FROM Payments 
                     WHERE status = N'مؤكد' 
                       AND MONTH(paymentDate) = MONTH(GETDATE()) 
                       AND YEAR(paymentDate) = YEAR(GETDATE())) as monthlyRevenue,
                    
                    -- إجمالي العملاء (عدد السجلات في Leads)
                    (SELECT COUNT(*) FROM Leads) as totalClients,
                    -- العملاء المتعاقدين هذا الشهر (العقود الجديدة)
                    (SELECT COUNT(*) FROM Contracts 
                     WHERE MONTH(createdAt) = MONTH(GETDATE()) 
                       AND YEAR(createdAt) = YEAR(GETDATE())) as newClients
            `;
            
            const result = await this.queryAsync(statsQuery);
            const stats = result[0];

            // تنسيق الإحصائيات
            const formattedStats = {
                totalProjects: parseInt(stats.totalProjects) || 0,
                availableUnits: parseInt(stats.availableUnits) || 0,
                totalContracts: parseInt(stats.totalContracts) || 0,
                activeContracts: parseInt(stats.activeContracts) || 0,
                totalRevenue: parseFloat(stats.totalRevenue) || 0,
                monthlyRevenue: parseFloat(stats.monthlyRevenue) || 0,
                totalClients: parseInt(stats.totalClients) || 0,
                newClients: parseInt(stats.newClients) || 0
            };

            console.log('✅ تم جلب إحصائيات لوحة التحكم:', formattedStats);
            return formattedStats;

        } catch (error) {
            console.error('❌ خطأ في getDashboardStats:', error);
            throw new Error('فشل في جلب إحصائيات لوحة التحكم');
        }
    }

    /**
     * @desc    جلب العقود الحديثة (آخر 5 عقود)
     * @param   {number} limit - عدد العقود المطلوبة
     * @returns {Array} قائمة العقود الحديثة
     */
    async getRecentContracts(limit = 5) {
        try {
            console.log(`📑 جلب أحدث ${limit} عقود...`);

            const query = `
                SELECT TOP ${limit}
                    c.id,
                    c.contractNumber,
                    c.customerName,
                    p.projectName,
                    c.totalAmount,
                    c.contractStatus as status,
                    c.startDate,
                    c.createdAt
                FROM Contracts c
                LEFT JOIN Projects p ON c.projectId = p.id
                ORDER BY c.createdAt DESC
            `;

            const result = await this.queryAsync(query);
            const contracts = result;

            // تنسيق العقود
            const formattedContracts = contracts.map(contract => ({
                id: contract.id,
                contractNumber: contract.contractNumber || `CON-${contract.id}`,
                customerName: contract.customerName || 'عميل',
                projectName: contract.projectName || 'مشروع',
                totalAmount: parseFloat(contract.totalAmount) || 0,
                status: contract.status || 'معلق',
                startDate: contract.startDate,
                createdAt: contract.createdAt
            }));

            console.log(`✅ تم جلب ${formattedContracts.length} عقد`);
            return formattedContracts;

        } catch (error) {
            console.error('❌ خطأ في getRecentContracts:', error);
            throw new Error('فشل في جلب العقود الحديثة');
        }
    }

    /**
     * @desc    جلب المدفوعات الحديثة (آخر 5 مدفوعات مؤكدة)
     * @param   {number} limit - عدد المدفوعات المطلوبة
     * @returns {Array} قائمة المدفوعات الحديثة
     */
    async getRecentPayments(limit = 5) {
        try {
            console.log(`💰 جلب أحدث ${limit} مدفوعات...`);

            const query = `
                SELECT TOP ${limit}
                    p.id,
                    p.paymentNumber,
                    c.customerName,
                    p.amount,
                    p.paymentMethod,
                    p.paymentDate,
                    p.status,
                    p.receiptNumber
                FROM Payments p
                LEFT JOIN Contracts c ON p.contractId = c.id
                WHERE p.status = N'مؤكد'
                ORDER BY p.paymentDate DESC, p.createdAt DESC
            `;

            const result = await this.queryAsync(query);
            const payments = result;

            // تنسيق المدفوعات
            const formattedPayments = payments.map(payment => ({
                id: payment.id,
                paymentNumber: payment.paymentNumber || `PAY-${payment.id}`,
                customerName: payment.customerName || 'عميل',
                amount: parseFloat(payment.amount) || 0,
                paymentMethod: this.getPaymentMethodText(payment.paymentMethod),
                paymentDate: payment.paymentDate,
                status: payment.status || 'مؤكد',
                receiptNumber: payment.receiptNumber || `REC-${payment.id}`
            }));

            console.log(`✅ تم جلب ${formattedPayments.length} دفعة`);
            return formattedPayments;

        } catch (error) {
            console.error('❌ خطأ في getRecentPayments:', error);
            throw new Error('فشل في جلب المدفوعات الحديثة');
        }
    }

    /**
     * @desc    جلب الاستفسارات الحديثة (آخر 5 استفسارات جديدة)
     * @param   {number} limit - عدد الاستفسارات المطلوبة
     * @returns {Array} قائمة الاستفسارات الحديثة
     */
    async getRecentInquiries(limit = 5) {
        try {
            console.log(`❓ جلب أحدث ${limit} استفسارات...`);

            const query = `
                SELECT TOP ${limit}
                    i.id,
                    i.inquiryCode,
                    i.customerName,
                    p.projectName,
                    i.inquiryType,
                    i.status,
                    i.createdAt
                FROM Inquiries i
                LEFT JOIN Projects p ON i.projectId = p.id
                ORDER BY i.createdAt DESC
            `;

            const result = await this.queryAsync(query);
            const inquiries = result;

            // تنسيق الاستفسارات
            const formattedInquiries = inquiries.map(inquiry => ({
                id: inquiry.id,
                inquiryCode: inquiry.inquiryCode || `INQ-${inquiry.id}`,
                customerName: inquiry.customerName || 'عميل',
                projectName: inquiry.projectName || 'مشروع',
                inquiryType: this.getInquiryTypeText(inquiry.inquiryType),
                status: this.getInquiryStatusText(inquiry.status),
                createdAt: inquiry.createdAt
            }));

            console.log(`✅ تم جلب ${formattedInquiries.length} استفسار`);
            return formattedInquiries;

        } catch (error) {
            console.error('❌ خطأ في getRecentInquiries:', error);
            throw new Error('فشل في جلب الاستفسارات الحديثة');
        }
    }

    /**
     * @desc    جلب بيانات الإيرادات للرسم البياني حسب الفترة (ربع سنوي / سنوي)
     * @param   {string} period - 'quarterly' أو 'yearly'
     * @returns {Object} بيانات الإيرادات (labels, data)
     */
    async getRevenueChartData(period = 'quarterly') {
        try {
            console.log(`📈 جلب بيانات الإيرادات للرسم البياني (${period})...`);

            let query = '';
            if (period === 'yearly') {
                // آخر 4 سنوات
                query = `
                    SELECT 
                        YEAR(paymentDate) as year,
                        SUM(amount) as revenue
                    FROM Payments
                    WHERE status = N'مؤكد'
                      AND YEAR(paymentDate) >= YEAR(GETDATE()) - 3
                    GROUP BY YEAR(paymentDate)
                    ORDER BY year
                `;
            } else {
                // ربع سنوي: آخر 4 أرباع (أو أرباع السنة الحالية)
                query = `
                    SELECT 
                        CONCAT('Q', DATEPART(quarter, paymentDate), ' ', YEAR(paymentDate)) as quarter,
                        SUM(amount) as revenue
                    FROM Payments
                    WHERE status = N'مؤكد'
                      AND paymentDate >= DATEADD(quarter, -3, GETDATE())
                    GROUP BY YEAR(paymentDate), DATEPART(quarter, paymentDate)
                    ORDER BY MIN(paymentDate)
                `;
            }

            const result = await this.queryAsync(query);
            
            const labels = [];
            const data = [];

            result.forEach(row => {
                if (period === 'yearly') {
                    labels.push(row.year.toString());
                } else {
                    labels.push(row.quarter);
                }
                data.push(parseFloat(row.revenue) || 0);
            });

            // إذا لم توجد بيانات، نعيد مصفوفتين فارغتين (الرسم البياني سيكون فارغاً)
            return { labels, data };

        } catch (error) {
            console.error('❌ خطأ في getRevenueChartData:', error);
            throw new Error('فشل في جلب بيانات الإيرادات للرسم البياني');
        }
    }

    /**
     * @desc    جلب توزيع المشاريع حسب النوع أو المدينة
     * @param   {string} filterBy - 'type' أو 'city'
     * @returns {Object} بيانات التوزيع (labels, data, colors)
     */
    async getProjectsChartData(filterBy = 'type') {
        try {
            console.log(`📊 جلب توزيع المشاريع حسب ${filterBy === 'type' ? 'النوع' : 'المدينة'}...`);

            const groupField = filterBy === 'type' ? 'projectType' : 'city';
            
            const query = `
                SELECT 
                    ${groupField} as label,
                    COUNT(*) as count
                FROM Projects
                WHERE ${groupField} IS NOT NULL AND ${groupField} != ''
                GROUP BY ${groupField}
                ORDER BY count DESC
            `;

            const result = await this.queryAsync(query);
            
            const labels = [];
            const data = [];
            const colors = [];

            // ألوان ثابتة متنوعة
            const colorPalette = [
                '#121212',
                '#1E1E1E',
                '#2C2C2C',
                '#3A3A3A',
                '#4A4A4A',
                '#5A5A5A',
                '#6A6A6A',
                '#C0C0C0'
            ];

            result.forEach((row, index) => {
                labels.push(row.label || 'غير محدد');
                data.push(parseInt(row.count) || 0);
                colors.push(colorPalette[index % colorPalette.length]);
            });

            return { labels, data, colors };

        } catch (error) {
            console.error('❌ خطأ في getProjectsChartData:', error);
            throw new Error('فشل في جلب توزيع المشاريع');
        }
    }

    /**
     * @desc    دالة مساعدة لتحويل نوع وسيلة الدفع
     * @param   {string} method - وسيلة الدفع
     * @returns {string} وصف وسيلة الدفع
     */
    getPaymentMethodText(method) {
        const methodMap = {
            'تحويل_بنكي': 'تحويل بنكي',
            'شيك': 'شيك',
            'نقدي': 'نقدي',
            'بطاقة': 'بطاقة ائتمان',
            'cash': 'نقدي',
            'bank_transfer': 'تحويل بنكي',
            'check': 'شيك',
            'card': 'بطاقة ائتمان'
        };
        return methodMap[method] || method || 'غير محدد';
    }

    /**
     * @desc    دالة مساعدة لتحويل نوع الاستفسار
     * @param   {string} type - نوع الاستفسار
     * @returns {string} وصف نوع الاستفسار
     */
    getInquiryTypeText(type) {
        const typeMap = {
            'طلب_عرض_سعر': 'طلب عرض سعر',
            'تفاصيل_إضافية': 'تفاصيل إضافية',
            'استفسار_عام': 'استفسار عام',
            'price_request': 'طلب عرض سعر',
            'details': 'تفاصيل إضافية',
            'general': 'استفسار عام'
        };
        return typeMap[type] || type || 'استفسار عام';
    }

    /**
     * @desc    دالة مساعدة لتحويل حالة الاستفسار
     * @param   {string} status - حالة الاستفسار
     * @returns {string} وصف حالة الاستفسار
     */
    getInquiryStatusText(status) {
        const statusMap = {
            'جديد': 'جديد',
            'تحت_المراجعة': 'قيد المراجعة',
            'تم_الرد': 'تم الرد',
            'مكتمل': 'مكتمل',
            'new': 'جديد',
            'pending': 'قيد المراجعة',
            'responded': 'تم الرد',
            'completed': 'مكتمل'
        };
        return statusMap[status] || status || 'جديد';
    }
}

module.exports = new DashboardService();