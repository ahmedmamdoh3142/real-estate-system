// 📁 Backend/controllers/admin/projects.controller.js - النسخة المصححة مع إضافة locationLink و contractPdfUrl
const projectsService = require('/services/admin/projects.service');

/**
 * @desc    جلب جميع المشاريع مع الفلترة والترتيب
 * @route   GET /api/admin/projects
 * @access  Private (Admin)
 */
exports.getAllProjects = async (req, res) => {
    try {
        console.log('📊 جلب جميع المشاريع من قاعدة البيانات الحقيقية (msnodesqlv8)...');
        
        // استخراج معاملات البحث والفلترة
        const { 
            page = 1, 
            limit = 25, 
            sort = 'newest',
            search = '',
            status = '',
            type = '',
            featured = '',
            available = ''
        } = req.query;
        
        console.log('🔍 معاملات البحث:', { page, limit, sort, search, status, type, featured, available });
        
        // تحويل الفلترات إلى مصفوفات
        const filters = {
            search: search || '',
            status: status ? status.split(',') : [],
            type: type ? type.split(',') : [],
            featured: featured === 'true',
            available: available === 'true'
        };
        
        console.log('🎯 الفلترات النهائية:', filters);
        
        const result = await projectsService.getAllProjects(
            parseInt(page),
            parseInt(limit),
            sort,
            filters
        );
        
        console.log(`✅ تم جلب ${result.projects?.length || 0} مشروع بنجاح (msnodesqlv8)`);
        
        res.status(200).json({
            success: true,
            message: 'تم جلب المشاريع بنجاح (msnodesqlv8)',
            data: result.projects || [],
            pagination: result.pagination || {
                currentPage: 1,
                totalPages: 1,
                totalItems: 0,
                itemsPerPage: parseInt(limit),
                hasNextPage: false,
                hasPrevPage: false
            },
            filters: filters,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ خطأ في getAllProjects (msnodesqlv8):', error);
        res.status(500).json({
            success: false,
            message: error.message || 'فشل في جلب المشاريع',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
};

/**
 * @desc    جلب إحصائيات المشاريع
 * @route   GET /api/admin/projects/stats
 * @access  Private (Admin)
 */
exports.getProjectsStats = async (req, res) => {
    try {
        console.log('📈 جلب إحصائيات المشاريع من قاعدة البيانات الحقيقية (msnodesqlv8)...');
        
        const stats = await projectsService.getProjectsStats();
        
        res.status(200).json({
            success: true,
            message: 'تم جلب إحصائيات المشاريع بنجاح (msnodesqlv8)',
            data: stats,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ خطأ في getProjectsStats (msnodesqlv8):', error);
        res.status(500).json({
            success: false,
            message: error.message || 'فشل في جلب إحصائيات المشاريع',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
};

/**
 * @desc    جلب المشاريع الحديثة
 * @route   GET /api/admin/projects/recent
 * @access  Private (Admin)
 */
exports.getRecentProjects = async (req, res) => {
    try {
        const { limit = 4 } = req.query;
        console.log(`🆕 جلب ${limit} مشروع حديث من قاعدة البيانات الحقيقية (msnodesqlv8)...`);
        
        const projects = await projectsService.getRecentProjects(parseInt(limit));
        
        res.status(200).json({
            success: true,
            message: 'تم جلب المشاريع الحديثة بنجاح (msnodesqlv8)',
            data: projects || [],
            total: projects?.length || 0
        });
        
    } catch (error) {
        console.error('❌ خطأ في getRecentProjects (msnodesqlv8):', error);
        res.status(500).json({
            success: false,
            message: error.message || 'فشل في جلب المشاريع الحديثة',
            error: error.message
        });
    }
};

/**
 * @desc    البحث في المشاريع
 * @route   GET /api/admin/projects/search
 * @access  Private (Admin)
 */
exports.searchProjects = async (req, res) => {
    try {
        const { q = '', limit = 10 } = req.query;
        console.log(`🔍 بحث في المشاريع عن: "${q}" (msnodesqlv8)`);
        
        const projects = await projectsService.searchProjects(q, parseInt(limit));
        
        res.status(200).json({
            success: true,
            message: 'تم البحث بنجاح (msnodesqlv8)',
            data: projects || [],
            query: q,
            total: projects?.length || 0
        });
        
    } catch (error) {
        console.error('❌ خطأ في searchProjects (msnodesqlv8):', error);
        res.status(500).json({
            success: false,
            message: error.message || 'فشل في البحث',
            error: error.message
        });
    }
};

/**
 * @desc    جلب مشروع واحد
 * @route   GET /api/admin/projects/:id
 * @access  Private (Admin)
 */
exports.getProjectById = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`📄 جلب مشروع رقم ${id} من قاعدة البيانات الحقيقية (msnodesqlv8)...`);
        
        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                success: false,
                message: 'معرف المشروع غير صالح'
            });
        }
        
        const project = await projectsService.getProjectById(parseInt(id));
        
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'المشروع غير موجود'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'تم جلب المشروع بنجاح (msnodesqlv8)',
            data: project
        });
        
    } catch (error) {
        console.error('❌ خطأ في getProjectById (msnodesqlv8):', error);
        res.status(500).json({
            success: false,
            message: error.message || 'فشل في جلب المشروع',
            error: error.message
        });
    }
};

/**
 * @desc    إنشاء مشروع جديد مع الصور والميزات
 * @route   POST /api/admin/projects
 * @access  Private (Admin)
 */
exports.createProject = async (req, res) => {
    try {
        console.log('➕ إنشاء مشروع جديد في قاعدة البيانات الحقيقية (msnodesqlv8)...');
        console.log('📝 بيانات المشروع:', JSON.stringify(req.body, null, 2));
        
        // التحقق من البيانات المطلوبة
        const requiredFields = ['projectName', 'projectCode', 'projectType', 'location', 'city', 'totalUnits', 'availableUnits', 'price', 'area'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `الحقول التالية مطلوبة: ${missingFields.join(', ')}`
            });
        }
        
        // التحقق من أن الوحدات المتاحة أقل من أو تساوي الإجمالية
        if (parseInt(req.body.availableUnits) > parseInt(req.body.totalUnits)) {
            return res.status(400).json({
                success: false,
                message: 'الوحدات المتاحة لا يمكن أن تكون أكثر من إجمالي الوحدات'
            });
        }
        
        const projectData = {
            ...req.body,
            // تحويل القيم إلى الأرقام المناسبة
            totalUnits: parseInt(req.body.totalUnits),
            availableUnits: parseInt(req.body.availableUnits),
            price: parseFloat(req.body.price),
            area: parseFloat(req.body.area),
            bedrooms: req.body.bedrooms ? parseInt(req.body.bedrooms) : null,
            bathrooms: req.body.bathrooms ? parseInt(req.body.bathrooms) : null,
            isFeatured: req.body.isFeatured === true || req.body.isFeatured === 'true',
            createdBy: 1 // في الإنتاج الفعلي: req.user.id
        };
        
        // ✅ معالجة الميزات والصور بشكل صحيح
        if (req.body.features && Array.isArray(req.body.features)) {
            projectData.features = req.body.features.map(feature => ({
                name: feature.name,
                value: feature.value,
                featureName: feature.featureName || feature.name, // ✅ إضافة لتجنب undefined
                featureValue: feature.featureValue || feature.value, // ✅ إضافة لتجنب undefined
                icon: feature.icon,
                displayOrder: feature.displayOrder
            }));
        } else {
            projectData.features = [];
        }
        
        if (req.body.images && Array.isArray(req.body.images)) {
            projectData.images = req.body.images.map((image, index) => ({
                imageUrl: image.imageUrl || image.previewUrl || `/uploads/projects/default-${index + 1}.jpg`,
                imageType: image.imageType || 'صورة_عامة',
                displayOrder: image.displayOrder || index + 1,
                isActive: image.isActive !== undefined ? image.isActive : true,
                isMain: image.isMain || false
            }));
        } else {
            projectData.images = [];
        }
        
        
        const newProject = await projectsService.createProject(projectData);
        
        res.status(201).json({
            success: true,
            message: 'تم إنشاء المشروع بنجاح مع الصور والميزات (msnodesqlv8)',
            data: newProject
        });
        
    } catch (error) {
        console.error('❌ خطأ في createProject (msnodesqlv8):', error);
        res.status(500).json({
            success: false,
            message: error.message || 'فشل في إنشاء المشروع',
            error: error.message
        });
    }
};

/**
 * @desc    تحديث مشروع مع الصور والميزات
 * @route   PUT /api/admin/projects/:id
 * @access  Private (Admin)
 */
exports.updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`✏️ تحديث مشروع رقم ${id} في قاعدة البيانات الحقيقية (msnodesqlv8)...`);
        console.log('📝 بيانات التحديث:', JSON.stringify(req.body, null, 2));
        
        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                success: false,
                message: 'معرف المشروع غير صالح'
            });
        }
        
        // التحقق من وجود المشروع أولاً
        const existingProject = await projectsService.getProjectById(parseInt(id));
        if (!existingProject) {
            return res.status(404).json({
                success: false,
                message: 'المشروع غير موجود'
            });
        }
        
        // معالجة البيانات
        const updateData = { ...req.body };
        
        // تحويل القيم الرقمية إذا كانت موجودة
        if (updateData.totalUnits) updateData.totalUnits = parseInt(updateData.totalUnits);
        if (updateData.availableUnits) updateData.availableUnits = parseInt(updateData.availableUnits);
        if (updateData.price) updateData.price = parseFloat(updateData.price);
        if (updateData.area) updateData.area = parseFloat(updateData.area);
        if (updateData.bedrooms) updateData.bedrooms = parseInt(updateData.bedrooms);
        if (updateData.bathrooms) updateData.bathrooms = parseInt(updateData.bathrooms);
        if (updateData.isFeatured !== undefined) {
            updateData.isFeatured = updateData.isFeatured === true || updateData.isFeatured === 'true';
        }
        
        // التحقق من أن الوحدات المتاحة أقل من أو تساوي الإجمالية
        if (updateData.availableUnits && updateData.totalUnits && 
            updateData.availableUnits > updateData.totalUnits) {
            return res.status(400).json({
                success: false,
                message: 'الوحدات المتاحة لا يمكن أن تكون أكثر من إجمالي الوحدات'
            });
        }
        
        // ✅ معالجة الميزات والصور بشكل صحيح
        if (updateData.features !== undefined && Array.isArray(updateData.features)) {
            updateData.features = updateData.features.map(feature => ({
                name: feature.name,
                value: feature.value,
                featureName: feature.featureName || feature.name, // ✅ إضافة لتجنب undefined
                featureValue: feature.featureValue || feature.value, // ✅ إضافة لتجنب undefined
                icon: feature.icon,
                displayOrder: feature.displayOrder
            }));
        }
        
        if (updateData.images !== undefined && Array.isArray(updateData.images)) {
            updateData.images = updateData.images.map((image, index) => ({
                imageUrl: image.imageUrl || image.previewUrl || `/uploads/projects/project-${id}-${index + 1}.jpg`,
                imageType: image.imageType || 'صورة_عامة',
                displayOrder: image.displayOrder || index + 1,
                isActive: image.isActive !== undefined ? image.isActive : true,
                isMain: image.isMain || false
            }));
        }
        
        const updatedProject = await projectsService.updateProject(parseInt(id), updateData);
        
        if (!updatedProject) {
            return res.status(404).json({
                success: false,
                message: 'المشروع غير موجود بعد التحديث'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'تم تحديث المشروع بنجاح مع الصور والميزات (msnodesqlv8)',
            data: updatedProject
        });
        
    } catch (error) {
        console.error('❌ خطأ في updateProject (msnodesqlv8):', error);
        res.status(500).json({
            success: false,
            message: error.message || 'فشل في تحديث المشروع',
            error: error.message
        });
    }
};

/**
 * @desc    حذف مشروع مع جميع البيانات المرتبطة
 * @route   DELETE /api/admin/projects/:id
 * @access  Private (Admin)
 */
exports.deleteProject = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🗑️ حذف مشروع رقم ${id} من قاعدة البيانات الحقيقية (msnodesqlv8)...`);
        
        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                success: false,
                message: 'معرف المشروع غير صالح'
            });
        }
        
        // التحقق من وجود المشروع أولاً
        const existingProject = await projectsService.getProjectById(parseInt(id));
        if (!existingProject) {
            return res.status(404).json({
                success: false,
                message: 'المشروع غير موجود'
            });
        }
        
        const deleted = await projectsService.deleteProject(parseInt(id));
        
        if (!deleted) {
            return res.status(500).json({
                success: false,
                message: 'فشل في حذف المشروع'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'تم حذف المشروع بنجاح مع جميع البيانات المرتبطة (msnodesqlv8)',
            data: { 
                id: parseInt(id),
                deletedFeatures: true,
                deletedImages: true,
                deletedInquiries: true,
                deletedLeads: true,
                deletedContracts: true
            }
        });
        
    } catch (error) {
        console.error('❌ خطأ في deleteProject (msnodesqlv8):', error);
        res.status(500).json({
            success: false,
            message: error.message || 'فشل في حذف المشروع',
            error: error.message
        });
    }
};

/**
 * @desc    جلب ميزات المشروع
 * @route   GET /api/admin/projects/:id/features
 * @access  Private (Admin)
 */
exports.getProjectFeatures = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`⭐ جلب ميزات مشروع رقم ${id} من قاعدة البيانات الحقيقية (msnodesqlv8)...`);
        
        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                success: false,
                message: 'معرف المشروع غير صالح'
            });
        }
        
        const features = await projectsService.getProjectFeatures(parseInt(id));
        
        res.status(200).json({
            success: true,
            message: 'تم جلب ميزات المشروع بنجاح (msnodesqlv8)',
            data: features || [],
            total: features?.length || 0
        });
        
    } catch (error) {
        console.error('❌ خطأ في getProjectFeatures (msnodesqlv8):', error);
        res.status(500).json({
            success: false,
            message: error.message || 'فشل في جلب ميزات المشروع',
            error: error.message
        });
    }
};

/**
 * @desc    جلب صور المشروع
 * @route   GET /api/admin/projects/:id/images
 * @access  Private (Admin)
 */
exports.getProjectImages = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🖼️ جلب صور مشروع رقم ${id} من قاعدة البيانات الحقيقية (msnodesqlv8)...`);
        
        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                success: false,
                message: 'معرف المشروع غير صالح'
            });
        }
        
        const images = await projectsService.getProjectImages(parseInt(id));
        
        res.status(200).json({
            success: true,
            message: 'تم جلب صور المشروع بنجاح (msnodesqlv8)',
            data: images || [],
            total: images?.length || 0
        });
        
    } catch (error) {
        console.error('❌ خطأ في getProjectImages (msnodesqlv8):', error);
        res.status(500).json({
            success: false,
            message: error.message || 'فشل في جلب صور المشروع',
            error: error.message
        });
    }
};

/**
 * @desc    إضافة صورة للمشروع
 * @route   POST /api/admin/projects/:id/images
 * @access  Private (Admin)
 */
exports.addProjectImage = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`📤 إضافة صورة لمشروع رقم ${id} في قاعدة البيانات الحقيقية (msnodesqlv8)...`);
        
        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                success: false,
                message: 'معرف المشروع غير صالح'
            });
        }
        
        const imageData = {
            ...req.body,
            projectId: parseInt(id)
        };
        
        // التحقق من البيانات المطلوبة
        if (!imageData.imageUrl) {
            return res.status(400).json({
                success: false,
                message: 'مسار الصورة مطلوب'
            });
        }
        
        const newImage = await projectsService.addProjectImage(imageData);
        
        res.status(201).json({
            success: true,
            message: 'تم إضافة الصورة للمشروع بنجاح (msnodesqlv8)',
            data: newImage
        });
        
    } catch (error) {
        console.error('❌ خطأ في addProjectImage (msnodesqlv8):', error);
        res.status(500).json({
            success: false,
            message: error.message || 'فشل في إضافة الصورة',
            error: error.message
        });
    }
};

/**
 * @desc    رفع صورة (منفصل)
 * @route   POST /api/admin/projects/upload-image
 * @access  Private (Admin)
 */
exports.uploadImage = async (req, res) => {
    try {
        console.log('📤 رفع صورة جديدة (محاكاة) (msnodesqlv8)...');
        
        const { filename, mimetype, size, projectId } = req.body;
        
        if (!filename) {
            return res.status(400).json({
                success: false,
                message: 'اسم الملف مطلوب'
            });
        }
        
        // إنشاء مسار وهمي للصورة
        const imageUrl = `/uploads/projects/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.]/g, '-')}`;
        
        console.log(`📁 تم "رفع" الملف: ${filename} إلى: ${imageUrl}`);
        
        res.status(201).json({
            success: true,
            message: 'تم رفع الصورة بنجاح (محاكاة)',
            data: {
                url: imageUrl,
                filename: filename,
                mimetype: mimetype || 'image/jpeg',
                size: size || 0,
                uploadedAt: new Date().toISOString(),
                projectId: projectId || null
            }
        });
        
    } catch (error) {
        console.error('❌ خطأ في uploadImage (msnodesqlv8):', error);
        res.status(500).json({
            success: false,
            message: error.message || 'فشل في رفع الصورة',
            error: error.message
        });
    }
};

/**
 * @desc    تصدير المشاريع
 * @route   GET /api/admin/projects/export/export-data
 * @access  Private (Admin)
 */
exports.exportProjects = async (req, res) => {
    try {
        console.log('📊 تصدير المشاريع من قاعدة البيانات الحقيقية (msnodesqlv8)...');
        
        const { format = 'csv' } = req.query;
        
        const exportData = await projectsService.exportProjects(format);
        
        res.status(200).json({
            success: true,
            message: 'تم تحضير بيانات التصدير (msnodesqlv8)',
            data: exportData || [],
            format: format,
            total: exportData?.length || 0,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ خطأ في exportProjects (msnodesqlv8):', error);
        res.status(500).json({
            success: false,
            message: error.message || 'فشل في تصدير المشاريع',
            error: error.message
        });
    }
};

/**
 * @desc    اختبار الاتصال بقاعدة البيانات
 * @route   GET /api/admin/projects/test-connection
 * @access  Private (Admin)
 */
exports.testConnection = async (req, res) => {
    try {
        console.log('🔌 اختبار الاتصال بقاعدة البيانات (msnodesqlv8)...');
        const result = await projectsService.testConnection();
        
        res.status(200).json(result);
    } catch (error) {
        console.error('❌ خطأ في testConnection (msnodesqlv8):', error);
        res.status(500).json({
            success: false,
            message: error.message || 'فشل في اختبار الاتصال',
            error: error.message
        });
    }
};