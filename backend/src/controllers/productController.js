const { pool } = require("../config/db");

// Lấy danh sách sản phẩm (Mặc định chỉ lấy sản phẩm đang hiện; Admin truyền includeHidden=true để lấy tất cả)
async function getAllProducts(req, res) {
  try {
    const { includeHidden } = req.query;
    let sql = `
      SELECT p.*, c.name AS category_name, c.slug AS category_slug 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
    `;
    
    // Nếu không yêu cầu lấy toàn bộ thì chỉ trả về sản phẩm đang hiển thị (is_active = 1)
    if (includeHidden !== "true") {
      sql += " WHERE p.is_active = 1 ";
    }
    
    sql += " ORDER BY p.id ASC";

    const [rows] = await pool.query(sql);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
}

// Lấy chi tiết 1 sản phẩm theo ID
async function getProductById(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.id = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
}

// Thêm sản phẩm mới (Mặc định is_active = 1)
async function createProduct(req, res) {
  try {
    const { name, description, price_eth, image_url, stock, category_id, is_active = 1 } = req.body;
    if (!name || price_eth === undefined) {
      return res.status(400).json({ success: false, message: "Name and price_eth are required" });
    }

    const [result] = await pool.query(
      "INSERT INTO products (name, description, price_eth, image_url, stock, category_id, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [name, description || "", price_eth, image_url || "", stock || 0, category_id || null, is_active ? 1 : 0]
    );

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: { id: result.insertId, name, description, price_eth, image_url, stock, category_id, is_active: is_active ? 1 : 0 },
    });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
}

// Cập nhật sản phẩm
async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const { name, description, price_eth, image_url, stock, category_id, is_active } = req.body;

    let sql = "UPDATE products SET name = ?, description = ?, price_eth = ?, image_url = ?, stock = ?, category_id = ?";
    const params = [name, description, price_eth, image_url, stock, category_id !== undefined ? category_id : null];

    if (is_active !== undefined) {
      sql += ", is_active = ?";
      params.push(is_active ? 1 : 0);
    }

    sql += " WHERE id = ?";
    params.push(id);

    const [result] = await pool.query(sql, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, message: "Product updated successfully" });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
}

// Chuyển đổi trạng thái Ẩn / Hiện (Không xóa cứng)
async function toggleProductVisibility(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT id, name, is_active FROM products WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const currentStatus = rows[0].is_active;
    const newStatus = currentStatus === 1 ? 0 : 1;

    await pool.query("UPDATE products SET is_active = ? WHERE id = ?", [newStatus, id]);
    const statusText = newStatus === 1 ? "Hiển thị" : "Ẩn";

    console.log(`👁️ [Product Visibility Toggled] Sản phẩm #${id} (${rows[0].name}) chuyển sang: ${statusText}`);

    res.json({
      success: true,
      message: `Đã chuyển sản phẩm #${id} (${rows[0].name}) sang trạng thái: ${statusText}.`,
      data: { id: parseInt(id), is_active: newStatus },
    });
  } catch (error) {
    console.error("Error toggling product visibility:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
}

// Thay vì xóa cứng, chuyển thành ẩn sản phẩm (xóa mềm/ẩn khỏi cửa hàng)
async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    const [result] = await pool.query("UPDATE products SET is_active = 0 WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.json({ success: true, message: `Sản phẩm #${id} đã được ẩn khỏi cửa hàng (không xóa cứng).` });
  } catch (error) {
    console.error("Error soft-deleting product:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  toggleProductVisibility,
  deleteProduct,
};
