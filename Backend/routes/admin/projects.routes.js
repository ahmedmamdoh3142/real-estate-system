// 📁 Backend/routes/admin/projects.routes.js - نظام إدارة المشاريع الكامل مع دعم رفع الصور
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const projectsController = require('../../controllers/admin/projects.controller');

console.log('✅ تم تحميل Projects Routes مع دعم رفع الصور واتصال قاعدة البيانات');

// ⚙️ إعداد multer لرفع الصور إلى مجلد uploads/projects
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, '../../uploads/projects');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('نوع الملف غير مدعوم. الأنواع المدعومة: jpg, jpeg, png, webp'), false);
    }
};

const upload = multer({ 
    storage: storage, 
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: fileFilter 
});

// 🔍 التحقق من صحة مسار المشاريع
router.get('/health', (req, res) => {
    console.log('🏥 طلب صحة Projects API');
    res.json({
        success: true,
        message: '✅ نظام إدارة المشاريع يعمل مع قاعدة البيانات الحقيقية',
        timestamp: new Date().toISOString(),
        version: '4.0.0 - Production',
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

// 📤 رفع صورة (منفصل) - يجب أن يكون قبل المسارات التي تستخدم :id
router.post('/upload-image', upload.single('image'), projectsController.uploadImage);

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

// 📤 رفع صورة للمشروع (إضافة مباشرة)
router.post('/:id/images', projectsController.addProjectImage);

// 📊 تصدير المشاريع
router.get('/export/export-data', projectsController.exportProjects);

module.exports = router;