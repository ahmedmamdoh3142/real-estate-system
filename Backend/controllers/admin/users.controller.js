// 📁 Backend/controllers/admin/users.controller.js
const usersService = require('/services/admin/users.service');

// GET /api/admin/permissions
exports.getAllPermissions = async (req, res) => {
    try {
        const permissions = await usersService.getAllPermissions();
        res.json({ success: true, data: permissions });
    } catch (error) {
        console.error('❌ getAllPermissions error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/admin/users/roles
exports.getAllRoles = async (req, res) => {
    try {
        const roles = await usersService.getAllRoles();
        res.json({ success: true, data: roles });
    } catch (error) {
        console.error('❌ getAllRoles error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/admin/users
exports.getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 25, sort = 'newest', search = '', status = '', role = '' } = req.query;

        const filters = {
            search: search || '',
            status: status ? status.split(',') : [],
            role: role ? role.split(',') : []
        };

        const result = await usersService.getAllUsers(
            parseInt(page),
            parseInt(limit),
            sort,
            filters
        );

        res.json({
            success: true,
            message: 'تم جلب المستخدمين بنجاح',
            data: result.users,
            pagination: result.pagination
        });
    } catch (error) {
        console.error('❌ getAllUsers error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/admin/users/stats
exports.getUsersStats = async (req, res) => {
    try {
        const stats = await usersService.getUsersStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('❌ getUsersStats error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/admin/users/recent
exports.getRecentUsers = async (req, res) => {
    try {
        const { limit = 4 } = req.query;
        const users = await usersService.getRecentUsers(parseInt(limit));
        res.json({ success: true, data: users });
    } catch (error) {
        console.error('❌ getRecentUsers error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/admin/users/:id
exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await usersService.getUserById(parseInt(id));
        if (!user) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
        res.json({ success: true, data: user });
    } catch (error) {
        console.error('❌ getUserById error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/admin/users
exports.createUser = async (req, res) => {
    try {
        const userData = req.body;
        if (!userData.username || !userData.fullName || !userData.email || !userData.role || !userData.password) {
            return res.status(400).json({ success: false, message: 'جميع الحقول المطلوبة يجب أن تكون موجودة' });
        }
        const newUser = await usersService.createUser(userData);
        res.status(201).json({ success: true, message: 'تم إنشاء المستخدم بنجاح', data: newUser });
    } catch (error) {
        console.error('❌ createUser error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /api/admin/users/:id
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await usersService.updateUser(parseInt(id), req.body);
        res.json({ success: true, message: 'تم تحديث المستخدم بنجاح', data: updated });
    } catch (error) {
        console.error('❌ updateUser error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await usersService.deleteUser(parseInt(id));
        res.json({ success: true, message: 'تم حذف المستخدم بنجاح' });
    } catch (error) {
        console.error('❌ deleteUser error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// PATCH /api/admin/users/:id/status
exports.changeUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        if (isActive === undefined) {
            return res.status(400).json({ success: false, message: 'isActive مطلوب' });
        }
        const updated = await usersService.changeUserStatus(parseInt(id), isActive);
        res.json({ success: true, message: `تم ${isActive ? 'تفعيل' : 'تعطيل'} المستخدم بنجاح`, data: updated });
    } catch (error) {
        console.error('❌ changeUserStatus error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/admin/users/:id/last-login
exports.updateLastLogin = async (req, res) => {
    try {
        const { id } = req.params;
        await usersService.updateLastLogin(parseInt(id));
        res.json({ success: true, message: 'تم تحديث آخر تسجيل دخول' });
    } catch (error) {
        console.error('❌ updateLastLogin error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/admin/users/export/export-data
exports.exportUsers = async (req, res) => {
    try {
        const data = await usersService.exportUsers();
        res.json({ success: true, data });
    } catch (error) {
        console.error('❌ exportUsers error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};