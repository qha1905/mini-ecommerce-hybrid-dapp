import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import ProductCard from "./components/ProductCard";
import ProductModal from "./components/ProductModal";
import CartDrawer from "./components/CartDrawer";
import OrderHistory from "./components/OrderHistory";
import TransactionModal from "./components/TransactionModal";
import { apiService } from "./services/apiService";
import { web3Service } from "./services/web3Service";
import { Sparkles, Shield, Cpu, Database, CheckCircle2 } from "lucide-react";

export default function App() {
  const [walletInfo, setWalletInfo] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({ items: [], totalItems: 0, totalAmountEth: "0.00000000" });
  const [orders, setOrders] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("products");
  const [includeDeleted, setIncludeDeleted] = useState(false);
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
    loadCart();
    loadOrders();

    // Lắng nghe thay đổi tài khoản hoặc mạng trong MetaMask nếu người dùng đổi
    if (web3Service.isInstalled()) {
      window.ethereum.on?.("accountsChanged", (accounts) => {
        if (accounts.length === 0) {
          setWalletInfo(null);
        } else {
          handleConnectWallet();
        }
      });
      window.ethereum.on?.("chainChanged", () => {
        web3Service.provider = null;
        handleConnectWallet();
        loadOrders();
      });
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [includeDeleted]);

  const loadProducts = async () => {
    try {
      const data = await apiService.getProducts();
      setProducts(data);
    } catch (err) {
      console.error("Failed to load products:", err);
    }
  };

  const loadCart = async () => {
    try {
      const data = await apiService.getCart(1);
      if (data.data) {
        setCart(data.data);
      }
    } catch (err) {
      console.warn("Failed to load cart from backend:", err.message);
    }
  };

  const loadOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const data = await apiService.getOrders(1, includeDeleted);
      setOrders(data);
    } catch (err) {
      console.warn("Failed to load orders from backend:", err.message);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  // Kết nối MetaMask
  const handleConnectWallet = async () => {
    try {
      const info = await web3Service.connect();
      setWalletInfo(info);
    } catch (err) {
      alert(err.message || "Không thể kết nối ví MetaMask");
    }
  };

  // Thao tác giỏ hàng
  const handleAddToCart = async (product) => {
    try {
      await apiService.addToCart(product.id, 1, 1);
      await loadCart();
      setIsCartOpen(true);
    } catch (err) {
      alert("Không thể thêm vào giỏ hàng: " + err.message);
    }
  };

  const handleUpdateQuantity = async (cartItemId, newQty) => {
    try {
      await apiService.updateCartItem(cartItemId, newQty);
      await loadCart();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveCartItem = async (cartItemId) => {
    try {
      await apiService.removeCartItem(cartItemId);
      await loadCart();
    } catch (err) {
      console.error(err);
    }
  };

  // Luồng thanh toán Web3 chính (Từ Giỏ Hàng)
  const handleCheckout = async () => {
    if (!walletInfo) {
      await handleConnectWallet();
      return;
    }

    if (!cart.items || cart.items.length === 0) {
      alert("Giỏ hàng của bạn đang trống!");
      return;
    }

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
        userId: 1,
        fromCart: true,
      });

      const orderId = orderRes.data.orderId;
      const totalAmountEth = orderRes.data.totalAmountEth;

      setTxState({
        status: "PROCESSING",
        message: `Bước 2/3: Đơn hàng #${orderId} đã được tạo với trạng thái 'PENDING'. Vui lòng xác nhận giao dịch trên ví MetaMask...`,
        orderId,
        txHash: null,
        error: null,
      });

      // 2. Kích hoạt MetaMask để gọi payOrder trên Smart Contract
      const { txHash, blockNumber } = await web3Service.payOrder(
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
      await loadCart();
      await loadOrders();

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
      await loadOrders();

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

  // Hủy đơn hàng (Soft Delete)
  const handleCancelOrder = async (orderId) => {
    await apiService.cancelOrder(orderId);
    await loadOrders();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <div>
        {/* Navigation Bar */}
        <Navbar
          walletInfo={walletInfo}
          onConnectWallet={handleConnectWallet}
          cartCount={cart.totalItems || 0}
          onOpenCart={() => setIsCartOpen(true)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

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
                  Trải nghiệm thanh toán trực tiếp qua <strong className="text-indigo-300">Ethereum Smart Contract</strong> kết hợp hệ cơ sở dữ liệu <strong className="text-indigo-300">MySQL</strong> tốc độ cao với cơ chế <strong className="text-indigo-300">Soft Delete</strong> bảo vệ quyền lợi giao dịch.
                </p>
              </div>

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
            <OrderHistory
              orders={orders}
              onRefresh={loadOrders}
              onPayOrder={handlePayPendingOrder}
              onCancelOrder={handleCancelOrder}
              includeDeleted={includeDeleted}
              setIncludeDeleted={setIncludeDeleted}
              isLoading={isLoadingOrders}
            />
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Mini E-Commerce Hybrid DApp.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-slate-600 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Node.js v24 • Hardhat • ethers.js v6 • MySQL
            </span>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
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
