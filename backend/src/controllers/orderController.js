/**
 * ==============================================================================
 * MODULE: ORDER CONTROLLER (QUẢN LÝ ĐƠN HÀNG & TỒN KHO)
 * ==============================================================================
 * Kỹ sư phụ trách: Khang (Member 2 - Backend Developer)
 * Chức năng:
 *   1. Tạo đơn hàng (Chống Race Condition tồn kho bằng Database Transaction và FOR UPDATE).
 *   2. Tính toán giá trị đơn hàng bằng BigInt Wei (ethers.js) chống sai số IEEE 754.
 *   3. Kiểm soát phân quyền & chống lỗ hổng IDOR (Insecure Direct Object Reference).
 *   4. Hủy đơn hàng an toàn (Tự động hoàn trả tồn kho, chặn hủy đơn đã thanh toán On-chain).
 *   5. Khôi phục đơn hàng xóa mềm cho Quản trị viên (Kiểm tra và trừ lại tồn kho).
 * ==============================================================================
 */

const { pool } = require("../config/db");
const { ethers } = require("ethers");

// Lấy danh sách đơn hàng (hỗ trợ lọc theo userId, hoặc lấy toàn bộ cho Admin)
async function getAllOrders(req, res) {
  try {
    const { userId, status } = req.query;

    let sql = `
      SELECT o.*, u.full_name AS user_name, u.email AS user_email
      FROM orders o
      JOIN users u ON o.user_id = u.id
    `;
    const params = [];
    const whereClauses = [];

    // Bảo mật: Nếu người dùng thông thường đã đăng nhập, chỉ cho phép xem đơn hàng của chính mình
    if (req.user && req.user.role !== "ADMIN") {
      whereClauses.push("o.user_id = ?");
      params.push(req.user.id);
    } else if (userId) {
      whereClauses.push("o.user_id = ?");
      params.push(userId);
    }

    if (status) {
      whereClauses.push("o.status = ?");
      params.push(status);
    }

    if (whereClauses.length > 0) {
      sql += " WHERE " + whereClauses.join(" AND ");
    }

    sql += " ORDER BY o.id DESC";

    const [orders] = await pool.query(sql, params);

    // Lấy chi tiết các sản phẩm trong từng đơn
    for (const order of orders) {
      const [items] = await pool.query(
        `SELECT oi.*, p.name AS product_name, p.image_url
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?`,
        [order.id]
      );
      order.items = items;
    }

    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
}

// Lấy chi tiết 1 đơn hàng theo ID
async function getOrderById(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM orders WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const order = rows[0];

    // Bảo mật phân quyền: Chỉ Admin hoặc chính chủ đơn hàng mới có quyền xem
    if (req.user && req.user.role !== "ADMIN" && order.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền truy cập đơn hàng của người dùng khác!",
      });
    }

    const [items] = await pool.query(
      `SELECT oi.*, p.name AS product_name, p.image_url
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [order.id]
    );
    order.items = items;

    res.json({ success: true, data: order });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
}

// Tạo đơn hàng mới từ giỏ hàng hoặc danh sách mặt hàng (Tự động trừ kho)
async function createOrder(req, res) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { fromCart = true, items = [] } = req.body;
    // Chống IDOR: Nếu có thông tin đăng nhập từ token thì dùng req.user.id
    const effectiveUserId = req.user && req.user.id ? req.user.id : req.body.userId || 1;

    let orderItemsToInsert = [];

    if (fromCart) {
      // Lấy từ cart_items trong CSDL (khóa dòng sản phẩm để đảm bảo tính nhất quán tồn kho)
      const [cartRows] = await connection.query(
        `SELECT c.product_id, c.quantity, p.name AS product_name, p.price_eth, p.stock, p.is_active
         FROM cart_items c
         JOIN products p ON c.product_id = p.id
         WHERE c.user_id = ?
         FOR UPDATE`,
        [effectiveUserId]
      );

      if (cartRows.length === 0) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: "Giỏ hàng đang trống!" });
      }

      orderItemsToInsert = cartRows;
    } else {
      // Nhận trực tiếp items truyền vào
      if (!items || items.length === 0) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: "Danh sách sản phẩm không được trống!" });
      }

      for (const item of items) {
        const [pRows] = await connection.query(
          "SELECT id, name AS product_name, price_eth, stock, is_active FROM products WHERE id = ? FOR UPDATE",
          [item.productId]
        );
        if (pRows.length === 0) {
          await connection.rollback();
          return res.status(404).json({ success: false, message: `Không tìm thấy sản phẩm #${item.productId}` });
        }
        orderItemsToInsert.push({
          product_id: item.productId,
          product_name: pRows[0].product_name,
          quantity: item.quantity || 1,
          price_eth: pRows[0].price_eth,
          stock: pRows[0].stock,
          is_active: pRows[0].is_active,
        });
      }
    }

    // 1. Kiểm tra trạng thái kinh doanh & tồn kho + Tính tổng tiền bằng BigInt Wei (chống sai số IEEE 754)
    let totalWei = 0n;
    for (const item of orderItemsToInsert) {
      if (item.is_active === 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Sản phẩm "${item.product_name}" hiện đang tạm ngừng kinh doanh (đã ẩn khỏi cửa hàng)!`,
        });
      }
      if (item.stock < item.quantity) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Sản phẩm "${item.product_name}" không đủ số lượng tồn kho (Hiện có: ${item.stock}, Đặt mua: ${item.quantity})!`,
        });
      }

      // Tính tổng ETH chính xác tuyệt đối qua ethers.js BigInt Wei
      const formattedPrice = parseFloat(item.price_eth).toFixed(8);
      const itemPriceWei = ethers.parseEther(formattedPrice);
      totalWei += itemPriceWei * BigInt(item.quantity);
    }

    const totalAmountEthStr = ethers.formatEther(totalWei);

    // 2. Tạo bản ghi đơn hàng với trạng thái PENDING và is_deleted = 0
    const [orderResult] = await connection.query(
      `INSERT INTO orders (user_id, total_amount_eth, status, is_deleted)
       VALUES (?, ?, 'PENDING', 0)`,
      [effectiveUserId, totalAmountEthStr]
    );

    const orderId = orderResult.insertId;

    // 3. Chèn chi tiết order_items VÀ TỰ ĐỘNG TRỪ TỒN KHO SẢN PHẨM
    for (const item of orderItemsToInsert) {
      await connection.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price_eth)
         VALUES (?, ?, ?, ?)`,
        [orderId, item.product_id, item.quantity, item.price_eth]
      );

      // Tự động trừ kho
      await connection.query(
        "UPDATE products SET stock = stock - ? WHERE id = ?",
        [item.quantity, item.product_id]
      );
    }

    // 4. Nếu tạo từ giỏ hàng thì xóa sạch giỏ hàng của user
    if (fromCart) {
      await connection.query("DELETE FROM cart_items WHERE user_id = ?", [effectiveUserId]);
    }

    await connection.commit();

    console.log(`📦 [Order Created & Stock Deducted] Đơn hàng #${orderId} | Tổng: ${totalAmountEthStr} ETH | Tồn kho đã tự động trừ.`);

    res.status(201).json({
      success: true,
      message: "Order created successfully (Pending Payment)",
      data: {
        orderId,
        totalAmountEth: totalAmountEthStr,
        status: "PENDING",
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error creating order:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  } finally {
    connection.release();
  }
}

/**
 * Hủy (xóa mềm) cho các đơn hàng có trạng thái PENDING: TỰ ĐỘNG CỘNG LẠI TỒN KHO
 */
async function cancelOrSoftDeleteOrder(req, res) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;

    const [rows] = await connection.query("SELECT * FROM orders WHERE id = ? FOR UPDATE", [id]);
    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: `Đơn hàng #${id} không tồn tại trên hệ thống.`,
      });
    }

    const order = rows[0];

    // Bảo mật: Kiểm tra quyền hủy (Chỉ Admin hoặc chính chủ đơn hàng)
    if (req.user && req.user.role !== "ADMIN" && order.user_id !== req.user.id) {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền hủy đơn hàng của người dùng khác!",
      });
    }

    // Không cho phép hủy đơn hàng đã thanh toán PAID on-chain
    if (order.status === "PAID") {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Không thể hủy đơn hàng đã thanh toán On-chain trên Smart Contract (Chính sách bất biến Blockchain)!",
      });
    }

    // Nếu đơn hàng đã bị hủy trước đó
    if (order.status === "CANCELLED" || order.is_deleted === 1) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Đơn hàng #${id} đã được hủy trước đó rồi.`,
      });
    }

    // Lấy danh sách sản phẩm trong đơn hàng để tự động cộng hoàn lại tồn kho
    const [orderItems] = await connection.query(
      "SELECT product_id, quantity FROM order_items WHERE order_id = ?",
      [id]
    );

    // Tự động cộng hoàn lại tồn kho cho từng sản phẩm
    for (const item of orderItems) {
      await connection.query(
        "UPDATE products SET stock = stock + ? WHERE id = ?",
        [item.quantity, item.product_id]
      );
    }

    // Thực hiện xóa mềm và đổi trạng thái sang CANCELLED
    await connection.query(
      "UPDATE orders SET status = 'CANCELLED', is_deleted = 1, deleted_at = NOW() WHERE id = ?",
      [id]
    );

    await connection.commit();

    console.log(`🗑️ [Order Cancelled & Stock Restored] Đơn hàng #${id} đã hủy. Đã tự động cộng lại tồn kho.`);

    return res.json({
      success: true,
      message: `Đã hủy đơn hàng #${id} thành công (xóa mềm) và tự động hoàn trả số lượng vào tồn kho.`,
      data: { id: parseInt(id), status: "CANCELLED", is_deleted: 1 },
    });
  } catch (error) {
    await connection.rollback();
    console.error("Lỗi khi hủy đơn hàng:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống khi hủy đơn hàng",
      error: error.message,
    });
  } finally {
    connection.release();
  }
}

// Khôi phục đơn hàng đã xóa mềm (Dành cho Quản trị viên đối soát) - TỰ ĐỘNG TRỪ LẠI KHO
async function restoreOrder(req, res) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const [rows] = await connection.query("SELECT * FROM orders WHERE id = ? FOR UPDATE", [id]);
    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Đơn hàng không tồn tại." });
    }

    const order = rows[0];
    if (order.status === "PAID") {
      await connection.rollback();
      return res.status(400).json({ success: false, message: "Đơn hàng PAID không thể thao tác khôi phục." });
    }

    if (order.status !== "CANCELLED" && order.is_deleted === 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: "Đơn hàng đang hoạt động bình thường." });
    }

    // Lấy chi tiết các sản phẩm trong đơn để kiểm tra tồn kho
    const [orderItems] = await connection.query(
      `SELECT oi.product_id, oi.quantity, p.name AS product_name, p.stock
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?
       FOR UPDATE`,
      [id]
    );

    // Kiểm tra xem kho còn đủ để khôi phục không
    for (const item of orderItems) {
      if (item.stock < item.quantity) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Không thể khôi phục: Sản phẩm "${item.product_name}" không đủ tồn kho (Hiện có: ${item.stock}, Đơn hàng cần: ${item.quantity}).`,
        });
      }
    }

    // Trừ lại kho tương ứng khi phục hồi đơn hàng
    for (const item of orderItems) {
      await connection.query(
        "UPDATE products SET stock = stock - ? WHERE id = ?",
        [item.quantity, item.product_id]
      );
    }

    await connection.query(
      "UPDATE orders SET status = 'PENDING', is_deleted = 0, deleted_at = NULL WHERE id = ?",
      [id]
    );

    await connection.commit();

    console.log(`♻️ [Order Restored & Stock Deducted] Đơn hàng #${id} đã khôi phục về PENDING. Kho đã trừ lại.`);

    res.json({
      success: true,
      message: `Đơn hàng #${id} đã được phục hồi về trạng thái PENDING thành công (đã trừ tồn kho tương ứng).`,
      data: { id: parseInt(id), status: "PENDING", is_deleted: 0 },
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error restoring order:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  } finally {
    connection.release();
  }
}

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  cancelOrSoftDeleteOrder,
  restoreOrder,
};
