import React from "react";
import { Plus, Eye, Layers } from "lucide-react";

export default function ProductCard({ product, onAddToCart, onSelectProduct }) {
  return (
    <div className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
      <div>
        {/* Product Image */}
        <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden cursor-pointer" onClick={() => onSelectProduct(product)}>
          <img
            src={product.image_url || "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80"}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 shadow-sm flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            <span>Kho: {product.stock}</span>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-5">
          <h3 
            className="font-bold text-slate-900 text-base line-clamp-1 hover:text-indigo-600 transition-colors cursor-pointer"
            onClick={() => onSelectProduct(product)}
          >
            {product.name}
          </h3>
          <p className="mt-2 text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>
      </div>

      {/* Footer / Actions */}
      <div className="px-5 pb-5 pt-3 border-t border-slate-100 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Giá On-chain</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-extrabold text-indigo-600 font-mono">
                Ξ {parseFloat(product.price_eth)}
              </span>
              <span className="text-xs font-bold text-slate-400">ETH</span>
            </div>
          </div>

          <button
            onClick={() => onSelectProduct(product)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors border border-slate-200"
            title="Xem chi tiết"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Chi tiết</span>
          </button>
        </div>

        <button
          onClick={() => onAddToCart(product)}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-all whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm vào giỏ hàng</span>
        </button>
      </div>
    </div>
  );
}
