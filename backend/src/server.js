const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const { testConnection } = require("./config/db");
const { startBlockchainListener, verifyAndSyncPayment } = require("./services/blockchainListener");

const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

// Endpoint xác thực giao dịch tức thì (Dự phòng cho Frontend khi vừa gửi txHash)
app.post("/api/blockchain/verify-payment", async (req, res) => {
  const { txHash, orderId } = req.body;
  if (!txHash) {
    return res.status(400).json({ success: false, message: "txHash is required" });
  }

  const result = await verifyAndSyncPayment(txHash, orderId ? Number(orderId) : null);
  if (result.success) {
    return res.json(result);
  } else {
    return res.status(400).json(result);
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  const contractConfigPath = path.join(__dirname, "config/contractData.json");
  let contractInfo = null;
  if (fs.existsSync(contractConfigPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(contractConfigPath, "utf8"));
      contractInfo = {
        address: config.address,
        network: config.network,
        chainId: config.chainId,
      };
    } catch (e) {}
  }

  res.json({
    status: "online",
    timestamp: new Date().toISOString(),
    contract: contractInfo || "Not loaded",
    blockchainRpc: process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545",
  });
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
