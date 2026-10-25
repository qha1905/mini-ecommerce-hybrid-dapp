import React from "react";
import { X, Plus, ShieldCheck, Cpu } from "lucide-react";

export default function ProductModal({ product, onClose, onAddToCart }) {
  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200">
        <div className="relative aspect-video bg-slate-100">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white transition-colors backdrop-blur-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-lg">
              Sản phẩm Web3
            </span>
            <span className="text-xs text-slate-400">ID #{product.id}</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900">{product.name}</h2>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            {product.description}
          </p>

          <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 block">Đơn giá On-chain</span>
              <span className="text-2xl font-extrabold text-indigo-600">Ξ {product.price_eth} ETH</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-slate-400 block">Tồn kho khả dụng</span>
              <span className="text-sm font-bold text-slate-700">{product.stock} đơn vị</span>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Đóng
            </button>
            <button
              onClick={() => {
                onAddToCart(product);
                onClose();
              }}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm vào Giỏ hàng</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
