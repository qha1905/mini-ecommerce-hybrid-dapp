import React from "react";
import { X, Trash2, Plus, Minus, ArrowRight, Wallet, ShoppingBag, ShieldAlert } from "lucide-react";

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
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200">
          
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Giỏ hàng của bạn</h2>
                <p className="text-xs text-slate-500">{cart.items?.length || 0} mặt hàng đã chọn</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {(!cart.items || cart.items.length === 0) ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                  <ShoppingBag className="w-8 h-8 text-slate-300" />
                </div>
                <p className="font-semibold text-slate-700">Giỏ hàng của bạn đang trống</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                  Đơn hàng trước đó của bạn đã được chuyển vào mục Lịch sử để chờ thanh toán.
                </p>
              </div>
            ) : (
              cart.items.map((item) => (
                <div
                  key={item.cart_item_id || item.product_id}
                  className="flex gap-4 p-3.5 rounded-2xl border border-slate-200/80 bg-white hover:border-indigo-200 transition-colors shadow-sm"
                >
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-18 h-18 w-20 h-20 rounded-xl object-cover bg-slate-100 flex-shrink-0"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{item.name}</h4>
                      <div className="text-xs font-bold text-indigo-600 mt-0.5">
                        Ξ {item.price_eth} ETH
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2 bg-slate-100 px-2 py-1 rounded-lg">
                        <button
                          onClick={() => onUpdateQuantity(item.cart_item_id, item.quantity - 1)}
                          className="text-slate-600 hover:text-slate-900 p-0.5"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold text-slate-900 min-w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.cart_item_id, item.quantity + 1)}
                          className="text-slate-600 hover:text-slate-900 p-0.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem(item.cart_item_id)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
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

          {/* Footer & Checkout Button */}
          {cart.items && cart.items.length > 0 && (
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-4">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-slate-500 text-xs">
                  <span>Phí lưu kho & xử lý CSDL (Off-chain):</span>
                  <span className="font-semibold text-emerald-600">0.00000000 ETH (Free)</span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
                  <span className="font-bold text-slate-900 text-base">Tổng tiền thanh toán:</span>
                  <div className="text-right">
                    <span className="text-xl font-extrabold text-indigo-600 font-mono">
                      Ξ {cart.totalAmountEth} ETH
                    </span>
                  </div>
                </div>
              </div>

              {!isWalletConnected ? (
                <button
                  onClick={onConnectWallet}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-95"
                >
                  <Wallet className="w-4 h-4" />
                  <span>Kết nối MetaMask để thanh toán</span>
                </button>
              ) : (
                <button
                  onClick={onCheckout}
                  disabled={isCheckingOut}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-500/25 transition-all active:scale-95"
                >
                  <Wallet className="w-4 h-4" />
                  <span>{isCheckingOut ? "Đang chuẩn bị đơn hàng..." : "Thanh toán bằng Smart Contract"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <p className="text-[11px] text-center text-slate-400 flex items-center justify-center gap-1">
                <span>🔒 Giao dịch bảo mật bằng Smart Contract trên Ethereum</span>
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
