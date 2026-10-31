const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_dapp_key_2026";

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
  requireAdmin,
  JWT_SECRET,
};
