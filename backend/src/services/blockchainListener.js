const { ethers } = require("ethers");
const { pool } = require("../config/db");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

let contractInstance = null;
let providerInstance = null;

/**
 * Khởi tạo Blockchain Provider & Smart Contract Listener
 */
async function startBlockchainListener() {
  console.log("==================================================");
  console.log("⛓️ Initializing Blockchain Event Listener (Member 2)...");

  // 1. Đọc thông tin Contract Address và ABI từ file cấu hình tự động
  const configPath = path.join(__dirname, "../config/contractData.json");
  let contractAddress = process.env.CONTRACT_ADDRESS;
  let contractAbi = null;

  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
      contractAddress = contractAddress || config.address;
      contractAbi = config.abi;
    } catch (err) {
      console.warn("⚠️ Could not parse contractData.json:", err.message);
    }
  }

  if (!contractAddress || !contractAbi) {
    console.warn("⚠️ [Blockchain Listener] Contract address or ABI not found yet.");
    console.warn("   Run `npm run deploy:local` or `npm run deploy:sepolia` in smart-contract directory first.");
    return false;
  }

  const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545";
  console.log(`🌐 Connecting to Blockchain RPC: ${rpcUrl}`);
  console.log(`📍 Contract Address: ${contractAddress}`);

  try {
    providerInstance = new ethers.JsonRpcProvider(rpcUrl);

    // Kiểm tra kết nối tới RPC
    const network = await providerInstance.getNetwork();
    console.log(`🔗 Connected to Blockchain Network: Chain ID ${network.chainId}`);

    contractInstance = new ethers.Contract(contractAddress, contractAbi, providerInstance);

    // Bắt đầu lắng nghe sự kiện PaymentCompleted phát ra từ Smart Contract
    contractInstance.on("PaymentCompleted", async (orderId, buyer, amount, timestamp, event) => {
      await handlePaymentCompletedEvent(orderId, buyer, amount, timestamp, event);
    });

    console.log("👂 [Blockchain Listener] Successfully listening for 'PaymentCompleted' events!");
    console.log("==================================================");
    return true;
  } catch (error) {
    console.warn("⚠️ [Blockchain Listener] Could not connect to RPC or bind listener:", error.message);
    console.warn("   Listener will automatically retry or run in on-demand mode when transactions occur.");
    return false;
  }
}

/**
 * Xử lý logic khi bắt được sự kiện PaymentCompleted từ Smart Contract
 */
async function handlePaymentCompletedEvent(orderId, buyer, amount, timestamp, event, explicitTxHash) {
  try {
    const numericOrderId = Number(orderId);
    const buyerAddress = buyer.toLowerCase();
    const amountEth = ethers.formatEther(amount);
    
    // Trích xuất mã băm giao dịch chuẩn xác (hỗ trợ ethers v6)
    const txHash = explicitTxHash 
      || (typeof event === "string" ? event : null)
      || event?.transactionHash 
      || event?.hash 
      || event?.log?.transactionHash 
      || event?.log?.hash;

    console.log("--------------------------------------------------");
    console.log(`🔔 [EVENT RECEIVED] PaymentCompleted`);
    console.log(`   📦 Order ID: #${numericOrderId}`);
    console.log(`   👛 Buyer Wallet: ${buyerAddress}`);
    console.log(`   💰 Amount: ${amountEth} ETH`);
    console.log(`   🔗 Tx Hash: ${txHash}`);

    // Kiểm tra đơn hàng trong MySQL
    const [orders] = await pool.query("SELECT * FROM orders WHERE id = ?", [numericOrderId]);

    if (orders.length === 0) {
      console.warn(`⚠️ [Warning] Order #${numericOrderId} not found in MySQL database.`);
      return;
    }

    const currentOrder = orders[0];

    // Cập nhật trạng thái sang PAID, lưu địa chỉ ví và mã băm giao dịch
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

    console.log(`✅ [Database Updated] Order #${numericOrderId} updated from '${currentOrder.status}' to 'PAID'!`);
    console.log(`🔒 Order is now LOCKED against cancellation/deletion.`);
    console.log("--------------------------------------------------");
  } catch (error) {
    console.error("❌ Error handling PaymentCompleted event:", error);
  }
}

/**
 * API xác thực giao dịch dự phòng (Manual Sync / Verification)
 * Frontend có thể gọi hàm này kèm txHash sau khi người dùng gửi giao dịch qua MetaMask
 * để cập nhật tức thì mà không phụ thuộc hoàn toàn vào websocket ping của public testnet RPC.
 */
async function verifyAndSyncPayment(txHash, fallbackOrderId) {
  if (!providerInstance) {
    const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545";
    providerInstance = new ethers.JsonRpcProvider(rpcUrl);
  }

  try {
    console.log(`🔍 [Verification] Checking transaction: ${txHash}`);
    const receipt = await providerInstance.getTransactionReceipt(txHash);

    if (!receipt || receipt.status !== 1) {
      return { success: false, message: "Transaction is pending or failed on-chain" };
    }

    // Đọc log của receipt để tìm event PaymentCompleted
    if (contractInstance) {
      for (const log of receipt.logs) {
        try {
          const parsedLog = contractInstance.interface.parseLog(log);
          if (parsedLog && parsedLog.name === "PaymentCompleted") {
            const { orderId, buyer, amount, timestamp } = parsedLog.args;
            await handlePaymentCompletedEvent(orderId, buyer, amount, timestamp, receipt, txHash);
            return {
              success: true,
              message: "Payment verified and synchronized from on-chain event",
              orderId: Number(orderId),
              txHash,
            };
          }
        } catch (e) {
          // Log không thuộc contract này, bỏ qua
        }
      }
    }

    // Nếu fallbackOrderId được truyền vào và receipt đã thành công
    if (fallbackOrderId) {
      const [orders] = await pool.query("SELECT * FROM orders WHERE id = ?", [fallbackOrderId]);
      if (orders.length > 0) {
        await pool.query(
          `UPDATE orders 
           SET status = 'PAID', 
               buyer_wallet = ?, 
               tx_hash = ?, 
               paid_at = NOW(), 
               is_deleted = 0 
           WHERE id = ?`,
          [receipt.from.toLowerCase(), txHash, fallbackOrderId]
        );
        return {
          success: true,
          message: "Payment verified and updated successfully",
          orderId: fallbackOrderId,
          txHash,
        };
      }
    }

    return { success: false, message: "Could not match event with order" };
  } catch (error) {
    console.error("Error verifying payment transaction:", error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  startBlockchainListener,
  handlePaymentCompletedEvent,
  verifyAndSyncPayment,
};
