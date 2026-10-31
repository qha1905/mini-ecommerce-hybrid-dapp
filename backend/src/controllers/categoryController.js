const { pool } = require("../config/db");

// Lấy danh sách danh mục (Mặc định chỉ lấy danh mục đang hiện; Admin truyền includeHidden=true để lấy tất cả)
async function getAllCategories(req, res) {
  try {
    const { includeHidden } = req.query;
    let sql = `
      SELECT c.*, COUNT(p.id) AS product_count 
      FROM categories c 
      LEFT JOIN products p ON p.category_id = c.id 
    `;

    if (includeHidden !== "true") {
      sql += " WHERE c.is_active = 1 ";
    }

    sql += `
      GROUP BY c.id 
      ORDER BY c.id ASC
    `;

    const [rows] = await pool.query(sql);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
}

// Lấy chi tiết 1 danh mục theo ID
async function getCategoryById(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT c.*, COUNT(p.id) AS product_count 
       FROM categories c 
       LEFT JOIN products p ON p.category_id = c.id 
       WHERE c.id = ? 
       GROUP BY c.id`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
}

// Helper tạo slug từ tên
function generateSlug(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Xóa dấu tiếng Việt
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9 -]/g, "") // Xóa ký tự lạ
    .replace(/\s+/g, "-") // Thay khoảng trắng bằng -
    .replace(/-+/g, "-");
}

// Thêm danh mục mới (Mặc định is_active = 1)
async function createCategory(req, res) {
  try {
    const { name, slug, description, is_active = 1 } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: "Tên danh mục là bắt buộc" });
    }

    const finalSlug = slug && slug.trim() ? slug.trim() : generateSlug(name) + "-" + Date.now().toString().slice(-4);

    const [result] = await pool.query(
      "INSERT INTO categories (name, slug, description, is_active) VALUES (?, ?, ?, ?)",
      [name.trim(), finalSlug, description || "", is_active ? 1 : 0]
    );

    res.status(201).json({
      success: true,
      message: "Tạo danh mục thành công",
      data: { id: result.insertId, name: name.trim(), slug: finalSlug, description: description || "", is_active: is_active ? 1 : 0 },
    });
  } catch (error) {
    console.error("Error creating category:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ success: false, message: "Slug danh mục đã tồn tại, vui lòng chọn slug khác" });
    }
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
}

// Cập nhật danh mục
async function updateCategory(req, res) {
  try {
    const { id } = req.params;
    const { name, slug, description, is_active } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Tên danh mục là bắt buộc" });
    }

    const finalSlug = slug && slug.trim() ? slug.trim() : generateSlug(name);

    let sql = "UPDATE categories SET name = ?, slug = ?, description = ?";
    const params = [name.trim(), finalSlug, description || ""];

    if (is_active !== undefined) {
      sql += ", is_active = ?";
      params.push(is_active ? 1 : 0);
    }

    sql += " WHERE id = ?";
    params.push(id);

    const [result] = await pool.query(sql, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    res.json({ success: true, message: "Cập nhật danh mục thành công" });
  } catch (error) {
    console.error("Error updating category:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ success: false, message: "Slug danh mục đã tồn tại" });
    }
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
}

// Bật/tắt ẩn hiện danh mục (Không xóa cứng)
async function toggleCategoryVisibility(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT id, name, is_active FROM categories WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const currentStatus = rows[0].is_active;
    const newStatus = currentStatus === 1 ? 0 : 1;

    await pool.query("UPDATE categories SET is_active = ? WHERE id = ?", [newStatus, id]);
    const statusText = newStatus === 1 ? "Hiển thị" : "Ẩn";

    console.log(`👁️ [Category Visibility Toggled] Danh mục #${id} (${rows[0].name}) chuyển sang: ${statusText}`);

    res.json({
      success: true,
      message: `Đã chuyển danh mục #${id} (${rows[0].name}) sang trạng thái: ${statusText}.`,
      data: { id: parseInt(id), is_active: newStatus },
    });
  } catch (error) {
    console.error("Error toggling category visibility:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
}

// Thay vì xóa cứng, chuyển thành ẩn danh mục (xóa mềm/ẩn khỏi cửa hàng)
async function deleteCategory(req, res) {
  try {
    const { id } = req.params;
    const [result] = await pool.query("UPDATE categories SET is_active = 0 WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }
    res.json({ success: true, message: `Danh mục #${id} đã được ẩn khỏi cửa hàng (không xóa cứng).` });
  } catch (error) {
    console.error("Error soft-deleting category:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
}

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  toggleCategoryVisibility,
  deleteCategory,
};
