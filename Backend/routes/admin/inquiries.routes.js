// 📁 Backend/routes/admin/inquiries.routes.js
const express = require('express');
const router = express.Router();
const inquiriesController = require('/controllers/admin/inquiries.controller');

// التحقق من صحة الـ API
router.get('/health', (req, res) => {
    res.json({ success: true, message: 'Inquiries API is running with real database (msnodesqlv8)' });
});

// 📊 إحصائيات
router.get('/stats', inquiriesController.getInquiriesStats);

// 🆕 أحدث الاستفسارات
router.get('/recent', inquiriesController.getRecentInquiries);

// 🏢 جلب المشاريع للقوائم المنسدلة
router.get('/projects', inquiriesController.getProjects);

// 🔍 جلب أنواع الاستفسارات المميزة (ديناميكية)
router.get('/types', inquiriesController.getInquiryTypes);

// 🔍 البحث عن المستخدمين
router.get('/search/users', inquiriesController.searchUsers);

// 📄 قائمة الاستفسارات (مع فلترة)
router.get('/', inquiriesController.getAllInquiries);

// 📄 استفسار واحد
router.get('/:id', inquiriesController.getInquiryById);

// ➕ إنشاء استفسار
router.post('/', inquiriesController.createInquiry);

// ✏️ تحديث استفسار
router.put('/:id', inquiriesController.updateInquiry);

// 💬 الرد على استفسار
router.post('/:id/reply', inquiriesController.replyToInquiry);

// 🗑️ حذف استفسار
router.delete('/:id', inquiriesController.deleteInquiry);

// 📊 تصدير
router.get('/export/export-data', inquiriesController.exportInquiries);

module.exports = router;