// Backend/controllers/public/projects.controller.js - التحكم في العقارات
const projectsService = require('../../services/public/projects.service');

/**
 * @desc    جلب جميع العقارات مع الفلترة
 * @route   GET /api/public/projects/all
 * @access  Public
 */
exports.getAllProjects = async (req, res) => {
    try {
        console.log('🏢 جلب جميع العقارات مع الفلترة...');
        
        const filters = {
            page: req.query.page || 1,
            limit: req.query.limit || 50,
            type: req.query.type || 'all',
            city: req.query.city || 'all',
            transaction: req.query.transaction || 'all',
            minPrice: req.query.minPrice,
            maxPrice: req.query.maxPrice,
            search: req.query.search || '',
            sort: req.query.sort || 'newest'
        };
        
        const result = await projectsService.getAllProjects(filters);
        
        res.status(200).json({
            success: true,
            message: 'تم جلب العقارات بنجاح',
            data: result
        });
    } catch (error) {
        console.error('❌ خطأ في getAllProjects:', error);
        
        res.status(500).json({
            success: false,
            message: 'فشل في جلب العقارات'
        });
    }
};

/**
 * @desc    جلب إحصائيات العقارات
 * @route   GET /api/public/projects/stats
 * @access  Public
 */
exports.getProjectsStats = async (req, res) => {
    try {
        console.log('📊 جلب إحصائيات العقارات...');
        
        const stats = await projectsService.getProjectsStats();
        
        res.status(200).json({
            success: true,
            message: 'تم جلب الإحصائيات بنجاح',
            data: stats
        });
    } catch (error) {
        console.error('❌ خطأ في getProjectsStats:', error);
        
        res.status(500).json({
            success: false,
            message: 'فشل في جلب الإحصائيات'
        });
    }
};

/**
 * @desc    جلب العقارات المميزة
 * @route   GET /api/public/projects/featured
 * @access  Public
 */
exports.getFeaturedProjects = async (req, res) => {
    try {
        console.log('⭐ جلب العقارات المميزة...');
        
        const result = await projectsService.getFeaturedProjects();
        
        res.status(200).json({
            success: true,
            message: 'تم جلب العقارات المميزة بنجاح',
            data: result
        });
    } catch (error) {
        console.error('❌ خطأ في getFeaturedProjects:', error);
        
        res.status(500).json({
            success: false,
            message: 'فشل في جلب العقارات المميزة'
        });
    }
};

/**
 * @desc    جلب تفاصيل عقار محدد
 * @route   GET /api/public/projects/:id
 * @access  Public
 */
exports.getProjectById = async (req, res) => {
    try {
        const projectId = parseInt(req.params.id);
        console.log(`🔍 جلب تفاصيل العقار ID: ${projectId}`);
        
        if (!projectId || isNaN(projectId)) {
            return res.status(400).json({
                success: false,
                message: 'معرّف العقار غير صالح'
            });
        }
        
        const project = await projectsService.getProjectById(projectId);
        
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'العقار غير موجود'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'تم جلب تفاصيل العقار بنجاح',
            data: project
        });
    } catch (error) {
        console.error('❌ خطأ في getProjectById:', error);
        
        res.status(500).json({
            success: false,
            message: 'فشل في جلب تفاصيل العقار'
        });
    }
};

/**
 * @desc    جلب قائمة المدن المتاحة
 * @route   GET /api/public/projects/cities/list
 * @access  Public
 */
exports.getCitiesList = async (req, res) => {
    try {
        console.log('🏙️ جلب قائمة المدن المتاحة...');
        
        const cities = await projectsService.getCitiesList();
        
        res.status(200).json({
            success: true,
            message: 'تم جلب قائمة المدن بنجاح',
            data: cities
        });
    } catch (error) {
        console.error('❌ خطأ في getCitiesList:', error);
        
        res.status(500).json({
            success: false,
            message: 'فشل في جلب قائمة المدن'
        });
    }
};

/**
 * @desc    اختبار قاعدة البيانات للعقارات
 * @route   GET /api/public/projects/test/db
 * @access  Public
 */
exports.testProjectsDatabase = async (req, res) => {
    try {
        console.log('🧪 اختبار قاعدة البيانات للعقارات...');
        
        const result = await projectsService.testDatabase();
        
        res.status(200).json({
            success: true,
            message: 'تم اختبار قاعدة البيانات بنجاح',
            data: result
        });
    } catch (error) {
        console.error('❌ خطأ في testProjectsDatabase:', error);
        
        res.status(500).json({
            success: false,
            message: 'فشل في اختبار قاعدة البيانات'
        });
    }
};