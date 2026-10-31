const { pool } = require("./db");

async function migrate() {
  console.log("Migrating categories and products...");
  
  // 1. Tạo bảng categories
  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      slug VARCHAR(100) NOT NULL UNIQUE,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);
  console.log("✅ Created categories table");

  // 2. Thêm cột category_id vào products nếu chưa có
  const [columns] = await pool.query("SHOW COLUMNS FROM products LIKE 'category_id'");
  if (columns.length === 0) {
    await pool.query("ALTER TABLE products ADD COLUMN category_id INT NULL AFTER description");
    try {
      await pool.query("ALTER TABLE products ADD CONSTRAINT fk_product_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL");
    } catch (e) {
      console.log("Constraint note:", e.message);
    }
    console.log("✅ Added category_id to products");
  } else {
    console.log("ℹ️ category_id already exists in products");
  }

  // 3. Thêm các danh mục mẫu (Seed Categories)
  const categories = [
    [1, "Ví Lạnh & Bảo Mật Web3", "hardware-wallets", "Thiết bị lưu trữ khóa riêng tư lạnh, USB FIDO2 chống tấn công lừa đảo."],
    [2, "Phụ Kiện Công Nghệ Cyberpunk", "cyberpunk-gear", "Bàn phím cơ, chuột và phụ kiện công nghệ phong cách tương lai Cyberpunk."],
    [3, "Thời Trang Web3 & NFT Merch", "web3-fashion", "Áo hoodie, áo thun và phụ kiện thương hiệu Web3 phiên bản giới hạn."],
    [4, "Decor & Đèn Hologram 3D", "decor-hologram", "Đèn LED biểu tượng Ethereum, quà tặng decor góc setup công nghệ."]
  ];

  for (const cat of categories) {
    await pool.query(
      "INSERT INTO categories (id, name, slug, description) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description)",
      cat
    );
  }
  console.log("✅ Seeded categories");

  // 4. Gán category_id cho các sản phẩm hiện có
  await pool.query("UPDATE products SET category_id = 1 WHERE id IN (1, 5)");
  await pool.query("UPDATE products SET category_id = 2 WHERE id = 2");
  await pool.query("UPDATE products SET category_id = 3 WHERE id = 3");
  await pool.query("UPDATE products SET category_id = 4 WHERE id = 4");
  console.log("✅ Linked products to categories");

  const [cats] = await pool.query("SELECT * FROM categories");
  console.log("Current categories in DB:", cats);
}

migrate()
  .then(() => {
    console.log("🎉 Migration finished successfully!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Migration error:", err);
    process.exit(1);
  });
