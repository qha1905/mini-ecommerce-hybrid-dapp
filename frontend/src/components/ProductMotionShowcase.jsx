import React, { useState, useEffect, useRef } from "react";
import { ArrowRight, ShoppingBag, Eye, Sparkles, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

export default function ProductMotionShowcase({ products = [], onSelectProduct, onAddToCart }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const stripRef = useRef(null);

  // Fallback nếu danh sách rỗng lúc đầu
  const displayProducts = products.length > 0 ? products : [
    {
      id: 1,
      name: "Exclusive Web3 Genesis NFT Hoodie",
      description: "Áo Hoodie phiên bản giới hạn kỷ niệm khởi chạy mạng Web3, chất cotton nỉ 100% thoáng mát.",
      price_eth: "0.00030000",
      image_url: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80",
      stock: 50,
      keyword: "HOODIE",
      themeColor: "from-[#042111] via-[#07381d] to-[#031c0e]",
      accentColor: "#10c273",
    },
  ];

  // Danh sách sản phẩm duy nhất (không nhân bản trùng lặp)
  const activeProduct = displayProducts[activeIndex % displayProducts.length] || displayProducts[0];

  // Tự động chuyển động (Auto-play motion)
  useEffect(() => {
    if (!isPlaying || isHovered || displayProducts.length <= 1) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % displayProducts.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [isPlaying, isHovered, displayProducts.length]);

  // Tự động scroll dải thumbnail theo active item
  useEffect(() => {
    if (stripRef.current) {
      const activeElement = stripRef.current.querySelector(`[data-active="true"]`);
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [activeIndex]);

  const handlePrev = (e) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev - 1 + displayProducts.length) % displayProducts.length);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev + 1) % displayProducts.length);
  };

  return (
    <div className="max-w-[1520px] mx-auto px-4 md:px-6 pt-5 pb-6">
      <div
        className="relative w-full rounded-2xl md:rounded-3xl overflow-hidden border border-[#232736] shadow-2xl bg-[#090b10] min-h-[360px] sm:min-h-[420px] md:min-h-[450px] flex flex-col justify-between"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Dynamic Product Background Images with Smooth Crossfade Motion */}
        {displayProducts.map((item, idx) => {
          const isActive = idx === (activeIndex % displayProducts.length);
          const bgImg = item.image_url
            ? item.image_url.replace("w=800", "w=1600")
            : "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1600&q=80";

          return (
            <div
              key={`bg-${item.id || idx}`}
              className={`absolute inset-0 transition-all duration-1000 ease-in-out pointer-events-none ${
                isActive ? "opacity-100 scale-100 z-0" : "opacity-0 scale-105 -z-10"
              }`}
            >
              {/* Product Background Image */}
              <img
                src={bgImg}
                alt={item.name}
                className="w-full h-full object-cover object-center"
              />

              {/* Gradient Shading & Vignette for Readability (chỉ làm tối nhẹ ở chân banner để làm nổi chữ) */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#050608]/90 via-black/30 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-black/40" />
            </div>
          );
        })}

        {/* Ambient Glows */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none z-1" />
        <div className="absolute top-1/2 right-10 w-96 h-96 bg-[#e2f500]/10 rounded-full blur-3xl pointer-events-none z-1" />

        {/* Top Header Row of the Banner */}
        <div className="relative z-10 px-5 sm:px-8 pt-5 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#e2f500] animate-pulse" />
            <span className="text-gray-300">Bộ Sưu Tập Sản Phẩm Nổi Bật</span>
            <span className="text-[10px] bg-[#e2f500] text-black font-extrabold px-1.5 py-0.2 rounded-full">
              LIVE
            </span>
          </div>

          {/* Autoplay & Slides Controls */}
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-full text-xs text-gray-300">
            <span className="font-mono text-[11px] font-bold">
              {String((activeIndex % displayProducts.length) + 1).padStart(2, "0")} / {String(displayProducts.length).padStart(2, "0")}
            </span>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1 text-gray-400 hover:text-white transition-colors cursor-pointer"
              title={isPlaying ? "Tạm dừng chuyển động" : "Tiếp tục chuyển động"}
            >
              {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Middle Empty Spacer to let the giant typography breathe */}
        <div className="relative z-10 py-6 sm:py-10" />

        {/* Bottom Banner Bar with Info, CTA & Avatar Badges Strip (Chính xác theo mẫu ảnh) */}
        <div className="relative z-10 bg-black/55 backdrop-blur-md px-5 sm:px-8 py-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 border-t border-white/10">
          
          {/* Left: Product Info & Call-To-Action Buttons */}
          <div className="space-y-3 max-w-xl">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-tight line-clamp-1">
                  {activeProduct.name}
                </h2>
                {activeProduct.stock > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-[#10c273] border border-emerald-500/30 text-[10px] font-bold whitespace-nowrap">
                    Kho: {activeProduct.stock}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-gray-300 font-medium line-clamp-1 mt-1">
                {activeProduct.description || "Trải nghiệm mua sắm Web3 trên Ethereum Smart Contract"}
              </p>
            </div>

            {/* Action Buttons & Price */}
            <div className="flex flex-wrap items-center gap-3 pt-0.5">
              {/* White Pill Button 'Xem Chi Tiết' (như nút 'Trade Collection' trong ảnh) */}
              <button
                onClick={() => onSelectProduct && onSelectProduct(activeProduct)}
                className="bg-white hover:bg-white/90 active:scale-95 text-black font-extrabold text-xs sm:text-sm px-6 py-2.5 rounded-full shadow-lg transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap"
              >
                <span>Xem chi tiết</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {/* Yellow Neon 'Thêm vào giỏ hàng' Button */}
              <button
                onClick={() => onAddToCart && onAddToCart(activeProduct)}
                className="bg-[#e2f500] hover:bg-[#ecff1a] active:scale-95 text-black font-black text-xs sm:text-sm px-5 py-2.5 rounded-full shadow-[0_0_20px_rgba(226,245,0,0.25)] transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>+ Thêm Giỏ Hàng</span>
              </button>

              {/* Price Pill */}
              <div className="bg-[#141620]/90 border border-white/10 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold text-white flex items-center gap-1.5">
                <span className="text-[#8e92a4] text-[10px] uppercase font-sans">Giá:</span>
                <span className="text-[#e2f500] font-black">Ξ {parseFloat(activeProduct.price_eth)} ETH</span>
              </div>
            </div>
          </div>

          {/* Right: Interactive Product Thumbnails Motion Strip (Thanh trình bày chuyển động sản phẩm) */}
          <div className="w-full lg:w-auto flex items-center gap-2 relative">
            
            {/* Scroll Prev */}
            <button
              onClick={handlePrev}
              className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/15 flex items-center justify-center shrink-0 transition-all cursor-pointer hover:scale-105"
              aria-label="Previous product"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Thumbnails Row (Mỗi sản phẩm hiển thị đúng 1 lần duy nhất) */}
            <div
              ref={stripRef}
              className="flex items-center gap-3 overflow-x-auto py-2 px-1 max-w-full lg:max-w-[560px] xl:max-w-[650px] no-scrollbar scroll-smooth"
            >
              {displayProducts.map((item, index) => {
                const isSelected = index === (activeIndex % displayProducts.length);

                return (
                  <button
                    key={item.id || index}
                    data-active={isSelected}
                    onClick={() => setActiveIndex(index)}
                    title={item.name}
                    className={`relative rounded-xl sm:rounded-2xl overflow-hidden shrink-0 transition-all duration-300 cursor-pointer ${
                      isSelected
                        ? "w-14 h-14 sm:w-16 sm:h-16 md:w-17 md:h-17 border-2 border-white ring-4 ring-black/60 shadow-[0_0_25px_rgba(255,255,255,0.45)] scale-110 -translate-y-1 z-20"
                        : "w-11 h-11 sm:w-13 sm:h-13 md:w-14 md:h-14 border border-white/20 opacity-70 hover:opacity-100 hover:scale-105 hover:border-white/60 bg-[#12141c]"
                    }`}
                  >
                    <img
                      src={item.image_url || "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80"}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />

                    {/* Active Indicator Dot */}
                    {isSelected && (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#e2f500] rounded-full border border-black shadow-sm" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Scroll Next */}
            <button
              onClick={handleNext}
              className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/15 flex items-center justify-center shrink-0 transition-all cursor-pointer hover:scale-105"
              aria-label="Next product"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}