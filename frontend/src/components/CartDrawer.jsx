import React from "react";
import { X, Trash2, Plus, Minus, ArrowRight, Wallet, ShoppingBag, ShieldCheck } from "lucide-react";

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  isWalletConnected,
  onConnectWallet,
  isCheckingOut,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#0c0d13] border-l border-[#212534] shadow-2xl flex flex-col text-white">
          
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-[#1c202d] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#e2f500]/10 border border-[#e2f500]/20 text-[#e2f500] rounded-xl">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Giỏ hàng của bạn</h2>
                <p className="text-xs text-[#80869a]">{cart.items?.length || 0} mặt hàng đã chọn</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-[#1a1c26] rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3.5">
            {(!cart.items || cart.items.length === 0) ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#71778c]">
                <div className="w-16 h-16 rounded-2xl bg-[#141620] border border-[#222634] flex items-center justify-center mb-3">
                  <ShoppingBag className="w-8 h-8 text-[#555a6d]" />
                </div>
                <p className="font-bold text-gray-200">Giỏ hàng của bạn đang trống</p>
                <p className="text-xs text-[#71778c] mt-1 max-w-xs leading-relaxed">
                  Đơn hàng trước đó của bạn đã được chuyển vào mục Lịch sử để chờ thanh toán.
                </p>
              </div>
            ) : (
              cart.items.map((item) => (
                <div
                  key={item.cart_item_id || item.product_id}
                  className="flex gap-3.5 p-3.5 rounded-xl border border-[#1f2332] bg-[#12141d] hover:border-[#2f354a] transition-colors"
                >
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-18 h-18 w-20 h-20 rounded-xl object-cover bg-[#181b26] flex-shrink-0"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm line-clamp-1">{item.name}</h4>
                      <div className="text-xs font-bold text-[#e2f500] font-mono mt-0.5">
                        Ξ {item.price_eth} ETH
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-2 bg-[#181a24] border border-[#262a3a] px-2 py-0.5 rounded-lg">
                        <button
                          onClick={() => onUpdateQuantity(item.cart_item_id, item.quantity - 1)}
                          className="text-gray-400 hover:text-white p-0.5 cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold text-white min-w-4 text-center font-mono">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.cart_item_id, item.quantity + 1)}
                          className="text-gray-400 hover:text-white p-0.5 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => onRemoveItem(item.cart_item_id)}
                        className="text-gray-400 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                        title="Xóa khỏi giỏ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout */}
          {cart.items && cart.items.length > 0 && (
            <div className="p-5 sm:p-6 border-t border-[#1c202d] bg-[#0f1118] space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-[#80869a] text-xs">
                  <span>Phí lưu kho & xử lý CSDL (Off-chain):</span>
                  <span className="font-semibold text-[#10c273]">0.00000000 ETH (Free)</span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-[#1f2332]">
                  <span className="font-bold text-gray-200 text-sm">Tổng tiền thanh toán:</span>
                  <div className="text-right">
                    <span className="text-xl font-black text-[#e2f500] font-mono">
                      Ξ {cart.totalAmountEth} ETH
                    </span>
                  </div>
                </div>
              </div>

              {!isWalletConnected ? (
                <button
                  onClick={onConnectWallet}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-sm rounded-xl shadow-lg transition-all active:scale-98 cursor-pointer"
                >
                  <Wallet className="w-4 h-4" />
                  <span>Kết nối MetaMask để thanh toán</span>
                </button>
              ) : (
                <button
                  onClick={onCheckout}
                  disabled={isCheckingOut}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-[#e2f500] hover:bg-[#ecff1a] active:scale-98 disabled:opacity-50 text-black font-extrabold text-sm rounded-xl shadow-[0_0_25px_rgba(226,245,0,0.25)] transition-all cursor-pointer"
                >
                  <Wallet className="w-4 h-4" />
                  <span>{isCheckingOut ? "Đang chuẩn bị đơn hàng..." : "Thanh toán bằng Smart Contract"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <p className="text-[11px] text-center text-[#71778c] flex items-center justify-center gap-1">
                <span>🔒 Giao dịch bảo mật bằng Smart Contract trên Ethereum</span>
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}