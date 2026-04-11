// 📁 Backend/routes/admin/contracts.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const contractsController = require('../../controllers/admin/contracts.controller');

// التأكد من وجود مجلد رفع العقود
const uploadDir = path.join(__dirname, '../../../uploads/contracts');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`📁 Created upload directory: ${uploadDir}`);
}

// تكوين multer لرفع ملفات PDF
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'contract-' + uniqueSuffix + '.pdf');
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // حد أقصى 5 ميجابايت
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('يجب أن يكون الملف من نوع PDF'), false);
        }
    }
});

// التحقق من صحة الـ API
router.get('/health', (req, res) => {
    res.json({ success: true, message: 'Contracts API is running with real database (msnodesqlv8)' });
});

// 📊 إحصائيات
router.get('/stats', contractsController.getContractsStats);

// 🆕 العقود المنتهية قريباً
router.get('/upcoming', contractsController.getUpcomingContracts);

// 🔍 البحث عن العملاء
router.get('/search/customers', contractsController.searchCustomers);

// 🏢 جلب المشاريع للقوائم المنسدلة
router.get('/projects', contractsController.getProjects);

// 📄 قائمة العقود (مع فلترة)
router.get('/', contractsController.getAllContracts);

// 📄 عقد واحد
router.get('/:id', contractsController.getContractById);

// ➕ إنشاء عقد مع رفع ملف
router.post('/', upload.single('contractFile'), contractsController.createContract);

// ✏️ تحديث عقد مع رفع ملف اختياري
router.put('/:id', upload.single('contractFile'), contractsController.updateContract);

// 🗑️ حذف عقد
router.delete('/:id', contractsController.deleteContract);

// 💰 إضافة دفعة
router.post('/:id/payments', contractsController.addPayment);

// 📊 تصدير
router.get('/export/export-data', contractsController.exportContracts);

// 🔄 تحديث حالات التأخير (اختياري)
router.post('/refresh-overdue', contractsController.refreshOverdue);

module.exports = router;