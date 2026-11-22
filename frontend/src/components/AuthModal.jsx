import React, { useState } from "react";
import {
  Lock,
  Mail,
  User,
  ShieldCheck,
  ShoppingBag,
  Wallet,
  X,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { apiService } from "../services/apiService";

export default function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  currentWalletAddress,
}) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [walletAddress, setWalletAddress] = useState(currentWalletAddress || "");

  if (!isOpen) return null;

  // Submit Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiService.login(email, password);
      onSuccess(res.user);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Submit Register
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = {
        full_name: fullName,
        email,
        password,
        role: "CUSTOMER",
        wallet_address: walletAddress || null,
      };
      const res = await apiService.register(payload);
      onSuccess(res.user);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#0d0e14] border border-[#232736] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative text-white">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#1c1f2b] hover:bg-[#282d3e] flex items-center justify-center text-gray-400 hover:text-white transition-colors z-10 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Banner */}
        <div className="p-6 pb-4 bg-[#0d0e14] border-b border-[#1c202d]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#e2f500] to-emerald-400 flex items-center justify-center text-black font-black text-xl shadow-[0_0_15px_rgba(226,245,0,0.25)]">
              <span>Ξ</span>
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>{mode === "login" ? "Đăng Nhập Tài Khoản" : "Tạo Tài Khoản Mới"}</span>
              </h2>
              <p className="text-xs text-[#80869a] mt-0.5">
                Tách biệt phân quyền Khách hàng và Quản trị viên
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#1c202d] bg-[#11131a]">
          <button
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className={`flex-1 py-3 text-center text-xs font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
              mode === "login"
                ? "border-[#e2f500] text-[#e2f500] bg-[#161822]"
                : "border-transparent text-[#80869a] hover:text-white"
            }`}
          >
            Đăng Nhập
          </button>
          <button
            onClick={() => {
              setMode("register");
              setError(null);
              if (currentWalletAddress) setWalletAddress(currentWalletAddress);
            }}
            className={`flex-1 py-3 text-center text-xs font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
              mode === "register"
                ? "border-[#e2f500] text-[#e2f500] bg-[#161822]"
                : "border-transparent text-[#80869a] hover:text-white"
            }`}
          >
            Đăng Ký Tài Khoản
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {mode === "login" ? (
            /* =================== FORM ĐĂNG NHẬP =================== */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#80869a] uppercase tracking-wider mb-1.5">
                  Email đăng nhập
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-[#6c7285]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#141620] border border-[#232736] focus:border-[#e2f500] rounded-xl text-white text-sm outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#80869a] uppercase tracking-wider mb-1.5">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-[#6c7285]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-[#141620] border border-[#232736] focus:border-[#e2f500] rounded-xl text-white text-sm outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-[#6c7285] hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#e2f500] hover:bg-[#ecff1a] active:scale-98 text-black font-black text-sm rounded-xl shadow-[0_0_20px_rgba(226,245,0,0.2)] transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 cursor-pointer"
              >
                <span>{loading ? "Đang xử lý..." : "Đăng Nhập"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* =================== FORM ĐĂNG KÝ =================== */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#80869a] uppercase tracking-wider mb-1.5">
                  Họ và tên *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3.5 text-[#6c7285]" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#141620] border border-[#232736] focus:border-[#e2f500] rounded-xl text-white text-sm outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#80869a] uppercase tracking-wider mb-1.5">
                  Email đăng ký *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-[#6c7285]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#141620] border border-[#232736] focus:border-[#e2f500] rounded-xl text-white text-sm outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#80869a] uppercase tracking-wider mb-1.5">
                  Mật khẩu (tối thiểu 6 ký tự) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-[#6c7285]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-[#141620] border border-[#232736] focus:border-[#e2f500] rounded-xl text-white text-sm outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-[#6c7285] hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Địa chỉ ví Web3 (Tùy chọn) */}
              <div>
                <label className="block text-[11px] font-bold text-[#80869a] uppercase tracking-wider mb-1.5">
                  Địa chỉ Ví MetaMask (Tùy chọn)
                </label>
                <div className="relative">
                  <Wallet className="w-4 h-4 absolute left-3.5 top-3.5 text-[#6c7285]" />
                  <input
                    type="text"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full pl-10 pr-4 py-2.5 bg-[#141620] border border-[#232736] focus:border-[#e2f500] rounded-xl text-white text-xs font-mono outline-none transition-colors"
                  />
                </div>
                {currentWalletAddress && (
                  <p className="text-[11px] text-[#10c273] mt-1 font-semibold">
                    ✓ Đã nhận diện ví MetaMask đang kết nối
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#e2f500] hover:bg-[#ecff1a] active:scale-98 text-black font-black text-sm rounded-xl shadow-[0_0_20px_rgba(226,245,0,0.2)] transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 cursor-pointer"
              >
                <span>{loading ? "Đang tạo tài khoản..." : "Đăng Ký Ngay"}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}