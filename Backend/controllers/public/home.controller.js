const homeService = require('../../services/public/home.service');

/**
 * @desc    جلب إحصائيات الصفحة الرئيسية
 * @route   GET /api/public/home/stats
 * @access  Public
 */
exports.getHomeStats = async (req, res) => {
    try {
        console.log('📊 جلب إحصائيات الصفحة الرئيسية...');
        
        // استخدام بيانات ثابتة مؤقتاً
        const stats = {
            totalProjects: 42,
            totalUnits: 1250,
            totalClients: 850,
            totalCities: 8,
            featuredCount: 6
        };
        
        res.status(200).json({
            success: true,
            message: 'تم جلب الإحصائيات بنجاح',
            data: stats
        });
    } catch (error) {
        console.error('❌ خطأ في getHomeStats:', error);
        
        res.status(500).json({
            success: false,
            message: 'فشل في جلب الإحصائيات'
        });
    }
};

/**
 * @desc    جلب المشاريع المميزة
 * @route   GET /api/public/home/featured-projects
 * @access  Public
 */
exports.getFeaturedProjects = async (req, res) => {
    try {
        console.log('🏢 جلب المشاريع المميزة...');
        
        const { page = 1, limit = 6 } = req.query;
        
        // بيانات مشاريع ثابتة مؤقتاً
        const projects = [
            {
                id: 1,
                projectName: 'برج النخيل السكني',
                projectType: 'سكني',
                city: 'الرياض',
                district: 'النخيل',
                area: 250,
                areaUnit: 'م²',
                bedrooms: 4,
                bathrooms: 3,
                price: 2500000,
                priceType: 'sale',
                status: 'active',
                isFeatured: true,
                mainImage: '/global/assets/images/project-placeholder.jpg'
            },
            {
                id: 2,
                projectName: 'مشروع الواحة التجاري',
                projectType: 'تجاري',
                city: 'جدة',
                district: 'الروضة',
                area: 180,
                areaUnit: 'م²',
                price: 15000,
                priceType: 'rent',
                status: 'pre_sale',
                isFeatured: true,
                mainImage: '/global/assets/images/project-placeholder.jpg'
            },
            {
                id: 3,
                projectName: 'فيلات القمر السكنية',
                projectType: 'سكني',
                city: 'الدمام',
                district: 'الفيحاء',
                area: 320,
                areaUnit: 'م²',
                bedrooms: 5,
                bathrooms: 4,
                price: 3500000,
                priceType: 'sale',
                status: 'active',
                isFeatured: true,
                mainImage: '/global/assets/images/project-placeholder.jpg'
            }
        ];
        
        const total = projects.length;
        
        res.status(200).json({
            success: true,
            message: 'تم جلب المشاريع المميزة بنجاح',
            data: {
                projects,
                pagination: {
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / limit),
                    limit: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('❌ خطأ في getFeaturedProjects:', error);
        
        res.status(500).json({
            success: false,
            message: 'فشل في جلب المشاريع المميزة'
        });
    }
};

/**
 * @desc    الاشتراك في النشرة البريدية
 * @route   POST /api/public/home/newsletter
 * @access  Public
 */
exports.subscribeNewsletter = async (req, res) => {
    try {
        console.log('📧 معالجة اشتراك النشرة البريدية...');
        
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'البريد الإلكتروني مطلوب'
            });
        }
        
        // التحقق البسيط من البريد
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'يرجى إدخال بريد إلكتروني صحيح'
            });
        }
        
        console.log(`✅ تم تسجيل البريد ${email} في النشرة البريدية`);
        
        res.status(200).json({
            success: true,
            message: 'تم الاشتراك في النشرة البريدية بنجاح',
            data: {
                email,
                subscribedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('❌ خطأ في subscribeNewsletter:', error);
        
        res.status(500).json({
            success: false,
            message: 'فشل في الاشتراك في النشرة البريدية'
        });
    }
};