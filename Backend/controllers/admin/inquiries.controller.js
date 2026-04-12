// 📁 Backend/controllers/admin/inquiries.controller.js
const inquiriesService = require('/services/admin/inquiries.service');

// GET /api/admin/inquiries
exports.getAllInquiries = async (req, res) => {
    try {
        const { page = 1, limit = 25, sort = 'newest', search = '', status = '', type = '' } = req.query;

        const filters = {
            search: search || '',
            status: status ? status.split(',') : [],
            type: type ? type.split(',') : []
        };

        const result = await inquiriesService.getAllInquiries(
            parseInt(page),
            parseInt(limit),
            sort,
            filters
        );

        res.json({
            success: true,
            message: 'تم جلب الاستفسارات بنجاح',
            data: result.inquiries,
            pagination: result.pagination
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/admin/inquiries/stats
exports.getInquiriesStats = async (req, res) => {
    try {
        const stats = await inquiriesService.getInquiriesStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/admin/inquiries/recent
exports.getRecentInquiries = async (req, res) => {
    try {
        const { limit = 3 } = req.query;
        const inquiries = await inquiriesService.getRecentInquiries(parseInt(limit));
        res.json({ success: true, data: inquiries });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/admin/inquiries/projects
exports.getProjects = async (req, res) => {
    try {
        const projects = await inquiriesService.getAllProjects();
        res.json({ success: true, data: projects });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/admin/inquiries/types
exports.getInquiryTypes = async (req, res) => {
    try {
        const types = await inquiriesService.getDistinctTypes();
        res.json({ success: true, data: types });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/admin/inquiries/:id
exports.getInquiryById = async (req, res) => {
    try {
        const { id } = req.params;
        const inquiry = await inquiriesService.getInquiryById(parseInt(id));
        if (!inquiry) return res.status(404).json({ success: false, message: 'الاستفسار غير موجود' });
        res.json({ success: true, data: inquiry });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/admin/inquiries
exports.createInquiry = async (req, res) => {
    try {
        const newInquiry = await inquiriesService.createInquiry(req.body);
        res.status(201).json({ success: true, message: 'تم إنشاء الاستفسار بنجاح', data: newInquiry });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /api/admin/inquiries/:id
exports.updateInquiry = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await inquiriesService.updateInquiry(parseInt(id), req.body);
        res.json({ success: true, message: 'تم تحديث الاستفسار بنجاح', data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/admin/inquiries/:id/reply
exports.replyToInquiry = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await inquiriesService.replyToInquiry(parseInt(id), req.body);
        res.json({ success: true, message: 'تم إرسال الرد بنجاح', data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /api/admin/inquiries/:id
exports.deleteInquiry = async (req, res) => {
    try {
        const { id } = req.params;
        await inquiriesService.deleteInquiry(parseInt(id));
        res.json({ success: true, message: 'تم حذف الاستفسار بنجاح' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/admin/inquiries/export/export-data
exports.exportInquiries = async (req, res) => {
    try {
        const data = await inquiriesService.exportInquiries();
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/admin/inquiries/search/users
exports.searchUsers = async (req, res) => {
    try {
        const { q } = req.query;
        const users = await inquiriesService.searchUsers(q || '');
        res.json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};