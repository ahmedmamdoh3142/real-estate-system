const chatService = require('../../services/admin/chat.service');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../../uploads/chats');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const avatarUploadDir = path.join(__dirname, '../../../uploads/group-avatars');
if (!fs.existsSync(avatarUploadDir)) {
    fs.mkdirSync(avatarUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'chat-att-' + uniqueSuffix + ext);
    }
});

const avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, avatarUploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'group-avatar-' + uniqueSuffix + ext);
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

const uploadAvatar = multer({ 
    storage: avatarStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('يجب أن تكون الصورة من نوع صورة'), false);
        }
    }
});

// ========== جلب محادثات المستخدم (يدعم عرض مشرف عام) ==========
exports.getChats = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const { viewingUserId } = req.query;

        let targetUserId = null;
        if (viewingUserId && req.user.role === 'مشرف_عام') {
            targetUserId = parseInt(viewingUserId);
        }

        const chats = await chatService.getUserChats(currentUserId, targetUserId);
        res.json({ success: true, data: chats });
    } catch (error) {
        console.error('❌ getChats error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ========== جلب رسائل محادثة (يدعم عرض مشرف عام) ==========
exports.getMessages = async (req, res) => {
    try {
        const { chatId } = req.params;
        const currentUserId = req.user.id;
        const { limit = 50, offset = 0, viewingUserId } = req.query;

        let targetUserId = null;
        if (viewingUserId && req.user.role === 'مشرف_عام') {
            targetUserId = parseInt(viewingUserId);
        }

        const messages = await chatService.getMessages(chatId, currentUserId, targetUserId, parseInt(limit), parseInt(offset));
        res.json({ success: true, data: messages });
    } catch (error) {
        console.error('❌ getMessages error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ========== تحديث حالة القراءة (للمستخدم الهدف) ==========
exports.markMessagesAsRead = async (req, res) => {
    try {
        const { chatId } = req.params;
        const currentUserId = req.user.id;
        const { viewingUserId } = req.query;

        let targetUserId = null;
        if (viewingUserId && req.user.role === 'مشرف_عام') {
            targetUserId = parseInt(viewingUserId);
        }

        await chatService.markMessagesAsRead(chatId, currentUserId, targetUserId);
        res.json({ success: true, message: 'تم تحديث القراءة' });
    } catch (error) {
        console.error('❌ markMessagesAsRead error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ========== إرسال رسالة نصية (ممنوع إذا كان هناك viewingUserId) ==========
exports.sendTextMessage = async (req, res) => {
    try {
        const { chatId } = req.params;
        const currentUserId = req.user.id;
        const { content, replyToId } = req.body;
        const { viewingUserId } = req.query;

        if (viewingUserId && req.user.role === 'مشرف_عام') {
            return res.status(403).json({ success: false, message: 'لا يمكنك إرسال رسائل أثناء عرض محادثات موظف آخر' });
        }

        if (!content) {
            return res.status(400).json({ success: false, message: 'محتوى الرسالة مطلوب' });
        }

        const result = await chatService.sendTextMessage(chatId, currentUserId, content, replyToId);
        res.json({ success: true, data: result.message });
    } catch (error) {
        console.error('❌ sendTextMessage error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ========== إرسال رسالة مع مرفق (ممنوع إذا كان هناك viewingUserId) ==========
exports.sendFileMessage = async (req, res) => {
    try {
        const { chatId } = req.params;
        const currentUserId = req.user.id;
        const { content, replyToId, duration } = req.body;
        const { viewingUserId } = req.query;

        if (viewingUserId && req.user.role === 'مشرف_عام') {
            return res.status(403).json({ success: false, message: 'لا يمكنك إرسال رسائل أثناء عرض محادثات موظف آخر' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'يجب رفع ملف' });
        }

        const fileData = {
            fileName: req.file.originalname,
            fileUrl: `/uploads/chats/${req.file.filename}`,
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
            duration: duration ? parseInt(duration) : null
        };

        const result = await chatService.sendFileMessage(chatId, currentUserId, fileData, content || null, replyToId);
        res.json({ success: true, data: result.message });
    } catch (error) {
        if (req.file) {
            try { fs.unlinkSync(req.file.path); } catch(e) {}
        }
        console.error('❌ sendFileMessage error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ========== بدء محادثة خاصة جديدة ==========
exports.startPrivateChat = async (req, res) => {
    try {
        const userId = req.user.id;
        const { contactId } = req.body;

        if (!contactId) {
            return res.status(400).json({ success: false, message: 'معرف جهة الاتصال مطلوب' });
        }

        const result = await chatService.createPrivateChat(userId, parseInt(contactId));
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('❌ startPrivateChat error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ========== إنشاء مجموعة جديدة ==========
exports.createGroup = async (req, res) => {
    try {
        const userId = req.user.id;
        const { groupName, participantIds } = req.body;

        if (!groupName || !participantIds || !Array.isArray(participantIds)) {
            return res.status(400).json({ success: false, message: 'بيانات المجموعة غير صحيحة' });
        }

        const result = await chatService.createGroupChat(groupName, userId, participantIds.map(p => parseInt(p)));
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('❌ createGroup error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ========== إضافة أعضاء لمجموعة ==========
exports.addParticipants = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user.id;
        const { userIds } = req.body;

        if (!userIds || !Array.isArray(userIds)) {
            return res.status(400).json({ success: false, message: 'قائمة الأعضاء مطلوبة' });
        }

        await chatService.addParticipants(chatId, userId, userIds.map(uid => parseInt(uid)));
        res.json({ success: true, message: 'تمت إضافة الأعضاء' });
    } catch (error) {
        console.error('❌ addParticipants error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ========== إزالة عضو من مجموعة ==========
exports.removeParticipant = async (req, res) => {
    try {
        const { chatId, userId } = req.params;
        const adminId = req.user.id;
        await chatService.removeParticipant(chatId, adminId, parseInt(userId));
        res.json({ success: true, message: 'تمت إزالة العضو' });
    } catch (error) {
        console.error('❌ removeParticipant error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ========== مغادرة مجموعة ==========
exports.leaveGroup = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user.id;

        await chatService.leaveGroup(chatId, userId);
        res.json({ success: true, message: 'تمت المغادرة' });
    } catch (error) {
        console.error('❌ leaveGroup error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ========== تحديث اسم المجموعة أو حذفها (للمنشئ) ==========
exports.updateGroup = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user.id;
        const { chatName } = req.body;
        if (chatName) {
            await chatService.updateGroupName(chatId, userId, chatName);
            return res.json({ success: true, message: 'تم تحديث اسم المجموعة' });
        }
        res.status(400).json({ success: false, message: 'لا توجد بيانات للتحديث' });
    } catch (error) {
        console.error('❌ updateGroup error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ========== تحديث صورة المجموعة ==========
exports.updateGroupAvatar = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user.id;
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'يجب رفع صورة' });
        }
        const avatarUrl = `/uploads/group-avatars/${req.file.filename}`;
        await chatService.updateGroupAvatar(chatId, userId, avatarUrl);
        res.json({ success: true, message: 'تم تحديث صورة المجموعة', avatarUrl });
    } catch (error) {
        if (req.file) {
            try { fs.unlinkSync(req.file.path); } catch(e) {}
        }
        console.error('❌ updateGroupAvatar error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ========== حذف محادثة للمستخدم ==========
exports.deleteChat = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user.id;

        const chatInfo = await chatService.queryAsync(`SELECT chatType, createdBy FROM Chats WHERE id = ${parseInt(chatId)}`);
        if (chatInfo[0] && chatInfo[0].chatType === 'group' && chatInfo[0].createdBy === userId) {
            await chatService.deleteGroup(chatId, userId);
            return res.json({ success: true, message: 'تم حذف المجموعة' });
        } else {
            await chatService.deleteChatForUser(chatId, userId);
            return res.json({ success: true, message: 'تم حذف المحادثة' });
        }
    } catch (error) {
        console.error('❌ deleteChat error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ========== جلب المشاركين في مجموعة ==========
exports.getGroupParticipants = async (req, res) => {
    try {
        const { chatId } = req.params;
        const participants = await chatService.getGroupParticipants(chatId);
        res.json({ success: true, data: participants });
    } catch (error) {
        console.error('❌ getGroupParticipants error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ========== البحث عن مستخدمين ==========
exports.searchUsers = async (req, res) => {
    try {
        const { q } = req.query;
        const userId = req.user.id;
        if (!q) return res.json({ success: true, data: [] });

        const users = await chatService.searchUsers(q, userId);
        res.json({ success: true, data: users });
    } catch (error) {
        console.error('❌ searchUsers error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ========== الحصول على جميع المستخدمين (للمشرف العام فقط) ==========
exports.getAllUsers = async (req, res) => {
    try {
        if (req.user.role !== 'مشرف_عام') {
            return res.status(403).json({ success: false, message: 'غير مصرح' });
        }
        const users = await chatService.getAllUsers();
        res.json({ success: true, data: users });
    } catch (error) {
        console.error('❌ getAllUsers error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ========== البحث العام في الرسائل ==========
exports.searchMessages = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const { q, viewingUserId } = req.query;
        if (!q) return res.json({ success: true, data: [] });

        let targetUserId = null;
        if (viewingUserId && req.user.role === 'مشرف_عام') {
            targetUserId = parseInt(viewingUserId);
        }

        const results = await chatService.searchMessages(currentUserId, q, targetUserId);
        res.json({ success: true, data: results });
    } catch (error) {
        console.error('❌ searchMessages error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ========== جلب الوسائط (الصور، الملفات، الصوتيات) لمحادثة ==========
exports.getChatMedia = async (req, res) => {
    try {
        const { chatId } = req.params;
        const currentUserId = req.user.id;
        const { viewingUserId } = req.query;

        let targetUserId = null;
        if (viewingUserId && req.user.role === 'مشرف_عام') {
            targetUserId = parseInt(viewingUserId);
        }

        const media = await chatService.getChatMedia(chatId, currentUserId, targetUserId);
        res.json({ success: true, data: media });
    } catch (error) {
        console.error('❌ getChatMedia error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ========== Middleware لرفع الملفات ==========
exports.upload = upload.single('file');
exports.uploadAvatar = uploadAvatar.single('avatar');