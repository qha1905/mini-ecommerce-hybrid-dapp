const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_dapp_key_2026";

/**
 * Middleware bắt buộc xác thực token
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "Yêu cầu đăng nhập để truy cập tài nguyên này" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: "Phiên đăng nhập đã hết hạn hoặc không hợp lệ" });
    }
    req.user = user;
    next();
  });
}

/**
 * Middleware trích xuất thông tin người dùng từ Bearer token (nếu có)
 * Không chặn request nếu không có token (dành cho các endpoint linh hoạt)
 */
function extractUser(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (!err && user) {
      req.user = user;
    }
    next();
  });
}

/**
 * Middleware kiểm tra quyền Quản trị viên (Admin)
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Quyền truy cập bị từ chối: Khu vực này chỉ dành riêng cho Quản trị viên (Admin)!",
    });
  }
  next();
}

module.exports = {
  verifyToken,
  extractUser,
  requireAdmin,
  JWT_SECRET,
};
