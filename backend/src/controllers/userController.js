const { pool } = require("../config/db");

// Lấy danh sách toàn bộ người dùng (kèm thống kê số đơn hàng & tổng chi tiêu ETH)
async function getAllUsers(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT 
        u.*, 
        COUNT(o.id) AS total_orders,
        COALESCE(SUM(CASE WHEN o.status = 'PAID' THEN o.total_amount_eth ELSE 0 END), 0) AS total_eth_spent
      FROM users u
      LEFT JOIN orders o ON o.user_id = u.id
      GROUP BY u.id
      ORDER BY u.id ASC
    `);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
}

// Lấy chi tiết người dùng
async function getUserById(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT 
        u.*, 
        COUNT(o.id) AS total_orders,
        COALESCE(SUM(CASE WHEN o.status = 'PAID' THEN o.total_amount_eth ELSE 0 END), 0) AS total_eth_spent
       FROM users u
       LEFT JOIN orders o ON o.user_id = u.id
       WHERE u.id = ?
       GROUP BY u.id`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Người dùng không tồn tại" });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
}

// Tạo người dùng mới
async function createUser(req, res) {
  try {
    const { full_name, email, password, role = "CUSTOMER", wallet_address, is_active = 1 } = req.body;
    if (!full_name || !email) {
      return res.status(400).json({ success: false, message: "Họ tên và email là bắt buộc" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Địa chỉ email không hợp lệ" });
    }

    if (wallet_address && !/^0x[a-fA-F0-9]{40}$/.test(wallet_address)) {
      return res.status(400).json({ success: false, message: "Địa chỉ ví Ethereum không hợp lệ (phải bắt đầu bằng 0x và dài 42 ký tự)" });
    }

    const bcrypt = require("bcryptjs");
    const hashedPassword = password ? await bcrypt.hash(password, 10) : await bcrypt.hash("123456", 10);
    const assignedRole = role === "ADMIN" ? "ADMIN" : "CUSTOMER";
    const activeStatus = is_active !== undefined ? (is_active ? 1 : 0) : 1;

    const [result] = await pool.query(
      "INSERT INTO users (full_name, email, password, role, wallet_address, is_active) VALUES (?, ?, ?, ?, ?, ?)",
      [full_name.trim(), email.trim().toLowerCase(), hashedPassword, assignedRole, wallet_address ? wallet_address.trim() : null, activeStatus]
    );

    res.status(201).json({
      success: true,
      message: "Tạo người dùng thành công",
      data: { id: result.insertId, full_name, email, role: assignedRole, wallet_address, is_active: activeStatus },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ success: false, message: "Email này đã được đăng ký trong hệ thống" });
    }
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
}

// Cập nhật người dùng
async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { full_name, email, password, role, wallet_address, is_active } = req.body;

    if (!full_name || !email) {
      return res.status(400).json({ success: false, message: "Họ tên và email là bắt buộc" });
    }

    if (wallet_address && !/^0x[a-fA-F0-9]{40}$/.test(wallet_address)) {
      return res.status(400).json({ success: false, message: "Địa chỉ ví Ethereum không hợp lệ" });
    }

    const bcrypt = require("bcryptjs");
    let sql = "UPDATE users SET full_name = ?, email = ?, wallet_address = ?";
    const params = [full_name.trim(), email.trim().toLowerCase(), wallet_address ? wallet_address.trim() : null];

    if (role) {
      sql += ", role = ?";
      params.push(role === "ADMIN" ? "ADMIN" : "CUSTOMER");
    }

    if (is_active !== undefined) {
      sql += ", is_active = ?";
      params.push(is_active ? 1 : 0);
    }

    if (password && password.trim().length >= 6) {
      const hashedPassword = await bcrypt.hash(password.trim(), 10);
      sql += ", password = ?";
      params.push(hashedPassword);
    }

    sql += " WHERE id = ?";
    params.push(id);

    const [result] = await pool.query(sql, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Người dùng không tồn tại" });
    }

    res.json({ success: true, message: "Cập nhật người dùng thành công" });
  } catch (error) {
    console.error("Error updating user:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ success: false, message: "Email này đã thuộc về người dùng khác" });
    }
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
}

// Bật/tắt trạng thái ẩn/hiện người dùng (xóa mềm)
async function toggleUserVisibility(req, res) {
  try {
    const { id } = req.params;

    const [users] = await pool.query("SELECT id, full_name, is_active FROM users WHERE id = ?", [id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "Người dùng không tồn tại" });
    }

    const user = users[0];
    const newActive = user.is_active === 0 ? 1 : 0;

    await pool.query("UPDATE users SET is_active = ? WHERE id = ?", [newActive, id]);

    res.json({
      success: true,
      message: `Đã chuyển người dùng #${user.id} (${user.full_name}) sang trạng thái: ${
        newActive === 1 ? "Đang hiện" : "Đã ẩn"
      }.`,
      data: { id: user.id, is_active: newActive },
    });
  } catch (error) {
    console.error("Error toggling user visibility:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
}

// Xóa mềm người dùng (chuyển sang trạng thái Ẩn)
async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    const [result] = await pool.query("UPDATE users SET is_active = 0 WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Người dùng không tồn tại" });
    }

    res.json({ success: true, message: "Người dùng đã được chuyển sang trạng thái Ẩn (không xóa cứng)." });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  toggleUserVisibility,
  deleteUser,
};
