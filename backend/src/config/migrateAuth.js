const { pool } = require("./db");
const bcrypt = require("bcryptjs");

async function migrateAuth() {
  try {
    console.log("Migrating users table for authentication & RBAC...");

    // 1. Kiểm tra xem cột password và role đã tồn tại chưa
    const [columns] = await pool.query("SHOW COLUMNS FROM users");
    const columnNames = columns.map((c) => c.Field);

    if (!columnNames.includes("password")) {
      await pool.query("ALTER TABLE users ADD COLUMN `password` VARCHAR(255) NULL AFTER `email`");
      console.log("✅ Added `password` column to users table");
    } else {
      console.log("ℹ️ `password` column already exists");
    }

    if (!columnNames.includes("role")) {
      await pool.query("ALTER TABLE users ADD COLUMN `role` ENUM('ADMIN', 'CUSTOMER') NOT NULL DEFAULT 'CUSTOMER' AFTER `password`");
      console.log("✅ Added `role` column to users table");
    } else {
      console.log("ℹ️ `role` column already exists");
    }

    // 2. Hash mật khẩu mặc định
    const adminPasswordHash = await bcrypt.hash("admin123", 10);
    const userPasswordHash = await bcrypt.hash("user123", 10);

    // 3. Cập nhật user id=1 hiện tại (DApp Tester) làm CUSTOMER và đặt pass user123
    await pool.query(
      `UPDATE users 
       SET password = ?, role = 'CUSTOMER', full_name = 'DApp Tester (Khách hàng)' 
       WHERE id = 1`,
      [userPasswordHash]
    );
    console.log("✅ Updated user #1 (DApp Tester) with default password 'user123'");

    // 4. Tạo hoặc cập nhật tài khoản Quản trị viên (ADMIN)
    const [adminExists] = await pool.query("SELECT id FROM users WHERE email = 'admin@hybrid-dapp.com'");
    if (adminExists.length === 0) {
      await pool.query(
        `INSERT INTO users (full_name, email, password, role, wallet_address)
         VALUES ('Quản Trị Viên DApp', 'admin@hybrid-dapp.com', ?, 'ADMIN', '0x48B065482fD364Ae81e4739Aa5c03ab7d3082492')`,
        [adminPasswordHash]
      );
      console.log("✅ Seeded Admin account: admin@hybrid-dapp.com / admin123 (Role: ADMIN)");
    } else {
      await pool.query(
        `UPDATE users SET password = ?, role = 'ADMIN' WHERE email = 'admin@hybrid-dapp.com'`,
        [adminPasswordHash]
      );
      console.log("✅ Updated existing Admin account: admin@hybrid-dapp.com (Role: ADMIN)");
    }

    // 5. Tạo thêm tài khoản Khách hàng mẫu: customer@hybrid-dapp.com
    const [customerExists] = await pool.query("SELECT id FROM users WHERE email = 'customer@hybrid-dapp.com'");
    if (customerExists.length === 0) {
      await pool.query(
        `INSERT INTO users (full_name, email, password, role, wallet_address)
         VALUES ('Nguyễn Văn Khách', 'customer@hybrid-dapp.com', ?, 'CUSTOMER', '0xbaa0bc524fcc1f347bd5c7991a09d48d88bd63a9')`,
        [userPasswordHash]
      );
      console.log("✅ Seeded Customer account: customer@hybrid-dapp.com / user123 (Role: CUSTOMER)");
    } else {
      await pool.query(
        `UPDATE users SET password = ?, role = 'CUSTOMER' WHERE email = 'customer@hybrid-dapp.com'`,
        [userPasswordHash]
      );
      console.log("✅ Updated customer account: customer@hybrid-dapp.com");
    }

    const [allUsers] = await pool.query("SELECT id, full_name, email, role, wallet_address FROM users");
    console.log("Current users in DB:", allUsers);
    console.log("🎉 Migration for Authentication & RBAC completed successfully!");
  } catch (error) {
    console.error("Migration error:", error);
  } finally {
    process.exit();
  }
}

migrateAuth();
