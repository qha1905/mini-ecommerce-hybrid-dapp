const { pool } = require("../config/db");

// Lấy số liệu thống kê tổng quan (Dashboard Overview)
async function getAdminStats(req, res) {
  try {
    // 1. Thống kê đơn hàng và doanh thu ETH
    const [orderStats] = await pool.query(`
      SELECT 
        COUNT(*) AS total_orders,
        COALESCE(SUM(CASE WHEN status = 'PAID' THEN 1 ELSE 0 END), 0) AS paid_orders,
        COALESCE(SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END), 0) AS pending_orders,
        COALESCE(SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END), 0) AS cancelled_orders,
        COALESCE(SUM(CASE WHEN status = 'PAID' THEN total_amount_eth ELSE 0 END), 0) AS total_revenue_eth
      FROM orders
    `);

    // 2. Thống kê sản phẩm và kho hàng
    const [productStats] = await pool.query(`
      SELECT 
        COUNT(*) AS total_products,
        COALESCE(SUM(stock), 0) AS total_stock,
        COALESCE(SUM(CASE WHEN stock <= 5 THEN 1 ELSE 0 END), 0) AS low_stock_products
      FROM products
    `);

    // 3. Thống kê danh mục
    const [categoryStats] = await pool.query(`
      SELECT COUNT(*) AS total_categories FROM categories
    `);

    // 4. Thống kê người dùng
    const [userStats] = await pool.query(`
      SELECT COUNT(*) AS total_users FROM users
    `);

    // 5. Đơn hàng mới nhất (Top 5)
    const [recentOrders] = await pool.query(`
      SELECT o.*, u.full_name AS user_name, u.email AS user_email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.id DESC
      LIMIT 5
    `);

    // 6. Sản phẩm bán chạy nhất
    const [topProducts] = await pool.query(`
      SELECT 
        p.id, 
        p.name, 
        p.price_eth, 
        p.image_url,
        COALESCE(SUM(oi.quantity), 0) AS units_sold,
        COALESCE(SUM(oi.quantity * oi.unit_price_eth), 0) AS total_earned_eth
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.status = 'PAID'
      GROUP BY p.id
      ORDER BY units_sold DESC, p.id ASC
      LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        revenueEth: parseFloat(orderStats[0].total_revenue_eth || 0).toFixed(6),
        totalOrders: Number(orderStats[0].total_orders || 0),
        paidOrders: Number(orderStats[0].paid_orders || 0),
        pendingOrders: Number(orderStats[0].pending_orders || 0),
        cancelledOrders: Number(orderStats[0].cancelled_orders || 0),
        totalProducts: Number(productStats[0].total_products || 0),
        totalStock: Number(productStats[0].total_stock || 0),
        lowStockProducts: Number(productStats[0].low_stock_products || 0),
        totalCategories: Number(categoryStats[0].total_categories || 0),
        totalUsers: Number(userStats[0].total_users || 0),
        recentOrders,
        topProducts,
      },
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
}

module.exports = {
  getAdminStats,
};
