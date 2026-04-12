// Backend/controllers/admin/email.controller.js
const emailService = require('/services/admin/email.service');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '/uploads/emails');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'email-att-' + uniqueSuffix + ext);
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
});

exports.getInbox = async (req, res) => {
    try {
        const { page = 1, limit = 25 } = req.query;
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, message: 'غير مصرح' });

        const result = await emailService.getUserEmails(userId, 'inbox', parseInt(page), parseInt(limit));
        res.json({ success: true, data: result.emails, pagination: result.pagination });
    } catch (error) {
        console.error('❌ getInbox error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getSent = async (req, res) => {
    try {
        const { page = 1, limit = 25 } = req.query;
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, message: 'غير مصرح' });

        const result = await emailService.getUserEmails(userId, 'sent', parseInt(page), parseInt(limit));
        res.json({ success: true, data: result.emails, pagination: result.pagination });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getDrafts = async (req, res) => {
    try {
        const { page = 1, limit = 25 } = req.query;
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, message: 'غير مصرح' });

        const result = await emailService.getUserEmails(userId, 'drafts', parseInt(page), parseInt(limit));
        res.json({ success: true, data: result.emails, pagination: result.pagination });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getTrash = async (req, res) => {
    try {
        const { page = 1, limit = 25 } = req.query;
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, message: 'غير مصرح' });

        const result = await emailService.getUserEmails(userId, 'trash', parseInt(page), parseInt(limit));
        res.json({ success: true, data: result.emails, pagination: result.pagination });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getEmail = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, message: 'غير مصرح' });

        const email = await emailService.getEmailById(parseInt(id), userId);
        if (!email) return res.status(404).json({ success: false, message: 'البريد غير موجود' });

        res.json({ success: true, data: email });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.sendEmail = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, message: 'غير مصرح' });

        let attachments = [];
        if (req.files && req.files.length > 0) {
            attachments = req.files.map(file => ({
                fileName: file.originalname,
                fileUrl: `/uploads/emails/${file.filename}`,
                fileSize: file.size,
                mimeType: file.mimetype
            }));
        }

        const { subject, body, to, cc, bcc, isDraft } = req.body;
        const emailData = {
            subject: subject || '',
            body: body || '',
            to: to ? JSON.parse(to) : [],
            cc: cc ? JSON.parse(cc) : [],
            bcc: bcc ? JSON.parse(bcc) : [],
            isDraft: isDraft === 'true',
            attachments
        };

        const result = await emailService.sendEmail(emailData, userId);
        res.json({ success: true, message: isDraft === 'true' ? 'تم حفظ المسودة' : 'تم إرسال البريد', data: result });
    } catch (error) {
        // حذف الملفات المرفوعة في حالة الفشل
        if (req.files) {
            req.files.forEach(file => {
                try { fs.unlinkSync(file.path); } catch(e) {}
            });
        }
        console.error('❌ sendEmail error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateDraft = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, message: 'غير مصرح' });

        const { subject, body, to, cc, bcc } = req.body;
        const updateData = {
            subject,
            body,
            to: to ? JSON.parse(to) : undefined,
            cc: cc ? JSON.parse(cc) : undefined,
            bcc: bcc ? JSON.parse(bcc) : undefined
        };
        await emailService.updateDraft(parseInt(id), updateData, userId);
        res.json({ success: true, message: 'تم تحديث المسودة' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteEmail = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, message: 'غير مصرح' });

        await emailService.deleteEmail(parseInt(id), userId);
        res.json({ success: true, message: 'تم نقل البريد إلى المهملات' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.restoreEmail = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, message: 'غير مصرح' });

        await emailService.restoreEmail(parseInt(id), userId);
        res.json({ success: true, message: 'تم استعادة البريد' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.permanentDelete = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, message: 'غير مصرح' });

        await emailService.permanentDelete(parseInt(id), userId);
        res.json({ success: true, message: 'تم حذف البريد نهائياً' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getStats = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, message: 'غير مصرح' });

        const stats = await emailService.getEmailStats(userId);
        res.json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.searchUsers = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.json({ success: true, data: [] });

        const users = await emailService.searchUsers(q);
        res.json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.upload = upload.array('attachments', 10);