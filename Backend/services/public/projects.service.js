// Backend/services/public/projects.service.js - خدمة العقارات (معدلة لاستخدام mssql)
const sql = require('mssql');

// الحصول على pool من app.locals (تم تعيينه في server.js)
function getPool() {
    const app = require('/app');
    if (!app.locals.dbPool) {
        throw new Error('قاعدة البيانات غير متصلة');
    }
    return app.locals.dbPool;
}

// دالة مساعدة للاستعلامات
async function queryAsync(sqlQuery) {
    const pool = getPool();
    try {
        const result = await pool.request().query(sqlQuery);
        return result.recordset;
    } catch (err) {
        console.error('❌ خطأ في الاستعلام:', err.message);
        throw err;
    }
}

/**
 * جلب جميع العقارات مع الفلترة
 */
exports.getAllProjects = async (filters) => {
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
        } = filters;
        
        // بناء استعلام WHERE ديناميكي
        let whereConditions = [];
        
        if (type !== 'all' && type) {
            whereConditions.push(`p.projectType = N'${type.replace(/'/g, "''")}'`);
        }
        
        if (city !== 'all' && city) {
            whereConditions.push(`p.city = N'${city.replace(/'/g, "''")}'`);
        }
        
        if (minPrice) {
            whereConditions.push(`p.price >= ${parseFloat(minPrice)}`);
        }
        if (maxPrice) {
            whereConditions.push(`p.price <= ${parseFloat(maxPrice)}`);
        }
        
        if (transaction !== 'all' && transaction) {
            if (transaction === 'إيجار') {
                whereConditions.push(`(p.priceType LIKE N'%إيجار%' OR p.priceType LIKE N'%تأجير%')`);
            } else if (transaction === 'شراء') {
                whereConditions.push(`(p.priceType LIKE N'%شراء%' OR p.priceType LIKE N'%بيع%')`);
            }
        }
        
        if (search) {
            const searchSafe = search.replace(/'/g, "''");
            whereConditions.push(`(
                p.projectName LIKE N'%${searchSafe}%' OR 
                p.city LIKE N'%${searchSafe}%' OR 
                p.district LIKE N'%${searchSafe}%' OR 
                p.description LIKE N'%${searchSafe}%'
            )`);
        }
        
        const whereClause = whereConditions.length > 0 
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
        }
        
        // استعلام العد
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
                p.createdAt
            FROM Projects p
            ${whereClause}
            ${orderBy}
            OFFSET ${offset} ROWS
            FETCH NEXT ${parseInt(limit)} ROWS ONLY
        `;
        
        const [countResult, projects] = await Promise.all([
            queryAsync(countQuery),
            queryAsync(dataQuery)
        ]);
        
        const totalCount = countResult[0] ? countResult[0].totalCount : 0;
        
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
                    projectName: project.projectName || 'عقار',
                    projectType: project.projectType || 'سكني',
                    city: project.city || 'الرياض',
                    district: project.district || '',
                    area: parseFloat(project.area) || 0,
                    bedrooms: parseInt(project.bedrooms) || 0,
                    bathrooms: parseInt(project.bathrooms) || 0,
                    price: parseFloat(project.price) || 0,
                    priceType: project.priceType || 'شراء',
                    isFeatured: project.isFeatured === true || project.isFeatured === 1,
                    status: project.status || 'نشط',
                    mainImage: images && images.length > 0 ? images[0].imageUrl : '/global/assets/images/project-placeholder.jpg',
                    createdAt: project.createdAt
                };
            } catch (error) {
                console.error(`❌ خطأ في معالجة المشروع ${project.id}:`, error);
                
                return {
                    id: parseInt(project.id),
                    projectName: project.projectName || 'عقار',
                    projectType: project.projectType || 'سكني',
                    city: project.city || 'الرياض',
                    area: parseFloat(project.area) || 0,
                    price: parseFloat(project.price) || 0,
                    priceType: project.priceType || 'شراء',
                    isFeatured: false,
                    status: project.status || 'نشط',
                    mainImage: '/global/assets/images/project-placeholder.jpg'
                };
            }
        }));
        
        return {
            projects: processedProjects,
            pagination: {
                total: parseInt(totalCount),
                page: parseInt(page),
                pages: Math.ceil(totalCount / parseInt(limit)),
                limit: parseInt(limit),
                hasMore: (parseInt(page) * parseInt(limit)) < totalCount
            }
        };
        
    } catch (error) {
        console.error('❌ خطأ في getAllProjects service:', error);
        throw error;
    }
};

/**
 * جلب إحصائيات العقارات
 */
exports.getProjectsStats = async () => {
    try {
        const statsQuery = `
            SELECT 
                (SELECT COUNT(*) FROM Projects) as totalProjects,
                (SELECT COUNT(*) FROM Projects WHERE status NOT IN ('مباع', 'محجوز')) as availableProjects,
                (SELECT COUNT(*) FROM Projects WHERE status = 'مباع') as soldProjects,
                (SELECT COUNT(*) FROM Projects WHERE priceType LIKE N'%إيجار%' OR priceType LIKE N'%تأجير%') as rentProjects,
                (SELECT COUNT(*) FROM Projects WHERE priceType LIKE N'%شراء%' OR priceType LIKE N'%بيع%') as saleProjects,
                (SELECT COUNT(DISTINCT city) FROM Projects WHERE city IS NOT NULL) as citiesCount
        `;
        
        const result = await queryAsync(statsQuery);
        const stats = result[0];
        
        // جلب توزيع الأنواع
        const typesQuery = `
            SELECT projectType, COUNT(*) as count
            FROM Projects
            GROUP BY projectType
        `;
        
        const typesResult = await queryAsync(typesQuery);
        const types = {};
        typesResult.forEach(t => {
            types[t.projectType || 'سكني'] = t.count;
        });
        
        return {
            totalProjects: parseInt(stats.totalProjects) || 0,
            totalAvailable: parseInt(stats.availableProjects) || 0,
            totalSold: parseInt(stats.soldProjects) || 0,
            totalRent: parseInt(stats.rentProjects) || 0,
            totalSale: parseInt(stats.saleProjects) || 0,
            citiesCount: parseInt(stats.citiesCount) || 0,
            types: types
        };
        
    } catch (error) {
        console.error('❌ خطأ في getProjectsStats service:', error);
        throw error;
    }
};

/**
 * جلب العقارات المميزة
 */
exports.getFeaturedProjects = async () => {
    try {
        const query = `
            SELECT TOP 6 
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
            WHERE p.isFeatured = 1
            ORDER BY p.createdAt DESC
        `;
        
        const projects = await queryAsync(query);
        
        // معالجة البيانات
        const processedProjects = await Promise.all(projects.map(async (project) => {
            try {
                const images = await queryAsync(`
                    SELECT TOP 1 imageUrl
                    FROM ProjectImages 
                    WHERE projectId = ${project.id} AND isActive = 1
                    ORDER BY displayOrder
                `);
                
                return {
                    id: parseInt(project.id),
                    projectName: project.projectName || 'عقار مميز',
                    projectType: project.projectType || 'سكني',
                    city: project.city || 'الرياض',
                    area: parseFloat(project.area) || 0,
                    bedrooms: parseInt(project.bedrooms) || 0,
                    bathrooms: parseInt(project.bathrooms) || 0,
                    price: parseFloat(project.price) || 0,
                    priceType: project.priceType || 'شراء',
                    isFeatured: true,
                    status: project.status || 'نشط',
                    mainImage: images && images.length > 0 ? images[0].imageUrl : '/global/assets/images/project-placeholder.jpg'
                };
            } catch (error) {
                console.error(`❌ خطأ في معالجة المشروع المميز ${project.id}:`, error);
                
                return {
                    id: parseInt(project.id),
                    projectName: project.projectName || 'عقار مميز',
                    projectType: project.projectType || 'سكني',
                    city: project.city || 'الرياض',
                    area: parseFloat(project.area) || 0,
                    price: parseFloat(project.price) || 0,
                    priceType: project.priceType || 'شراء',
                    isFeatured: true,
                    status: project.status || 'نشط',
                    mainImage: '/global/assets/images/project-placeholder.jpg'
                };
            }
        }));
        
        return {
            projects: processedProjects,
            count: processedProjects.length
        };
        
    } catch (error) {
        console.error('❌ خطأ في getFeaturedProjects service:', error);
        throw error;
    }
};

/**
 * جلب تفاصيل عقار محدد
 */
exports.getProjectById = async (projectId) => {
    try {
        const query = `
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
                u.fullName as createdByName
            FROM Projects p
            LEFT JOIN Users u ON p.createdBy = u.id
            WHERE p.id = ${projectId}
        `;
        
        const projectResult = await queryAsync(query);
        
        if (!projectResult || projectResult.length === 0) {
            return null;
        }
        
        const project = projectResult[0];
        
        // جلب الصور والميزات
        const [images, features] = await Promise.all([
            queryAsync(`
                SELECT imageUrl, imageType, displayOrder
                FROM ProjectImages 
                WHERE projectId = ${projectId} AND isActive = 1
                ORDER BY displayOrder
            `),
            queryAsync(`
                SELECT featureName, featureValue, icon, displayOrder
                FROM ProjectFeatures 
                WHERE projectId = ${projectId}
                ORDER BY displayOrder
            `)
        ]);
        
        return {
            id: parseInt(project.id),
            projectName: project.projectName || 'عقار',
            projectType: project.projectType || 'سكني',
            description: project.description || 'وصف غير متوفر',
            location: project.location || 'غير محدد',
            city: project.city || 'الرياض',
            district: project.district || '',
            fullAddress: `${project.city}${project.district ? '، ' + project.district : ''}${project.location ? '، ' + project.location : ''}`,
            totalUnits: parseInt(project.totalUnits) || 0,
            availableUnits: parseInt(project.availableUnits) || 0,
            price: parseFloat(project.price) || 0,
            priceType: project.priceType || 'شراء',
            area: parseFloat(project.area) || 0,
            areaUnit: project.areaUnit || 'م²',
            bedrooms: parseInt(project.bedrooms) || 0,
            bathrooms: parseInt(project.bathrooms) || 0,
            isFeatured: project.isFeatured === true || project.isFeatured === 1,
            status: project.status || 'نشط',
            completionDate: project.completionDate,
            createdAt: project.createdAt,
            createdBy: project.createdByName || 'النظام',
            images: (images || []).map(img => ({
                url: img.imageUrl,
                type: img.imageType || 'صورة',
                order: img.displayOrder || 0
            })),
            features: (features || []).map(feat => ({
                name: feat.featureName,
                value: feat.featureValue,
                icon: feat.icon || 'fas fa-check',
                order: feat.displayOrder || 0
            }))
        };
        
    } catch (error) {
        console.error('❌ خطأ في getProjectById service:', error);
        throw error;
    }
};

/**
 * جلب قائمة المدن المتاحة
 */
exports.getCitiesList = async () => {
    try {
        const query = `
            SELECT DISTINCT city
            FROM Projects
            WHERE city IS NOT NULL AND city != ''
            ORDER BY city
        `;
        
        const cities = await queryAsync(query);
        
        return {
            cities: cities.map(c => c.city).filter(c => c),
            count: cities.length
        };
        
    } catch (error) {
        console.error('❌ خطأ في getCitiesList service:', error);
        throw error;
    }
};

/**
 * اختبار قاعدة البيانات
 */
exports.testDatabase = async () => {
    try {
        const [projectsCount, imagesCount, latestProjects] = await Promise.all([
            queryAsync('SELECT COUNT(*) as count FROM Projects'),
            queryAsync('SELECT COUNT(*) as count FROM ProjectImages'),
            queryAsync(`
                SELECT TOP 5 id, projectName, projectType, city, price
                FROM Projects
                ORDER BY createdAt DESC
            `)
        ]);
        
        return {
            projects: {
                total: projectsCount[0].count,
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
        };
        
    } catch (error) {
        console.error('❌ خطأ في testDatabase service:', error);
        throw error;
    }
};