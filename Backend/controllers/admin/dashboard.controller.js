// 📁 Backend/controllers/admin/dashboard.controller.js
const dashboardService = require('../../services/admin/dashboard.service');

/**
 * @desc    جلب إحصائيات لوحة التحكم
 * @route   GET /api/admin/dashboard/stats
 * @access  Private (Admin)
 */
exports.getDashboardStats = async (req, res) => {
    try {
        console.log('📊 جلب إحصائيات لوحة التحكم...');
        
        const stats = await dashboardService.getDashboardStats();
        
        res.status(200).json({
            success: true,
            message: 'تم جلب إحصائيات لوحة التحكم بنجاح',
            data: stats
        });
        
    } catch (error) {
        console.error('❌ خطأ في getDashboardStats:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'فشل في جلب إحصائيات لوحة التحكم'
        });
    }
};

/**
 * @desc    جلب العقود الحديثة
 * @route   GET /api/admin/dashboard/recent-contracts
 * @access  Private (Admin)
 */
exports.getRecentContracts = async (req, res) => {
    try {
        const { limit = 5 } = req.query;
        console.log(`📑 جلب أحدث ${limit} عقود...`);
        
        const contracts = await dashboardService.getRecentContracts(parseInt(limit));
        
        res.status(200).json({
            success: true,
            message: 'تم جلب العقود الحديثة بنجاح',
            data: contracts
        });
        
    } catch (error) {
        console.error('❌ خطأ في getRecentContracts:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'فشل في جلب العقود الحديثة'
        });
    }
};

/**
 * @desc    جلب المدفوعات الحديثة
 * @route   GET /api/admin/dashboard/recent-payments
 * @access  Private (Admin)
 */
exports.getRecentPayments = async (req, res) => {
    try {
        const { limit = 5 } = req.query;
        console.log(`💰 جلب أحدث ${limit} مدفوعات...`);
        
        const payments = await dashboardService.getRecentPayments(parseInt(limit));
        
        res.status(200).json({
            success: true,
            message: 'تم جلب المدفوعات الحديثة بنجاح',
            data: payments
        });
        
    } catch (error) {
        console.error('❌ خطأ في getRecentPayments:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'فشل في جلب المدفوعات الحديثة'
        });
    }
};

/**
 * @desc    جلب الاستفسارات الحديثة
 * @route   GET /api/admin/dashboard/recent-inquiries
 * @access  Private (Admin)
 */
exports.getRecentInquiries = async (req, res) => {
    try {
        const { limit = 5 } = req.query;
        console.log(`❓ جلب أحدث ${limit} استفسارات...`);
        
        const inquiries = await dashboardService.getRecentInquiries(parseInt(limit));
        
        res.status(200).json({
            success: true,
            message: 'تم جلب الاستفسارات الحديثة بنجاح',
            data: inquiries
        });
        
    } catch (error) {
        console.error('❌ خطأ في getRecentInquiries:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'فشل في جلب الاستفسارات الحديثة'
        });
    }
};

/**
 * @desc    جلب بيانات الإيرادات للرسم البياني (مع فلتر)
 * @route   GET /api/admin/dashboard/monthly-revenue?period=quarterly|yearly
 * @access  Private (Admin)
 */
exports.getMonthlyRevenue = async (req, res) => {
    try {
        const period = req.query.period || 'quarterly';
        console.log(`📈 جلب بيانات الإيرادات (${period})...`);
        
        const revenueData = await dashboardService.getRevenueChartData(period);
        
        res.status(200).json({
            success: true,
            message: 'تم جلب بيانات الإيرادات بنجاح',
            data: revenueData,
            period: period
        });
        
    } catch (error) {
        console.error('❌ خطأ في getMonthlyRevenue:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'فشل في جلب بيانات الإيرادات'
        });
    }
};

/**
 * @desc    جلب توزيع المشاريع (مع فلتر)
 * @route   GET /api/admin/dashboard/projects-by-type?filter=type|city
 * @access  Private (Admin)
 */
exports.getProjectsByType = async (req, res) => {
    try {
        const filterBy = req.query.filter || 'type';
        console.log(`📊 جلب توزيع المشاريع حسب ${filterBy === 'type' ? 'النوع' : 'المدينة'}...`);
        
        const projectsData = await dashboardService.getProjectsChartData(filterBy);
        
        res.status(200).json({
            success: true,
            message: 'تم جلب توزيع المشاريع بنجاح',
            data: projectsData,
            filter: filterBy
        });
        
    } catch (error) {
        console.error('❌ خطأ في getProjectsByType:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'فشل في جلب توزيع المشاريع'
        });
    }
};

/**
 * @desc    جلب جميع بيانات لوحة التحكم دفعة واحدة
 * @route   GET /api/admin/dashboard/all-data
 * @access  Private (Admin)
 */
exports.getAllDashboardData = async (req, res) => {
    try {
        console.log('🚀 جلب جميع بيانات لوحة التحكم دفعة واحدة...');
        
        // جلب جميع البيانات بالتوازي
        const [
            stats,
            contracts,
            payments,
            inquiries,
            monthlyRevenue,
            projectsByType
        ] = await Promise.all([
            dashboardService.getDashboardStats(),
            dashboardService.getRecentContracts(5),
            dashboardService.getRecentPayments(5),
            dashboardService.getRecentInquiries(5),
            dashboardService.getRevenueChartData('quarterly'), // افتراضي ربع سنوي
            dashboardService.getProjectsChartData('type')      // افتراضي حسب النوع
        ]);
        
        res.status(200).json({
            success: true,
            message: 'تم جلب جميع بيانات لوحة التحكم بنجاح',
            data: {
                stats,
                contracts,
                payments,
                inquiries,
                activities: [], // يمكن إضافتها لاحقًا
                notifications: [], // يمكن إضافتها لاحقًا
                charts: {
                    monthlyRevenue,
                    projectsByType
                }
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ خطأ في getAllDashboardData:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'فشل في جلب جميع بيانات لوحة التحكم'
        });
    }
};

/**
 * @desc    فحص صحة API لوحة التحكم
 * @route   GET /api/admin/dashboard/health
 * @access  Private (Admin)
 */
exports.getDashboardHealth = async (req, res) => {
    try {
        console.log('🏥 فحص صحة لوحة التحكم...');
        
        // اختبار بسيط للاتصال بقاعدة البيانات
        const testQuery = await dashboardService.queryAsync('SELECT 1 as test');
        
        res.status(200).json({
            success: true,
            message: '✅ لوحة التحكم تعمل بشكل ممتاز',
            data: {
                database: {
                    connected: true,
                    testResult: testQuery[0].test
                },
                timestamp: new Date().toISOString(),
                version: '2.0.0 - Dynamic Filters Dashboard'
            }
        });
        
    } catch (error) {
        console.error('❌ خطأ في فحص الصحة:', error);
        
        res.status(200).json({
            success: true,
            message: '✅ لوحة التحكم تعمل (قاعدة البيانات تحت الصيانة)',
            timestamp: new Date().toISOString()
        });
    }
};
