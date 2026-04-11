// Backend/server.js - الإصدار المعاد تصحيحه للعمل مع APIs
const app = require('./app');
const sql = require('msnodesqlv8');

const PORT = 3001;

console.log('\n' + '🚀'.repeat(10));
console.log('بدء تشغيل نظام إدارة العقارات');
console.log('='.repeat(50));
console.log('📅 التاريخ:', new Date().toLocaleString('ar-SA'));
console.log('💻 المنفذ:', PORT);

// سلسلة الاتصال الثابتة
const connectionString = "Server=DESKTOP-54ST25S\\ATTENDANCE;Database=abh;Trusted_Connection=Yes;Driver={SQL Server Native Client 11.0}";

console.log('📁 قاعدة البيانات: abh');
console.log('🔌 سلسلة الاتصال:', connectionString);

// اختبار الاتصال بقاعدة البيانات
console.log('\n🔗 اختبار الاتصال بقاعدة البيانات...');

sql.query(connectionString, "SELECT 1 as test", (err, rows) => {
    if (err) {
        console.error('❌ فشل الاتصال بقاعدة البيانات:', err.message);
        console.log('\n⚠️ سيتم تشغيل الخادم بدون قاعدة البيانات');
        console.log('   ⚠️ سيتم استخدام بيانات افتراضية فقط');
        app.locals.dbConnected = false;
        startServer();
    } else {
        console.log('✅ قاعدة البيانات متصلة بنجاح!');
        app.locals.dbConnected = true;
        
        // جلب إحصائيات سريعة
        sql.query(connectionString, 
            "SELECT (SELECT COUNT(*) FROM Projects) as projects, (SELECT COUNT(*) FROM Users) as users",
            (err2, stats) => {
                if (!err2 && stats && stats.length > 0) {
                    console.log(`📊 الإحصائيات: ${stats[0].projects} مشروع, ${stats[0].users} مستخدم`);
                }
                startServer();
            }
        );
    }
});

function startServer() {
    const server = app.listen(PORT, () => {
        console.log('\n' + '🎉'.repeat(10));
        console.log('✅ نظام إدارة العقارات يعمل الآن!');
        console.log('='.repeat(50));
        console.log('📍 الرابط: http://localhost:' + PORT);
        console.log('📡 APIs متاحة:');
        console.log('   GET  /api/health                    - حالة النظام');
        console.log('   GET  /api/public/home/stats        - إحصائيات الصفحة الرئيسية');
        console.log('   GET  /api/public/home/featured-projects - المشاريع المميزة');
        console.log('\n⚡ جاهز لاستقبال الطلبات من الواجهة الأمامية!');
        
        if (!app.locals.dbConnected) {
            console.log('\n⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️');
            console.log('⚠️  قاعدة البيانات غير متصلة!');
            console.log('⚠️  سيتم استخدام بيانات افتراضية فقط');
            console.log('⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️');
        }
    });

    // إغلاق نظيف
    process.on('SIGINT', () => {
        console.log('\n👋 إيقاف الخادم...');
        server.close(() => {
            console.log('✅ تم إغلاق الخادم');
            process.exit(0);
        });
    });
}