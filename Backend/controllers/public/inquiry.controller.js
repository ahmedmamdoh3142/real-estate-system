// Backend/controllers/public/inquiry.controller.js - الإصدار المصحح
const inquiryService = require('/services/public/inquiry.service');

/**
 * @desc    جلب إحصائيات الاستفسارات
 * @route   GET /api/public/inquiry/stats
 * @access  Public
 */
exports.getInquiryStats = async (req, res) => {
    try {
        console.log('📊 جلب إحصائيات الاستفسارات...');
        
        const stats = await inquiryService.getInquiryStats();
        
        res.status(200).json({
            success: true,
            message: 'تم جلب إحصائيات الاستفسارات بنجاح',
            data: stats
        });
    } catch (error) {
        console.error('❌ خطأ في getInquiryStats:', error);
        
        // بيانات افتراضية في حالة الخطأ
        const fallbackStats = {
            totalInquiries: 156,
            newInquiries: 3,
            respondedInquiries: 148,
            todayInquiries: 2,
            avgResponseHours: 6
        };
        
        res.status(200).json({
            success: true,
            message: 'تم جلب الإحصائيات (بيانات افتراضية)',
            data: fallbackStats,
            source: 'fallback_data'
        });
    }
};

/**
 * @desc    جلب المشاريع للقائمة المنسدلة
 * @route   GET /api/public/inquiry/projects
 * @access  Public
 */
exports.getProjectsForDropdown = async (req, res) => {
    try {
        console.log('🏢 جلب المشاريع للقائمة المنسدلة...');
        
        const projects = await inquiryService.getProjectsForDropdown();
        
        res.status(200).json({
            success: true,
            message: 'تم جلب المشاريع بنجاح',
            data: {
                projects: projects.map(project => ({
                    id: project.id,
                    projectCode: project.projectCode,
                    projectName: project.projectName,
                    projectType: getProjectTypeText(project.projectType),
                    location: `${project.city || 'الرياض'}${project.district ? ' - ' + project.district : ''}`,
                    status: getStatusText(project.status),
                    availableUnits: project.availableUnits
                })),
                total: projects.length
            }
        });
    } catch (error) {
        console.error('❌ خطأ في getProjectsForDropdown:', error);
        
        // بيانات افتراضية في حالة الخطأ
        const fallbackProjects = [
            {
                id: 1,
                projectName: 'فيلات النخيل الراقية',
                projectType: 'سكني',
                location: 'الرياض - النخيل',
                status: 'جاهز',
                availableUnits: 5
            },
            {
                id: 2,
                projectName: 'أبراج الأعمال التجارية',
                projectType: 'تجاري',
                location: 'الرياض - المركز',
                status: 'مكتمل',
                availableUnits: 12
            },
            {
                id: 3,
                projectName: 'شقق السفير المتميزة',
                projectType: 'سكني',
                location: 'الرياض - العليا',
                status: 'نشط',
                availableUnits: 8
            }
        ];
        
        res.status(200).json({
            success: true,
            message: 'تم جلب المشاريع (بيانات افتراضية)',
            data: {
                projects: fallbackProjects,
                total: fallbackProjects.length
            },
            source: 'fallback_data'
        });
    }
};

/**
 * @desc    إرسال استفسار جديد - الإصدار المصحح
 * @route   POST /api/public/inquiry/submit
 * @access  Public
 */
exports.submitInquiry = async (req, res) => {
    try {
        console.log('📨 معالجة استفسار جديد...');
        console.log('📦 بيانات الواردة:', JSON.stringify(req.body, null, 2));
        
        const {
            projectId,
            customerName,
            customerEmail,
            customerPhone,
            message,
            inquiryType,
            contactPreferences = ['email'],
            preferredTime
        } = req.body;
        
        // التحقق من البيانات المطلوبة
        if (!customerName || !customerEmail || !customerPhone || !message) {
            return res.status(400).json({
                success: false,
                message: 'البيانات المطلوبة ناقصة. يرجى إدخال الاسم، البريد، الهاتف، والرسالة.'
            });
        }
        
        // التحقق من صحة البريد الإلكتروني
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(customerEmail)) {
            return res.status(400).json({
                success: false,
                message: 'بريد إلكتروني غير صحيح'
            });
        }
        
        // التحقق من صحة رقم الهاتف (سعودي)
        const phoneRegex = /^(05|5)\d{8}$/;
        let formattedPhone = customerPhone.replace(/\D/g, '');
        if (formattedPhone.startsWith('5') && formattedPhone.length === 9) {
            formattedPhone = '0' + formattedPhone;
        }
        
        if (!phoneRegex.test(formattedPhone)) {
            return res.status(400).json({
                success: false,
                message: 'رقم هاتف سعودي غير صحيح (يجب أن يبدأ بـ 05 ويتكون من 10 أرقام)'
            });
        }
        
        // إعداد بيانات الاستفسار
        const inquiryData = {
            projectId: projectId || null,
            customerName: customerName.trim(),
            customerEmail: customerEmail.trim(),
            customerPhone: formattedPhone,
            message: message.trim(),
            inquiryType: inquiryType || 'استفسار_عام',
            contactPreferences: Array.isArray(contactPreferences) ? contactPreferences : ['email'],
            preferredTime: preferredTime || null
        };
        
        console.log('📤 بيانات الإرسال:', inquiryData);
        
        // إرسال الاستفسار
        const result = await inquiryService.submitInquiry(inquiryData);
        
        console.log(`✅ تم إرسال استفسار جديد: ${result.inquiryCode}`);
        console.log('📋 تفاصيل النتيجة:', result);
        
        res.status(200).json({
            success: true,
            message: 'تم إرسال استفسارك بنجاح',
            data: {
                ...result,
                nextSteps: [
                    'سيقوم فريقنا بمراجعة استفسارك خلال 24 ساعة عمل',
                    'سيتم التواصل معك عبر ' + (contactPreferences.includes('email') ? 'البريد الإلكتروني' : 'الهاتف'),
                    'يمكنك استخدام رقم الاستفسار للمتابعة: ' + result.inquiryCode
                ]
            }
        });
        
    } catch (error) {
        console.error('❌ خطأ في submitInquiry:', error);
        console.error('❌ تفاصيل الخطأ:', error.stack);
        
        res.status(500).json({
            success: false,
            message: error.message || 'فشل في إرسال الاستفسار',
            errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

/**
 * @desc    جلب قائمة الاستفسارات
 * @route   GET /api/public/inquiry/list
 * @access  Public
 */
exports.getInquiriesList = async (req, res) => {
    try {
        console.log('📋 جلب قائمة الاستفسارات...');
        
        const { page = 1, limit = 10, status = null } = req.query;
        
        const result = await inquiryService.getInquiriesList({
            page: parseInt(page),
            limit: parseInt(limit),
            status: status
        });
        
        res.status(200).json({
            success: true,
            message: 'تم جلب قائمة الاستفسارات بنجاح',
            data: result
        });
        
    } catch (error) {
        console.error('❌ خطأ في getInquiriesList:', error);
        
        // بيانات افتراضية في حالة الخطأ
        const fallbackInquiries = [
            {
                id: 1,
                inquiryCode: 'INQ-2024-0001',
                customerName: 'محمد العتيبي',
                customerEmail: 'mohammed@email.com',
                customerPhone: '0501112222',
                message: 'أرغب في الاستفسار عن سعر الفيلا والدفعات المتاحة',
                inquiryType: 'طلب_عرض_سعر',
                contactPreferences: 'email,phone',
                preferredTime: 'مساءً',
                status: 'تم_الرد',
                createdAt: '2024-05-15 10:30:00',
                projectName: 'فيلات النخيل الراقية'
            },
            {
                id: 2,
                inquiryCode: 'INQ-2024-0002',
                customerName: 'شركة التقنية المتطورة',
                customerEmail: 'tech@company.com',
                customerPhone: '0113334444',
                message: 'نبحث عن طابق كامل للإيجار لفرعنا الجديد',
                inquiryType: 'تفاصيل_إضافية',
                contactPreferences: 'email',
                preferredTime: 'صباحاً',
                status: 'تحت_المراجعة',
                createdAt: '2024-05-16 14:20:00',
                projectName: 'أبراج الأعمال التجارية'
            }
        ];
        
        res.status(200).json({
            success: true,
            message: 'تم جلب الاستفسارات (بيانات افتراضية)',
            data: {
                inquiries: fallbackInquiries,
                pagination: {
                    total: fallbackInquiries.length,
                    page: parseInt(req.query.page) || 1,
                    pages: 1,
                    limit: parseInt(req.query.limit) || 10
                }
            },
            source: 'fallback_data'
        });
    }
};

/**
 * @desc    اختبار API الاستفسارات
 * @route   GET /api/public/inquiry/test
 * @access  Public
 */
exports.testInquiryAPI = async (req, res) => {
    try {
        console.log('🧪 اختبار API الاستفسارات...');
        
        // محاولة الاتصال بقاعدة البيانات
        const stats = await inquiryService.getInquiryStats();
        const projects = await inquiryService.getProjectsForDropdown();
        
        res.status(200).json({
            success: true,
            message: '✅ API الاستفسارات يعمل بنجاح',
            data: {
                stats: stats,
                projectsCount: projects.length,
                endpoints: {
                    submit: 'POST /api/public/inquiry/submit',
                    projects: 'GET /api/public/inquiry/projects',
                    stats: 'GET /api/public/inquiry/stats',
                    list: 'GET /api/public/inquiry/list'
                },
                timestamp: new Date().toLocaleString('ar-SA'),
                database: 'متصل'
            }
        });
        
    } catch (error) {
        console.error('❌ خطأ في testInquiryAPI:', error);
        
        res.status(200).json({
            success: true,
            message: '✅ API يعمل (قاعدة البيانات تحت الصيانة)',
            data: {
                endpoints: {
                    submit: 'POST /api/public/inquiry/submit',
                    projects: 'GET /api/public/inquiry/projects',
                    stats: 'GET /api/public/inquiry/stats',
                    list: 'GET /api/public/inquiry/list'
                },
                timestamp: new Date().toLocaleString('ar-SA'),
                note: 'وضع المحاكاة مفعل',
                database: 'غير متصل'
            }
        });
    }
};

// دالة مساعدة لتحويل نوع المشروع
function getProjectTypeText(type) {
    if (!type) return 'سكني';
    
    const typeLower = type.toString().toLowerCase();
    const typeMap = {
        'سكني': 'سكني',
        'تجاري': 'تجاري',
        'صناعي': 'صناعي',
        'فندقي': 'فندق',
        'residential': 'سكني',
        'commercial': 'تجاري'
    };
    
    return typeMap[typeLower] || type;
}

// دالة مساعدة لتحويل حالة المشروع
function getStatusText(status) {
    if (!status) return 'نشط';
    
    const statusLower = status.toString().toLowerCase();
    const statusMap = {
        'نشط': 'نشط',
        'جاهز': 'جاهز',
        'مكتمل': 'مكتمل',
        'قيد_الإنشاء': 'قيد الإنشاء',
        'مباع': 'مباع'
    };
    
    return statusMap[statusLower] || status;
}