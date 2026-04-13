const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT, 10) || 1433,
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    },
    connectionTimeout: 30000,
    requestTimeout: 30000
};

async function connectToDatabase() {
    try {
        const pool = await sql.connect(dbConfig);
        console.log('✅ تم الاتصال بقاعدة البيانات:', dbConfig.database);
        return pool;
    } catch (error) {
        console.error('❌ فشل الاتصال بقاعدة البيانات:', error.message);
        throw error;
    }
}

async function executeQuery(query, params = []) {
    try {
        const pool = await connectToDatabase();
        const request = pool.request();

        params.forEach((param, index) => {
            request.input(`param${index}`, param.type || sql.VarChar, param.value);
        });

        const result = await request.query(query);
        await pool.close();

        return {
            success: true,
            data: result.recordset,
            rowsAffected: result.rowsAffected || 0
        };
    } catch (error) {
        console.error('❌ خطأ في تنفيذ الاستعلام:', error.message);
        return {
            success: false,
            error: error.message,
            errorCode: error.code
        };
    }
}

module.exports = {
    sql,
    dbConfig,
    connectToDatabase,
    executeQuery
};