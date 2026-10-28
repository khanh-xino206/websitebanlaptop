const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'shop_laptop',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test connection
pool.getConnection()
    .then(connection => {
        console.log('✅ Đã kết nối với MySQL Database (shop_laptop)');
        connection.release();
    })
    .catch(err => {
        console.error('❌ Kết nối database thất bại!');
        console.error('   Mã lỗi :', err.code);
        console.error('   Chi tiết: \n   Host    :', process.env.DB_HOST);
        console.error('   Port    :', process.env.DB_PORT);
        console.error('   User    :', process.env.DB_USER);
        console.error('   Database:', process.env.DB_NAME);
    });

module.exports = pool;
