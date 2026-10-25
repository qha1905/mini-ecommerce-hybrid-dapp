const API_BASE_URL = "http://localhost:5000/api";

export const apiService = {
  // Sản phẩm
  async getProducts() {
    try {
      const res = await fetch(`${API_BASE_URL}/products`);
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      return data.data || [];
    } catch (error) {
      console.warn("Backend not reached for products, using fallback sample items:", error.message);
      return [
        {
          id: 1,
          name: "Ledger Nano X Web3 Hardware Wallet",
          description: "Ví lạnh bảo mật khóa riêng tư tối đa, hỗ trợ kết nối Bluetooth và hơn 5,500 token crypto.",
          price_eth: "0.00050000",
          image_url: "https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?auto=format&fit=crop&w=800&q=80",
          stock: 25,
        },
        {
          id: 2,
          name: "Cyberpunk Mechanical Keyboard",
          description: "Bàn phím cơ thiết kế Cyberpunk tích hợp đèn RGB chuyển màu và keycap xuyên led PBT cao cấp.",
          price_eth: "0.00080000",
          image_url: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80",
          stock: 15,
        },
        {
          id: 3,
          name: "Exclusive Web3 Genesis NFT Hoodie",
          description: "Áo Hoodie phiên bản giới hạn kỷ niệm khởi chạy mạng Web3, vải cotton nỉ 100% thoáng mát.",
          price_eth: "0.00030000",
          image_url: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80",
          stock: 50,
        },
        {
          id: 4,
          name: "Ethereum Crystal Hologram Lamp",
          description: "Đèn decor biểu tượng Ethereum hiệu ứng Hologram 3D phát sáng nhiều chế độ màu.",
          price_eth: "0.00020000",
          image_url: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80",
          stock: 40,
        },
        {
          id: 5,
          name: "Smart Hardware Security Key FIDO2",
          description: "Khóa bảo mật vật lý chống phishing 2FA/WebAuthn chuẩn bảo mật quốc tế.",
          price_eth: "0.00040000",
          image_url: "https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=800&q=80",
          stock: 30,
        },
      ];
    }
  },

  // Giỏ hàng
  async getCart(userId = 1) {
    const res = await fetch(`${API_BASE_URL}/cart/${userId}`);
    if (!res.ok) throw new Error("Failed to fetch cart");
    return res.json();
  },

  async addToCart(productId, quantity = 1, userId = 1) {
    const res = await fetch(`${API_BASE_URL}/cart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, productId, quantity }),
    });
    return res.json();
  },

  async updateCartItem(cartItemId, quantity) {
    const res = await fetch(`${API_BASE_URL}/cart/${cartItemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    });
    return res.json();
  },

  async removeCartItem(cartItemId) {
    const res = await fetch(`${API_BASE_URL}/cart/item/${cartItemId}`, {
      method: "DELETE",
    });
    return res.json();
  },

  async clearCart(userId = 1) {
    const res = await fetch(`${API_BASE_URL}/cart/clear/${userId}`, {
      method: "DELETE",
    });
    return res.json();
  },

  // Đơn hàng
  async getOrders(userId = 1, includeDeleted = false) {
    const res = await fetch(`${API_BASE_URL}/orders?userId=${userId}&includeDeleted=${includeDeleted}`);
    if (!res.ok) throw new Error("Failed to fetch orders");
    const json = await res.json();
    return json.data || [];
  },

  async createOrder(payload) {
    const res = await fetch(`${API_BASE_URL}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || "Failed to create order");
    }
    return json;
  },

  async cancelOrder(orderId) {
    const res = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || "Không thể hủy đơn hàng");
    }
    return json;
  },

  // Xác thực đồng bộ tức thì với Backend sau khi MetaMask gửi tx
  async verifyPayment(txHash, orderId) {
    try {
      const res = await fetch(`${API_BASE_URL}/blockchain/verify-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash, orderId }),
      });
      return await res.json();
    } catch (e) {
      console.warn("Manual sync endpoint error:", e);
      return { success: false, error: e.message };
    }
  },
};
