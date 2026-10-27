const { pool } = require("../config/db");

// Lấy danh sách toàn bộ đơn hàng (Sổ cái bất biến - không lọc xóa mềm)
async function getAllOrders(req, res) {
  try {
    const userId = req.query.userId || 1;

    const sql = `
      SELECT o.*, u.full_name AS user_name, u.email AS user_email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.user_id = ?
      ORDER BY o.id DESC
    `;

    const [orders] = await pool.query(sql, [userId]);

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

// Tạo đơn hàng mới từ giỏ hàng hoặc danh sách mặt hàng (Trạng thái mặc định: PENDING)
async function createOrder(req, res) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { userId = 1, fromCart = true, items = [] } = req.body;
    let orderItemsToInsert = [];
    let totalAmountEth = 0;

    if (fromCart) {
      // Lấy từ cart_items trong CSDL
      const [cartRows] = await connection.query(
        `SELECT c.product_id, c.quantity, p.price_eth, p.stock
         FROM cart_items c
         JOIN products p ON c.product_id = p.id
         WHERE c.user_id = ?`,
        [userId]
      );

      if (cartRows.length === 0) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: "Cart is empty" });
      }

      orderItemsToInsert = cartRows;
    } else {
      // Nhận trực tiếp items truyền vào
      if (!items || items.length === 0) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: "Items list cannot be empty" });
      }

      for (const item of items) {
        const [pRows] = await connection.query("SELECT price_eth, stock FROM products WHERE id = ?", [item.productId]);
        if (pRows.length === 0) {
          await connection.rollback();
          return res.status(404).json({ success: false, message: `Product ${item.productId} not found` });
        }
        orderItemsToInsert.push({
          product_id: item.productId,
          quantity: item.quantity || 1,
          price_eth: pRows[0].price_eth,
        });
      }
    }

    // Tính tổng tiền ETH
    for (const item of orderItemsToInsert) {
      totalAmountEth += parseFloat(item.price_eth) * item.quantity;
    }

    // Tạo bản ghi đơn hàng với trạng thái PENDING và is_deleted = 0
    const [orderResult] = await connection.query(
      `INSERT INTO orders (user_id, total_amount_eth, status, is_deleted)
       VALUES (?, ?, 'PENDING', 0)`,
      [userId, totalAmountEth.toFixed(8)]
    );

    const orderId = orderResult.insertId;

    // Chèn chi tiết các dòng order_items
    for (const item of orderItemsToInsert) {
      await connection.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price_eth)
         VALUES (?, ?, ?, ?)`,
        [orderId, item.product_id, item.quantity, item.price_eth]
      );
    }

    // Nếu tạo từ giỏ hàng thì xóa sạch giỏ hàng của user
    if (fromCart) {
      await connection.query("DELETE FROM cart_items WHERE user_id = ?", [userId]);
    }

    await connection.commit();

    console.log(`📦 [Order Created] OrderID: ${orderId} | Total: ${totalAmountEth.toFixed(8)} ETH | Status: PENDING`);

    res.status(201).json({
      success: true,
      message: "Order created successfully (Pending Payment)",
      data: {
        orderId,
        totalAmountEth: totalAmountEth.toFixed(8),
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
 * Chặn hoàn toàn tính năng hủy hoặc xóa đơn hàng (Chính sách Bất biến - Immutability)
 */
async function cancelOrSoftDeleteOrder(req, res) {
  return res.status(403).json({
    success: false,
    message: "Chính sách bất biến (Immutability): Mọi đơn hàng một khi đã được tạo đều không thể hủy, xóa mềm hoặc thay đổi dưới bất kỳ hình thức nào!",
  });
}

// Khôi phục đơn hàng đã xóa mềm (Dành cho Quản trị viên đối soát)
async function restoreOrder(req, res) {
  try {
    const { id } = req.params;
    const [result] = await pool.query(
      "UPDATE orders SET is_deleted = 0, deleted_at = NULL WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.json({ success: true, message: `Đơn hàng #${id} đã được phục hồi thành công.` });
  } catch (error) {
    console.error("Error restoring order:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
}

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  cancelOrSoftDeleteOrder,
  restoreOrder,
};
