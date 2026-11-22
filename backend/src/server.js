/**
 * ==============================================================================
 * SERVER ENTRY POINT: MINI E-COMMERCE HYBRID DAPP BACKEND
 * ==============================================================================
 * Kỹ sư phụ trách: Khang (Member 2 - Backend & Integration Lead)
 * Chức năng:
 *   - Cấu hình Express REST API & CORS
 *   - Tự động trích xuất JWT Token (extractUser)
 *   - Định tuyến API: Auth, Products, Cart, Orders, Categories, Users, Admin, Upload
 *   - Lắng nghe và xác thực giao dịch Smart Contract Sepolia (Blockchain Listener)
 *   - Xử lý lỗi tập trung và bảo vệ tiến trình Node.js không bị crash
 * ==============================================================================
 */

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

// Đọc file .env dùng chung ở thư mục gốc và file backend/.env
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const { testConnection } = require("./config/db");
const { startBlockchainListener, verifyAndSyncPayment } = require("./services/blockchainListener");
const { extractUser } = require("./middleware/authMiddleware");

const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares cơ bản
app.use(cors());
app.use(express.json());

// Tự động phân tích Token người dùng (nếu có) trên mọi request mà không gây chặn
app.use(extractUser);

// Phục vụ file tĩnh trong thư mục uploads (ảnh sản phẩm tải lên)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/upload", uploadRoutes);

// Endpoint xác thực giao dịch tức thì (Dự phòng cho Frontend khi vừa gửi txHash)
app.post("/api/blockchain/verify-payment", async (req, res, next) => {
  try {
    const { txHash, orderId } = req.body;
    if (!txHash) {
      return res.status(400).json({ success: false, message: "txHash là bắt buộc" });
    }

    const result = await verifyAndSyncPayment(txHash, orderId ? Number(orderId) : null);
    if (result.success) {
      return res.json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (err) {
    next(err);
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  const contractAddress = (process.env.CONTRACT_ADDRESS || "").trim();
  const contractInfo = contractAddress
    ? {
        address: contractAddress,
        network: process.env.CONTRACT_NETWORK || "sepolia",
        chainId: process.env.CONTRACT_CHAIN_ID || "11155111",
      }
    : null;

  res.json({
    status: "online",
    author: "Khang (Backend Engineer)",
    timestamp: new Date().toISOString(),
    contract: contractInfo || "Chưa cấu hình contract address",
    blockchainRpc: process.env.BLOCKCHAIN_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com",
  });
});

// Bắt lỗi 404 cho toàn bộ các route API không tồn tại
app.use("/api/*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.originalUrl} không tồn tại trên máy chủ backend.`,
  });
});

// Middleware xử lý lỗi tập trung (Centralized Error Handler)
app.use((err, req, res, next) => {
  console.error("🔥 [Unhandled Server Error]:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Đã xảy ra lỗi nội bộ máy chủ!",
  });
});

// Bắt các ngoại lệ không mong muốn ở cấp độ Process để không làm sập Node.js daemon
process.on("unhandledRejection", (reason, promise) => {
  console.error("⚠️ [Process Warning] Unhandled Rejection tại:", promise, "nguyên nhân:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("🚨 [Process Critical] Uncaught Exception:", error);
});

// Khởi động Server
app.listen(PORT, async () => {
  console.log("==================================================");
  console.log(`🚀 Mini E-Commerce Backend Server running on port ${PORT}`);
  console.log(`📡 Health Check URL: http://localhost:${PORT}/api/health`);
  console.log("==================================================");

  // 1. Kiểm tra kết nối CSDL MySQL
  await testConnection();

  // 2. Khởi chạy Blockchain Listener lắng nghe PaymentCompleted event
  await startBlockchainListener();
});
