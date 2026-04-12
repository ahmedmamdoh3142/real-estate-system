// 📁 Backend/controllers/admin/payments.controller.js
const paymentsService = require('/services/admin/payments.service');
const contractsService = require('/services/admin/contracts.service'); // استيراد

// GET /api/admin/payments
exports.getAllPayments = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 25, 
            sort = 'newest', 
            search = '', 
            status = '', 
            method = '', 
            type = '',
            month,
            year
        } = req.query;

        const filters = {
            search: search || '',
            status: status ? status.split(',') : [],
            method: method ? method.split(',') : [],
            type: type ? type.split(',') : [],
            month: month,
            year: year
        };

        const result = await paymentsService.getAllPayments(
            parseInt(page),
            parseInt(limit),
            sort,
            filters
        );

        res.json({
            success: true,
            message: 'تم جلب المدفوعات بنجاح',
            data: result.payments,
            pagination: result.pagination
        });
    } catch (error) {
        console.error('❌ getAllPayments error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/admin/payments/contracts/:contractId/payments
exports.addPaymentToContract = async (req, res) => {
    try {
        const { contractId } = req.params;
        const paymentData = {
            ...req.body,
            collectedBy: req.user?.id || 1 // في حال عدم وجود مستخدم حقيقي
        };
        const result = await paymentsService.addPaymentToContract(parseInt(contractId), paymentData);
        res.json({ success: true, message: 'تم تسجيل الدفعة بنجاح', data: result });
    } catch (error) {
        console.error('❌ addPaymentToContract error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/admin/payments/stats
exports.getPaymentStats = async (req, res) => {
    try {
        const stats = await paymentsService.getPaymentStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('❌ getPaymentStats error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/admin/payments/upcoming
exports.getUpcomingPayments = async (req, res) => {
    try {
        const { limit = 5 } = req.query;
        const payments = await paymentsService.getUpcomingPayments(parseInt(limit));
        res.json({ success: true, data: payments });
    } catch (error) {
        console.error('❌ getUpcomingPayments error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/admin/payments/:id
exports.getPaymentById = async (req, res) => {
    try {
        const { id } = req.params;
        
        // التحقق من أن id موجود وقابل للتحويل إلى رقم
        if (!id || id === 'undefined' || id === 'null') {
            return res.status(400).json({ success: false, message: 'معرّف الدفعة غير صالح' });
        }
        
        const paymentId = parseInt(id);
        if (isNaN(paymentId)) {
            return res.status(400).json({ success: false, message: 'معرّف الدفعة يجب أن يكون رقماً' });
        }
        
        const payment = await paymentsService.getPaymentById(paymentId);
        if (!payment) return res.status(404).json({ success: false, message: 'الدفعة غير موجودة' });
        res.json({ success: true, data: payment });
    } catch (error) {
        console.error('❌ getPaymentById error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/admin/payments/schedule/:scheduleId/pay
exports.paySchedule = async (req, res) => {
    try {
        const { scheduleId } = req.params;
        const paymentData = {
            ...req.body,
            collectedBy: req.user?.id || 1
        };
        const result = await paymentsService.paySchedule(parseInt(scheduleId), paymentData);
        res.json({ success: true, message: 'تم تسجيل الدفعة بنجاح', data: result });
    } catch (error) {
        console.error('❌ paySchedule error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /api/admin/payments/:id/status
exports.updatePaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, reason } = req.body;
        
        if (!id || id === 'undefined' || id === 'null') {
            return res.status(400).json({ success: false, message: 'معرّف الدفعة غير صالح' });
        }
        
        const paymentId = parseInt(id);
        if (isNaN(paymentId)) {
            return res.status(400).json({ success: false, message: 'معرّف الدفعة يجب أن يكون رقماً' });
        }
        
        await paymentsService.updatePaymentStatus(paymentId, status, reason);
        res.json({ success: true, message: 'تم تحديث حالة الدفعة بنجاح' });
    } catch (error) {
        console.error('❌ updatePaymentStatus error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /api/admin/payments/:id
exports.deletePayment = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id || id === 'undefined' || id === 'null') {
            return res.status(400).json({ success: false, message: 'معرّف الدفعة غير صالح' });
        }
        
        const paymentId = parseInt(id);
        if (isNaN(paymentId)) {
            return res.status(400).json({ success: false, message: 'معرّف الدفعة يجب أن يكون رقماً' });
        }
        
        await paymentsService.deletePayment(paymentId);
        res.json({ success: true, message: 'تم حذف الدفعة بنجاح' });
    } catch (error) {
        console.error('❌ deletePayment error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/admin/payments/chart-data
exports.getChartData = async (req, res) => {
    try {
        const { period } = req.query;
        const data = await paymentsService.getChartData(period);
        res.json({ success: true, data });
    } catch (error) {
        console.error('❌ getChartData error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/admin/payments/forecast
exports.getFinancialForecast = async (req, res) => {
    try {
        const { months = 6 } = req.query;
        const monthsNum = parseInt(months);
        if (isNaN(monthsNum) || monthsNum <= 0) {
            return res.status(400).json({ success: false, message: 'عدد الأشهر يجب أن يكون رقماً موجباً' });
        }
        const forecast = await paymentsService.getFinancialForecast(monthsNum);
        res.json({ success: true, data: forecast });
    } catch (error) {
        console.error('❌ getFinancialForecast error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/admin/payments/forecast/:monthIndex
exports.getForecastDetail = async (req, res) => {
    try {
        const { monthIndex } = req.params;
        const index = parseInt(monthIndex);
        if (isNaN(index) || index < 0) {
            return res.status(400).json({ success: false, message: 'فهرس الشهر غير صالح' });
        }
        const forecast = await paymentsService.getFinancialForecast(12); // نجلب عدد كافٍ من الأشهر
        if (!forecast[index]) {
            return res.status(404).json({ success: false, message: 'الشهر غير موجود' });
        }
        res.json({ success: true, data: forecast[index] });
    } catch (error) {
        console.error('❌ getForecastDetail error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/admin/payments/export/export-data
exports.exportPayments = async (req, res) => {
    try {
        const data = await paymentsService.exportPayments();
        res.json({ success: true, data });
    } catch (error) {
        console.error('❌ exportPayments error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};