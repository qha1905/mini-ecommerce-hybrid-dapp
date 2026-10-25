import React from "react";
import { CheckCircle2, AlertCircle, Loader2, ExternalLink, ShieldCheck, ArrowRight } from "lucide-react";

export default function TransactionModal({ isOpen, txState, onClose, onViewOrders }) {
  if (!isOpen) return null;

  const { status, message, txHash, orderId, error } = txState;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-center">
        
        {/* Status Icons */}
        <div className="mx-auto mb-5 flex items-center justify-center">
          {status === "PROCESSING" && (
            <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center border-4 border-indigo-100">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          )}

          {status === "SUCCESS" && (
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border-4 border-emerald-100 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
          )}

          {status === "ERROR" && (
            <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center border-4 border-rose-100">
              <AlertCircle className="w-8 h-8" />
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-xl font-extrabold text-slate-900">
          {status === "PROCESSING" && "Đang xử lý Giao dịch Web3..."}
          {status === "SUCCESS" && "Thanh toán On-Chain Thành công!"}
          {status === "ERROR" && "Giao dịch Thất bại hoặc Bị từ chối"}
        </h3>

        {/* Message */}
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          {message}
        </p>

        {/* Order ID & TxHash Details */}
        {(orderId || txHash) && (
          <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
            {orderId && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Mã đơn hàng (Off-chain):</span>
                <span className="font-bold text-slate-900 font-mono">#{orderId}</span>
              </div>
            )}
            {txHash && (
              <div>
                <span className="text-slate-500 font-medium block mb-1">Mã băm giao dịch (On-chain):</span>
                <div className="p-2 bg-white rounded-lg border border-slate-200 font-mono text-[11px] text-indigo-600 break-all flex items-center justify-between gap-2">
                  <span>{txHash}</span>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-indigo-800 flex-shrink-0"
                    title="Xem trên Etherscan Sepolia"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Detail */}
        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl text-left">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-center gap-3">
          {status === "SUCCESS" ? (
            <>
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Tiếp tục mua hàng
              </button>
              <button
                onClick={() => {
                  onClose();
                  onViewOrders();
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-500/20 transition-all"
              >
                <span>Xem đơn hàng</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              disabled={status === "PROCESSING"}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
            >
              {status === "PROCESSING" ? "Đang giao dịch..." : "Đóng"}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
