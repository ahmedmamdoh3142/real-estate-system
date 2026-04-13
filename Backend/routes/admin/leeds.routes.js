// 📁 Backend/routes/admin/leeds.routes.js
const express = require('express');
const router = express.Router();
const leedsController = require('../../controllers/admin/leeds.controller');

// التحقق من صحة الـ API
router.get('/health', (req, res) => {
    res.json({ success: true, message: 'Clients API is running with real database (msnodesqlv8)' });
});

// 📊 إحصائيات
router.get('/stats', leedsController.getClientsStats);

// 🏢 جلب المشاريع للقوائم المنسدلة
router.get('/projects', leedsController.getProjects);

// 📄 قائمة العملاء (مع فلترة)
router.get('/', leedsController.getAllClients);

// 📄 عميل واحد
router.get('/:id', leedsController.getClientById);

// ➕ إنشاء عميل
router.post('/', leedsController.createClient);

// ✏️ تحديث عميل
router.put('/:id', leedsController.updateClient);

// 🗑️ حذف عميل
router.delete('/:id', leedsController.deleteClient);

// 📊 تصدير
router.get('/export/export-data', leedsController.exportClients);

module.exports = router;