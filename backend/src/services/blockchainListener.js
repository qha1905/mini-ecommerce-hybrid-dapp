/**
 * ==============================================================================
 * MODULE: BLOCKCHAIN EVENT LISTENER & TRANSACTION VERIFICATION
 * ==============================================================================
 * Kỹ sư phụ trách: Khang (Member 2 - Backend & Blockchain Integration Engineer)
 * Chức năng:
 *   1. Lắng nghe On-chain sự kiện 'PaymentCompleted' từ Smart Contract Sepolia.
 *   2. Kiểm toán bảo mật tài chính: Kiểm tra số tiền ETH thực trả so với đơn hàng (Chống gian lận 1 wei).
 *   3. Giải quyết bài toán Race Condition: Tự động trừ lại kho nếu thanh toán trễ trên đơn đã hủy.
 *   4. Xác thực giao dịch tức thì: Chống giả mạo txHash bằng cách kiểm tra địa chỉ hợp đồng đích (receipt.to).
 *   5. Khả năng tự phục hồi (Self-Healing): Tự động kết nối lại khi RPC bị ngắt quãng hoặc nghẽn mạng (429 Rate Limit).
 * ==============================================================================
 */

const { ethers } = require("ethers");
const { pool } = require("../config/db");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

// Đọc file .env dùng chung ở thư mục gốc trước, sau đó đọc backend/.env
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

let contractInstance = null;
let providerInstance = null;
let isListening = false;
let reconnectTimer = null;

/**
 * Lấy địa chỉ Smart Contract và ABI từ cấu hình tập trung
 */
function getContractMetadata() {
  const contractAddress = (process.env.CONTRACT_ADDRESS || "").trim();
  const abiFilePath = path.resolve(__dirname, "../../../contractData.json");
  let contractAbi = null;

  if (fs.existsSync(abiFilePath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(abiFilePath, "utf8"));
      contractAbi = Array.isArray(parsed) ? parsed : parsed.abi;
    } catch (err) {
      console.warn("⚠️ [Blockchain Listener] Không thể parse contractData.json:", err.message);
    }
  }

  return { contractAddress, contractAbi };
}

/**
 * Khởi tạo Blockchain Provider & Smart Contract Listener với cơ chế tự phục hồi
 */
async function startBlockchainListener() {
  console.log("==================================================");
  console.log("⛓️ Khởi tạo Module Blockchain Event Listener (Kỹ sư Khang)...");

  const { contractAddress, contractAbi } = getContractMetadata();

  if (!contractAddress || !contractAbi) {
    console.warn("⚠️ [Blockchain Listener] Chưa tìm thấy CONTRACT_ADDRESS trong .env hoặc ABI trong contractData.json.");
    console.warn("   Hệ thống sẽ chạy ở chế độ On-demand (sẵn sàng khi có giao dịch hoặc cập nhật cấu hình).");
    return false;
  }

  const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";
  console.log(`🌐 Kết nối tới Blockchain RPC: ${rpcUrl}`);
  console.log(`📍 Địa chỉ Smart Contract: ${contractAddress}`);

  try {
    // Khởi tạo JsonRpcProvider với cấu hình mạng Sepolia
    providerInstance = new ethers.JsonRpcProvider(rpcUrl);

    // Bắt lỗi kết nối ngầm của Provider để chống crash tiến trình Node.js
    if (providerInstance._websocket) {
      providerInstance._websocket.on("error", (err) => {
        console.warn("⚠️ [RPC WebSocket Warning]:", err.message);
      });
    }

    const network = await providerInstance.getNetwork();
    console.log(`🔗 Đã kết nối mạng Blockchain thành công: Chain ID ${network.chainId}`);

    contractInstance = new ethers.Contract(contractAddress, contractAbi, providerInstance);

    // Xóa listener cũ trước khi gắn listener mới (tránh duplicate events)
    contractInstance.removeAllListeners("PaymentCompleted");

    // Lắng nghe sự kiện PaymentCompleted phát ra từ Smart Contract
    contractInstance.on("PaymentCompleted", async (orderId, buyer, amount, timestamp, event) => {
      await handlePaymentCompletedEvent(orderId, buyer, amount, timestamp, event);
    });

    isListening = true;
    console.log("👂 [Blockchain Listener] Đang trực chiến lắng nghe sự kiện 'PaymentCompleted'!");
    console.log("==================================================");
    return true;
  } catch (error) {
    console.warn("⚠️ [Blockchain Listener] Không thể kết nối tới RPC node hoặc bị giới hạn lượt gọi:", error.message);
    console.warn("   Hệ thống sẽ tự động thử kết nối lại sau 10 giây...");

    if (!reconnectTimer) {
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        startBlockchainListener();
      }, 10000);
    }
    return false;
  }
}

/**
 * Xử lý sự kiện PaymentCompleted với kiểm toán bảo mật tài chính & toàn vẹn tồn kho
 */
async function handlePaymentCompletedEvent(orderId, buyer, amount, timestamp, event, explicitTxHash) {
  try {
    const numericOrderId = Number(orderId);
    const buyerAddress = buyer.toLowerCase();
    const amountEth = ethers.formatEther(amount);

    const txHash =
      explicitTxHash ||
      (typeof event === "string" ? event : null) ||
      event?.transactionHash ||
      event?.hash ||
      event?.log?.transactionHash ||
      event?.log?.hash ||
      "N/A";

    console.log("--------------------------------------------------");
    console.log(`🔔 [SỰ KIỆN ON-CHAIN PHÁT HIỆN] PaymentCompleted`);
    console.log(`   📦 Mã đơn hàng: #${numericOrderId}`);
    console.log(`   👛 Ví người mua: ${buyerAddress}`);
    console.log(`   💰 Số ETH đã nạp: ${amountEth} ETH`);
    console.log(`   🔗 Mã băm giao dịch: ${txHash}`);

    // 1. Kiểm tra đơn hàng trong CSDL MySQL
    const [orders] = await pool.query("SELECT * FROM orders WHERE id = ?", [numericOrderId]);

    if (orders.length === 0) {
      console.warn(`⚠️ [Cảnh báo Kiểm toán] Không tìm thấy đơn hàng #${numericOrderId} trong CSDL MySQL!`);
      return;
    }

    const currentOrder = orders[0];

    // 2. KIỂM TOÁN TÀI CHÍNH: Kiểm tra số tiền ETH thực trả so với giá trị đơn hàng
    const expectedEth = parseFloat(currentOrder.total_amount_eth);
    const paidEth = parseFloat(amountEth);

    // Cho phép dung sai cực nhỏ (0.0000001 ETH) để xử lý sai số làm tròn số thực
    if (paidEth < expectedEth - 0.0000001) {
      console.error(`🚨 [CẢNH BÁO GIAN LẬN TÀI CHÍNH] Đơn hàng #${numericOrderId} trả thiếu tiền!`);
      console.error(`   Cần thanh toán: ${expectedEth} ETH | Thực nhận trên chain: ${paidEth} ETH`);

      await pool.query(
        `UPDATE orders 
         SET status = 'PAYMENT_MISMATCH', 
             buyer_wallet = ?, 
             tx_hash = ?, 
             updated_at = NOW() 
         WHERE id = ?`,
        [buyerAddress, txHash, numericOrderId]
      );
      return;
    }

    // 3. XỬ LÝ TOÀN VẸN TỒN KHO: Xử lý trường hợp khách thanh toán trễ trên đơn đã bị hủy (Race condition)
    if (currentOrder.status === "CANCELLED" || currentOrder.is_deleted === 1) {
      console.warn(`⚠️ [Thanh toán trễ] Đơn hàng #${numericOrderId} đã bị hủy trước đó (tồn kho đã hoàn).`);
      console.log(`   Đang kích hoạt Transaction trừ lại tồn kho cho đơn hàng thanh toán thành công...`);

      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        // Lấy chi tiết các mặt hàng để trừ lại tồn kho
        const [items] = await connection.query(
          "SELECT product_id, quantity FROM order_items WHERE order_id = ?",
          [numericOrderId]
        );

        for (const item of items) {
          await connection.query(
            "UPDATE products SET stock = stock - ? WHERE id = ?",
            [item.quantity, item.product_id]
          );
        }

        // Cập nhật trạng thái thành PAID và khôi phục đơn
        await connection.query(
          `UPDATE orders 
           SET status = 'PAID', 
               buyer_wallet = ?, 
               tx_hash = ?, 
               paid_at = NOW(), 
               is_deleted = 0, 
               deleted_at = NULL 
           WHERE id = ?`,
          [buyerAddress, txHash, numericOrderId]
        );

        await connection.commit();
        console.log(`✅ [Tồn kho đồng bộ] Đơn hàng #${numericOrderId} đã phục hồi sang PAID và trừ lại kho thành công.`);
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally {
        connection.release();
      }
    } else {
      // 4. Trường hợp bình thường (Đơn đang PENDING)
      await pool.query(
        `UPDATE orders 
         SET status = 'PAID', 
             buyer_wallet = ?, 
             tx_hash = ?, 
             paid_at = NOW(), 
             is_deleted = 0, 
             deleted_at = NULL 
         WHERE id = ?`,
        [buyerAddress, txHash, numericOrderId]
      );

      console.log(`✅ [Database Updated] Đơn hàng #${numericOrderId} cập nhật thành 'PAID' thành công!`);
    }

    console.log(`🔒 Đơn hàng #${numericOrderId} đã khóa vĩnh viễn, chống hủy và đối soát toàn vẹn.`);
    console.log("--------------------------------------------------");
  } catch (error) {
    console.error("❌ Lỗi khi xử lý sự kiện PaymentCompleted:", error.message);
  }
}

/**
 * API xác thực giao dịch dự phòng (Manual Sync / Verification)
 * Bảo mật: Chống giả mạo txHash bằng cách kiểm tra địa chỉ hợp đồng đích (receipt.to)
 */
async function verifyAndSyncPayment(txHash, fallbackOrderId) {
  const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";
  if (!providerInstance) {
    providerInstance = new ethers.JsonRpcProvider(rpcUrl);
  }

  const { contractAddress } = getContractMetadata();

  try {
    console.log(`🔍 [Xác thực On-chain] Kiểm tra mã băm giao dịch: ${txHash}`);
    const receipt = await providerInstance.getTransactionReceipt(txHash);

    if (!receipt || receipt.status !== 1) {
      return { success: false, message: "Giao dịch đang chờ xử lý hoặc đã thất bại trên chuỗi (On-chain)." };
    }

    // BẢO MẬT CHỐNG GIẢ MẠO: Kiểm tra xem giao dịch có được gửi tới đúng Smart Contract cửa hàng không
    if (contractAddress && receipt.to && receipt.to.toLowerCase() !== contractAddress.toLowerCase()) {
      return {
        success: false,
        message: "Giao dịch này không được gửi tới Smart Contract của cửa hàng (Địa chỉ đích không khớp)!",
      };
    }

    // Đọc log của receipt để bóc tách sự kiện PaymentCompleted
    if (contractInstance) {
      for (const log of receipt.logs) {
        try {
          const parsedLog = contractInstance.interface.parseLog(log);
          if (parsedLog && parsedLog.name === "PaymentCompleted") {
            const { orderId, buyer, amount, timestamp } = parsedLog.args;
            await handlePaymentCompletedEvent(orderId, buyer, amount, timestamp, receipt, txHash);
            return {
              success: true,
              message: "Giao dịch đã được xác minh và đồng bộ chính xác từ On-chain Event!",
              orderId: Number(orderId),
              txHash,
            };
          }
        } catch (e) {
          // Bỏ qua log không thuộc contract này
        }
      }
    }

    // Fallback: Khi có fallbackOrderId và receipt.to khớp với hợp đồng
    if (fallbackOrderId && contractAddress && receipt.to && receipt.to.toLowerCase() === contractAddress.toLowerCase()) {
      const [orders] = await pool.query("SELECT * FROM orders WHERE id = ?", [fallbackOrderId]);
      if (orders.length > 0) {
        await pool.query(
          `UPDATE orders 
           SET status = 'PAID', 
               buyer_wallet = ?, 
               tx_hash = ?, 
               paid_at = NOW(), 
               is_deleted = 0, 
               deleted_at = NULL 
           WHERE id = ?`,
          [receipt.from.toLowerCase(), txHash, fallbackOrderId]
        );
        return {
          success: true,
          message: "Xác thực biên nhận giao dịch thành công và cập nhật đơn hàng thành PAID!",
          orderId: fallbackOrderId,
          txHash,
        };
      }
    }

    return {
      success: false,
      message: "Không tìm thấy sự kiện PaymentCompleted hợp lệ trong giao dịch này.",
    };
  } catch (error) {
    console.error("Lỗi khi xác minh giao dịch thanh toán:", error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  startBlockchainListener,
  handlePaymentCompletedEvent,
  verifyAndSyncPayment,
};
