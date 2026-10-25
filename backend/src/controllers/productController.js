const { pool } = require("../config/db");

// Lấy danh sách toàn bộ sản phẩm
async function getAllProducts(req, res) {
  try {
    const [rows] = await pool.query("SELECT * FROM products ORDER BY id ASC");
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
    const [rows] = await pool.query("SELECT * FROM products WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
}

// Thêm sản phẩm mới
async function createProduct(req, res) {
  try {
    const { name, description, price_eth, image_url, stock } = req.body;
    if (!name || price_eth === undefined) {
      return res.status(400).json({ success: false, message: "Name and price_eth are required" });
    }

    const [result] = await pool.query(
      "INSERT INTO products (name, description, price_eth, image_url, stock) VALUES (?, ?, ?, ?, ?)",
      [name, description || "", price_eth, image_url || "", stock || 0]
    );

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: { id: result.insertId, name, description, price_eth, image_url, stock },
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
    const { name, description, price_eth, image_url, stock } = req.body;

    const [result] = await pool.query(
      "UPDATE products SET name = ?, description = ?, price_eth = ?, image_url = ?, stock = ? WHERE id = ?",
      [name, description, price_eth, image_url, stock, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, message: "Product updated successfully" });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
}

// Xóa sản phẩm
async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    const [result] = await pool.query("DELETE FROM products WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
