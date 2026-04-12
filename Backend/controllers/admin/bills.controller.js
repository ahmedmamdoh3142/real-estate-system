// 📁 Backend/controllers/admin/bills.controller.js
const billsService = require('/services/admin/bills.service');

// GET /api/admin/bills
exports.getAllInvoices = async (req, res) => {
    try {
        const { page = 1, limit = 25, sort = 'newest', search = '', paymentStatus = '', invoiceType = '', property = '' } = req.query;

        const filters = {
            search: search || '',
            paymentStatus: paymentStatus ? paymentStatus.split(',') : [],
            invoiceType: invoiceType ? invoiceType.split(',') : [],
            property: property ? property.split(',').map(p => parseInt(p)) : []
        };

        const result = await billsService.getAllInvoices(
            parseInt(page),
            parseInt(limit),
            sort,
            filters
        );

        res.json({
            success: true,
            message: 'تم جلب الفواتير بنجاح',
            data: result.invoices,
            pagination: result.pagination
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/admin/bills/stats
exports.getInvoicesStats = async (req, res) => {
    try {
        const stats = await billsService.getInvoicesStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/admin/bills/recent-payments
exports.getRecentPayments = async (req, res) => {
    try {
        const { limit = 5 } = req.query;
        const payments = await billsService.getRecentPayments(parseInt(limit));
        res.json({ success: true, data: payments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/admin/bills/overdue
exports.getOverdueInvoices = async (req, res) => {
    try {
        const { limit = 5 } = req.query;
        const overdue = await billsService.getOverdueInvoices(parseInt(limit));
        res.json({ success: true, data: overdue });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/admin/bills/projects
exports.getProjects = async (req, res) => {
    try {
        const projects = await billsService.getAllProjects();
        res.json({ success: true, data: projects });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/admin/bills/:id
exports.getInvoiceById = async (req, res) => {
    try {
        const { id } = req.params;
        const invoice = await billsService.getInvoiceById(parseInt(id));
        if (!invoice) return res.status(404).json({ success: false, message: 'الفاتورة غير موجودة' });
        res.json({ success: true, data: invoice });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/admin/bills
exports.createInvoice = async (req, res) => {
    try {
        const newInvoice = await billsService.createInvoice(req.body);
        res.status(201).json({ success: true, message: 'تم إنشاء الفاتورة بنجاح', data: newInvoice });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /api/admin/bills/:id
exports.updateInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await billsService.updateInvoice(parseInt(id), req.body);
        res.json({ success: true, message: 'تم تحديث الفاتورة بنجاح', data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /api/admin/bills/:id
exports.deleteInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        await billsService.deleteInvoice(parseInt(id));
        res.json({ success: true, message: 'تم حذف الفاتورة بنجاح' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/admin/bills/:id/payments
exports.addPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await billsService.addPayment(parseInt(id), req.body);
        res.json({ success: true, message: 'تم إضافة الدفعة بنجاح', data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/admin/bills/refresh-overdue
exports.refreshOverdue = async (req, res) => {
    try {
        await billsService.refreshOverdueStatuses();
        res.json({ success: true, message: 'تم تحديث حالات التأخير بنجاح' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/admin/bills/export/export-data
exports.exportInvoices = async (req, res) => {
    try {
        const data = await billsService.exportInvoices();
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};