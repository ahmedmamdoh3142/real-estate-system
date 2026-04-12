// Backend/test-simple.js
require('dotenv').config();
const sql = require('mssql');

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT) || 1433,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

console.log('🔍 اختبار اتصال قاعدة البيانات...');
console.log('📁 السيرفر:', dbConfig.server);
console.log('📁 قاعدة البيانات:', dbConfig.database);

async function runTest() {
    try {
        const pool = await sql.connect(dbConfig);
        console.log('✅ تم الاتصال بنجاح!');

        const result = await pool.request().query('SELECT DB_NAME() as dbName, @@SERVERNAME as serverName');
        console.log('📊 معلومات قاعدة البيانات:');
        console.log('   - اسم قاعدة البيانات:', result.recordset[0].dbName);
        console.log('   - اسم السيرفر:', result.recordset[0].serverName);

        // اختبار قراءة جدول
        try {
            const projects = await pool.request().query('SELECT TOP 3 id, projectName FROM Projects');
            console.log(`📋 عدد المشاريع المتاحة: ${projects.recordset.length}`);
            projects.recordset.forEach((p, i) => {
                console.log(`   ${i+1}. ${p.projectName} (ID: ${p.id})`);
            });
        } catch (err) {
            console.log('⚠️ تعذر قراءة جدول Projects:', err.message);
        }

        await pool.close();
    } catch (err) {
        console.error('❌ فشل الاتصال:', err.message);
        console.log('\n🛠️ استكشاف الأخطاء وإصلاحها:');
        console.log('1. تأكد من تشغيل SQL Server');
        console.log('2. تحقق من بيانات الاتصال في ملف .env');
        console.log('3. تأكد من أن SQL Server يسمح بالاتصالات عن بعد');
    }
}

runTest();