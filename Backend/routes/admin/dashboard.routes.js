// Backend/routes/admin/dashboard.routes.js - الإصدار النهائي (يستخدم service.queryAsync مع عرض تفاصيل الخطأ)
const express = require('express');
const router = express.Router();
// استيراد الـ service للاستفادة من queryAsync (الذي يستخدم connectionString الصحيح)
const dashboardService = require('/services/admin/dashboard.service');

console.log('✅ تم تحميل Dashboard Routes مع دعم الفلاتر (ربع سنوي/سنوي، نوع/مدينة) باستخدام service.queryAsync');

// ==================== اختبار الاتصال بقاعدة البيانات ====================
router.get('/test-db', async (req, res) => {
    console.log('🧪 اختبار الاتصال بقاعدة البيانات');
    
    try {
        const result = await dashboardService.queryAsync('SELECT 1 as test');
        res.json({
            success: true,
            message: '✅ الاتصال بقاعدة البيانات ناجح',
            data: result
        });
    } catch (error) {
        console.error('❌ فشل الاتصال بقاعدة البيانات:', error);
        res.status(500).json({
            success: false,
            message: 'فشل الاتصال بقاعدة البيانات',
            error: error.message,
            stack: error.stack // للتصحيح فقط، يمكن إزالته في الإنتاج
        });
    }
});

// ==================== الإحصائيات ====================
router.get('/stats', async (req, res) => {
    console.log('📊 طلب إحصائيات Dashboard');
    
    try {
        const query = `
            SELECT 
                (SELECT COUNT(*) FROM Projects) as totalProjects,
                (SELECT ISNULL(SUM(availableUnits), 0) FROM Projects) as availableUnits,
                (SELECT COUNT(*) FROM Contracts) as totalContracts,
                (SELECT COUNT(*) FROM Contracts WHERE contractStatus = N'نشط') as activeContracts,
                (SELECT ISNULL(SUM(amount), 0) FROM Payments WHERE status = N'مؤكد') as totalRevenue,
                (SELECT ISNULL(SUM(amount), 0) FROM Payments 
                 WHERE status = N'مؤكد' 
                   AND MONTH(paymentDate) = MONTH(GETDATE()) 
                   AND YEAR(paymentDate) = YEAR(GETDATE())) as monthlyRevenue,
                (SELECT COUNT(*) FROM Leads) as totalClients,
                (SELECT COUNT(*) FROM Contracts 
                 WHERE MONTH(createdAt) = MONTH(GETDATE()) 
                   AND YEAR(createdAt) = YEAR(GETDATE())) as newClients
        `;
        
        const result = await dashboardService.queryAsync(query);
        const stats = result[0];
        
        res.json({
            success: true,
            data: stats,
            source: 'real_database',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ خطأ في جلب الإحصائيات:', error);
        res.status(500).json({
            success: false,
            message: 'فشل في جلب الإحصائيات',
            error: error.message,
            stack: error.stack // للتصحيح فقط
        });
    }
});

// ==================== العقود الحديثة ====================
router.get('/recent-contracts', async (req, res) => {
    const limit = parseInt(req.query.limit) || 5;
    
    try {
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
        
        const result = await dashboardService.queryAsync(query);
        
        res.json({
            success: true,
            data: result,
            total: result.length
        });
        
    } catch (error) {
        console.error('❌ خطأ في جلب العقود:', error);
        res.status(500).json({
            success: false,
            message: 'فشل في جلب العقود الحديثة',
            error: error.message,
            stack: error.stack
        });
    }
});

// ==================== المدفوعات الحديثة ====================
router.get('/recent-payments', async (req, res) => {
    const limit = parseInt(req.query.limit) || 5;
    
    try {
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
        
        const result = await dashboardService.queryAsync(query);
        
        res.json({
            success: true,
            data: result,
            total: result.length
        });
        
    } catch (error) {
        console.error('❌ خطأ في جلب المدفوعات:', error);
        res.status(500).json({
            success: false,
            message: 'فشل في جلب المدفوعات الحديثة',
            error: error.message,
            stack: error.stack
        });
    }
});

// ==================== الاستفسارات الحديثة ====================
router.get('/recent-inquiries', async (req, res) => {
    const limit = parseInt(req.query.limit) || 5;
    
    try {
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
        
        const result = await dashboardService.queryAsync(query);
        
        res.json({
            success: true,
            data: result,
            total: result.length
        });
        
    } catch (error) {
        console.error('❌ خطأ في جلب الاستفسارات:', error);
        res.status(500).json({
            success: false,
            message: 'فشل في جلب الاستفسارات الحديثة',
            error: error.message,
            stack: error.stack
        });
    }
});

// ==================== بيانات الإيرادات للرسم البياني (مع فلتر) ====================
router.get('/monthly-revenue', async (req, res) => {
    const period = req.query.period || 'quarterly'; // quarterly or yearly
    console.log(`📈 طلب بيانات الإيرادات (${period})`);
    
    try {
        let query = '';
        if (period === 'yearly') {
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
        
        const result = await dashboardService.queryAsync(query);
        
        const labels = [];
        const data = [];
        
        result.forEach(row => {
            if (period === 'yearly') {
                labels.push(row.year.toString());
            } else {
                labels.push(row.quarter);
            }
            data.push(row.revenue || 0);
        });
        
        res.json({
            success: true,
            data: { labels, data },
            period: period
        });
        
    } catch (error) {
        console.error('❌ خطأ في جلب بيانات الإيرادات:', error);
        res.status(500).json({
            success: false,
            message: 'فشل في جلب بيانات الإيرادات',
            error: error.message,
            stack: error.stack
        });
    }
});

// ==================== توزيع المشاريع (حسب النوع أو المدينة) مع فلتر ====================
router.get('/projects-by-type', async (req, res) => {
    const filterBy = req.query.filter || 'type'; // type or city
    console.log(`📊 طلب توزيع المشاريع حسب ${filterBy === 'type' ? 'النوع' : 'المدينة'}`);
    
    try {
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
        
        const result = await dashboardService.queryAsync(query);
        
        const labels = [];
        const data = [];
        const colors = [];
        
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
            data.push(row.count || 0);
            colors.push(colorPalette[index % colorPalette.length]);
        });
        
        res.json({
            success: true,
            data: { labels, data, colors },
            filter: filterBy
        });
        
    } catch (error) {
        console.error('❌ خطأ في جلب توزيع المشاريع:', error);
        res.status(500).json({
            success: false,
            message: 'فشل في جلب توزيع المشاريع',
            error: error.message,
            stack: error.stack
        });
    }
});

// ==================== جميع البيانات دفعة واحدة (للوحة التحكم) ====================
router.get('/all-data', async (req, res) => {
    console.log('🚀 طلب جميع بيانات لوحة التحكم دفعة واحدة');
    
    try {
        // الإحصائيات
        const statsQuery = `
            SELECT 
                (SELECT COUNT(*) FROM Projects) as totalProjects,
                (SELECT ISNULL(SUM(availableUnits), 0) FROM Projects) as availableUnits,
                (SELECT COUNT(*) FROM Contracts) as totalContracts,
                (SELECT COUNT(*) FROM Contracts WHERE contractStatus = N'نشط') as activeContracts,
                (SELECT ISNULL(SUM(amount), 0) FROM Payments WHERE status = N'مؤكد') as totalRevenue,
                (SELECT ISNULL(SUM(amount), 0) FROM Payments 
                 WHERE status = N'مؤكد' AND MONTH(paymentDate) = MONTH(GETDATE()) AND YEAR(paymentDate) = YEAR(GETDATE())) as monthlyRevenue,
                (SELECT COUNT(*) FROM Leads) as totalClients,
                (SELECT COUNT(*) FROM Contracts 
                 WHERE MONTH(createdAt) = MONTH(GETDATE()) AND YEAR(createdAt) = YEAR(GETDATE())) as newClients
        `;
        
        // العقود الحديثة
        const contractsQuery = `
            SELECT TOP 5
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
        
        // المدفوعات الحديثة
        const paymentsQuery = `
            SELECT TOP 5
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
        
        // الاستفسارات الحديثة
        const inquiriesQuery = `
            SELECT TOP 5
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
        
        // بيانات الإيرادات (افتراضي ربع سنوي)
        const revenueQuery = `
            SELECT 
                CONCAT('Q', DATEPART(quarter, paymentDate), ' ', YEAR(paymentDate)) as quarter,
                SUM(amount) as revenue
            FROM Payments
            WHERE status = N'مؤكد'
              AND paymentDate >= DATEADD(quarter, -3, GETDATE())
            GROUP BY YEAR(paymentDate), DATEPART(quarter, paymentDate)
            ORDER BY MIN(paymentDate)
        `;
        
        // توزيع المشاريع (افتراضي حسب النوع)
        const projectsQuery = `
            SELECT 
                projectType as label,
                COUNT(*) as count
            FROM Projects
            WHERE projectType IS NOT NULL AND projectType != ''
            GROUP BY projectType
            ORDER BY count DESC
        `;
        
        // تنفيذ جميع الاستعلامات
        const [
            statsResult,
            contractsResult,
            paymentsResult,
            inquiriesResult,
            revenueResult,
            projectsResult
        ] = await Promise.all([
            dashboardService.queryAsync(statsQuery),
            dashboardService.queryAsync(contractsQuery),
            dashboardService.queryAsync(paymentsQuery),
            dashboardService.queryAsync(inquiriesQuery),
            dashboardService.queryAsync(revenueQuery),
            dashboardService.queryAsync(projectsQuery)
        ]);
        
        const revenueLabels = revenueResult.map(r => r.quarter);
        const revenueData = revenueResult.map(r => r.revenue || 0);
        
        const projectLabels = projectsResult.map(r => r.label);
        const projectData = projectsResult.map(r => r.count);
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
        const projectColors = projectLabels.map((_, i) => colorPalette[i % colorPalette.length]);
        
        const responseData = {
            stats: statsResult[0],
            contracts: contractsResult,
            payments: paymentsResult,
            inquiries: inquiriesResult,
            activities: [], // يمكن تركها فارغة
            notifications: [], // يمكن تركها فارغة
            charts: {
                monthlyRevenue: {
                    labels: revenueLabels.length ? revenueLabels : ['الربع الأول', 'الربع الثاني', 'الربع الثالث', 'الربع الرابع'],
                    data: revenueData.length ? revenueData : [0, 0, 0, 0]
                },
                projectsByType: {
                    labels: projectLabels.length ? projectLabels : ['سكني', 'تجاري', 'صناعي'],
                    data: projectData.length ? projectData : [0, 0, 0],
                    colors: projectColors
                }
            }
        };
        
        res.json({
            success: true,
            data: responseData,
            message: 'تم جلب جميع بيانات لوحة التحكم بنجاح',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ خطأ في جلب جميع البيانات:', error);
        res.status(500).json({
            success: false,
            message: 'فشل في جلب جميع البيانات',
            error: error.message,
            stack: error.stack
        });
    }
});

module.exports = router;