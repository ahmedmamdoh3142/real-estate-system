// 📁 Backend/routes/admin/users.routes.js
const express = require('express');
const router = express.Router();
const usersController = require('../../controllers/admin/users.controller');

// التحقق من صحة الـ API
router.get('/health', (req, res) => {
    res.json({ success: true, message: 'Users API is running with real database (msnodesqlv8) and multi-permissions' });
});

// 📋 جلب جميع الصلاحيات المتاحة
router.get('/permissions', usersController.getAllPermissions);

// 📋 جلب جميع الأدوار (للفلترة)
router.get('/roles', usersController.getAllRoles);

// 📊 إحصائيات
router.get('/stats', usersController.getUsersStats);

// 🆕 أحدث المستخدمين
router.get('/recent', usersController.getRecentUsers);

// 📄 قائمة المستخدمين (مع فلترة)
router.get('/', usersController.getAllUsers);

// 📄 مستخدم واحد
router.get('/:id', usersController.getUserById);

// ➕ إنشاء مستخدم
router.post('/', usersController.createUser);

// ✏️ تحديث مستخدم
router.put('/:id', usersController.updateUser);

// 🗑️ حذف مستخدم
router.delete('/:id', usersController.deleteUser);

// 🔄 تغيير حالة المستخدم
router.patch('/:id/status', usersController.changeUserStatus);

// 🔄 تحديث آخر تسجيل دخول (اختياري)
router.post('/:id/last-login', usersController.updateLastLogin);

// 📊 تصدير
router.get('/export/export-data', usersController.exportUsers);

module.exports = router;