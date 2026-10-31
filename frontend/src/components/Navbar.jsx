import React from "react";
import {
  ShoppingBag,
  Wallet,
  ReceiptText,
  ShieldCheck,
  User,
  LogIn,
  LogOut,
  Sparkles,
} from "lucide-react";

export default function Navbar({
  walletInfo,
  onConnectWallet,
  cartCount,
  onOpenCart,
  activeTab,
  setActiveTab,
  currentUser,
  onOpenAuthModal,
  onLogout,
}) {
  const formatAddress = (addr) => {
    if (!addr) return "";
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* Logo & Brand */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setActiveTab("products")}
          >
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
              <span className="font-extrabold text-xl">Ξ</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-slate-900">Mini E-Commerce</span>
                <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                  Web3 Store
                </span>
              </div>
              <p className="text-xs text-slate-500">Thanh toán Smart Contract • CSDL MySQL</p>
            </div>
          </div>

          {/* Navigation Links - Customer View */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setActiveTab("products")}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                activeTab === "products"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Cửa hàng
            </button>
            <button
              onClick={() => {
                if (!currentUser) {
                  onOpenAuthModal();
                  return;
                }
                setActiveTab("orders");
              }}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
                activeTab === "orders"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ReceiptText className="w-4 h-4" />
              Lịch sử Đơn hàng
            </button>

            {/* Chỉ hiển thị nút Admin nếu tài khoản đăng nhập có quyền ADMIN */}
            {currentUser && currentUser.role === "ADMIN" && (
              <button
                onClick={() => setActiveTab("admin")}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === "admin"
                    ? "bg-slate-900 text-cyan-400 shadow-sm"
                    : "text-indigo-600 hover:bg-indigo-50 font-bold"
                }`}
              >
                <span>Trang Quản Trị</span>
              </button>
            )}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5">

            {/* Cart Button */}
            <button
              onClick={() => {
                if (!currentUser) {
                  onOpenAuthModal();
                  return;
                }
                onOpenCart();
              }}
              className="relative p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors text-slate-700"
              title="Xem giỏ hàng"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 text-white rounded-full text-xs font-bold flex items-center justify-center shadow-md animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Wallet Connect Button - Chỉ hiển thị và cho phép khi ĐÃ đăng nhập */}
            {currentUser && (
              walletInfo ? (
                <div className="hidden sm:flex items-center gap-2 bg-indigo-50/80 border border-indigo-200/80 px-3 py-1.5 rounded-xl">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      walletInfo.chainId === "31337" || walletInfo.chainId === "11155111"
                        ? "bg-emerald-500 animate-ping"
                        : "bg-rose-500"
                    }`}
                  />
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1 justify-end">
                      <span>{walletInfo.balance} ETH</span>
                      <span
                        className={`text-[9px] font-semibold px-1.5 py-0.2 rounded ${
                          walletInfo.chainId === "31337" || walletInfo.chainId === "11155111"
                            ? "bg-indigo-100 text-indigo-700"
                            : "bg-rose-100 text-rose-700 font-bold"
                        }`}
                      >
                        {walletInfo.chainId === "31337" || walletInfo.chainId === "11155111"
                          ? "Sepolia"
                          : "Sai mạng"}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">
                      {formatAddress(walletInfo.address)}
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={onConnectWallet}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all"
                  title="Kết nối ví MetaMask"
                >
                  <Wallet className="w-4 h-4 text-indigo-600" />
                  <span>Ví Web3</span>
                </button>
              )
            )}

            {/* User Account / Auth Section */}
            {currentUser ? (
              <div className="flex items-center gap-2 bg-slate-100 p-1.5 pl-3 rounded-xl border border-slate-200">
                <div className="text-right">
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="text-xs font-bold text-slate-800 line-clamp-1 max-w-[110px]">
                      {currentUser.full_name}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                        currentUser.role === "ADMIN"
                          ? "bg-violet-100 text-violet-700 border border-violet-200"
                          : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      {currentUser.role === "ADMIN" ? "Admin" : "Khách"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-200 transition-colors"
                  title="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all active:scale-95"
              >
                <LogIn className="w-4 h-4" />
                <span>Đăng Nhập</span>
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
}
