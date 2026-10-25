const mysql = require("mysql2/promise");
require("dotenv").config();

// Tạo Connection Pool tới MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "mini_ecommerce_dapp",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/**
 * Kiểm tra kết nối CSDL khi khởi động Backend
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("✅ [MySQL] Successfully connected to database:", process.env.DB_NAME || "mini_ecommerce_dapp");
    connection.release();
    return true;
  } catch (error) {
    console.warn("⚠️ [MySQL] Warning: Could not connect to MySQL server at", `${process.env.DB_HOST}:${process.env.DB_PORT}`);
    console.warn("   Error message:", error.message);
    console.warn("   Tip: Hãy đảm bảo MySQL service (XAMPP / MySQL Server / Docker) đang chạy và database đã được tạo.");
    return false;
  }
}

module.exports = {
  pool,
  testConnection,
};
