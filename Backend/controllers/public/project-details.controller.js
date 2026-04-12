// Backend/controllers/public/project-details.controller.js - التحكم في تفاصيل العقار
const sql = require('msnodesqlv8');

// سلسلة الاتصال
require('dotenv').config();
const connectionString = process.env.DB_CONNECTION_STRING;
// دالة مساعدة للاستعلامات
function queryAsync(sqlQuery) {
    return new Promise((resolve, reject) => {
        sql.query(connectionString, sqlQuery, (err, rows) => {
            if (err) {
                console.error('❌ خطأ في الاستعلام:', err.message);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

/**
 * @desc    جلب تفاصيل عقار محدد
 * @route   GET /api/public/project-details/:id
 * @access  Public
 */
exports.getProjectDetails = async (req, res) => {
    try {
        const projectId = parseInt(req.params.id);
        console.log(`🔍 جلب تفاصيل العقار ID: ${projectId}`);
        
        if (!projectId || isNaN(projectId)) {
            return res.status(400).json({
                success: false,
                message: 'معرّف العقار غير صالح'
            });
        }
        
        // استعلام البيانات الأساسية
        const projectQuery = `
            SELECT 
                p.id,
                p.projectCode,
                p.projectName,
                p.projectType,
                p.description,
                p.location,
                p.city,
                p.district,
                p.totalUnits,
                p.availableUnits,
                p.price,
                p.priceType,
                p.area,
                ISNULL(p.areaUnit, N'متر مربع') as areaUnit,
                p.bedrooms,
                p.bathrooms,
                p.isFeatured,
                p.status,
                p.completionDate,
                p.createdAt,
                p.updatedAt,
                p.locationLink,
                u.fullName as createdByName
            FROM Projects p
            LEFT JOIN Users u ON p.createdBy = u.id
            WHERE p.id = ${projectId}
        `;
        
        const projectResult = await queryAsync(projectQuery);
        
        if (!projectResult || projectResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'العقار غير موجود'
            });
        }
        
        const project = projectResult[0];
        
        // جلب الصور والميزات بالتوازي
        const [images, features] = await Promise.all([
            queryAsync(`
                SELECT id, imageUrl, imageType, displayOrder, isActive
                FROM ProjectImages 
                WHERE projectId = ${projectId} AND isActive = 1
                ORDER BY displayOrder
            `),
            queryAsync(`
                SELECT id, featureName, featureValue, icon, displayOrder
                FROM ProjectFeatures 
                WHERE projectId = ${projectId}
                ORDER BY displayOrder
            `)
        ]);
        
        // معالجة البيانات
        const processedProject = {
            id: parseInt(project.id),
            projectCode: project.projectCode || `PJ-${project.id}`,
            projectName: project.projectName || 'عقار',
            projectType: getProjectTypeText(project.projectType || 'سكني'),
            description: project.description || 'وصف غير متوفر',
            location: project.location || 'غير محدد',
            city: project.city || 'الرياض',
            district: project.district || '',
            fullAddress: `${project.city}${project.district ? '، ' + project.district : ''}${project.location ? '، ' + project.location : ''}`,
            totalUnits: parseInt(project.totalUnits) || 0,
            availableUnits: parseInt(project.availableUnits) || 0,
            price: parseFloat(project.price) || 0,
            priceType: getPriceTypeText(project.priceType || 'شراء'),
            area: parseFloat(project.area) || 0,
            areaUnit: project.areaUnit || 'م²',
            bedrooms: parseInt(project.bedrooms) || 0,
            bathrooms: parseInt(project.bathrooms) || 0,
            isFeatured: project.isFeatured === true || project.isFeatured === 1 || project.isFeatured === 'true',
            status: getStatusText(project.status || 'نشط'),
            completionDate: project.completionDate || null,
            createdAt: project.createdAt || new Date(),
            updatedAt: project.updatedAt || null,
            createdBy: project.createdByName || 'النظام',
            locationLink: project.locationLink || null,
            images: (images || []).map(img => ({
                id: img.id,
                url: img.imageUrl,
                type: img.imageType || 'صورة',
                order: img.displayOrder || 0,
                isActive: img.isActive === true || img.isActive === 1 || img.isActive === 'true'
            })),
            features: (features || []).map(feat => ({
                id: feat.id,
                name: feat.featureName,
                value: feat.featureValue,
                icon: feat.icon || 'fas fa-check',
                order: feat.displayOrder || 0
            }))
        };
        
        res.status(200).json({
            success: true,
            message: 'تم جلب تفاصيل العقار بنجاح',
            data: processedProject
        });
        
    } catch (error) {
        console.error('❌ خطأ في getProjectDetails:', error);
        
        res.status(500).json({
            success: false,
            message: 'فشل في جلب تفاصيل العقار'
        });
    }
};

/**
 * @desc    جلب العقارات المشابهة
 * @route   GET /api/public/project-details/:id/related
 * @access  Public
 */
exports.getRelatedProjects = async (req, res) => {
    try {
        const projectId = parseInt(req.params.id);
        const limit = parseInt(req.query.limit) || 3;
        
        console.log(`🔗 جلب العقارات المشابهة للمشروع ID: ${projectId}`);
        
        // جلب بيانات المشروع الحالي
        const currentProject = await queryAsync(`
            SELECT projectType, city
            FROM Projects
            WHERE id = ${projectId}
        `);
        
        if (!currentProject || currentProject.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'العقار غير موجود'
            });
        }
        
        const { projectType, city } = currentProject[0];
        
        // جلب العقارات المشابهة
        const relatedQuery = `
            SELECT TOP ${limit} 
                p.id,
                p.projectName,
                p.projectType,
                p.city,
                p.district,
                p.area,
                p.bedrooms,
                p.bathrooms,
                p.price,
                p.priceType,
                p.isFeatured,
                p.status
            FROM Projects p
            WHERE p.id != ${projectId}
            AND (p.projectType = N'${projectType?.replace(/'/g, "''") || 'سكني'}'
                 OR p.city = N'${city?.replace(/'/g, "''") || 'الرياض'}')
            AND p.status NOT IN ('مباع', 'محجوز')
            ORDER BY 
                CASE WHEN p.projectType = N'${projectType?.replace(/'/g, "''") || 'سكني'}' THEN 0 ELSE 1 END,
                CASE WHEN p.city = N'${city?.replace(/'/g, "''") || 'الرياض'}' THEN 0 ELSE 1 END,
                p.isFeatured DESC,
                p.createdAt DESC
        `;
        
        const relatedProjects = await queryAsync(relatedQuery);
        
        // معالجة النتائج
        const processedProjects = await Promise.all(relatedProjects.map(async (project) => {
            const images = await queryAsync(`
                SELECT TOP 1 imageUrl
                FROM ProjectImages 
                WHERE projectId = ${project.id} AND isActive = 1
                ORDER BY displayOrder
            `);
            
            return {
                id: parseInt(project.id),
                projectName: project.projectName || 'عقار',
                projectType: getProjectTypeText(project.projectType || 'سكني'),
                city: project.city || 'الرياض',
                district: project.district || '',
                area: parseFloat(project.area) || 0,
                bedrooms: parseInt(project.bedrooms) || 0,
                bathrooms: parseInt(project.bathrooms) || 0,
                price: parseFloat(project.price) || 0,
                priceType: getPriceTypeText(project.priceType || 'شراء'),
                isFeatured: project.isFeatured === true || project.isFeatured === 1,
                status: getStatusText(project.status || 'نشط'),
                mainImage: images && images.length > 0 ? images[0].imageUrl : '/global/assets/images/project-placeholder.jpg'
            };
        }));
        
        res.status(200).json({
            success: true,
            message: 'تم جلب العقارات المشابهة بنجاح',
            data: {
                projects: processedProjects,
                count: processedProjects.length
            }
        });
        
    } catch (error) {
        console.error('❌ خطأ في getRelatedProjects:', error);
        
        res.status(500).json({
            success: false,
            message: 'فشل في جلب العقارات المشابهة'
        });
    }
};

/**
 * @desc    إرسال استفسار عن عقار
 * @route   POST /api/public/project-details/:id/inquiry
 * @access  Public
 */
exports.submitInquiry = async (req, res) => {
    try {
        const projectId = parseInt(req.params.id);
        const {
            customerName,
            customerEmail,
            customerPhone,
            message,
            inquiryType = 'استفسار_عام'
        } = req.body;
        
        console.log(`📤 إرسال استفسار للمشروع ID: ${projectId}`);
        
        // التحقق من البيانات
        if (!customerName || !customerEmail || !customerPhone || !message) {
            return res.status(400).json({
                success: false,
                message: 'جميع الحقول مطلوبة'
            });
        }
        
        // التحقق من وجود المشروع
        const projectCheck = await queryAsync(`
            SELECT projectName
            FROM Projects
            WHERE id = ${projectId}
        `);
        
        if (!projectCheck || projectCheck.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'العقار غير موجود'
            });
        }
        
        // إنشاء كود الاستفسار
        const inquiryCode = `INQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        
        // إدخال الاستفسار
        const insertQuery = `
            INSERT INTO Inquiries (
                inquiryCode,
                projectId,
                customerName,
                customerEmail,
                customerPhone,
                message,
                inquiryType,
                status,
                createdAt,
                updatedAt
            ) VALUES (
                N'${inquiryCode}',
                ${projectId},
                N'${customerName.replace(/'/g, "''")}',
                N'${customerEmail.replace(/'/g, "''")}',
                N'${customerPhone.replace(/'/g, "''")}',
                N'${message.replace(/'/g, "''")}',
                N'${inquiryType.replace(/'/g, "''")}',
                N'جديد',
                GETDATE(),
                GETDATE()
            )
            
            SELECT SCOPE_IDENTITY() as newId
        `;
        
        const insertResult = await queryAsync(insertQuery);
        const newId = insertResult && insertResult.length > 0 ? insertResult[0].newId : null;
        
        if (newId) {
            res.status(201).json({
                success: true,
                data: {
                    inquiryId: newId,
                    inquiryCode: inquiryCode,
                    projectId: projectId,
                    projectName: projectCheck[0].projectName
                },
                message: 'تم إرسال استفسارك بنجاح'
            });
        } else {
            throw new Error('فشل في إنشاء الاستفسار');
        }
        
    } catch (error) {
        console.error('❌ خطأ في submitInquiry:', error);
        
        res.status(500).json({
            success: false,
            message: 'فشل في إرسال الاستفسار'
        });
    }
};

/**
 * @desc    جلب إحصائيات المشروع
 * @route   GET /api/public/project-details/:id/stats
 * @access  Public
 */
exports.getProjectStats = async (req, res) => {
    try {
        const projectId = parseInt(req.params.id);
        
        console.log(`📊 جلب إحصائيات المشروع ID: ${projectId}`);
        
        // استعلام الإحصائيات
        const statsQuery = `
            SELECT 
                (SELECT COUNT(*) FROM Inquiries WHERE projectId = ${projectId}) as inquiriesCount,
                (SELECT COUNT(*) FROM Leads WHERE projectId = ${projectId}) as leadsCount,
                (SELECT COUNT(*) FROM Contracts WHERE projectId = ${projectId}) as contractsCount,
                (SELECT COUNT(*) FROM Contracts WHERE projectId = ${projectId} AND contractStatus = 'نشط') as activeContractsCount,
                
                p.projectName,
                p.projectType,
                p.city,
                p.status,
                p.availableUnits,
                p.totalUnits,
                p.locationLink
            FROM Projects p
            WHERE p.id = ${projectId}
        `;
        
        const statsResult = await queryAsync(statsQuery);
        
        if (!statsResult || statsResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'العقار غير موجود'
            });
        }
        
        const stats = statsResult[0];
        
        const processedStats = {
            projectId: projectId,
            projectName: stats.projectName || 'عقار',
            projectType: getProjectTypeText(stats.projectType || 'سكني'),
            city: stats.city || 'الرياض',
            status: getStatusText(stats.status || 'نشط'),
            locationLink: stats.locationLink || null,
            
            statistics: {
                inquiries: parseInt(stats.inquiriesCount) || 0,
                leads: parseInt(stats.leadsCount) || 0,
                contracts: {
                    total: parseInt(stats.contractsCount) || 0,
                    active: parseInt(stats.activeContractsCount) || 0
                },
                units: {
                    total: parseInt(stats.totalUnits) || 0,
                    available: parseInt(stats.availableUnits) || 0,
                    occupied: parseInt(stats.totalUnits) - parseInt(stats.availableUnits) || 0,
                    occupancyRate: stats.totalUnits > 0 ? 
                        Math.round(((parseInt(stats.totalUnits) - parseInt(stats.availableUnits)) / parseInt(stats.totalUnits)) * 100) : 0
                }
            }
        };
        
        res.status(200).json({
            success: true,
            message: 'تم جلب إحصائيات المشروع بنجاح',
            data: processedStats
        });
        
    } catch (error) {
        console.error('❌ خطأ في getProjectStats:', error);
        
        res.status(500).json({
            success: false,
            message: 'فشل في جلب إحصائيات المشروع'
        });
    }
};

// دوال مساعدة
function getProjectTypeText(type) {
    const typeMap = {
        'residential': 'سكني',
        'commercial': 'تجاري',
        'villa': 'فيلا',
        'apartment': 'شقة',
        'office': 'مكتب',
        'shop': 'محل تجاري',
        'land': 'أرض',
        'صناعي': 'صناعي',
        'فندقي': 'فندقي',
        'سكني': 'سكني',
        'تجاري': 'تجاري'
    };
    
    return typeMap[type?.toLowerCase()] || type || 'سكني';
}

function getPriceTypeText(type) {
    if (!type) return 'شراء';
    
    const typeLower = type.toString().toLowerCase();
    if (typeLower.includes('إيجار') || typeLower.includes('تأجير') || typeLower === 'rent') {
        return 'إيجار';
    }
    return 'شراء';
}

function getStatusText(status) {
    const statusMap = {
        'جاهز_للتسليم': 'جاهز',
        'مكتمل': 'مكتمل',
        'نشط': 'نشط',
        'قيد_الإنشاء': 'قيد الإنشاء',
        'مباع': 'مباع',
        'محجوز': 'محجوز',
        'active': 'نشط',
        'completed': 'مكتمل',
        'sold': 'مباع'
    };
    
    return statusMap[status?.toLowerCase()] || status || 'نشط';
}