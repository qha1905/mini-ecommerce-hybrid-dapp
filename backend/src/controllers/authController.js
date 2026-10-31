const { pool } = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../middleware/authMiddleware");

// Đăng ký tài khoản mới
async function register(req, res) {
  try {
    const { full_name, email, password, role = "CUSTOMER", wallet_address } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Họ và tên, email và mật khẩu là bắt buộc",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu phải có tối thiểu 6 ký tự",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Định dạng email không hợp lệ",
      });
    }

    // Kiểm tra xem email đã tồn tại chưa
    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email.trim().toLowerCase()]);
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác.",
      });
    }

    // Hash mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);
    // Mặc định đăng ký công khai chỉ có tài khoản Khách hàng (CUSTOMER)
    const assignedRole = "CUSTOMER";

    // Insert user
    const [result] = await pool.query(
      `INSERT INTO users (full_name, email, password, role, wallet_address)
       VALUES (?, ?, ?, ?, ?)`,
      [full_name.trim(), email.trim().toLowerCase(), hashedPassword, assignedRole, wallet_address ? wallet_address.trim() : null]
    );

    const newUser = {
      id: result.insertId,
      full_name: full_name.trim(),
      email: email.trim().toLowerCase(),
      role: assignedRole,
      wallet_address: wallet_address ? wallet_address.trim() : null,
    };

    // Tạo JWT token
    const token = jwt.sign(newUser, JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      success: true,
      message: "Đăng ký tài khoản thành công!",
      token,
      user: newUser,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ", error: error.message });
  }
}

// Đăng nhập tài khoản
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ email và mật khẩu",
      });
    }

    // Tìm người dùng theo email
    const [rows] = await pool.query(
      "SELECT id, full_name, email, password, role, wallet_address, is_active FROM users WHERE email = ?",
      [email.trim().toLowerCase()]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Email hoặc mật khẩu không chính xác",
      });
    }

    const user = rows[0];

    // Kiểm tra tài khoản có bị ẩn / khóa không
    if (user.is_active === 0) {
      return res.status(403).json({
        success: false,
        message: "Tài khoản của bạn đã bị ẩn/khóa bởi Quản trị viên.",
      });
    }

    // So sánh mật khẩu
    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: "Tài khoản này chưa thiết lập mật khẩu, vui lòng liên hệ quản trị",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Email hoặc mật khẩu không chính xác",
      });
    }

    const userPayload = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      wallet_address: user.wallet_address,
    };

    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      success: true,
      message: "Đăng nhập thành công!",
      token,
      user: userPayload,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ", error: error.message });
  }
}

// Lấy thông tin tài khoản hiện tại từ token
async function getProfile(req, res) {
  try {
    const [rows] = await pool.query(
      "SELECT id, full_name, email, role, wallet_address, created_at FROM users WHERE id = ?",
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Người dùng không tồn tại" });
    }

    res.json({ success: true, user: rows[0] });
  } catch (error) {
    console.error("GetProfile error:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ", error: error.message });
  }
}

// Liên kết hoặc cập nhật địa chỉ ví MetaMask cho người dùng đang đăng nhập
async function linkWallet(req, res) {
  try {
    const { wallet_address } = req.body;
    if (!wallet_address || !/^0x[a-fA-F0-9]{40}$/.test(wallet_address)) {
      return res.status(400).json({ success: false, message: "Địa chỉ ví Ethereum không hợp lệ" });
    }

    await pool.query("UPDATE users SET wallet_address = ? WHERE id = ?", [wallet_address.trim(), req.user.id]);

    res.json({
      success: true,
      message: "Đã liên kết ví MetaMask thành công!",
      wallet_address: wallet_address.trim(),
    });
  } catch (error) {
    console.error("LinkWallet error:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ", error: error.message });
  }
}

module.exports = {
  register,
  login,
  getProfile,
  linkWallet,
};
