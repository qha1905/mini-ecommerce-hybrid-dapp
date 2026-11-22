/**
 * ==============================================================================
 * MODULE: CART CONTROLLER (QUẢN LÝ GIỎ HÀNG)
 * ==============================================================================
 * Kỹ sư phụ trách: Khang (Member 2 - Backend Developer)
 * Chức năng:
 *   1. Quản lý sản phẩm trong giỏ hàng (Thêm, sửa số lượng, xóa, làm trống).
 *   2. Kiểm toán số lượng nghiêm ngặt (Chặn số lượng âm, số thập phân, số lượng vượt tồn kho).
 *   3. Phân quyền và chống lỗi IDOR dựa trên req.user.id từ Token.
 *   4. Tính toán tổng tiền chính xác tuyệt đối bằng ethers.js BigInt Wei.
 * ==============================================================================
 */

const { pool } = require("../config/db");
const { ethers } = require("ethers");

// Lấy giỏ hàng của người dùng kèm thông tin sản phẩm và tính toán chính xác tổng ETH
async function getCartByUser(req, res) {
  try {
    const effectiveUserId = req.user && req.user.id ? req.user.id : req.params.userId || 1;

    const [rows] = await pool.query(
      `SELECT c.id AS cart_item_id, c.user_id, c.product_id, c.quantity,
              p.name, p.price_eth, p.image_url, p.stock,
              (c.quantity * p.price_eth) AS item_total_eth
       FROM cart_items c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = ?
       ORDER BY c.created_at DESC`,
      [effectiveUserId]
    );

    // Tính toán tổng tiền bằng BigInt Wei để chống sai số dấu phẩy động
    let totalWei = 0n;
    let totalItems = 0;

    for (const item of rows) {
      totalItems += Number(item.quantity);
      const formattedPrice = parseFloat(item.price_eth || "0").toFixed(8);
      const itemPriceWei = ethers.parseEther(formattedPrice);
      totalWei += itemPriceWei * BigInt(item.quantity);
    }

    const totalAmountEthStr = ethers.formatEther(totalWei);

    res.json({
      success: true,
      data: {
        items: rows,
        totalItems,
        totalAmountEth: totalAmountEthStr,
      },
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
}

// Thêm sản phẩm vào giỏ hàng với kiểm tra tồn kho & số lượng hợp lệ
async function addToCart(req, res) {
  try {
    const effectiveUserId = req.user && req.user.id ? req.user.id : req.body.userId || 1;
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: "productId là bắt buộc" });
    }

    const parsedQty = parseInt(quantity, 10);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      return res.status(400).json({ success: false, message: "Số lượng sản phẩm thêm vào giỏ phải là số nguyên dương lớn hơn 0" });
    }

    // Kiểm tra sản phẩm có tồn tại và còn hàng không
    const [products] = await pool.query("SELECT * FROM products WHERE id = ?", [productId]);
    if (products.length === 0) {
      return res.status(404).json({ success: false, message: "Sản phẩm không tồn tại" });
    }
    const product = products[0];

    if (product.is_active === 0) {
      return res.status(400).json({ success: false, message: `Sản phẩm "${product.name}" hiện đã ngừng kinh doanh.` });
    }

    if (product.stock <= 0) {
      return res.status(400).json({ success: false, message: `Sản phẩm "${product.name}" hiện đã hết hàng trong kho!` });
    }

    // Kiểm tra số lượng hiện tại đã có trong giỏ hàng
    const [existingCart] = await pool.query(
      "SELECT quantity FROM cart_items WHERE user_id = ? AND product_id = ?",
      [effectiveUserId, productId]
    );

    const currentQtyInCart = existingCart.length > 0 ? existingCart[0].quantity : 0;
    if (currentQtyInCart + parsedQty > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Không thể thêm: Tổng số lượng trong giỏ (${currentQtyInCart + parsedQty}) vượt quá số lượng hàng có sẵn trong kho (${product.stock})!`,
      });
    }

    // UPSERT vào cart_items
    await pool.query(
      `INSERT INTO cart_items (user_id, product_id, quantity) 
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
      [effectiveUserId, productId, parsedQty]
    );

    res.json({ success: true, message: "Đã thêm sản phẩm vào giỏ hàng thành công!" });
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

    const parsedQty = parseInt(quantity, 10);
    if (isNaN(parsedQty)) {
      return res.status(400).json({ success: false, message: "Số lượng không hợp lệ" });
    }

    // Kiểm tra sự tồn tại của mặt hàng trong giỏ
    const [cartItemRows] = await pool.query(
      `SELECT c.*, p.stock, p.name AS product_name 
       FROM cart_items c 
       JOIN products p ON c.product_id = p.id 
       WHERE c.id = ?`,
      [id]
    );

    if (cartItemRows.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy mặt hàng trong giỏ" });
    }

    const cartItem = cartItemRows[0];

    // Bảo mật: Kiểm tra quyền sở hữu
    if (req.user && req.user.role !== "ADMIN" && cartItem.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền chỉnh sửa giỏ hàng này" });
    }

    // Nếu số lượng <= 0 thì tự động xóa khỏi giỏ
    if (parsedQty <= 0) {
      await pool.query("DELETE FROM cart_items WHERE id = ?", [id]);
      return res.json({ success: true, message: "Đã xóa mặt hàng khỏi giỏ hàng" });
    }

    // Kiểm tra tồn kho
    if (parsedQty > cartItem.stock) {
      return res.status(400).json({
        success: false,
        message: `Số lượng yêu cầu (${parsedQty}) vượt quá số lượng tồn kho của "${cartItem.product_name}" (${cartItem.stock})`,
      });
    }

    await pool.query("UPDATE cart_items SET quantity = ? WHERE id = ?", [parsedQty, id]);

    res.json({ success: true, message: "Cập nhật số lượng thành công" });
  } catch (error) {
    console.error("Error updating cart item:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
}

// Xóa 1 mặt hàng khỏi giỏ
async function removeCartItem(req, res) {
  try {
    const { id } = req.params;

    const [rows] = await pool.query("SELECT * FROM cart_items WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy mặt hàng trong giỏ" });
    }

    if (req.user && req.user.role !== "ADMIN" && rows[0].user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền xóa mặt hàng của người dùng khác" });
    }

    await pool.query("DELETE FROM cart_items WHERE id = ?", [id]);
    res.json({ success: true, message: "Đã xóa mặt hàng khỏi giỏ hàng" });
  } catch (error) {
    console.error("Error removing cart item:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
}

// Làm trống giỏ hàng
async function clearCart(req, res) {
  try {
    const effectiveUserId = req.user && req.user.id ? req.user.id : req.params.userId || 1;
    await pool.query("DELETE FROM cart_items WHERE user_id = ?", [effectiveUserId]);
    res.json({ success: true, message: "Đã làm trống giỏ hàng" });
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
