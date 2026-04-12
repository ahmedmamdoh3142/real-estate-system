// 📁 Backend/routes/admin/projects.routes.js - نظام إدارة المشاريع الكامل
const express = require('express');
const router = express.Router();
const projectsController = require('/controllers/admin/projects.controller');

console.log('✅ تم تحميل Projects Routes مع اتصال قاعدة البيانات الحقيقي (msnodesqlv8)');

// 🔍 التحقق من صحة مسار المشاريع
router.get('/health', (req, res) => {
    console.log('🏥 طلب صحة Projects API - Real Database (msnodesqlv8)');
    res.json({
        success: true,
        message: '✅ نظام إدارة المشاريع يعمل مع قاعدة البيانات الحقيقية (msnodesqlv8)',
        timestamp: new Date().toISOString(),
        version: '4.0.0 - Real Production Database (msnodesqlv8)',
        endpoints: [
            'GET    /api/admin/projects/health',
            'GET    /api/admin/projects',
            'GET    /api/admin/projects/stats',
            'GET    /api/admin/projects/:id',
            'POST   /api/admin/projects',
            'PUT    /api/admin/projects/:id',
            'DELETE /api/admin/projects/:id',
            'GET    /api/admin/projects/:id/features',
            'GET    /api/admin/projects/:id/images',
            'POST   /api/admin/projects/:id/images',
            'POST   /api/admin/projects/upload-image',
            'GET    /api/admin/projects/search',
            'GET    /api/admin/projects/recent',
            'GET    /api/admin/projects/export/export-data',
            'GET    /api/admin/projects/test-connection'
        ]
    });
});

// 🔌 اختبار الاتصال بقاعدة البيانات
router.get('/test-connection', projectsController.testConnection);

// 📊 الحصول على جميع المشاريع مع فلترة وترتيب
router.get('/', projectsController.getAllProjects);

// 📈 الحصول على إحصائيات المشاريع
router.get('/stats', projectsController.getProjectsStats);

// 🆕 الحصول على المشاريع الحديثة
router.get('/recent', projectsController.getRecentProjects);

// 🔍 البحث في المشاريع
router.get('/search', projectsController.searchProjects);

// 📄 الحصول على مشروع واحد
router.get('/:id', projectsController.getProjectById);

// ➕ إنشاء مشروع جديد
router.post('/', projectsController.createProject);

// ✏️ تحديث مشروع
router.put('/:id', projectsController.updateProject);

// 🗑️ حذف مشروع
router.delete('/:id', projectsController.deleteProject);

// ⭐ الحصول على ميزات المشروع
router.get('/:id/features', projectsController.getProjectFeatures);

// 🖼️ الحصول على صور المشروع
router.get('/:id/images', projectsController.getProjectImages);

// 📤 رفع صورة للمشروع
router.post('/:id/images', projectsController.addProjectImage);

// 📤 رفع صورة (منفصل)
router.post('/upload-image', projectsController.uploadImage);

// 📊 تصدير المشاريع
router.get('/export/export-data', projectsController.exportProjects);

module.exports = router;