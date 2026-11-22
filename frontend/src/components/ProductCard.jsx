import React from "react";
import { Plus, Eye, Layers, Sparkles } from "lucide-react";

export default function ProductCard({ product, onAddToCart, onSelectProduct }) {
  const isOutOfStock = product.stock <= 0;

  return (
    <div className="group bg-[#0f1117] hover:bg-[#151722] rounded-2xl border border-[#1f222d] hover:border-[#33384a] overflow-hidden shadow-md hover:shadow-2xl hover:shadow-[#e2f500]/5 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 relative">
      
      <div>
        {/* Product Image */}
        <div
          className="relative aspect-[4/3] bg-[#161822] overflow-hidden cursor-pointer"
          onClick={() => onSelectProduct(product)}
        >
          <img
            src={product.image_url || "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80"}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Stock Badge */}
          <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-gray-200 shadow-sm flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#e2f500]" />
            <span>Kho: {product.stock}</span>
          </div>

          {/* Web3 Tag */}
          <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded-lg text-[10px] font-bold text-gray-300">
            Smart Contract
          </div>
        </div>

        {/* Product Info */}
        <div className="p-5">
          <h3
            className="font-bold text-white text-base line-clamp-1 group-hover:text-[#e2f500] transition-colors cursor-pointer"
            onClick={() => onSelectProduct(product)}
          >
            {product.name}
          </h3>
          <p className="mt-2 text-xs text-[#8e92a4] line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>
      </div>

      {/* Footer / Actions */}
      <div className="px-5 pb-5 pt-3 border-t border-[#1b1f2b] flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#6c7285] uppercase tracking-wider block">
              Giá On-chain
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-extrabold text-white font-mono">
                Ξ {parseFloat(product.price_eth)}
              </span>
              <span className="text-xs font-bold text-[#8e92a4]">ETH</span>
            </div>
          </div>

          <button
            onClick={() => onSelectProduct(product)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-300 hover:text-white bg-[#181a24] hover:bg-[#202432] rounded-xl transition-colors border border-[#262a3a] cursor-pointer"
            title="Xem chi tiết"
          >
            <Eye className="w-3.5 h-3.5 text-gray-400" />
            <span>Chi tiết</span>
          </button>
        </div>

        <button
          onClick={() => !isOutOfStock && onAddToCart(product)}
          disabled={isOutOfStock}
          className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-black rounded-xl transition-all cursor-pointer ${
            isOutOfStock
              ? "bg-[#181a24] text-[#6c7285] cursor-not-allowed border border-[#242836]"
              : "bg-[#e2f500] hover:bg-[#ecff1a] active:scale-98 text-black shadow-md shadow-[#e2f500]/10"
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>{isOutOfStock ? "Hết hàng" : "Thêm vào giỏ hàng"}</span>
        </button>
      </div>

    </div>
  );
}