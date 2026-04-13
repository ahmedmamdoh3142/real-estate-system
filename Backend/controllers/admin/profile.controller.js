// Backend/controllers/admin/profile.controller.js
const profileService = require('../../services/admin/profile.service');
const path = require('path');
const fs = require('fs');

// GET /api/admin/profile/me
exports.getMyProfile = async (req, res) => {
    try {
        const userId = req.user?.id || req.body.userId || req.query.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'غير مصرح به - لم يتم توفير معرف المستخدم' });
        }

        const user = await profileService.getUserById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
        }

        delete user.passwordHash;

        res.json({
            success: true,
            message: 'تم جلب بيانات الملف الشخصي بنجاح',
            data: user
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /api/admin/profile/me
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user?.id || req.body.userId || req.query.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'غير مصرح به' });
        }

        const currentUser = await profileService.getUserById(userId);
        if (!currentUser) {
            return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
        }

        const { fullName, email, phone, role, department } = req.body;
        const requestingUserRole = currentUser.role;

        const updatedUser = await profileService.updateUser(
            userId, 
            { fullName, email, phone, role, department },
            requestingUserRole
        );

        delete updatedUser.passwordHash;

        res.json({
            success: true,
            message: 'تم تحديث الملف الشخصي بنجاح',
            data: updatedUser
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/admin/profile/me/password
exports.changePassword = async (req, res) => {
    try {
        const userId = req.user?.id || req.body.userId || req.query.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'غير مصرح به' });
        }

        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'يرجى إرسال كلمة المرور الحالية والجديدة' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ success: false, message: 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل' });
        }

        await profileService.changePassword(userId, currentPassword, newPassword);

        res.json({
            success: true,
            message: 'تم تغيير كلمة المرور بنجاح'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/admin/profile/me/picture
exports.uploadProfilePicture = async (req, res) => {
    try {
        const userId = req.user?.id || req.body.userId || req.query.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'غير مصرح به' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'لم يتم رفع أي صورة' });
        }

        const imageUrl = `/uploads/profile/${req.file.filename}`;

        const updatedUser = await profileService.updateProfileImage(userId, imageUrl);

        res.json({
            success: true,
            message: 'تم رفع الصورة بنجاح',
            data: { profileImage: imageUrl }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ========== دوال جديدة للتقييمات والمهام والجزاءات ==========

// GET /api/admin/profile/me/rating
exports.getMyRating = async (req, res) => {
    try {
        const userId = req.user?.id || req.body.userId || req.query.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'غير مصرح به' });
        }

        const ratingData = await profileService.getUserOverallRating(userId);
        
        res.json({
            success: true,
            data: {
                averageRating: ratingData.avgRating,
                totalRatings: ratingData.totalRatings
            }
        });
    } catch (error) {
        console.error('❌ getMyRating error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/admin/profile/me/tasks-with-ratings
exports.getMyTasksWithRatings = async (req, res) => {
    try {
        const userId = req.user?.id || req.body.userId || req.query.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'غير مصرح به' });
        }

        const tasks = await profileService.getUserTasksWithRatings(userId);
        
        res.json({
            success: true,
            data: tasks
        });
    } catch (error) {
        console.error('❌ getMyTasksWithRatings error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/admin/profile/me/penalties
exports.getMyPenalties = async (req, res) => {
    try {
        const userId = req.user?.id || req.body.userId || req.query.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'غير مصرح به' });
        }

        const penalties = await profileService.getUserPenalties(userId);
        
        res.json({
            success: true,
            data: penalties
        });
    } catch (error) {
        console.error('❌ getMyPenalties error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};