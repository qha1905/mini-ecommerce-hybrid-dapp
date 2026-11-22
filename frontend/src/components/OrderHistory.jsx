import React, { useState } from "react";
import {
  Receipt,
  CheckCircle,
  Clock,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  Wallet,
  Ban,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";

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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 text-white">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#e2f500]/10 border border-[#e2f500]/20 flex items-center justify-center text-[#e2f500]">
              <Receipt className="w-4 h-4" />
            </div>
            <span>Lịch sử Đơn hàng</span>
          </h1>
          <p className="text-xs text-[#80869a] mt-1">
            Theo dõi đơn hàng & trạng thái thanh toán Smart Contract Sepolia • Hỗ trợ hủy đơn chờ (Pending)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#10c273] bg-[#10c273]/10 border border-[#10c273]/20 px-3 py-1.5 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Xác thực On-chain</span>
          </div>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2.5 rounded-full border border-[#232736] bg-[#141620] hover:bg-[#1b1f2d] text-gray-300 hover:text-white shadow-sm transition-colors cursor-pointer"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#e2f500]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Orders List */}
      {(!orders || orders.length === 0) ? (
        <div className="bg-[#0d0e14] rounded-2xl border border-[#232736] p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-[#141620] border border-[#222634] text-gray-400 flex items-center justify-center mx-auto mb-4">
            <Receipt className="w-8 h-8 text-[#6c7285]" />
          </div>
          <h3 className="text-base font-bold text-white">Chưa có đơn hàng nào</h3>
          <p className="text-xs text-[#80869a] mt-1 max-w-sm mx-auto leading-relaxed">
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
                className={`rounded-2xl border p-5 sm:p-6 transition-all shadow-md ${
                  isPaid
                    ? "border-emerald-500/30 bg-[#0c1310]"
                    : isCancelled
                    ? "border-[#1e2230] bg-[#0c0d12] opacity-80"
                    : "border-amber-500/30 bg-[#14120c]"
                }`}
              >
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-base font-black text-white">
                      Đơn hàng #{order.id}
                    </span>
                    
                    {/* Status Badges */}
                    {isPaid && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#10c273]/15 text-[#10c273] border border-[#10c273]/30">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Đã thanh toán (PAID)
                      </span>
                    )}

                    {isPending && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/15 text-amber-300 border border-amber-400/30">
                        <Clock className="w-3.5 h-3.5 animate-pulse" />
                        Chờ thanh toán (PENDING)
                      </span>
                    )}

                    {isCancelled && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/5 text-gray-400 border border-white/10">
                        <Ban className="w-3.5 h-3.5" />
                        Đã hủy trước đó
                      </span>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-[#80869a] uppercase tracking-wider block">
                      Tổng tiền
                    </span>
                    <span className="text-lg font-black text-[#e2f500] font-mono">
                      Ξ {order.total_amount_eth} <span className="text-xs text-[#80869a]">ETH</span>
                    </span>
                  </div>
                </div>

                {/* Items in Order */}
                {order.items && order.items.length > 0 && (
                  <div className="my-3.5 p-3 rounded-xl bg-[#12141c]/80 border border-[#1f2330] space-y-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs text-gray-300">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#e2f500]" />
                          <span className="font-semibold text-white">{item.product_name}</span>
                          <span className="text-[#80869a]">x{item.quantity}</span>
                        </div>
                        <span className="font-mono font-bold text-gray-200">
                          Ξ {(item.quantity * parseFloat(item.unit_price_eth)).toFixed(8)} ETH
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* On-chain Details & Actions */}
                <div className="pt-3 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1 text-[#80869a]">
                    <div>
                      <span>Ngày tạo: </span>
                      <span className="font-medium text-gray-300">
                        {new Date(order.created_at).toLocaleString("vi-VN")}
                      </span>
                    </div>

                    {order.tx_hash && (
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#e2f500]">
                        <span>TxHash: {order.tx_hash.substring(0, 16)}...</span>
                        <a
                          href={`https://sepolia.etherscan.io/tx/${order.tx_hash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline flex items-center gap-0.5 text-white"
                          title="Xem trên Sepolia Etherscan"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}

                    {order.buyer_wallet && (
                      <div className="text-[11px] font-mono text-[#6c7285]">
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
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                          title="Hủy đơn hàng này (xóa mềm)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hủy đơn</span>
                        </button>
                        <button
                          onClick={() => onPayOrder(order)}
                          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#e2f500] hover:bg-[#ecff1a] text-black text-xs font-black shadow-md shadow-[#e2f500]/10 transition-all active:scale-95 cursor-pointer"
                        >
                          <Wallet className="w-3.5 h-3.5" />
                          <span>Thanh toán MetaMask</span>
                        </button>
                      </div>
                    )}

                    {isPaid && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#10c273]/10 border border-[#10c273]/25 text-[#10c273] text-xs font-bold">
                        <ShieldCheck className="w-4 h-4 text-[#10c273]" />
                        <span>Đã xác thực On-chain (Bất biến)</span>
                      </div>
                    )}

                    {isCancelled && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-xs font-medium">
                        <Ban className="w-3.5 h-3.5 text-gray-500" />
                        <span>Đơn hàng đã hủy</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            );
          })}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="bg-[#0d0e14] rounded-2xl border border-[#232736] p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs mt-6">
              <div className="text-[#80869a]">
                Hiển thị <span className="font-bold text-white">{startIndex + 1}</span> -{" "}
                <span className="font-bold text-white">
                  {Math.min(startIndex + ordersPerPage, orders.length)}
                </span>{" "}
                trên tổng số <span className="font-bold text-[#e2f500]">{orders.length}</span> đơn hàng
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={validPage === 1}
                  className="px-3 py-1.5 rounded-xl border border-[#232736] bg-[#141620] hover:bg-[#1d202d] text-gray-300 disabled:opacity-40 disabled:hover:bg-[#141620] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
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
                      className={`w-8 h-8 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                        validPage === pageNum
                          ? "bg-[#e2f500] text-black shadow-md shadow-[#e2f500]/20"
                          : "border border-[#232736] bg-[#141620] hover:bg-[#1d202d] text-gray-300"
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={validPage === totalPages}
                  className="px-3 py-1.5 rounded-xl border border-[#232736] bg-[#141620] hover:bg-[#1d202d] text-gray-300 disabled:opacity-40 disabled:hover:bg-[#141620] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
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