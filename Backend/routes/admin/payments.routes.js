// 📁 Backend/routes/admin/payments.routes.js
const express = require('express');
const router = express.Router();
const paymentsController = require('../../controllers/admin/payments.controller');

// التحقق من صحة الـ API
router.get('/health', (req, res) => {
    res.json({ success: true, message: 'Payments API is running with real database (msnodesqlv8)' });
});

// 📊 إحصائيات
router.get('/stats', paymentsController.getPaymentStats);

// 🆕 الأقساط القادمة
router.get('/upcoming', paymentsController.getUpcomingPayments);

// 📄 قائمة المدفوعات (مع فلترة)
router.get('/', paymentsController.getAllPayments);

// ➕ إضافة دفعة إلى عقد (توزيع تلقائي)
router.post('/contracts/:contractId/payments', paymentsController.addPaymentToContract);

// 💰 دفع قسط معين
router.post('/schedule/:scheduleId/pay', paymentsController.paySchedule);

// 📊 بيانات المخطط
router.get('/chart-data', paymentsController.getChartData);

// 📊 التوقعات المالية (يجب أن تأتي قبل route :id)
router.get('/forecast', paymentsController.getFinancialForecast);
router.get('/forecast/:monthIndex', paymentsController.getForecastDetail);

// 📥 تصدير
router.get('/export/export-data', paymentsController.exportPayments);

// ✏️ تحديث حالة دفعة
router.put('/:id/status', paymentsController.updatePaymentStatus);

// 🗑️ حذف دفعة
router.delete('/:id', paymentsController.deletePayment);

// 📄 دفعة واحدة (يجب أن يكون في النهاية)
router.get('/:id', paymentsController.getPaymentById);

module.exports = router;