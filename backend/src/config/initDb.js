const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function initDatabase() {
  console.log("==================================================");
  console.log("🛠️ Starting MySQL Database Initialization...");
  console.log("==================================================");

  const connectionConfig = {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306", 10),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    multipleStatements: true,
  };

  let connection;
  try {
    connection = await mysql.createConnection(connectionConfig);
    console.log("✅ Connected to MySQL server.");

    const schemaPath = path.join(__dirname, "../../../database/schema.sql");
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at: ${schemaPath}`);
    }

    const schemaSql = fs.readFileSync(schemaPath, "utf8");
    console.log("📖 Executing schema.sql script...");
    
    await connection.query(schemaSql);
    console.log("🎉 Database and tables initialized with sample products successfully!");
  } catch (error) {
    console.error("❌ Database initialization error:", error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase;
