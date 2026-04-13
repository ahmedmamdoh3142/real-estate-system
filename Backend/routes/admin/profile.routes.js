// Backend/routes/admin/profile.routes.js
const express = require('express');
const router = express.Router();
const profileController = require('../../controllers/admin/profile.controller');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// تكوين multer لحفظ الصور الشخصية
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '/uploads/profile');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const userId = req.user?.id || req.body.userId || 'temp';
        cb(null, `user-${userId}-${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    if (allowedTypes.test(ext)) {
        cb(null, true);
    } else {
        cb(new Error('صيغة الملف غير مدعومة. استخدم jpg, png, gif, webp'));
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: fileFilter
});

// يمكن إضافة middleware مصادقة هنا
// router.use(authMiddleware);

router.get('/me', profileController.getMyProfile);
router.put('/me', profileController.updateProfile);
router.post('/me/password', profileController.changePassword);
router.post('/me/picture', upload.single('profileImage'), profileController.uploadProfilePicture);

// ========== المسارات الجديدة للتقييمات والمهام والجزاءات ==========
router.get('/me/rating', profileController.getMyRating);
router.get('/me/tasks-with-ratings', profileController.getMyTasksWithRatings);
router.get('/me/penalties', profileController.getMyPenalties);

module.exports = router;