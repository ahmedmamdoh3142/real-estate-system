const statsService = require('../../services/admin/stats.service');

// ========== الأقسام ==========
exports.getAllDepartments = async (req, res) => {
    try {
        const departments = await statsService.getAllDepartments();
        res.json({ success: true, data: departments });
    } catch (error) {
        console.error('❌ getAllDepartments error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getDepartmentById = async (req, res) => {
    try {
        const { id } = req.params;
        const department = await statsService.getDepartmentById(id);
        if (!department) {
            return res.status(404).json({ success: false, message: 'القسم غير موجود' });
        }
        res.json({ success: true, data: department });
    } catch (error) {
        console.error('❌ getDepartmentById error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ========== إحصائيات الأقسام مع فلتر التاريخ ==========
exports.getDepartmentsStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        console.log(`📊 Fetching departments stats from ${startDate || 'بداية'} to ${endDate || 'نهاية'}`);
        const stats = await statsService.getAllDepartmentsStats(startDate, endDate);
        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('❌ getDepartmentsStats error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ========== إحصائيات عامة ==========
exports.getOverallStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const stats = await statsService.getOverallStats(startDate, endDate);
        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('❌ getOverallStats error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ========== جميع الموظفين (بدون فلتر قسم) ==========
exports.getAllEmployees = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const employees = await statsService.getAllEmployees(startDate, endDate);
        res.json({ success: true, data: employees });
    } catch (error) {
        console.error('❌ getAllEmployees error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ========== موظفو القسم ==========
exports.getEmployeesByDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const { startDate, endDate } = req.query;
        const employees = await statsService.getEmployeesByDepartment(id, startDate, endDate);
        res.json({ success: true, data: employees });
    } catch (error) {
        console.error('❌ getEmployeesByDepartment error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ========== إحصائيات مهام قسم معين ==========
exports.getDepartmentTasksStats = async (req, res) => {
    try {
        const { id } = req.params;
        const { startDate, endDate } = req.query;
        const stats = await statsService.getDepartmentTasksStats(id, startDate, endDate);
        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('❌ getDepartmentTasksStats error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ========== أفضل الموظفين ==========
exports.getTopEmployees = async (req, res) => {
    try {
        const { limit = 5, startDate, endDate } = req.query;
        const employees = await statsService.getTopEmployees(limit, startDate, endDate);
        res.json({ success: true, data: employees });
    } catch (error) {
        console.error('❌ getTopEmployees error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ========== تفاصيل الموظف الكاملة ==========
exports.getEmployeeDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const { startDate, endDate } = req.query;
        const employee = await statsService.getEmployeeDetails(id, startDate, endDate);
        if (!employee) {
            return res.status(404).json({ success: false, message: 'الموظف غير موجود' });
        }
        res.json({ success: true, data: employee });
    } catch (error) {
        console.error('❌ getEmployeeDetails error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ========== بيانات الرسم البياني ==========
exports.getTasksChartData = async (req, res) => {
    try {
        const { departmentId, startDate, endDate } = req.query;
        const data = await statsService.getTasksChartData(departmentId, startDate, endDate);
        res.json({ success: true, data });
    } catch (error) {
        console.error('❌ getTasksChartData error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ========== حذف جزاء عادي ==========
exports.deleteRegularPenalty = async (req, res) => {
    try {
        const { id } = req.params;
        await statsService.deleteRegularPenalty(id);
        res.json({ success: true, message: 'تم حذف الجزاء بنجاح' });
    } catch (error) {
        console.error('❌ deleteRegularPenalty error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ========== حذف جزاء يدوي ==========
exports.deleteManualPenalty = async (req, res) => {
    try {
        const { id } = req.params;
        await statsService.deleteManualPenalty(id);
        res.json({ success: true, message: 'تم حذف الجزاء اليدوي بنجاح' });
    } catch (error) {
        console.error('❌ deleteManualPenalty error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};