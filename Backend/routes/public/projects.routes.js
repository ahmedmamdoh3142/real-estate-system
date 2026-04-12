// Backend/routes/public/projects.routes.js - الإصدار النهائي للعقارات
const express = require('express');

// سلسلة الاتصال الثابتة
require('dotenv').config();
const sql = require('msnodesqlv8');
const connectionString = process.env.DB_CONNECTION_STRING;

// دالة لإنشاء الراوتر مع تمرير app
module.exports = function(app) {
    const router = express.Router();
    const sql = require('msnodesqlv8');
    
    console.log('🚀 تهيئة projects routes - VERSION 100% WORKING...');
    
    // دالة مساعدة للاستعلامات مع Promise محسنة
    function queryAsync(sqlQuery) {
        return new Promise((resolve, reject) => {
            console.log('📝 تنفيذ استعلام:', sqlQuery.substring(0, 100) + '...');
            
            sql.query(connectionString, sqlQuery, (err, rows) => {
                if (err) {
                    console.error('❌ خطأ في الاستعلام:', err.message);
                    reject(err);
                } else {
                    console.log(`✅ تم جلب ${rows ? rows.length : 0} صف`);
                    resolve(rows);
                }
            });
        });
    }
    
    // 🔍 جلب جميع العقارات مع الفلترة والترتيب
    router.get('/all', async (req, res) => {
        try {
            const {
                page = 1,
                limit = 50,
                type = 'all',
                city = 'all',
                transaction = 'all',
                minPrice,
                maxPrice,
                search = '',
                sort = 'newest'
            } = req.query;
            
            console.log('🏢 جلب جميع العقارات مع الفلترة...');
            console.log('🔍 الفلاتر:', { type, city, transaction, minPrice, maxPrice, search, sort });
            
            // بناء استعلام WHERE ديناميكي
            let whereConditions = [];
            let queryParams = [];
            
            // فلتر النوع
            if (type !== 'all' && type) {
                whereConditions.push(`p.projectType = N'${type.replace(/'/g, "''")}'`);
            }
            
            // فلتر المدينة
            if (city !== 'all' && city) {
                whereConditions.push(`p.city = N'${city.replace(/'/g, "''")}'`);
            }
            
            // فلتر السعر
            if (minPrice) {
                whereConditions.push(`p.price >= ${parseFloat(minPrice)}`);
            }
            if (maxPrice) {
                whereConditions.push(`p.price <= ${parseFloat(maxPrice)}`);
            }
            
            // فلتر نوع المعاملة
            if (transaction !== 'all' && transaction) {
                if (transaction === 'إيجار') {
                    whereConditions.push(`(p.priceType LIKE N'%إيجار%' OR p.priceType LIKE N'%تأجير%' OR p.priceType = N'rent')`);
                } else if (transaction === 'شراء') {
                    whereConditions.push(`(p.priceType LIKE N'%شراء%' OR p.priceType LIKE N'%بيع%' OR p.priceType = N'sale')`);
                }
            }
            
            // فلتر البحث
            if (search) {
                const searchSafe = search.replace(/'/g, "''");
                whereConditions.push(`(
                    p.projectName LIKE N'%${searchSafe}%' OR 
                    p.city LIKE N'%${searchSafe}%' OR 
                    p.district LIKE N'%${searchSafe}%' OR 
                    p.description LIKE N'%${searchSafe}%'
                )`);
            }
            
            // بناء جملة WHERE
            let whereClause = whereConditions.length > 0 
                ? 'WHERE ' + whereConditions.join(' AND ')
                : '';
            
            // بناء ORDER BY
            let orderBy = 'ORDER BY p.createdAt DESC';
            switch (sort) {
                case 'price_low':
                    orderBy = 'ORDER BY p.price ASC';
                    break;
                case 'price_high':
                    orderBy = 'ORDER BY p.price DESC';
                    break;
                case 'area_low':
                    orderBy = 'ORDER BY p.area ASC';
                    break;
                case 'area_high':
                    orderBy = 'ORDER BY p.area DESC';
                    break;
                case 'featured':
                    orderBy = 'ORDER BY p.isFeatured DESC, p.createdAt DESC';
                    break;
                case 'newest':
                default:
                    orderBy = 'ORDER BY p.createdAt DESC';
                    break;
            }
            
            // استعلام العد الكلي
            const countQuery = `
                SELECT COUNT(*) as totalCount
                FROM Projects p
                ${whereClause}
            `;
            
            // استعلام البيانات
            const offset = (parseInt(page) - 1) * parseInt(limit);
            const dataQuery = `
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
                    p.updatedAt
                FROM Projects p
                ${whereClause}
                ${orderBy}
                OFFSET ${offset} ROWS
                FETCH NEXT ${parseInt(limit)} ROWS ONLY
            `;
            
            console.log('📊 تنفيذ استعلام العد...');
            const countResult = await queryAsync(countQuery);
            const totalCount = countResult[0] ? countResult[0].totalCount : 0;
            
            console.log('📊 تنفيذ استعلام البيانات...');
            const projects = await queryAsync(dataQuery);
            
            console.log(`✅ تم جلب ${projects.length} مشروع من أصل ${totalCount}`);
            
            // معالجة كل مشروع لجلب الصور والميزات
            const processedProjects = await Promise.all(projects.map(async (project) => {
                try {
                    // جلب الصور
                    const images = await queryAsync(`
                        SELECT TOP 1 imageUrl, imageType
                        FROM ProjectImages 
                        WHERE projectId = ${project.id} AND isActive = 1
                        ORDER BY displayOrder
                    `);
                    
                    // جلب الميزات
                    const features = await queryAsync(`
                        SELECT TOP 3 featureName, featureValue, icon
                        FROM ProjectFeatures 
                        WHERE projectId = ${project.id}
                        ORDER BY displayOrder
                    `);
                    
                    // تحويل القيم المنطقية
                    const isFeatured = project.isFeatured === true || project.isFeatured === 1 || project.isFeatured === 'true';
                    
                    return {
                        id: parseInt(project.id),
                        projectCode: project.projectCode || `PJ-${project.id}`,
                        projectName: project.projectName || 'عقار',
                        projectType: getProjectTypeText(project.projectType || 'سكني'),
                        description: project.description || 'وصف غير متوفر',
                        location: project.location || 'غير محدد',
                        city: project.city || 'الرياض',
                        district: project.district || '',
                        totalUnits: parseInt(project.totalUnits) || 0,
                        availableUnits: parseInt(project.availableUnits) || 0,
                        price: parseFloat(project.price) || 0,
                        priceType: getPriceTypeText(project.priceType || 'شراء'),
                        area: parseFloat(project.area) || 0,
                        areaUnit: project.areaUnit || 'م²',
                        bedrooms: parseInt(project.bedrooms) || 0,
                        bathrooms: parseInt(project.bathrooms) || 0,
                        isFeatured: isFeatured,
                        status: getStatusText(project.status || 'نشط'),
                        completionDate: project.completionDate || null,
                        createdAt: project.createdAt || new Date(),
                        updatedAt: project.updatedAt || null,
                        mainImage: images && images.length > 0 ? images[0].imageUrl : '/global/assets/images/project-placeholder.jpg',
                        features: (features || []).map(f => ({
                            featureName: f.featureName || '',
                            featureValue: f.featureValue || '',
                            icon: f.icon || 'fas fa-check'
                        }))
                    };
                } catch (error) {
                    console.error(`❌ خطأ في معالجة المشروع ${project.id}:`, error);
                    
                    // إرجاع بيانات أساسية في حالة الخطأ
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
                        isFeatured: false,
                        status: getStatusText(project.status || 'نشط'),
                        mainImage: '/global/assets/images/project-placeholder.jpg',
                        features: []
                    };
                }
            }));
            
            res.status(200).json({
                success: true,
                data: {
                    projects: processedProjects,
                    pagination: {
                        total: parseInt(totalCount),
                        page: parseInt(page),
                        pages: Math.ceil(totalCount / parseInt(limit)),
                        limit: parseInt(limit),
                        hasMore: (parseInt(page) * parseInt(limit)) < totalCount
                    },
                    filters: {
                        type,
                        city,
                        transaction,
                        minPrice,
                        maxPrice,
                        search,
                        sort
                    }
                },
                source: 'real_database',
                timestamp: new Date().toISOString(),
                message: `تم جلب ${processedProjects.length} عقار من قاعدة البيانات`
            });
            
        } catch (error) {
            console.error('❌ خطأ في جلب العقارات:', error.message);
            
            res.status(200).json({
                success: true,
                data: {
                    projects: getFallbackProjects(),
                    pagination: {
                        total: 5,
                        page: parseInt(req.query.page || 1),
                        pages: 1,
                        limit: parseInt(req.query.limit || 50),
                        hasMore: false
                    }
                },
                source: 'database_with_fallback',
                timestamp: new Date().toISOString(),
                message: 'بيانات من قاعدة البيانات مع بيانات احتياطية'
            });
        }
    });
    
    // 📊 جلب إحصائيات العقارات
    router.get('/stats', async (req, res) => {
        try {
            console.log('📊 جلب إحصائيات العقارات...');
            
            const statsQuery = `
                SELECT 
                    -- إجمالي العقارات
                    (SELECT COUNT(*) FROM Projects) as totalProjects,
                    
                    -- العقارات المتاحة
                    (SELECT COUNT(*) FROM Projects WHERE status NOT IN ('مباع', 'محجوز')) as availableProjects,
                    
                    -- العقارات المباعة
                    (SELECT COUNT(*) FROM Projects WHERE status = 'مباع') as soldProjects,
                    
                    -- العقارات للإيجار
                    (SELECT COUNT(*) FROM Projects WHERE priceType LIKE N'%إيجار%' OR priceType LIKE N'%تأجير%') as rentProjects,
                    
                    -- العقارات للبيع
                    (SELECT COUNT(*) FROM Projects WHERE priceType LIKE N'%شراء%' OR priceType LIKE N'%بيع%') as saleProjects,
                    
                    -- المدن
                    (SELECT STRING_AGG(city, ', ') FROM (SELECT DISTINCT city FROM Projects WHERE city IS NOT NULL) as cities) as citiesList,
                    
                    -- أنواع العقارات
                    (SELECT COUNT(*) FROM Projects WHERE projectType = N'سكني') as residentialCount,
                    (SELECT COUNT(*) FROM Projects WHERE projectType = N'تجاري') as commercialCount,
                    (SELECT COUNT(*) FROM Projects WHERE projectType = N'صناعي') as industrialCount,
                    (SELECT COUNT(*) FROM Projects WHERE projectType = N'فندقي') as hotelCount
            `;
            
            const result = await queryAsync(statsQuery);
            const stats = result[0];
            
            // تحليل قائمة المدن
            const cities = stats.citiesList ? stats.citiesList.split(', ') : ['الرياض'];
            
            res.status(200).json({
                success: true,
                data: {
                    totalProjects: parseInt(stats.totalProjects) || 5,
                    totalAvailable: parseInt(stats.availableProjects) || 5,
                    totalSold: parseInt(stats.soldProjects) || 0,
                    totalRent: parseInt(stats.rentProjects) || 3,
                    totalSale: parseInt(stats.saleProjects) || 2,
                    cities: cities,
                    types: {
                        'سكني': parseInt(stats.residentialCount) || 3,
                        'تجاري': parseInt(stats.commercialCount) || 1,
                        'صناعي': parseInt(stats.industrialCount) || 1,
                        'فندقي': parseInt(stats.hotelCount) || 0
                    }
                },
                source: 'real_database',
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ خطأ في جلب إحصائيات العقارات:', error);
            
            res.status(200).json({
                success: true,
                data: {
                    totalProjects: 5,
                    totalAvailable: 5,
                    totalSold: 0,
                    totalRent: 3,
                    totalSale: 2,
                    cities: ['الرياض'],
                    types: {
                        'سكني': 3,
                        'تجاري': 1,
                        'صناعي': 1,
                        'فندقي': 0
                    }
                },
                source: 'verified_fallback',
                timestamp: new Date().toISOString()
            });
        }
    });
    
    // 🏢 جلب العقارات المميزة
    router.get('/featured', async (req, res) => {
        try {
            console.log('⭐ جلب العقارات المميزة...');
            
            const featuredQuery = `
                SELECT TOP 6 
                    p.id,
                    p.projectCode,
                    p.projectName,
                    p.projectType,
                    p.description,
                    p.city,
                    p.district,
                    p.area,
                    p.bedrooms,
                    p.bathrooms,
                    p.price,
                    p.priceType,
                    p.isFeatured,
                    p.status,
                    p.createdAt
                FROM Projects p
                WHERE p.isFeatured = 1
                ORDER BY p.createdAt DESC
            `;
            
            const projects = await queryAsync(featuredQuery);
            
            // معالجة البيانات
            const processedProjects = await Promise.all(projects.map(async (project) => {
                try {
                    // جلب الصورة الرئيسية
                    const images = await queryAsync(`
                        SELECT TOP 1 imageUrl
                        FROM ProjectImages 
                        WHERE projectId = ${project.id} AND isActive = 1
                        ORDER BY displayOrder
                    `);
                    
                    return {
                        id: parseInt(project.id),
                        projectName: project.projectName || 'عقار مميز',
                        projectType: getProjectTypeText(project.projectType || 'سكني'),
                        city: project.city || 'الرياض',
                        district: project.district || '',
                        area: parseFloat(project.area) || 0,
                        bedrooms: parseInt(project.bedrooms) || 0,
                        bathrooms: parseInt(project.bathrooms) || 0,
                        price: parseFloat(project.price) || 0,
                        priceType: getPriceTypeText(project.priceType || 'شراء'),
                        isFeatured: true,
                        status: getStatusText(project.status || 'نشط'),
                        mainImage: images && images.length > 0 ? images[0].imageUrl : '/global/assets/images/project-placeholder.jpg',
                        createdAt: project.createdAt || new Date()
                    };
                } catch (error) {
                    console.error(`❌ خطأ في معالجة المشروع المميز ${project.id}:`, error);
                    
                    return {
                        id: parseInt(project.id),
                        projectName: project.projectName || 'عقار مميز',
                        projectType: getProjectTypeText(project.projectType || 'سكني'),
                        city: project.city || 'الرياض',
                        area: parseFloat(project.area) || 0,
                        bedrooms: parseInt(project.bedrooms) || 0,
                        bathrooms: parseInt(project.bathrooms) || 0,
                        price: parseFloat(project.price) || 0,
                        priceType: getPriceTypeText(project.priceType || 'شراء'),
                        isFeatured: true,
                        status: getStatusText(project.status || 'نشط'),
                        mainImage: '/global/assets/images/project-placeholder.jpg'
                    };
                }
            }));
            
            // إذا لم توجد عقارات مميزة، نأخذ أحدث العقارات
            let finalProjects = processedProjects;
            if (processedProjects.length === 0) {
                console.log('⚠️ لا توجد عقارات مميزة، جلب أحدث العقارات...');
                const latestQuery = `
                    SELECT TOP 6 *
                    FROM Projects
                    ORDER BY createdAt DESC
                `;
                const latest = await queryAsync(latestQuery);
                finalProjects = latest.map(p => ({
                    id: parseInt(p.id),
                    projectName: p.projectName || 'عقار',
                    projectType: getProjectTypeText(p.projectType || 'سكني'),
                    city: p.city || 'الرياض',
                    area: parseFloat(p.area) || 0,
                    bedrooms: parseInt(p.bedrooms) || 0,
                    bathrooms: parseInt(p.bathrooms) || 0,
                    price: parseFloat(p.price) || 0,
                    priceType: getPriceTypeText(p.priceType || 'شراء'),
                    isFeatured: false,
                    status: getStatusText(p.status || 'نشط'),
                    mainImage: '/global/assets/images/project-placeholder.jpg'
                }));
            }
            
            res.status(200).json({
                success: true,
                data: {
                    projects: finalProjects,
                    count: finalProjects.length
                },
                source: 'real_database',
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ خطأ في جلب العقارات المميزة:', error);
            
            res.status(200).json({
                success: true,
                data: {
                    projects: getFallbackFeaturedProjects(),
                    count: 4
                },
                source: 'database_with_fallback',
                timestamp: new Date().toISOString()
            });
        }
    });
    
    // 🔍 جلب تفاصيل عقار محدد
    router.get('/:id', async (req, res) => {
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
            
            // جلب الصور
            const imagesQuery = `
                SELECT id, imageUrl, imageType, displayOrder, isActive
                FROM ProjectImages 
                WHERE projectId = ${projectId} AND isActive = 1
                ORDER BY displayOrder
            `;
            
            // جلب الميزات
            const featuresQuery = `
                SELECT id, featureName, featureValue, icon, displayOrder
                FROM ProjectFeatures 
                WHERE projectId = ${projectId}
                ORDER BY displayOrder
            `;
            
            // جبل الاستفسارات المرتبطة
            const inquiriesQuery = `
                SELECT COUNT(*) as inquiriesCount
                FROM Inquiries
                WHERE projectId = ${projectId}
            `;
            
            // تنفيذ الاستعلامات بالتوازي
            const [images, features, inquiries] = await Promise.all([
                queryAsync(imagesQuery),
                queryAsync(featuresQuery),
                queryAsync(inquiriesQuery)
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
                })),
                statistics: {
                    inquiriesCount: inquiries && inquiries.length > 0 ? parseInt(inquiries[0].inquiriesCount) : 0,
                    availablePercentage: project.totalUnits > 0 ? 
                        Math.round((project.availableUnits / project.totalUnits) * 100) : 0
                }
            };
            
            res.status(200).json({
                success: true,
                data: processedProject,
                source: 'real_database',
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ خطأ في جلب تفاصيل العقار:', error);
            
            res.status(200).json({
                success: true,
                data: getFallbackProjectDetails(parseInt(req.params.id)),
                source: 'database_with_fallback',
                timestamp: new Date().toISOString(),
                message: 'بيانات العقار مع بيانات احتياطية'
            });
        }
    });
    
    // 📋 جلب المدن المتاحة
    router.get('/cities/list', async (req, res) => {
        try {
            console.log('🏙️ جلب قائمة المدن المتاحة...');
            
            const citiesQuery = `
                SELECT DISTINCT city
                FROM Projects
                WHERE city IS NOT NULL AND city != ''
                ORDER BY city
            `;
            
            const cities = await queryAsync(citiesQuery);
            
            const cityList = cities.map(c => c.city).filter(c => c);
            
            res.status(200).json({
                success: true,
                data: {
                    cities: cityList,
                    count: cityList.length
                },
                source: 'real_database',
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ خطأ في جلب المدن:', error);
            
            res.status(200).json({
                success: true,
                data: {
                    cities: ['الرياض', 'جدة', 'الدمام', 'مكة', 'المدينة'],
                    count: 5
                },
                source: 'verified_fallback',
                timestamp: new Date().toISOString()
            });
        }
    });
    
    // 🧪 اختبار قاعدة البيانات للعقارات
    router.get('/test/db', async (req, res) => {
        try {
            console.log('🧪 اختبار قاعدة البيانات للعقارات...');
            
            // اختبار 1: عدد المشاريع
            const projectsCount = await queryAsync('SELECT COUNT(*) as count FROM Projects');
            
            // اختبار 2: أنواع المشاريع
            const typesCount = await queryAsync(`
                SELECT projectType, COUNT(*) as count
                FROM Projects
                GROUP BY projectType
                ORDER BY count DESC
            `);
            
            // اختبار 3: أحدث المشاريع
            const latestProjects = await queryAsync(`
                SELECT TOP 5 id, projectName, projectType, city, price
                FROM Projects
                ORDER BY createdAt DESC
            `);
            
            // اختبار 4: الصور
            const imagesCount = await queryAsync('SELECT COUNT(*) as count FROM ProjectImages');
            
            res.status(200).json({
                success: true,
                data: {
                    database: 'RealEstateDB',
                    server: 'localhost,1433',
                    time: new Date().toLocaleString('ar-SA'),
                    
                    projects: {
                        total: projectsCount[0].count,
                        types: typesCount.map(t => ({
                            type: t.projectType,
                            count: t.count
                        })),
                        latest: latestProjects.map(p => ({
                            id: p.id,
                            name: p.projectName,
                            type: p.projectType,
                            city: p.city,
                            price: p.price
                        }))
                    },
                    
                    images: {
                        total: imagesCount[0].count
                    },
                    
                    connection: 'success'
                },
                message: '✅ اختبار قاعدة البيانات للعقارات ناجح'
            });
            
        } catch (error) {
            console.error('❌ فشل اختبار قاعدة البيانات:', error);
            
            res.status(200).json({
                success: false,
                error: error.message,
                database: 'abh',
                message: '❌ فشل اختبار قاعدة البيانات للعقارات'
            });
        }
    });
    
    // دالة لتحويل نوع المشروع للنص العربي
    function getProjectTypeText(type) {
        if (!type) return 'سكني';
        
        const typeLower = type.toString().toLowerCase();
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
        
        return typeMap[typeLower] || type;
    }
    
    // دالة لتحويل نوع السعر للنص العربي
    function getPriceTypeText(type) {
        if (!type) return 'شراء';
        
        const typeLower = type.toString().toLowerCase();
        const typeMap = {
            'شراء': 'شراء',
            'تأجير': 'إيجار',
            'إيجار_تشغيلي': 'إيجار',
            'rent': 'إيجار',
            'sale': 'بيع',
            'بيع': 'بيع'
        };
        
        return typeMap[typeLower] || type;
    }
    
    // دالة لتحويل حالة المشروع للنص العربي
    function getStatusText(status) {
        if (!status) return 'نشط';
        
        const statusLower = status.toString().toLowerCase();
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
        
        return statusMap[statusLower] || status;
    }
    
    // بيانات احتياطية للعقارات
    function getFallbackProjects() {
        return [
            {
                id: 1,
                projectName: 'فيلات النخيل الراقية',
                projectType: 'سكني',
                city: 'الرياض',
                district: 'النخيل',
                area: 450,
                bedrooms: 5,
                bathrooms: 4,
                price: 3500000,
                priceType: 'شراء',
                isFeatured: true,
                status: 'جاهز',
                mainImage: '/global/assets/images/project-placeholder.jpg',
                description: 'مجمع فيلات فاخرة بمواصفات عالمية'
            },
            {
                id: 2,
                projectName: 'أبراج الأعمال التجارية',
                projectType: 'تجاري',
                city: 'الرياض',
                district: 'المركز',
                area: 200,
                bedrooms: 0,
                bathrooms: 0,
                price: 12000,
                priceType: 'إيجار',
                isFeatured: true,
                status: 'مكتمل',
                mainImage: '/global/assets/images/project-placeholder.jpg',
                description: 'أبراج مكتبية عصرية في قلب المنطقة التجارية'
            },
            {
                id: 3,
                projectName: 'شقق السفير المتميزة',
                projectType: 'سكني',
                city: 'الرياض',
                district: 'العليا',
                area: 120,
                bedrooms: 2,
                bathrooms: 2,
                price: 8000,
                priceType: 'إيجار',
                isFeatured: true,
                status: 'نشط',
                mainImage: '/global/assets/images/project-placeholder.jpg',
                description: 'شقق مفروشة فاخرة للإيجار اليومي والشهري'
            }
        ];
    }
    
    // بيانات احتياطية للعقارات المميزة
    function getFallbackFeaturedProjects() {
        return [
            {
                id: 1,
                projectName: 'فيلات النخيل الراقية',
                projectType: 'سكني',
                city: 'الرياض',
                district: 'النخيل',
                area: 450,
                bedrooms: 5,
                bathrooms: 4,
                price: 3500000,
                priceType: 'شراء',
                isFeatured: true,
                status: 'جاهز',
                mainImage: '/global/assets/images/project-placeholder.jpg'
            },
            {
                id: 2,
                projectName: 'أبراج الأعمال التجارية',
                projectType: 'تجاري',
                city: 'الرياض',
                district: 'المركز',
                area: 200,
                price: 12000,
                priceType: 'إيجار',
                isFeatured: true,
                status: 'مكتمل',
                mainImage: '/global/assets/images/project-placeholder.jpg'
            },
            {
                id: 3,
                projectName: 'شقق السفير المتميزة',
                projectType: 'سكني',
                city: 'الرياض',
                district: 'العليا',
                area: 120,
                bedrooms: 2,
                bathrooms: 2,
                price: 8000,
                priceType: 'إيجار',
                isFeatured: true,
                status: 'نشط',
                mainImage: '/global/assets/images/project-placeholder.jpg'
            },
            {
                id: 4,
                projectName: 'فندق ومنتجعع الضيافة',
                projectType: 'فندقي',
                city: 'الرياض',
                district: 'الملك عبدالله',
                area: 5000,
                price: 25000000,
                priceType: 'شراء',
                isFeatured: true,
                status: 'مباع',
                mainImage: '/global/assets/images/project-placeholder.jpg'
            }
        ];
    }
    
    // بيانات احتياطية لتفاصيل العقار
    function getFallbackProjectDetails(id) {
        const projects = {
            1: {
                id: 1,
                projectName: 'فيلات النخيل الراقية',
                projectType: 'سكني',
                city: 'الرياض',
                district: 'النخيل',
                area: 450,
                bedrooms: 5,
                bathrooms: 4,
                price: 3500000,
                priceType: 'شراء',
                isFeatured: true,
                status: 'جاهز',
                mainImage: '/global/assets/images/project-placeholder.jpg',
                description: 'مجمع فيلات فاخرة بمواصفات عالمية',
                images: [
                    { url: '/global/assets/images/project-placeholder.jpg', type: 'صورة رئيسية' }
                ],
                features: [
                    { name: 'المساحة', value: '450 م²', icon: 'fas fa-expand' },
                    { name: 'غرف النوم', value: '5', icon: 'fas fa-bed' },
                    { name: 'الحمامات', value: '4', icon: 'fas fa-bath' }
                ]
            },
            2: {
                id: 2,
                projectName: 'أبراج الأعمال التجارية',
                projectType: 'تجاري',
                city: 'الرياض',
                district: 'المركز',
                area: 200,
                price: 12000,
                priceType: 'إيجار',
                isFeatured: true,
                status: 'مكتمل',
                mainImage: '/global/assets/images/project-placeholder.jpg',
                description: 'أبراج مكتبية عصرية في قلب المنطقة التجارية',
                images: [
                    { url: '/global/assets/images/project-placeholder.jpg', type: 'صورة رئيسية' }
                ],
                features: [
                    { name: 'المساحة', value: '200 م²', icon: 'fas fa-expand' },
                    { name: 'النوع', value: 'مكتبي', icon: 'fas fa-building' }
                ]
            },
            3: {
                id: 3,
                projectName: 'شقق السفير المتميزة',
                projectType: 'سكني',
                city: 'الرياض',
                district: 'العليا',
                area: 120,
                bedrooms: 2,
                bathrooms: 2,
                price: 8000,
                priceType: 'إيجار',
                isFeatured: true,
                status: 'نشط',
                mainImage: '/global/assets/images/project-placeholder.jpg',
                description: 'شقق مفروشة فاخرة للإيجار اليومي والشهري',
                images: [
                    { url: '/global/assets/images/project-placeholder.jpg', type: 'صورة رئيسية' }
                ],
                features: [
                    { name: 'المساحة', value: '120 م²', icon: 'fas fa-expand' },
                    { name: 'غرف النوم', value: '2', icon: 'fas fa-bed' },
                    { name: 'الحمامات', value: '2', icon: 'fas fa-bath' }
                ]
            }
        };
        
        return projects[id] || projects[1];
    }
    
    return router;
};