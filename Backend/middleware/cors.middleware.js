// Backend/middleware/cors.middleware.js
// إعدادات CORS متوافقة تماماً مع Safari وجميع المتصفحات

const corsMiddleware = (req, res, next) => {
    const origin = req.headers.origin;

    // الأصول المسموحة (يمكن إضافة نطاق الإنتاج هنا)
    const allowedOrigins = [
        'http://localhost',
        'http://127.0.0.1',
        'http://localhost:3001',
        'http://127.0.0.1:3001',
        'https://abh-properties.com',        // أضف نطاقك
        'https://www.abh-properties.com'     // مع www إذا استُخدم
    ];

    // إذا كان الطلب من أصل معروف نعيده، وإلا نعطيه الأصل نفسه إن وُجد
    if (origin) {
        if (allowedOrigins.includes(origin)) {
            res.header('Access-Control-Allow-Origin', origin);
        } else {
            // في بيئة التطوير قد يأتي origin غير معروف، نسمح به ولكن دون إرسال cookies
            res.header('Access-Control-Allow-Origin', origin);
        }
    } else {
        // الطلبات التي لا تحمل Origin (مثل الطلبات من نفس النطاق) لا تحتاج CORS
        // لكننا نضيف سياسة أمان افتراضية: عدم السماح لأي أصل آخر
        res.header('Access-Control-Allow-Origin', '*'); // هذا لن يضر لأن الطلب من نفس الموقع
    }

    // السماح بـ credentials فقط إذا كان الطلب من أصل موثوق وتطبيقك يحتاج ذلك
    if (origin && allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Credentials', 'true');
    }
    // ملاحظة: لا ترسل Access-Control-Allow-Credentials مع Origin=*، وهذا السبب الذي كان يعطل Safari

    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, x-access-token, X-API-Key');

    // مدة تخزين preflight
    res.header('Access-Control-Max-Age', '86400');

    // التعامل مع طلب OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
        console.log('🔄 معالجة Preflight:', req.originalUrl);
        return res.status(204).end();
    }

    console.log(`📡 ${req.method} ${req.originalUrl} [Origin: ${origin || 'same-origin'}]`);
    next();
};

module.exports = corsMiddleware;