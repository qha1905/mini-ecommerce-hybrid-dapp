const { pool } = require("../config/db");

// Lấy giỏ hàng của người dùng kèm thông tin sản phẩm
async function getCartByUser(req, res) {
  try {
    const userId = req.params.userId || 1; // Default user 1
    const [rows] = await pool.query(
      `SELECT c.id AS cart_item_id, c.user_id, c.product_id, c.quantity,
              p.name, p.price_eth, p.image_url, p.stock,
              (c.quantity * p.price_eth) AS item_total_eth
       FROM cart_items c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = ?
       ORDER BY c.created_at DESC`,
      [userId]
    );

    const totalEth = rows.reduce((sum, item) => sum + parseFloat(item.item_total_eth || 0), 0);

    res.json({
      success: true,
      data: {
        items: rows,
        totalItems: rows.reduce((sum, item) => sum + item.quantity, 0),
        totalAmountEth: totalEth.toFixed(8),
      },
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
}

// Thêm sản phẩm vào giỏ hàng
async function addToCart(req, res) {
  try {
    const { userId = 1, productId, quantity = 1 } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, message: "productId is required" });
    }

    // Kiểm tra sản phẩm có tồn tại và còn hàng không
    const [products] = await pool.query("SELECT * FROM products WHERE id = ?", [productId]);
    if (products.length === 0) {
      return res.status(404).json({ success: false, message: "Sản phẩm không tồn tại" });
    }
    const product = products[0];
    if (product.stock <= 0) {
      return res.status(400).json({ success: false, message: `Sản phẩm "${product.name}" hiện đã hết hàng trong kho!` });
    }

    // UPSERT vào cart_items
    await pool.query(
      `INSERT INTO cart_items (user_id, product_id, quantity) 
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
      [userId, productId, quantity]
    );

    res.json({ success: true, message: "Product added to cart successfully" });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
}

// Cập nhật số lượng trong giỏ
async function updateCartItem(req, res) {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity <= 0) {
      await pool.query("DELETE FROM cart_items WHERE id = ?", [id]);
      return res.json({ success: true, message: "Cart item removed" });
    }

    const [result] = await pool.query("UPDATE cart_items SET quantity = ? WHERE id = ?", [quantity, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Cart item not found" });
    }

    res.json({ success: true, message: "Cart item updated successfully" });
  } catch (error) {
    console.error("Error updating cart item:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
}

// Xóa 1 mặt hàng khỏi giỏ
async function removeCartItem(req, res) {
  try {
    const { id } = req.params;
    const [result] = await pool.query("DELETE FROM cart_items WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Cart item not found" });
    }
    res.json({ success: true, message: "Cart item removed successfully" });
  } catch (error) {
    console.error("Error removing cart item:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
}

// Làm trống giỏ hàng
async function clearCart(req, res) {
  try {
    const userId = req.params.userId || 1;
    await pool.query("DELETE FROM cart_items WHERE user_id = ?", [userId]);
    res.json({ success: true, message: "Cart cleared successfully" });
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
}

module.exports = {
  getCartByUser,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};
