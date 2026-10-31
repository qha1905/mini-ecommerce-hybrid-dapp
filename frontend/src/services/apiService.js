const API_BASE_URL = "http://localhost:5000/api";

export const apiService = {
  // ===================== AUTHENTICATION & SESSION =====================
  getAuthToken() {
    return localStorage.getItem("dapp_token");
  },

  setAuthToken(token) {
    if (token) {
      localStorage.setItem("dapp_token", token);
    } else {
      localStorage.removeItem("dapp_token");
    }
  },

  getStoredUser() {
    try {
      const data = localStorage.getItem("dapp_user");
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  setStoredUser(user) {
    if (user) {
      localStorage.setItem("dapp_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("dapp_user");
    }
  },

  clearAuth() {
    localStorage.removeItem("dapp_token");
    localStorage.removeItem("dapp_user");
  },

  async login(email, password) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Đăng nhập thất bại");
    if (json.token) this.setAuthToken(json.token);
    if (json.user) this.setStoredUser(json.user);
    return json;
  },

  async register(payload) {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Đăng ký thất bại");
    if (json.token) this.setAuthToken(json.token);
    if (json.user) this.setStoredUser(json.user);
    return json;
  },

  async getProfile() {
    const token = this.getAuthToken();
    if (!token) return null;
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      this.clearAuth();
      return null;
    }
    const json = await res.json();
    if (json.user) this.setStoredUser(json.user);
    return json.user;
  },

  async linkWallet(walletAddress) {
    const token = this.getAuthToken();
    if (!token) throw new Error("Chưa đăng nhập");
    const res = await fetch(`${API_BASE_URL}/auth/link-wallet`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ wallet_address: walletAddress }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Liên kết ví thất bại");
    return json;
  },

  // ===================== SẢN PHẨM =====================
  async getProducts(includeHidden = false) {
    try {
      const url = includeHidden ? `${API_BASE_URL}/products?includeHidden=true` : `${API_BASE_URL}/products`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      return data.data || [];
    } catch (error) {
      console.warn("Backend not reached for products, error:", error.message);
      return [];
    }
  },

  async createProduct(productData) {
    const res = await fetch(`${API_BASE_URL}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productData),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Tạo sản phẩm thất bại");
    return json;
  },

  async updateProduct(id, productData) {
    const res = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productData),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Cập nhật sản phẩm thất bại");
    return json;
  },

  async toggleProductVisibility(id) {
    const res = await fetch(`${API_BASE_URL}/products/${id}/toggle-visibility`, {
      method: "PATCH",
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Không thể thay đổi trạng thái ẩn/hiện sản phẩm");
    return json;
  },

  async deleteProduct(id) {
    const res = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Xóa sản phẩm thất bại");
    return json;
  },

  // ===================== UPLOAD FILE / ẢNH SẢN PHẨM =====================
  async uploadImage(file) {
    const formData = new FormData();
    formData.append("image", file);

    const token = this.getAuthToken();
    const headers = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}/upload`, {
      method: "POST",
      headers,
      body: formData,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Tải ảnh từ máy tính thất bại");
    return json.url;
  },

  // ===================== DANH MỤC =====================
  async getCategories(includeHidden = false) {
    try {
      const url = includeHidden ? `${API_BASE_URL}/categories?includeHidden=true` : `${API_BASE_URL}/categories`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data = await res.json();
      return data.data || [];
    } catch (error) {
      console.error("Error fetching categories:", error);
      return [];
    }
  },

  async createCategory(categoryData) {
    const res = await fetch(`${API_BASE_URL}/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(categoryData),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Tạo danh mục thất bại");
    return json;
  },

  async updateCategory(id, categoryData) {
    const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(categoryData),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Cập nhật danh mục thất bại");
    return json;
  },

  async toggleCategoryVisibility(id) {
    const res = await fetch(`${API_BASE_URL}/categories/${id}/toggle-visibility`, {
      method: "PATCH",
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Không thể thay đổi trạng thái ẩn/hiện danh mục");
    return json;
  },

  async deleteCategory(id) {
    const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Xóa danh mục thất bại");
    return json;
  },

  // ===================== NGƯỜI DÙNG =====================
  async getUsers() {
    try {
      const res = await fetch(`${API_BASE_URL}/users`);
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      return data.data || [];
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  },

  async createUser(userData) {
    const res = await fetch(`${API_BASE_URL}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Tạo người dùng thất bại");
    return json;
  },

  async updateUser(id, userData) {
    const res = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Cập nhật người dùng thất bại");
    return json;
  },

  async toggleUserVisibility(id) {
    const res = await fetch(`${API_BASE_URL}/users/${id}/toggle-visibility`, {
      method: "PATCH",
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Chuyển trạng thái người dùng thất bại");
    return json;
  },

  async deleteUser(id) {
    const res = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Ẩn người dùng thất bại");
    return json;
  },

  // ===================== ĐƠN HÀNG =====================
  async getOrders(userId = 1) {
    const url = userId ? `${API_BASE_URL}/orders?userId=${userId}` : `${API_BASE_URL}/orders`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch orders");
    const json = await res.json();
    return json.data || [];
  },

  async getAllAdminOrders(status = null) {
    const url = status ? `${API_BASE_URL}/orders?status=${status}` : `${API_BASE_URL}/orders`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch all orders for admin");
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

  async restoreOrder(orderId) {
    const res = await fetch(`${API_BASE_URL}/orders/${orderId}/restore`, {
      method: "PATCH",
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || "Không thể khôi phục đơn hàng");
    }
    return json;
  },

  // ===================== GIỎ HÀNG =====================
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

  // ===================== THỐNG KÊ ADMIN =====================
  async getAdminStats() {
    const res = await fetch(`${API_BASE_URL}/admin/stats`);
    if (!res.ok) throw new Error("Failed to fetch admin stats");
    const json = await res.json();
    return json.data;
  },

  // ===================== BLOCKCHAIN SYNC =====================
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
