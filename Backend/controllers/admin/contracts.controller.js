// 📁 Backend/controllers/admin/contracts.controller.js
const contractsService = require('/services/admin/contracts.service');
const path = require('path');
const fs = require('fs');

// GET /api/admin/contracts
exports.getAllContracts = async (req, res) => {
    try {
        const { page = 1, limit = 25, sort = 'newest', search = '', status = '', type = '', payment = '' } = req.query;

        const filters = {
            search: search || '',
            status: status ? status.split(',') : [],
            type: type ? type.split(',') : [],
            payment: payment ? payment.split(',') : []
        };

        const result = await contractsService.getAllContracts(
            parseInt(page),
            parseInt(limit),
            sort,
            filters
        );

        res.json({
            success: true,
            message: 'تم جلب العقود بنجاح',
            data: result.contracts,
            pagination: result.pagination
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/admin/contracts/stats
exports.getContractsStats = async (req, res) => {
    try {
        const stats = await contractsService.getContractsStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/admin/contracts/upcoming
exports.getUpcomingContracts = async (req, res) => {
    try {
        const { limit = 4 } = req.query;
        const contracts = await contractsService.getUpcomingContracts(parseInt(limit));
        res.json({ success: true, data: contracts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/admin/contracts/search/customers
exports.searchCustomers = async (req, res) => {
    try {
        const { q } = req.query;
        const customers = await contractsService.searchCustomers(q);
        res.json({ success: true, data: customers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/admin/contracts/projects
exports.getProjects = async (req, res) => {
    try {
        const projects = await contractsService.getAllProjects();
        res.json({ success: true, data: projects });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/admin/contracts/:id
exports.getContractById = async (req, res) => {
    try {
        const { id } = req.params;
        const contract = await contractsService.getContractById(parseInt(id));
        if (!contract) return res.status(404).json({ success: false, message: 'العقد غير موجود' });
        res.json({ success: true, data: contract });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/admin/contracts
exports.createContract = async (req, res) => {
    try {
        // إذا تم رفع ملف، أضف مساره إلى البيانات
        if (req.file) {
            // مسار الملف النسبي للوصول عبر URL
            const fileUrl = `/uploads/contracts/${req.file.filename}`;
            req.body.contractFileUrl = fileUrl;
        }
        
        const contractData = {
            ...req.body,
            createdBy: req.user?.id || 1
        };
        const newContract = await contractsService.createContract(contractData);
        res.status(201).json({ success: true, message: 'تم إنشاء العقد بنجاح', data: newContract });
    } catch (error) {
        // إذا حدث خطأ، حذف الملف المرفوع إن وجد
        if (req.file) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (unlinkErr) {
                console.error('❌ فشل حذف الملف بعد الخطأ:', unlinkErr);
            }
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /api/admin/contracts/:id
exports.updateContract = async (req, res) => {
    try {
        const { id } = req.params;
        
        // إذا تم رفع ملف جديد، أضف مساره
        if (req.file) {
            const fileUrl = `/uploads/contracts/${req.file.filename}`;
            req.body.contractFileUrl = fileUrl;
        }
        
        const updated = await contractsService.updateContract(parseInt(id), req.body);
        res.json({ success: true, message: 'تم تحديث العقد بنجاح', data: updated });
    } catch (error) {
        // إذا حدث خطأ، حذف الملف المرفوع إن وجد
        if (req.file) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (unlinkErr) {
                console.error('❌ فشل حذف الملف بعد الخطأ:', unlinkErr);
            }
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /api/admin/contracts/:id
exports.deleteContract = async (req, res) => {
    try {
        const { id } = req.params;
        await contractsService.deleteContract(parseInt(id));
        res.json({ success: true, message: 'تم حذف العقد بنجاح' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/admin/contracts/:id/payments
exports.addPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const paymentData = {
            ...req.body,
            collectedBy: req.user?.id || 1
        };
        const result = await contractsService.addPayment(parseInt(id), paymentData);
        res.json({ success: true, message: 'تم إضافة الدفعة بنجاح', data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/admin/contracts/export/export-data
exports.exportContracts = async (req, res) => {
    try {
        const data = await contractsService.exportContracts();
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/admin/contracts/refresh-overdue (اختياري: لتحديث حالات التأخير يدوياً)
exports.refreshOverdue = async (req, res) => {
    try {
        const { contractId } = req.body;
        await contractsService.refreshOverdueStatuses(contractId ? parseInt(contractId) : null);
        res.json({ success: true, message: 'تم تحديث حالات التأخير بنجاح' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};