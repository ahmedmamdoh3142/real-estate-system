// 📁 Backend/controllers/admin/leeds.controller.js
const leedsService = require('../../services/admin/leeds.service');

// GET /api/admin/leeds
exports.getAllClients = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 25,
            sort = 'newest',
            search = '',
            clientType = '',
            status = '',
            priority = '',
            dateFrom = '',
            dateTo = ''
        } = req.query;

        const filters = {
            search: search || '',
            clientType: clientType ? clientType.split(',') : [],
            status: status ? status.split(',') : [],
            priority: priority ? priority.split(',') : [],
            dateFrom: dateFrom || null,
            dateTo: dateTo || null
        };

        const result = await leedsService.getAllClients(
            parseInt(page),
            parseInt(limit),
            sort,
            filters
        );

        res.json({
            success: true,
            message: 'تم جلب العملاء بنجاح',
            data: result.clients,
            pagination: result.pagination
        });
    } catch (error) {
        console.error('❌ getAllClients error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/admin/leeds/stats
exports.getClientsStats = async (req, res) => {
    try {
        const stats = await leedsService.getClientsStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('❌ getClientsStats error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/admin/leeds/projects
exports.getProjects = async (req, res) => {
    try {
        const projects = await leedsService.getAllProjects();
        res.json({ success: true, data: projects });
    } catch (error) {
        console.error('❌ getProjects error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/admin/leeds/:id
exports.getClientById = async (req, res) => {
    try {
        const { id } = req.params;
        const client = await leedsService.getClientById(parseInt(id));
        if (!client) return res.status(404).json({ success: false, message: 'العميل غير موجود' });
        res.json({ success: true, data: client });
    } catch (error) {
        console.error('❌ getClientById error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/admin/leeds
exports.createClient = async (req, res) => {
    try {
        const clientData = {
            ...req.body,
            assignedTo: req.user?.id || 1 // تعيين المستخدم الحالي
        };
        const newClient = await leedsService.createClient(clientData);
        res.status(201).json({ success: true, message: 'تم إنشاء العميل بنجاح', data: newClient });
    } catch (error) {
        console.error('❌ createClient error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /api/admin/leeds/:id
exports.updateClient = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await leedsService.updateClient(parseInt(id), req.body);
        res.json({ success: true, message: 'تم تحديث العميل بنجاح', data: updated });
    } catch (error) {
        console.error('❌ updateClient error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /api/admin/leeds/:id
exports.deleteClient = async (req, res) => {
    try {
        const { id } = req.params;
        await leedsService.deleteClient(parseInt(id));
        res.json({ success: true, message: 'تم حذف العميل بنجاح' });
    } catch (error) {
        console.error('❌ deleteClient error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/admin/leeds/export/export-data
exports.exportClients = async (req, res) => {
    try {
        const data = await leedsService.exportClients();
        res.json({ success: true, data });
    } catch (error) {
        console.error('❌ exportClients error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};