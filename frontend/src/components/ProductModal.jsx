import React from "react";
import { X, Plus, ShieldCheck, Layers, Sparkles } from "lucide-react";

export default function ProductModal({ product, onClose, onAddToCart }) {
  if (!product) return null;

  const isOutOfStock = product.stock <= 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[#0c0d13] border border-[#232736] rounded-2xl shadow-2xl overflow-hidden text-white my-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner / Image Section */}
        <div className="relative aspect-video sm:h-72 bg-[#161822] overflow-hidden">
          <img
            src={product.image_url || "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80"}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0d13] via-transparent to-black/50" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all cursor-pointer z-10 border border-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 text-xs font-bold bg-[#e2f500]/15 text-[#e2f500] border border-[#e2f500]/30 rounded-lg flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Sản phẩm Web3</span>
            </span>
            <span className="text-xs text-[#8e92a4] font-mono bg-[#141620] px-2.5 py-1 rounded-lg border border-[#222634]">
              ID #{product.id}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white">{product.name}</h2>
          <p className="mt-3 text-sm text-[#8e92a4] leading-relaxed">
            {product.description}
          </p>

          {/* Stats Grid Strip */}
          <div className="mt-6 p-4 rounded-xl bg-[#141620] border border-[#222634] grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <span className="text-[10px] text-[#71778c] uppercase font-semibold block">
                Đơn giá On-chain
              </span>
              <span className="text-xl font-extrabold text-[#e2f500] font-mono">
                Ξ {product.price_eth} <span className="text-xs font-normal text-[#8e92a4]">ETH</span>
              </span>
            </div>

            <div>
              <span className="text-[10px] text-[#71778c] uppercase font-semibold block">
                Tồn kho khả dụng
              </span>
              <span className="text-sm font-bold text-gray-200 mt-1 block">
                {product.stock} đơn vị
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <span className="text-[10px] text-[#71778c] uppercase font-semibold block">
                Smart Contract
              </span>
              <span className="text-sm font-bold text-[#10c273] flex items-center gap-1 mt-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Sepolia Verified</span>
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-[#1b1f2b]">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-[#262a3a] bg-[#161822] hover:bg-[#202432] text-xs font-semibold text-gray-300 hover:text-white transition-colors cursor-pointer"
            >
              Đóng
            </button>
            <button
              onClick={() => {
                if (!isOutOfStock) {
                  onAddToCart(product);
                  onClose();
                }
              }}
              disabled={isOutOfStock}
              className={`flex items-center gap-2 px-6 py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                isOutOfStock
                  ? "bg-[#181a24] text-[#6c7285] cursor-not-allowed border border-[#242836]"
                  : "bg-[#e2f500] hover:bg-[#ecff1a] active:scale-98 text-black shadow-[0_0_20px_rgba(226,245,0,0.2)]"
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>{isOutOfStock ? "Hết hàng" : "Thêm vào Giỏ hàng"}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}