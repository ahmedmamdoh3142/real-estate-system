// 📁 Backend/routes/admin/bills.routes.js
const express = require('express');
const router = express.Router();
const billsController = require('/controllers/admin/bills.controller');

// 📊 إحصائيات
router.get('/stats', billsController.getInvoicesStats);

// 💰 آخر المدفوعات
router.get('/recent-payments', billsController.getRecentPayments);

// ⚠️ الفواتير المتأخرة
router.get('/overdue', billsController.getOverdueInvoices);

// 🏢 جلب المشاريع للقوائم المنسدلة
router.get('/projects', billsController.getProjects);

// 📄 قائمة الفواتير (مع فلترة)
router.get('/', billsController.getAllInvoices);

// 📄 فاتورة واحدة
router.get('/:id', billsController.getInvoiceById);

// ➕ إنشاء فاتورة
router.post('/', billsController.createInvoice);

// ✏️ تحديث فاتورة
router.put('/:id', billsController.updateInvoice);

// 🗑️ حذف فاتورة
router.delete('/:id', billsController.deleteInvoice);

// 💰 إضافة دفعة
router.post('/:id/payments', billsController.addPayment);

// 🔄 تحديث حالات التأخير
router.post('/refresh-overdue', billsController.refreshOverdue);

// 📊 تصدير
router.get('/export/export-data', billsController.exportInvoices);

module.exports = router;