import React, { useState } from "react";
import { Receipt, CheckCircle, Clock, Ban, ExternalLink, RefreshCw, AlertTriangle, ShieldCheck, Wallet } from "lucide-react";

export default function OrderHistory({
  orders,
  onRefresh,
  onPayOrder,
  onCancelOrder,
  includeDeleted,
  setIncludeDeleted,
  isLoading,
}) {
  const [cancelFeedback, setCancelFeedback] = useState(null);

  const handleAttemptCancel = async (order) => {
    if (order.status === "PAID" || order.tx_hash) {
      setCancelFeedback({
        type: "error",
        message: `⛔ BẢO VỆ NGHIỆP VỤ: Đơn hàng #${order.id} đã thanh toán On-chain thành công (Tx: ${order.tx_hash?.substring(0, 10)}...). Backend đã ngăn chặn thao tác hủy đơn để bảo vệ tiền của shop và tính toàn vẹn dữ liệu!`,
      });
      setTimeout(() => setCancelFeedback(null), 6000);
      return;
    }

    try {
      await onCancelOrder(order.id);
      setCancelFeedback({
        type: "success",
        message: `Đơn hàng #${order.id} đã được hủy và xóa mềm (Soft Delete) thành công.`,
      });
      setTimeout(() => setCancelFeedback(null), 4000);
    } catch (err) {
      setCancelFeedback({
        type: "error",
        message: err.message,
      });
      setTimeout(() => setCancelFeedback(null), 6000);
    }
  };

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
            Theo dõi trạng thái đối soát Off-chain (MySQL) và On-chain (Smart Contract)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300">
            <input
              type="checkbox"
              checked={includeDeleted}
              onChange={(e) => setIncludeDeleted(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span>Hiển thị đơn đã xóa mềm (Soft Deleted)</span>
          </label>

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

      {/* Alert Banner */}
      {cancelFeedback && (
        <div className={`mb-6 p-4 rounded-2xl text-xs font-semibold flex items-start gap-3 border shadow-sm ${
          cancelFeedback.type === "error"
            ? "bg-rose-50 text-rose-800 border-rose-200"
            : "bg-emerald-50 text-emerald-800 border-emerald-200"
        }`}>
          {cancelFeedback.type === "error" ? (
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          ) : (
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          )}
          <span className="leading-relaxed">{cancelFeedback.message}</span>
        </div>
      )}

      {/* Orders List */}
      {(!orders || orders.length === 0) ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center mx-auto mb-4">
            <Receipt className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Chưa có đơn hàng nào</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Khi bạn đặt hàng qua giao diện cửa hàng và thanh toán bằng MetaMask, các đơn hàng sẽ được hiển thị và theo dõi tại đây.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isPaid = order.status === "PAID";
            const isPending = order.status === "PENDING";
            const isCancelled = order.status === "CANCELLED" || order.is_deleted === 1;

            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl border p-5 sm:p-6 transition-all shadow-sm ${
                  isPaid
                    ? "border-emerald-200/80 bg-emerald-50/20"
                    : isCancelled
                    ? "border-slate-200 bg-slate-50/60 opacity-75"
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
                        Đã hủy / Xóa mềm
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
                      <>
                        <button
                          onClick={() => handleAttemptCancel(order)}
                          className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors"
                        >
                          Hủy đơn (Soft Delete)
                        </button>
                        <button
                          onClick={() => onPayOrder(order)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95"
                        >
                          <Wallet className="w-3.5 h-3.5" />
                          <span>Thanh toán MetaMask</span>
                        </button>
                      </>
                    )}

                    {isPaid && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAttemptCancel(order)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-not-allowed flex items-center gap-1"
                          title="Click để test cơ chế Backend chặn hủy đơn"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Khóa hủy đơn (Đã nạp On-chain)</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
