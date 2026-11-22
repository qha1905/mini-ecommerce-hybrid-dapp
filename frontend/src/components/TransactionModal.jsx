import React from "react";
import { CheckCircle2, AlertCircle, Loader2, ExternalLink, ShieldCheck, ArrowRight } from "lucide-react";

export default function TransactionModal({ isOpen, txState, onClose, onViewOrders }) {
  if (!isOpen) return null;

  const { status, message, txHash, orderId, error } = txState;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#0d0e14] border border-[#232736] rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl text-center text-white">
        
        {/* Status Icons */}
        <div className="mx-auto mb-5 flex items-center justify-center">
          {status === "PROCESSING" && (
            <div className="w-16 h-16 rounded-full bg-[#e2f500]/10 border border-[#e2f500]/30 text-[#e2f500] flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          )}

          {status === "SUCCESS" && (
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[#10c273] flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
          )}

          {status === "ERROR" && (
            <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-8 h-8" />
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-xl font-black text-white">
          {status === "PROCESSING" && "Đang xử lý Giao dịch Web3..."}
          {status === "SUCCESS" && "Thanh toán On-Chain Thành công!"}
          {status === "ERROR" && "Giao dịch Thất bại hoặc Bị từ chối"}
        </h3>

        {/* Message */}
        <p className="mt-2 text-xs sm:text-sm text-[#80869a] leading-relaxed">
          {message}
        </p>

        {/* Order ID & TxHash Details */}
        {(orderId || txHash) && (
          <div className="mt-5 p-4 rounded-xl bg-[#141620] border border-[#222634] text-left text-xs space-y-2">
            {orderId && (
              <div className="flex justify-between items-center">
                <span className="text-[#80869a] font-medium">Mã đơn hàng (Off-chain):</span>
                <span className="font-bold text-white font-mono">#{orderId}</span>
              </div>
            )}
            {txHash && (
              <div>
                <span className="text-[#80869a] font-medium block mb-1">Mã băm giao dịch (On-chain):</span>
                <div className="p-2 bg-[#0c0d12] rounded-lg border border-[#1f222d] font-mono text-[11px] text-[#e2f500] break-all flex items-center justify-between gap-2">
                  <span>{txHash}</span>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white flex-shrink-0"
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
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl text-left">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-center gap-3">
          {status === "SUCCESS" ? (
            <>
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-[#262a3a] bg-[#161822] hover:bg-[#202432] text-xs font-semibold text-gray-300 hover:text-white transition-colors cursor-pointer"
              >
                Tiếp tục mua hàng
              </button>
              <button
                onClick={() => {
                  onClose();
                  onViewOrders();
                }}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#e2f500] hover:bg-[#ecff1a] text-black text-xs font-black shadow-md transition-all cursor-pointer"
              >
                <span>Xem đơn hàng</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl border border-[#262a3a] bg-[#161822] hover:bg-[#202432] text-xs font-semibold text-gray-300 hover:text-white transition-colors cursor-pointer"
            >
              Đóng
            </button>
          )}
        </div>

      </div>
    </div>
  );
}