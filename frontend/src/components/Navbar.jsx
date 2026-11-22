import React, { useState } from "react";
import {
  ShoppingBag,
  Wallet,
  ReceiptText,
  ShieldCheck,
  User,
  LogIn,
  LogOut,
  Sparkles,
  ChevronDown,
  ExternalLink,
  Search,
  Check,
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
  searchQuery = "",
  onSearchChange,
}) {
  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);

  const formatAddress = (addr) => {
    if (!addr) return "";
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const isCorrectChain = walletInfo && (walletInfo.chainId === "31337" || walletInfo.chainId === "11155111");

  return (
    <header className="sticky top-0 z-40 w-full bg-[#050608]/95 backdrop-blur-md border-b border-[#1b1c24]">
      <div className="max-w-[1520px] mx-auto px-4 md:px-6 h-18 flex items-center justify-between gap-4">
        
        {/* Left: Brand + Nav Links */}
        <div className="flex items-center gap-6 lg:gap-8 shrink-0">
          {/* Logo & Brand */}
          <button
            onClick={() => setActiveTab("products")}
            className="flex items-center gap-3 text-left cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#e2f500] to-emerald-400 flex items-center justify-center text-black font-black text-xl shadow-[0_0_15px_rgba(226,245,0,0.25)] group-hover:scale-105 transition-transform">
              <span>Ξ</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-[#e2f500] transition-colors">
                  Mini E-Commerce
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded bg-[#e2f500] text-black leading-none">
                  Web3
                </span>
              </div>
              <p className="text-[11px] text-[#8e92a4] hidden sm:block">Thanh toán Smart Contract • CSDL MySQL</p>
            </div>
          </button>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-[#12141a] p-1 rounded-full border border-[#212430]">
            <button
              onClick={() => setActiveTab("products")}
              className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer ${
                activeTab === "products"
                  ? "bg-[#222634] text-white shadow-sm"
                  : "text-[#8e92a4] hover:text-white"
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
              className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "orders"
                  ? "bg-[#222634] text-white shadow-sm"
                  : "text-[#8e92a4] hover:text-white"
              }`}
            >
              <ReceiptText className="w-3.5 h-3.5" />
              <span>Lịch sử Đơn hàng</span>
            </button>

            {/* Quản Trị Tab (Admin Only) */}
            {currentUser && currentUser.role === "ADMIN" && (
              <button
                onClick={() => setActiveTab("admin")}
                className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all flex items-center gap-1 cursor-pointer ${
                  activeTab === "admin"
                    ? "bg-purple-600/30 text-purple-300 border border-purple-500/40"
                    : "text-purple-400 hover:text-purple-300 hover:bg-[#1a1d28]"
                }`}
              >
                <span>Trang Quản Trị</span>
              </button>
            )}
          </nav>
        </div>

        {/* Center: Search Bar (Rarible Style) */}
        {onSearchChange && (
          <div className="flex-1 max-w-md mx-2 hidden sm:block">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Tìm kiếm sản phẩm Web3..."
                className="w-full bg-[#13151b] hover:bg-[#1a1d26] focus:bg-[#1a1d26] border border-[#232733] focus:border-[#383d4f] rounded-full pl-10 pr-4 py-2 text-xs md:text-sm text-white placeholder-[#6c7285] transition-all outline-none"
              />
              <Search className="w-4 h-4 text-[#7c8296] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Right Action Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          
          {/* Cart Button with Glowing Badge */}
          <button
            onClick={() => {
              if (!currentUser) {
                onOpenAuthModal();
                return;
              }
              onOpenCart();
            }}
            className="relative p-2.5 rounded-full bg-[#13151b] hover:bg-[#1a1d26] border border-[#232733] hover:border-[#383d4f] text-gray-200 hover:text-white transition-all cursor-pointer group"
            title="Xem giỏ hàng"
          >
            <ShoppingBag className="w-4 h-4 group-hover:scale-110 transition-transform" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-[#e2f500] text-black font-extrabold text-[11px] rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(226,245,0,0.6)] animate-pulse">
                {cartCount}
              </span>
            )}
          </button>

          {/* Ví Web3 Section */}
          {currentUser ? (
            walletInfo ? (
              <div className="relative">
                <button
                  onClick={() => setWalletDropdownOpen(!walletDropdownOpen)}
                  className="flex items-center gap-2.5 bg-[#181a22] hover:bg-[#20232e] border border-[#292d3b] hover:border-[#3b4154] rounded-full pl-2.5 pr-3.5 py-1.5 text-xs font-medium text-white transition-all cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#e2f500] to-emerald-400 flex items-center justify-center text-[10px] font-bold text-black shrink-0">
                    0x
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="font-mono text-[11px] leading-tight flex items-center gap-1.5">
                      <span className="text-gray-200">{walletInfo.balance} ETH</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                          isCorrectChain
                            ? "bg-emerald-500/20 text-[#10c273] border border-emerald-500/30"
                            : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        }`}
                      >
                        {isCorrectChain ? "Sepolia" : "Sai mạng"}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-[#8e92a4]">
                      {formatAddress(walletInfo.address)}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-0.5" />
                </button>

                {/* Dropdown Details */}
                {walletDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setWalletDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-[#12141a] border border-[#262a36] rounded-2xl shadow-2xl py-3 z-50 text-xs">
                      <div className="px-4 pb-2 border-b border-[#212430]">
                        <div className="text-[10px] text-[#8e92a4] uppercase tracking-wider font-semibold">
                          Ví Web3 Đã Liên Kết
                        </div>
                        <div className="font-mono text-xs text-white font-bold mt-1 break-all">
                          {walletInfo.address}
                        </div>
                        <div className="text-xs text-[#e2f500] font-bold mt-1.5 flex items-center justify-between">
                          <span>Số dư khả dụng:</span>
                          <span className="font-mono">{walletInfo.balance} ETH</span>
                        </div>
                      </div>

                      <div className="px-4 py-2.5 border-b border-[#212430] text-[11px] text-[#8e92a4] space-y-1">
                        <div className="flex justify-between">
                          <span>Mạng:</span>
                          <span className={isCorrectChain ? "text-[#10c273] font-semibold" : "text-rose-400 font-semibold"}>
                            {isCorrectChain ? "Sepolia Testnet / Hardhat" : "Vui lòng chuyển mạng Sepolia"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Smart Contract:</span>
                          <span className="text-gray-300 font-mono">Verified ✓</span>
                        </div>
                      </div>

                      <div className="pt-2 px-2">
                        <a
                          href={`https://sepolia.etherscan.io/address/${walletInfo.address}`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full px-3 py-1.5 rounded-lg text-left text-gray-300 hover:text-white hover:bg-[#1b1e28] flex items-center justify-between transition-colors"
                        >
                          <span className="text-[11px]">Xem trên Etherscan</span>
                          <ExternalLink className="w-3 h-3 text-gray-400" />
                        </a>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={onConnectWallet}
                className="flex items-center gap-1.5 bg-[#181a22] hover:bg-[#20232e] border border-[#292d3b] hover:border-[#e2f500] text-white rounded-full px-4 py-2 text-xs font-semibold transition-all cursor-pointer"
                title="Kết nối ví MetaMask"
              >
                <Wallet className="w-3.5 h-3.5 text-[#e2f500]" />
                <span>Ví Web3</span>
              </button>
            )
          ) : null}

          {/* User Account / Auth Section */}
          {currentUser ? (
            <div className="flex items-center gap-2 bg-[#141620] p-1 pl-3 rounded-full border border-[#232736]">
              <div className="text-right">
                <div className="flex items-center gap-1.5 justify-end">
                  <span className="text-xs font-bold text-gray-200 line-clamp-1 max-w-[100px]">
                    {currentUser.full_name}
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                      currentUser.role === "ADMIN"
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                        : "bg-emerald-500/20 text-[#10c273] border border-emerald-500/30"
                    }`}
                  >
                    {currentUser.role === "ADMIN" ? "Admin" : "Khách"}
                  </span>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="w-7 h-7 rounded-full bg-[#1c1f2b] hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 flex items-center justify-center transition-colors cursor-pointer"
                title="Đăng xuất"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="bg-[#e2f500] hover:bg-[#ecff1a] active:scale-98 text-black font-extrabold text-xs px-5 py-2.5 rounded-full shadow-[0_0_20px_rgba(226,245,0,0.2)] hover:shadow-[0_0_25px_rgba(226,245,0,0.35)] transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Đăng Nhập</span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
}