import React, { useState } from "react";
import { Receipt, CheckCircle, Clock, ExternalLink, RefreshCw, ShieldCheck, Wallet, Lock, Ban, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";

export default function OrderHistory({
  orders,
  onRefresh,
  onPayOrder,
  onCancelOrder,
  isLoading,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  const totalPages = Math.ceil((orders?.length || 0) / ordersPerPage) || 1;
  const validPage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (validPage - 1) * ordersPerPage;
  const paginatedOrders = (orders || []).slice(startIndex, startIndex + ordersPerPage);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-indigo-600" />
            Lịch sử Đơn hàng
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi đơn hàng & trạng thái thanh toán Smart Contract Sepolia • Hỗ trợ hủy đơn chờ (Pending)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Xác thực On-chain</span>
          </div>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shadow-sm transition-colors"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-indigo-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Orders List */}
      {(!orders || orders.length === 0) ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center mx-auto mb-4">
            <Receipt className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Chưa có đơn hàng nào</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Khi bạn đặt hàng qua giao diện cửa hàng và thanh toán bằng MetaMask, các đơn hàng sẽ được hiển thị vĩnh viễn tại đây.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedOrders.map((order) => {
            const isPaid = order.status === "PAID";
            const isCancelled = order.status === "CANCELLED" || order.is_deleted === 1;
            const isPending = !isPaid && !isCancelled;

            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl border p-5 sm:p-6 transition-all shadow-sm ${
                  isPaid
                    ? "border-emerald-200/80 bg-emerald-50/20"
                    : isCancelled
                    ? "border-slate-200 bg-slate-50/70"
                    : "border-amber-200/80 bg-amber-50/20"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-base font-extrabold text-slate-900">
                      Đơn hàng #{order.id}
                    </span>
                    
                    {/* Status Badges */}
                    {isPaid && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Đã thanh toán (PAID)
                      </span>
                    )}

                    {isPending && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                        <Clock className="w-3.5 h-3.5 animate-pulse" />
                        Chờ thanh toán (PENDING)
                      </span>
                    )}

                    {isCancelled && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700">
                        <Ban className="w-3.5 h-3.5" />
                        Đã hủy trước đó
                      </span>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Tổng tiền</span>
                    <span className="text-lg font-extrabold text-indigo-600 font-mono">
                      Ξ {order.total_amount_eth} ETH
                    </span>
                  </div>
                </div>

                {/* Items in Order */}
                {order.items && order.items.length > 0 && (
                  <div className="py-4 space-y-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          <span className="font-medium text-slate-800">{item.product_name}</span>
                          <span className="text-slate-400">x{item.quantity}</span>
                        </div>
                        <span className="font-mono font-semibold text-slate-700">
                          Ξ {(item.quantity * parseFloat(item.unit_price_eth)).toFixed(8)} ETH
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* On-chain Details & Actions */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1 text-slate-500">
                    <div>
                      <span>Ngày tạo: </span>
                      <span className="font-medium text-slate-700">
                        {new Date(order.created_at).toLocaleString("vi-VN")}
                      </span>
                    </div>

                    {order.tx_hash && (
                      <div className="flex items-center gap-1 font-mono text-[11px] text-indigo-600">
                        <span>TxHash: {order.tx_hash.substring(0, 16)}...</span>
                        <a
                          href={`https://sepolia.etherscan.io/tx/${order.tx_hash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline flex items-center gap-0.5"
                          title="Xem trên Sepolia Etherscan"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}

                    {order.buyer_wallet && (
                      <div className="text-[11px] font-mono text-slate-400">
                        Ví người mua: {order.buyer_wallet}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {isPending && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onCancelOrder && onCancelOrder(order)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 text-xs font-semibold shadow-sm transition-all active:scale-95"
                          title="Hủy đơn hàng này (xóa mềm)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hủy đơn</span>
                        </button>
                        <button
                          onClick={() => onPayOrder(order)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95"
                        >
                          <Wallet className="w-3.5 h-3.5" />
                          <span>Thanh toán MetaMask</span>
                        </button>
                      </div>
                    )}

                    {isPaid && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Đã xác thực On-chain (Bất biến)</span>
                      </div>
                    )}

                    {isCancelled && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium">
                        <Ban className="w-3.5 h-3.5 text-slate-400" />
                        <span>Đơn hàng đã hủy</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            );
          })}

          {/* Pagination Controls (10 orders per page) */}
          {totalPages > 1 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm text-xs mt-6">
              <div className="text-slate-500 font-medium">
                Hiển thị <span className="font-bold text-slate-800">{startIndex + 1}</span> -{" "}
                <span className="font-bold text-slate-800">
                  {Math.min(startIndex + ordersPerPage, orders.length)}
                </span>{" "}
                trên tổng số <span className="font-bold text-indigo-600">{orders.length}</span> đơn hàng
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={validPage === 1}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-white font-medium transition-colors flex items-center gap-1 shadow-sm"
                  title="Trang trước"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Trước</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-xl font-bold text-xs transition-all ${
                        validPage === pageNum
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                          : "border border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={validPage === totalPages}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-white font-medium transition-colors flex items-center gap-1 shadow-sm"
                  title="Trang sau"
                >
                  <span>Sau</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
