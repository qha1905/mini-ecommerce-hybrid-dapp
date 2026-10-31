import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import ProductCard from "./components/ProductCard";
import ProductModal from "./components/ProductModal";
import CartDrawer from "./components/CartDrawer";
import OrderHistory from "./components/OrderHistory";
import TransactionModal from "./components/TransactionModal";
import AdminDashboard from "./components/AdminDashboard";
import AuthModal from "./components/AuthModal";
import { apiService } from "./services/apiService";
import { web3Service } from "./services/web3Service";
import { Sparkles, Shield, Cpu, Database, CheckCircle2, ShoppingBag, ShieldCheck } from "lucide-react";

export default function App() {
  const [walletInfo, setWalletInfo] = useState(null);
  const [currentUser, setCurrentUser] = useState(() => apiService.getStoredUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({ items: [], totalItems: 0, totalAmountEth: "0.00000000" });
  const [orders, setOrders] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    const user = apiService.getStoredUser();
    return user && user.role === "ADMIN" ? "admin" : "products";
  });
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Trạng thái modal giao dịch Web3
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txState, setTxState] = useState({
    status: "PROCESSING", // "PROCESSING" | "SUCCESS" | "ERROR"
    message: "",
    txHash: null,
    orderId: null,
    error: null,
  });

  // Tải dữ liệu ban đầu
  useEffect(() => {
    loadProducts();
    const effectiveUserId = currentUser?.id || 1;
    loadCart(effectiveUserId);
    loadOrders(effectiveUserId);

    // Xác thực token nền để refresh thông tin mới nhất nếu còn hạn
    if (apiService.getAuthToken()) {
      apiService.getProfile().then((profile) => {
        if (profile) setCurrentUser(profile);
      });
    }

    // Chỉ lắng nghe thay đổi tài khoản hoặc mạng trong MetaMask nếu người dùng ĐÃ đăng nhập
    if (web3Service.isInstalled()) {
      window.ethereum.on?.("accountsChanged", (accounts) => {
        if (accounts.length === 0) {
          setWalletInfo(null);
        } else {
          if (apiService.getStoredUser()) {
            handleConnectWallet();
          } else {
            setWalletInfo(null);
          }
        }
      });
      window.ethereum.on?.("chainChanged", () => {
        web3Service.provider = null;
        if (apiService.getStoredUser()) {
          handleConnectWallet();
          loadOrders(currentUser?.id || 1);
        } else {
          setWalletInfo(null);
        }
      });
    }
  }, []);

  const loadProducts = async () => {
    try {
      const data = await apiService.getProducts();
      setProducts(data);
    } catch (err) {
      console.error("Failed to load products:", err);
    }
  };

  const loadCart = async (userId = currentUser?.id || 1) => {
    try {
      const data = await apiService.getCart(userId);
      if (data.data) {
        setCart(data.data);
      }
    } catch (err) {
      console.warn("Failed to load cart from backend:", err.message);
    }
  };

  const loadOrders = async (userId = currentUser?.id || 1) => {
    setIsLoadingOrders(true);
    try {
      const data = await apiService.getOrders(userId);
      setOrders(data);
    } catch (err) {
      console.warn("Failed to load orders from backend:", err.message);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  // Đăng nhập / Đăng ký thành công
  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    const userId = user.id;
    loadCart(userId);
    loadOrders(userId);

    // Phân tách điều hướng: Admin vào trang Quản trị, Khách hàng vào Cửa hàng
    if (user.role === "ADMIN") {
      setActiveTab("admin");
    } else {
      setActiveTab("products");
    }
  };

  // Đăng xuất
  const handleLogout = () => {
    apiService.clearAuth();
    setCurrentUser(null);
    setWalletInfo(null); // Xóa thông tin ví để ngắt hiển thị hoàn toàn khi chưa đăng nhập
    setActiveTab("products");
    loadCart(1);
    loadOrders(1);
  };

  // Kết nối MetaMask
  const handleConnectWallet = async () => {
    // Chưa đăng nhập thì không cho liên kết ví: chuyển tới modal Đăng nhập
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    try {
      const info = await web3Service.connect();
      setWalletInfo(info);

      // Nếu đang đăng nhập, liên kết địa chỉ ví này vào tài khoản người dùng
      if (info.address) {
        apiService.linkWallet(info.address).catch((e) => console.warn(e));
      }
    } catch (err) {
      alert(err.message || "Không thể kết nối ví MetaMask");
    }
  };

  // Thao tác giỏ hàng
  const handleAddToCart = async (product) => {
    // Nếu chưa đăng nhập: lập tức đưa khách hàng tới trang đăng nhập
    if (!currentUser) {
      if (selectedProduct) setSelectedProduct(null);
      setIsAuthModalOpen(true);
      return;
    }

    const userId = currentUser.id;
    try {
      await apiService.addToCart(product.id, 1, userId);
      await loadCart(userId);
      setIsCartOpen(true);
    } catch (err) {
      alert("Không thể thêm vào giỏ hàng: " + err.message);
    }
  };

  const handleUpdateQuantity = async (cartItemId, newQty) => {
    const userId = currentUser?.id || 1;
    try {
      await apiService.updateCartItem(cartItemId, newQty);
      await loadCart(userId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveCartItem = async (cartItemId) => {
    const userId = currentUser?.id || 1;
    try {
      await apiService.removeCartItem(cartItemId);
      await loadCart(userId);
    } catch (err) {
      console.error(err);
    }
  };

  // Luồng thanh toán Web3 chính (Từ Giỏ Hàng)
  const handleCheckout = async () => {
    // Nếu chưa đăng nhập, mở modal Đăng nhập trước
    if (!currentUser) {
      setIsCartOpen(false);
      setIsAuthModalOpen(true);
      return;
    }

    if (!walletInfo) {
      await handleConnectWallet();
      return;
    }

    if (!cart.items || cart.items.length === 0) {
      alert("Giỏ hàng của bạn đang trống!");
      return;
    }

    const userId = currentUser.id;
    setIsCheckingOut(true);
    setIsCartOpen(false);
    setIsTxModalOpen(true);
    setTxState({
      status: "PROCESSING",
      message: "Bước 1/3: Đang gửi yêu cầu tạo đơn hàng Off-chain tới Backend...",
      txHash: null,
      orderId: null,
      error: null,
    });

    try {
      // 1. Tạo đơn hàng PENDING trong MySQL thông qua Backend API
      const orderRes = await apiService.createOrder({
        userId,
        fromCart: true,
      });

      const orderId = orderRes.data.orderId;
      const totalAmountEth = orderRes.data.totalAmountEth;

      // Cập nhật lại giỏ hàng và số lượng tồn kho tức thì
      await loadCart(userId);
      await loadProducts();

      setTxState({
        status: "PROCESSING",
        message: `Bước 2/3: Đơn hàng #${orderId} đã được tạo với trạng thái 'PENDING'. Vui lòng xác nhận giao dịch trên ví MetaMask...`,
        orderId,
        txHash: null,
        error: null,
      });

      // 2. Kích hoạt MetaMask để gọi payOrder trên Smart Contract
      const { txHash } = await web3Service.payOrder(
        orderId,
        totalAmountEth,
        (progress) => {
          if (progress.step === "TRANSACTION_SENT") {
            setTxState((prev) => ({
              ...prev,
              message: "Bước 3/3: Giao dịch đã phát lên Blockchain! Đang chờ khối được xác nhận...",
              txHash: progress.txHash,
            }));
          }
        }
      );

      // 3. Thông báo cho Backend Event Listener đồng bộ tức thì
      setTxState((prev) => ({
        ...prev,
        message: "Smart Contract đã Emit Event PaymentCompleted! Đang đồng bộ trạng thái vào MySQL...",
        txHash,
      }));

      const syncResult = await apiService.verifyPayment(txHash, orderId);
      if (!syncResult || !syncResult.success) {
        throw new Error(syncResult?.message || "Giao dịch không khớp với Smart Contract trên mạng Blockchain mà Backend đang quản lý!");
      }

      // 4. Hoàn tất & tải lại dữ liệu mới nhất
      await loadCart(userId);
      await loadOrders(userId);
      await loadProducts();

      setTxState({
        status: "SUCCESS",
        message: `Thanh toán thành công! Đơn hàng #${orderId} đã được chuyển sang trạng thái 'PAID' và khóa hủy đơn an toàn.`,
        txHash,
        orderId,
        error: null,
      });
    } catch (err) {
      console.error("Checkout flow failed:", err);
      setTxState({
        status: "ERROR",
        message: "Quá trình thanh toán bằng Smart Contract bị gián đoạn hoặc bị người dùng từ chối.",
        txHash: null,
        orderId: null,
        error: err.message || "Giao dịch không thành công",
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Thanh toán trực tiếp từ trang Lịch sử đơn hàng cho đơn PENDING
  const handlePayPendingOrder = async (order) => {
    if (!walletInfo) {
      await handleConnectWallet();
      return;
    }

    setIsTxModalOpen(true);
    setTxState({
      status: "PROCESSING",
      message: `Đang chuẩn bị gửi giao dịch thanh toán cho Đơn hàng #${order.id}... Vui lòng mở MetaMask!`,
      orderId: order.id,
      txHash: null,
      error: null,
    });

    try {
      const { txHash } = await web3Service.payOrder(
        order.id,
        order.total_amount_eth,
        (progress) => {
          if (progress.step === "TRANSACTION_SENT") {
            setTxState((prev) => ({
              ...prev,
              message: "Giao dịch đã được gửi lên Blockchain. Đang chờ khối đào...",
              txHash: progress.txHash,
            }));
          }
        }
      );

      const syncResult = await apiService.verifyPayment(txHash, order.id);
      if (!syncResult || !syncResult.success) {
        throw new Error(syncResult?.message || "Giao dịch không khớp với Smart Contract trên mạng Backend đang quản lý!");
      }
      await loadOrders(currentUser?.id || 1);

      setTxState({
        status: "SUCCESS",
        message: `Thanh toán thành công cho Đơn hàng #${order.id}! Trạng thái đơn đã cập nhật thành 'PAID'.`,
        txHash,
        orderId: order.id,
        error: null,
      });
    } catch (err) {
      setTxState({
        status: "ERROR",
        message: "Không thể thanh toán đơn hàng này.",
        txHash: null,
        orderId: order.id,
        error: err.message,
      });
    }
  };

  // Hủy (xóa mềm) đơn hàng PENDING
  const handleCancelPendingOrder = async (order) => {
    if (!order || order.status !== "PENDING") {
      alert("Chỉ có thể hủy các đơn hàng đang ở trạng thái 'PENDING' (Chờ thanh toán)!");
      return;
    }

    const confirmCancel = window.confirm(
      `Bạn có chắc chắn muốn hủy Đơn hàng #${order.id} không?\n\nSau khi hủy, đơn hàng sẽ được chuyển sang trạng thái 'Đã hủy' (xóa mềm) và số lượng sản phẩm sẽ được tự động cộng trả lại vào kho.`
    );
    if (!confirmCancel) return;

    try {
      await apiService.cancelOrder(order.id);
      await loadOrders(currentUser?.id || 1);
      await loadProducts();
      alert(`Đã hủy Đơn hàng #${order.id} thành công và hoàn trả số lượng vào kho!`);
    } catch (err) {
      alert(err.message || "Lỗi khi hủy đơn hàng");
    }
  };

  return (
    <div className={`min-h-screen ${activeTab === "admin" ? "bg-slate-900" : "bg-slate-50 flex flex-col justify-between"}`}>
      {activeTab === "admin" ? (
        /* GIAO DIỆN DÀNH RIÊNG CHO QUẢN TRỊ VIÊN (ADMIN DASHBOARD) */
        <AdminDashboard
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onBackToStore={() => {
            setActiveTab("products");
            loadProducts();
            loadOrders(currentUser?.id || 1);
          }}
        />
      ) : (
        <div>
          {/* Navigation Bar Dành Riêng Cho Khách Hàng */}
          <Navbar
            walletInfo={walletInfo}
            onConnectWallet={handleConnectWallet}
            cartCount={cart.totalItems || 0}
            onOpenCart={() => setIsCartOpen(true)}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            currentUser={currentUser}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            onLogout={handleLogout}
          />

          {/* GIAO DIỆN DÀNH RIÊNG CHO KHÁCH HÀNG (CUSTOMER STOREFRONT) */}
          {/* Hero / Architecture Banner */}
          <div className="bg-gradient-to-b from-indigo-900 via-slate-900 to-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-indigo-950">
              <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-semibold mb-3">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Mô hình Hybrid DApp (Kết hợp Off-chain & On-chain)</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                      Cửa Hàng Thương Mại Điện Tử Web3
                    </h1>
                    <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                      Trải nghiệm thanh toán trực tiếp qua <strong className="text-indigo-300">Ethereum Smart Contract</strong> kết hợp hệ cơ sở dữ liệu <strong className="text-indigo-300">MySQL</strong> tốc độ cao với cơ chế <strong className="text-indigo-300">Sổ cái bất biến (Immutable Ledger)</strong> chống gian lận 100%.
                    </p>
                  </div>

                  {/* Thông tin đăng nhập nhanh nếu khách chưa đăng nhập */}
                  {!currentUser && (
                    <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 max-w-sm flex-shrink-0 text-xs">
                      <div className="flex items-center gap-2 font-bold text-white mb-2">
                        <ShoppingBag className="w-4 h-4 text-cyan-400" />
                        <span>Đăng nhập để đặt hàng & lưu đơn</span>
                      </div>
                      <p className="text-slate-400 mb-3">
                        Hệ thống đã tách riêng giao diện Khách hàng và Admin. Đăng nhập để xem lịch sử mua sắm cá nhân.
                      </p>
                      <button
                        onClick={() => setIsAuthModalOpen(true)}
                        className="w-full py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-600 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md transition-all text-center block"
                      >
                        Đăng Nhập / Đăng Ký Tài Khoản
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {activeTab === "products" ? (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900">Danh sách Sản phẩm Nổi bật</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Đơn giá niêm yết bằng đồng ETH (Sepolia / Localhost)</p>
                    </div>
                    <span className="text-xs font-semibold text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                      {products.length} sản phẩm sẵn có
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onAddToCart={handleAddToCart}
                        onSelectProduct={setSelectedProduct}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  {!currentUser ? (
                    <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-md mx-auto shadow-sm">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-4">
                        <ShoppingBag className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-1">Yêu Cầu Đăng Nhập</h3>
                      <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                        Vui lòng đăng nhập tài khoản Khách hàng để theo dõi lịch sử đơn hàng và trạng thái thanh toán Smart Contract của riêng bạn.
                      </p>
                      <button
                        onClick={() => setIsAuthModalOpen(true)}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                      >
                        Đăng Nhập Ngay
                      </button>
                    </div>
                  ) : (
                    <OrderHistory
                      orders={orders}
                      onRefresh={() => loadOrders(currentUser.id)}
                      onPayOrder={handlePayPendingOrder}
                      onCancelOrder={handleCancelPendingOrder}
                      isLoading={isLoadingOrders}
                    />
                  )}
                </div>
              )}
            </main>
          </div>
        )}

      {/* Footer (Chỉ hiển thị cho Cửa hàng khách hàng) */}
      {activeTab !== "admin" && (
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>© 2026 Mini E-Commerce Hybrid DApp.</p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 text-slate-600 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Node.js v24 • Hardhat • ethers.js v6 • MySQL • JWT RBAC
              </span>
            </div>
          </div>
        </footer>
      )}

      {/* Modals & Drawers */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        currentWalletAddress={walletInfo?.address}
      />

      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveCartItem}
        onCheckout={handleCheckout}
        isWalletConnected={Boolean(walletInfo)}
        onConnectWallet={handleConnectWallet}
        isCheckingOut={isCheckingOut}
      />

      <TransactionModal
        isOpen={isTxModalOpen}
        txState={txState}
        onClose={() => setIsTxModalOpen(false)}
        onViewOrders={() => setActiveTab("orders")}
      />
    </div>
  );
}
