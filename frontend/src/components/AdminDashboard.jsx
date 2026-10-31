import React, { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  FileSpreadsheet,
  Users,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Layers,
  ShieldCheck,
  Eye,
  EyeOff,
  X,
  Copy,
  Check,
  LogOut,
  Lock,
  ChevronLeft,
  ChevronRight,
  Ban,
  Upload,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { apiService } from "../services/apiService";
import contractData from "../contracts/contractData.json";

export default function AdminDashboard({
  onBackToStore,
  currentUser,
  onLogout,
  onOpenAuthModal,
}) {
  const [activeTab, setActiveTab] = useState("overview"); // overview | products | categories | orders | users
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);

  // Toast notification
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Search, Filter & Pagination states
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("ALL");
  const [productVisibilityFilter, setProductVisibilityFilter] = useState("ALL");
  const [productPage, setProductPage] = useState(1);
  const productsPerPage = 10;

  const [categorySearch, setCategorySearch] = useState("");
  const [categoryVisibilityFilter, setCategoryVisibilityFilter] = useState("ALL");
  const [categoryPage, setCategoryPage] = useState(1);
  const categoriesPerPage = 10;

  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("ALL");
  const [orderPage, setOrderPage] = useState(1);
  const ordersPerPage = 10;

  const [userSearch, setUserSearch] = useState("");
  const [userVisibilityFilter, setUserVisibilityFilter] = useState("ALL");
  const [userPage, setUserPage] = useState(1);
  const usersPerPage = 10;

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: "",
    category_id: "",
    price_eth: "",
    stock: 10,
    image_url: "",
    description: "",
    is_active: 1,
  });

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showUrlFallback, setShowUrlFallback] = useState(false);
  const fileInputRef = useRef(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    slug: "",
    description: "",
    is_active: 1,
  });

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    full_name: "",
    email: "",
    wallet_address: "",
    is_active: 1,
  });

  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [copiedText, setCopiedText] = useState("");

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(""), 2000);
  };

  // Load all initial admin data
  const loadAllData = async () => {
    setLoading(true);
    try {
      const [statsData, prodsData, catsData, ordersData, usersData] = await Promise.all([
        apiService.getAdminStats(),
        apiService.getProducts(true),
        apiService.getCategories(true),
        apiService.getAllAdminOrders(),
        apiService.getUsers(),
      ]);
      setStats(statsData);
      setProducts(prodsData);
      setCategories(catsData);
      setOrders(ordersData);
      setUsers(usersData);
    } catch (err) {
      console.error("Failed to load admin data:", err);
      showToast("Không thể tải toàn bộ dữ liệu quản trị: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // ===================== PRODUCT CRUD =====================
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: "",
      category_id: categories.length > 0 ? categories[0].id : "",
      price_eth: "0.0005",
      stock: 10,
      image_url: "",
      description: "",
      is_active: 1,
    });
    setIsUploadingImage(false);
    setShowUrlFallback(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      category_id: prod.category_id || "",
      price_eth: prod.price_eth,
      stock: prod.stock,
      image_url: prod.image_url || "",
      description: prod.description || "",
      is_active: prod.is_active !== undefined ? prod.is_active : 1,
    });
    setIsUploadingImage(false);
    setShowUrlFallback(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsProductModalOpen(true);
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Vui lòng chọn file hình ảnh hợp lệ (PNG, JPG, WEBP, GIF, SVG)!");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast("Dung lượng ảnh vượt quá giới hạn cho phép (10MB)!");
      return;
    }

    setIsUploadingImage(true);
    try {
      const uploadedUrl = await apiService.uploadImage(file);
      setProductForm((prev) => ({ ...prev, image_url: uploadedUrl }));
      showToast("Tải ảnh từ máy tính thành công!");
    } catch (err) {
      console.error("Upload image error:", err);
      showToast(err.message || "Không thể tải ảnh lên máy chủ!", "error");
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = () => {
    setProductForm((prev) => ({ ...prev, image_url: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    if (isUploadingImage) {
      showToast("Vui lòng đợi ảnh tải lên hoàn tất trước khi lưu!");
      return;
    }
    try {
      const payload = {
        ...productForm,
        image_url: productForm.image_url || "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80",
        price_eth: parseFloat(productForm.price_eth),
        stock: parseInt(productForm.stock),
        category_id: productForm.category_id ? parseInt(productForm.category_id) : null,
        is_active: productForm.is_active !== undefined ? productForm.is_active : 1,
      };

      if (editingProduct) {
        await apiService.updateProduct(editingProduct.id, payload);
        showToast("Cập nhật sản phẩm thành công!");
      } else {
        await apiService.createProduct(payload);
        showToast("Thêm sản phẩm mới thành công!");
      }
      setIsProductModalOpen(false);
      loadAllData();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleToggleProductVisibility = async (id, name, currentActive) => {
    const isCurrentlyVisible = currentActive !== 0;
    const action = isCurrentlyVisible ? "ẩn" : "hiển thị";
    const confirmMsg = isCurrentlyVisible
      ? `Bạn có chắc chắn muốn ẩn sản phẩm "${name}" (ID #${id}) khỏi Cửa hàng khách không?\n\n(Lưu ý: Sản phẩm sẽ được chuyển sang trạng thái Ẩn, không xóa cứng để bảo vệ tính toàn vẹn của dữ liệu đơn hàng).`
      : `Bạn có chắc chắn muốn cho hiển thị lại sản phẩm "${name}" (ID #${id}) lên Cửa hàng khách không?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await apiService.toggleProductVisibility(id);
      showToast(`Đã ${action} sản phẩm "${name}" thành công!`);
      loadAllData();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // ===================== CATEGORY CRUD =====================
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ name: "", slug: "", description: "", is_active: 1 });
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat) => {
    setEditingCategory(cat);
    setCategoryForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
      is_active: cat.is_active !== undefined ? cat.is_active : 1,
    });
    setIsCategoryModalOpen(true);
  };

  const handleSubmitCategory = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await apiService.updateCategory(editingCategory.id, {
          ...categoryForm,
          is_active: categoryForm.is_active !== undefined ? categoryForm.is_active : 1,
        });
        showToast("Cập nhật danh mục thành công!");
      } else {
        await apiService.createCategory({
          ...categoryForm,
          is_active: categoryForm.is_active !== undefined ? categoryForm.is_active : 1,
        });
        showToast("Thêm danh mục mới thành công!");
      }
      setIsCategoryModalOpen(false);
      loadAllData();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleToggleCategoryVisibility = async (id, name, currentActive) => {
    const isCurrentlyVisible = currentActive !== 0;
    const action = isCurrentlyVisible ? "ẩn" : "hiển thị";
    const confirmMsg = isCurrentlyVisible
      ? `Bạn có chắc chắn muốn ẩn danh mục "${name}" (ID #${id}) khỏi Cửa hàng khách không?\n\n(Lưu ý: Danh mục sẽ được chuyển sang trạng thái Ẩn, các sản phẩm thuộc danh mục này vẫn được giữ nguyên).`
      : `Bạn có chắc chắn muốn cho hiển thị lại danh mục "${name}" (ID #${id}) lên Cửa hàng khách không?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await apiService.toggleCategoryVisibility(id);
      showToast(`Đã ${action} danh mục "${name}" thành công!`);
      loadAllData();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // ===================== USER CRUD =====================
  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUserForm({ full_name: "", email: "", wallet_address: "", is_active: 1 });
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (u) => {
    setEditingUser(u);
    setUserForm({
      full_name: u.full_name,
      email: u.email,
      wallet_address: u.wallet_address || "",
      is_active: u.is_active !== undefined ? u.is_active : 1,
    });
    setIsUserModalOpen(true);
  };

  const handleSubmitUser = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await apiService.updateUser(editingUser.id, {
          ...userForm,
          is_active: userForm.is_active !== undefined ? userForm.is_active : 1,
        });
        showToast("Cập nhật thông tin người dùng thành công!");
      } else {
        await apiService.createUser({
          ...userForm,
          is_active: userForm.is_active !== undefined ? userForm.is_active : 1,
        });
        showToast("Thêm người dùng mới thành công!");
      }
      setIsUserModalOpen(false);
      loadAllData();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleToggleUserVisibility = async (id, name, currentActive) => {
    const isCurrentlyVisible = currentActive !== 0;
    const action = isCurrentlyVisible ? "ẩn" : "hiển thị";
    const confirmMsg = isCurrentlyVisible
      ? `Bạn có chắc chắn muốn ẩn người dùng "${name}" (ID #${id}) không?\n\n(Lưu ý: Tài khoản sẽ chuyển sang trạng thái Ẩn, dữ liệu đơn hàng và lịch sử giao dịch Web3 vẫn được giữ nguyên).`
      : `Bạn có chắc chắn muốn hiển thị / kích hoạt lại người dùng "${name}" (ID #${id}) không?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await apiService.toggleUserVisibility(id);
      showToast(`Đã ${action} người dùng "${name}" thành công!`);
      loadAllData();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // ===================== FILTERED & PAGINATED LISTS =====================
  // 1. Sản phẩm (Products)
  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(productSearch.toLowerCase())) ||
      p.id.toString() === productSearch.trim();
    const matchCat = productCategoryFilter === "ALL" || (p.category_id && p.category_id.toString() === productCategoryFilter);
    const matchVisibility =
      productVisibilityFilter === "ALL" ||
      (productVisibilityFilter === "VISIBLE" && p.is_active !== 0) ||
      (productVisibilityFilter === "HIDDEN" && p.is_active === 0);
    return matchSearch && matchCat && matchVisibility;
  });

  const totalProductPages = Math.ceil(filteredProducts.length / productsPerPage) || 1;
  const currentProductPage = Math.min(Math.max(productPage, 1), totalProductPages);
  const productStartIndex = (currentProductPage - 1) * productsPerPage;
  const paginatedProducts = filteredProducts.slice(productStartIndex, productStartIndex + productsPerPage);

  // 2. Danh mục (Categories)
  const filteredCategories = categories.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
      (c.slug && c.slug.toLowerCase().includes(categorySearch.toLowerCase())) ||
      (c.description && c.description.toLowerCase().includes(categorySearch.toLowerCase())) ||
      c.id.toString() === categorySearch.trim();
    const matchVisibility =
      categoryVisibilityFilter === "ALL" ||
      (categoryVisibilityFilter === "VISIBLE" && c.is_active !== 0) ||
      (categoryVisibilityFilter === "HIDDEN" && c.is_active === 0);
    return matchSearch && matchVisibility;
  });

  const totalCategoryPages = Math.ceil(filteredCategories.length / categoriesPerPage) || 1;
  const currentCategoryPage = Math.min(Math.max(categoryPage, 1), totalCategoryPages);
  const categoryStartIndex = (currentCategoryPage - 1) * categoriesPerPage;
  const paginatedCategories = filteredCategories.slice(categoryStartIndex, categoryStartIndex + categoriesPerPage);

  // 3. Đơn hàng (Orders)
  const filteredOrders = orders.filter((o) => {
    const matchStatus = orderStatusFilter === "ALL" || o.status === orderStatusFilter;
    const matchSearch =
      o.id.toString().includes(orderSearch.trim()) ||
      (o.buyer_wallet && o.buyer_wallet.toLowerCase().includes(orderSearch.toLowerCase())) ||
      (o.tx_hash && o.tx_hash.toLowerCase().includes(orderSearch.toLowerCase())) ||
      (o.user_name && o.user_name.toLowerCase().includes(orderSearch.toLowerCase())) ||
      (o.user_email && o.user_email.toLowerCase().includes(orderSearch.toLowerCase()));
    return matchStatus && matchSearch;
  });

  const totalOrderPages = Math.ceil(filteredOrders.length / ordersPerPage) || 1;
  const currentOrderPage = Math.min(Math.max(orderPage, 1), totalOrderPages);
  const orderStartIndex = (currentOrderPage - 1) * ordersPerPage;
  const paginatedOrders = filteredOrders.slice(orderStartIndex, orderStartIndex + ordersPerPage);

  // 4. Người dùng (Users)
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.wallet_address && u.wallet_address.toLowerCase().includes(userSearch.toLowerCase())) ||
      u.id.toString() === userSearch.trim();
    const matchVisibility =
      userVisibilityFilter === "ALL" ||
      (userVisibilityFilter === "VISIBLE" && u.is_active !== 0) ||
      (userVisibilityFilter === "HIDDEN" && u.is_active === 0);
    return matchSearch && matchVisibility;
  });

  const totalUserPages = Math.ceil(filteredUsers.length / usersPerPage) || 1;
  const currentUserPage = Math.min(Math.max(userPage, 1), totalUserPages);
  const userStartIndex = (currentUserPage - 1) * usersPerPage;
  const paginatedUsers = filteredUsers.slice(userStartIndex, userStartIndex + usersPerPage);

  // RBAC Access Guard: Chỉ cho phép tài khoản có quyền ADMIN truy cập
  if (!currentUser || currentUser.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl animate-fadeIn">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 mx-auto flex items-center justify-center mb-5 border border-rose-500/20">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Khu Vực Quản Trị Hệ Thống</h2>
          <p className="text-xs text-slate-400 leading-relaxed mb-6">
            Giao diện này chỉ dành riêng cho tài khoản có quyền <strong>Quản Trị Viên (ADMIN)</strong>.
            {currentUser
              ? ` Tài khoản hiện tại của bạn ("${currentUser.full_name}") là Khách hàng.`
              : " Bạn hiện chưa đăng nhập vào hệ thống."}
          </p>
          <div className="space-y-3">
            <button
              onClick={onOpenAuthModal}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
            >
              <span>Đăng Nhập Với Quản Trị Viên (Admin)</span>
            </button>
            <button
              onClick={onBackToStore}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl transition-all"
            >
              ← Quay Lại Giao Diện Khách Hàng
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 transition-all transform animate-bounce ${toast.type === "error"
            ? "bg-rose-600 text-white border border-rose-400"
            : "bg-emerald-600 text-white border border-emerald-400"
            }`}
        >
          {toast.type === "error" ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          <span className="text-sm font-semibold">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SIDEBAR BÊN TRÁI: LOGO, TỔNG QUAN, SẢN PHẨM, DANH MỤC, ĐƠN HÀNG, USER */}
      {/* ==================================================================== */}
      <aside className="w-full md:w-64 lg:w-72 bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between shrink-0 md:sticky md:top-0 md:h-screen z-30">
        <div>
          {/* Logo & Header Sidebar */}
          <div className="p-5 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/20 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-base font-bold tracking-tight text-white truncate">Quản trị Hệ thống</h1>
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-blue-500/15 text-blue-400 rounded border border-blue-500/30">
                    ADMIN
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  Sepolia DApp • Hybrid Web3
                </p>
              </div>
            </div>
          </div>

          {/* Menu Điều hướng Tabs Bên Trái */}
          <div className="p-4 space-y-1.5">
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Menu Quản trị
            </div>
            {[
              { id: "overview", label: "Tổng quan", icon: LayoutDashboard },
              { id: "products", label: "Sản phẩm", icon: Package, badge: products.length },
              { id: "categories", label: "Danh mục", icon: FolderTree, badge: categories.length },
              { id: "orders", label: "Đơn hàng", icon: FileSpreadsheet, badge: orders.length },
              { id: "users", label: "Người dùng", icon: Users, badge: users.length },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all group ${isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 transition-colors ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"}`} />
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge !== undefined && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold font-mono transition-colors ${isActive
                        ? "bg-blue-700 text-white"
                        : "bg-slate-800/80 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-300"
                        }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Phần dưới cùng của Sidebar: Thông tin tài khoản & Điều hướng */}
        <div className="p-4 border-t border-slate-800/80 space-y-3 bg-slate-950/60">
          {/* Thông tin Quản trị viên */}
          <div className="flex items-center gap-3 p-2.5 bg-slate-900/90 rounded-xl border border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 font-bold flex items-center justify-center text-sm shrink-0 border border-slate-700">
              {currentUser.full_name ? currentUser.full_name.charAt(0).toUpperCase() : "A"}
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-xs font-bold text-white truncate">
                {currentUser.full_name || "Quản trị viên"}
              </span>
              <span className="block text-[10px] text-slate-400 font-mono truncate">
                {currentUser.email || "admin@dapp.com"}
              </span>
            </div>
          </div>

          {/* Các nút hành động */}
          <div className="space-y-1.5">
            <button
              onClick={onBackToStore}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all active:scale-95"
            >
              <span>← Xem Cửa Hàng Khách</span>
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-900 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 text-xs font-medium rounded-xl border border-slate-800 hover:border-rose-500/30 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng xuất</span>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ==================================================================== */}
      {/* KHU VỰC NỘI DUNG CHÍNH (BÊN PHẢI) */}
      {/* ==================================================================== */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Header Bar */}
        <header className="border-b border-slate-800 bg-slate-950/70 backdrop-blur-md sticky top-0 z-20 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white tracking-tight">
              {activeTab === "overview" && "Tổng quan Hệ thống"}
              {activeTab === "products" && "Quản lý Sản phẩm"}
              {activeTab === "categories" && "Quản lý Danh mục"}
              {activeTab === "orders" && "Quản lý Đơn hàng On-chain"}
              {activeTab === "users" && "Quản lý Người dùng"}
            </h2>
            <span className="text-xs text-slate-600 hidden sm:inline">•</span>
            <span className="text-xs text-slate-400 hidden sm:inline">
              {activeTab === "overview" && "Đối soát On-chain Smart Contract & Quản lý CSDL Off-chain"}
              {activeTab === "products" && "Thêm mới, sửa thông tin, ẩn/hiện sản phẩm trên cửa hàng"}
              {activeTab === "categories" && "Quản lý và kích hoạt danh mục phân loại sản phẩm"}
              {activeTab === "orders" && "Đối soát thanh toán Smart Contract, tra cứu TxHash"}
              {activeTab === "users" && "Quản lý danh sách tài khoản và ví Web3"}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={loadAllData}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-colors"
              title="Tải lại toàn bộ dữ liệu"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-400" : ""}`} />
              <span className="hidden sm:inline">Làm mới</span>
            </button>
          </div>
        </header>

        {/* Nội dung chính của Tab */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1 w-full max-w-7xl mx-auto">
          {/* ==================================================================== */}
          {/* TAB 1: OVERVIEW / DASHBOARD STATS */}
          {/* ==================================================================== */}
          {activeTab === "overview" && (
            <div className="space-y-8 animate-fadeIn">
              {/* KPI Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Doanh thu ETH */}
                <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-cyan-500/50 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Doanh thu Smart Contract</span>
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-white tracking-tight">
                      {stats ? stats.revenueEth : "0.000000"}
                    </span>
                    <span className="text-cyan-400 font-bold text-sm">ETH</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    Từ {stats?.paidOrders || 0} đơn thanh toán on-chain thành công
                  </p>
                  <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl group-hover:bg-cyan-500/10 transition-all" />
                </div>

                {/* Đơn hàng */}
                <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-emerald-500/50 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tổng Đơn Hàng</span>
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-baseline gap-3">
                    <span className="text-3xl font-extrabold text-white">{stats ? stats.totalOrders : 0}</span>
                    <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      {stats?.paidOrders || 0} Đã thanh toán
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-amber-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {stats?.pendingOrders || 0} đơn đang chờ thanh toán
                  </p>
                </div>

                {/* Sản phẩm & Tồn kho */}
                <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-indigo-500/50 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Kho Hàng Sản Phẩm</span>
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                      <Package className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-baseline gap-3">
                    <span className="text-3xl font-extrabold text-white">{stats ? stats.totalProducts : 0}</span>
                    <span className="text-xs text-slate-400">mặt hàng</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    Tổng tồn kho: <strong className="text-indigo-300 font-bold">{stats?.totalStock || 0}</strong> sản phẩm ({stats?.totalCategories || 0} danh mục)
                  </p>
                </div>

                {/* Khách hàng / Người dùng */}
                <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-violet-500/50 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Người Dùng DApp</span>
                    <div className="w-9 h-9 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-baseline gap-3">
                    <span className="text-3xl font-extrabold text-white">{stats ? stats.totalUsers : 0}</span>
                    <span className="text-xs text-slate-400">tài khoản</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    Địa chỉ ví Web3 đã định danh trong hệ thống
                  </p>
                </div>
              </div>

              {/* Smart Contract Notice Card */}
              <div className="bg-slate-800/50 border border-slate-700/80 rounded-2xl p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      <h3 className="text-base font-bold text-white">Smart Contract: EcommercePayment.sol (Sepolia Testnet)</h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 font-mono">
                      Hợp đồng: {contractData.address} (Chain ID: {contractData.chainId || "11155111"})
                    </p>
                    <p className="text-xs text-slate-300 mt-1">
                      ✓ Bộ lắng nghe sự kiện (Event Listener) hoạt động 24/7 để đối soát trạng thái đơn hàng ngay khi người mua kích hoạt thanh toán.
                    </p>
                  </div>
                  <a
                    href={`https://sepolia.etherscan.io/address/${contractData.address}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all hover:scale-105"
                  >
                    <span>Xem trên Sepolia Etherscan</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Split Section: Top Products & Recent Settlements */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Selling Products */}
                <div className="bg-slate-800/50 border border-slate-700/80 rounded-2xl p-6">
                  <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
                    <Package className="w-4 h-4 text-cyan-400" />
                    <span>Sản phẩm Bán chạy nhất (Doanh số Paid)</span>
                  </h3>
                  <div className="divide-y divide-slate-700/60">
                    {stats?.topProducts && stats.topProducts.length > 0 ? (
                      stats.topProducts.map((p) => (
                        <div key={p.id} className="py-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.image_url}
                              alt={p.name}
                              className="w-11 h-11 rounded-lg object-cover bg-slate-900 border border-slate-700"
                            />
                            <div>
                              <h4 className="text-sm font-semibold text-slate-200 line-clamp-1">{p.name}</h4>
                              <p className="text-xs text-slate-400">{parseFloat(p.price_eth).toFixed(4)} ETH</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold text-white">{p.units_sold} đã bán</span>
                            <p className="text-xs text-emerald-400 font-mono">
                              {parseFloat(p.total_earned_eth || 0).toFixed(4)} ETH
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 py-4 text-center">Chưa có dữ liệu bán hàng</p>
                    )}
                  </div>
                </div>

                {/* Recent Settlements */}
                <div className="bg-slate-800/50 border border-slate-700/80 rounded-2xl p-6">
                  <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span>Giao dịch On-chain Mới nhất</span>
                  </h3>
                  <div className="divide-y divide-slate-700/60">
                    {stats?.recentOrders && stats.recentOrders.length > 0 ? (
                      stats.recentOrders.map((o) => (
                        <div key={o.id} className="py-3 flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-slate-200">Đơn #{o.id}</span>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${o.status === "PAID"
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                  }`}
                              >
                                {o.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">Khách: {o.user_name}</p>
                            {o.tx_hash && (
                              <a
                                href={`https://sepolia.etherscan.io/tx/${o.tx_hash}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-cyan-400 hover:underline font-mono flex items-center gap-1 mt-0.5"
                              >
                                Tx: {o.tx_hash.slice(0, 10)}...{o.tx_hash.slice(-6)}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold text-cyan-300 font-mono">
                              {parseFloat(o.total_amount_eth).toFixed(4)} ETH
                            </span>
                            <p className="text-[11px] text-slate-400">
                              {new Date(o.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 py-4 text-center">Chưa có đơn hàng nào</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================================== */}
          {/* TAB 2: PRODUCTS MANAGEMENT */}
          {/* ==================================================================== */}
          {activeTab === "products" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Action Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3 flex-1">
                  {/* Search */}
                  <div className="relative flex-1 min-w-[220px] max-w-md">
                    <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        setProductPage(1);
                      }}
                      placeholder="Tìm theo tên sản phẩm hoặc ID..."
                      className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  {/* Filter Category */}
                  <select
                    value={productCategoryFilter}
                    onChange={(e) => {
                      setProductCategoryFilter(e.target.value);
                      setProductPage(1);
                    }}
                    className="px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="ALL">Tất cả danh mục</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  {/* Filter Visibility (Ẩn / Hiện) */}
                  <select
                    value={productVisibilityFilter}
                    onChange={(e) => {
                      setProductVisibilityFilter(e.target.value);
                      setProductPage(1);
                    }}
                    className="px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="ALL">Tất cả trạng thái (Hiện & Ẩn)</option>
                    <option value="VISIBLE">Đang hiển thị</option>
                    <option value="HIDDEN">Đã ẩn</option>
                  </select>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-xs text-slate-400 whitespace-nowrap">
                    Tìm thấy <strong>{filteredProducts.length}</strong> sản phẩm • Trang <strong>{currentProductPage} / {totalProductPages}</strong>
                  </div>

                  <button
                    onClick={handleOpenAddProduct}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-600/20 transition-all active:scale-95 whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm Sản Phẩm Mới</span>
                  </button>
                </div>
              </div>

              {/* Products Table */}
              <div className="bg-slate-800/50 border border-slate-700/80 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-700 bg-slate-900/60 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        <th className="py-3.5 px-4">ID</th>
                        <th className="py-3.5 px-4">Sản Phẩm</th>
                        <th className="py-3.5 px-4 min-w-[150px]">Danh Mục</th>
                        <th className="py-3.5 px-4 whitespace-nowrap">Đơn Giá ETH</th>
                        <th className="py-3.5 px-4 whitespace-nowrap">Tồn Kho</th>
                        <th className="py-3.5 px-4 whitespace-nowrap">Trạng Thái</th>
                        <th className="py-3.5 px-4 text-right whitespace-nowrap">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/60 text-sm">
                      {paginatedProducts.length > 0 ? (
                        paginatedProducts.map((p) => (
                          <tr
                            key={p.id}
                            className={`hover:bg-slate-700/30 transition-colors ${p.is_active === 0 ? "opacity-60 bg-slate-900/40" : ""
                              }`}
                          >
                            <td className="py-3.5 px-4 font-mono text-slate-400">#{p.id}</td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={p.image_url}
                                  alt={p.name}
                                  className="w-12 h-12 rounded-xl object-cover bg-slate-900 border border-slate-700 flex-shrink-0"
                                />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-semibold text-white line-clamp-1">{p.name}</h4>
                                    {p.is_active === 0 && (
                                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-500/20 text-rose-300 rounded border border-rose-500/30">
                                        Đã ẩn
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-400 line-clamp-1 max-w-md">{p.description}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 min-w-[150px]">
                              {p.category_name ? (
                                <span className="inline-block px-2.5 py-1 text-xs font-medium bg-slate-800 text-slate-300 rounded-lg border border-slate-700 leading-snug">
                                  {p.category_name}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-500 italic">Chưa phân loại</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-100 whitespace-nowrap">
                              {parseFloat(p.price_eth).toFixed(5)} ETH
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span
                                className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${p.stock <= 5
                                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                  : "bg-slate-800 text-slate-300 border border-slate-700"
                                  }`}
                              >
                                {p.stock} cái
                              </span>
                            </td>
                            {/* Trạng thái Ẩn / Hiện */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {p.is_active !== 0 ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
                                  <Eye className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span>Đang hiện</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-700/80 text-slate-400 border border-slate-600/50 whitespace-nowrap">
                                  <EyeOff className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span>Đã ẩn</span>
                                </span>
                              )}
                            </td>
                            {/* Thao tác */}
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleOpenEditProduct(p)}
                                  className="p-2 bg-slate-700/60 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
                                  title="Sửa sản phẩm"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                {p.is_active !== 0 ? (
                                  <button
                                    onClick={() => handleToggleProductVisibility(p.id, p.name, p.is_active)}
                                    className="p-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-colors border border-amber-500/20"
                                    title="Ẩn sản phẩm khỏi cửa hàng (không xóa cứng)"
                                  >
                                    <EyeOff className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleToggleProductVisibility(p.id, p.name, p.is_active)}
                                    className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors border border-emerald-500/20"
                                    title="Hiển thị lại sản phẩm lên cửa hàng"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400 text-sm">
                            Không tìm thấy sản phẩm nào phù hợp
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Thanh Phân Trang Sản Phẩm (Mỗi trang 10 sản phẩm) */}
                {filteredProducts.length > 0 && (
                  <div className="px-5 py-4 bg-slate-900/90 border-t border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="text-slate-400">
                      Hiển thị <span className="font-bold text-white">{productStartIndex + 1}</span> -{" "}
                      <span className="font-bold text-white">
                        {Math.min(productStartIndex + productsPerPage, filteredProducts.length)}
                      </span>{" "}
                      trên tổng số <span className="font-bold text-blue-400">{filteredProducts.length}</span> sản phẩm
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Nút Trước */}
                      <button
                        onClick={() => setProductPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentProductPage === 1}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 transition-colors flex items-center gap-1 border border-slate-700"
                        title="Trang trước"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Trước</span>
                      </button>

                      {/* Danh sách số trang */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalProductPages }, (_, idx) => idx + 1).map((pageNum) => (
                          <button
                            key={pageNum}
                            onClick={() => setProductPage(pageNum)}
                            className={`w-8 h-8 rounded-xl font-bold text-xs transition-all ${currentProductPage === pageNum
                              ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                              : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700"
                              }`}
                          >
                            {pageNum}
                          </button>
                        ))}
                      </div>

                      {/* Nút Sau */}
                      <button
                        onClick={() => setProductPage((prev) => Math.min(prev + 1, totalProductPages))}
                        disabled={currentProductPage === totalProductPages}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 transition-colors flex items-center gap-1 border border-slate-700"
                        title="Trang sau"
                      >
                        <span>Sau</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================================== */}
          {/* TAB 3: CATEGORIES MANAGEMENT */}
          {/* ==================================================================== */}
          {activeTab === "categories" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Header & Action Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Danh mục Sản phẩm</h3>
                  <p className="text-xs text-slate-400">Phân loại mặt hàng giúp khách dễ dàng chọn lựa</p>
                </div>

                <button
                  onClick={handleOpenAddCategory}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-600/20 transition-all active:scale-95 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm Danh Mục</span>
                </button>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3 flex-1">
                  {/* Search */}
                  <div className="relative flex-1 min-w-[220px] max-w-md">
                    <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={categorySearch}
                      onChange={(e) => {
                        setCategorySearch(e.target.value);
                        setCategoryPage(1);
                      }}
                      placeholder="Tìm theo tên danh mục, slug, mô tả hoặc ID..."
                      className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400"
                    />
                  </div>

                  {/* Filter Visibility (Ẩn / Hiện) */}
                  <select
                    value={categoryVisibilityFilter}
                    onChange={(e) => {
                      setCategoryVisibilityFilter(e.target.value);
                      setCategoryPage(1);
                    }}
                    className="px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-400"
                  >
                    <option value="ALL">Tất cả trạng thái (Hiện & Ẩn)</option>
                    <option value="VISIBLE">Đang hiển thị</option>
                    <option value="HIDDEN">Đã ẩn</option>
                  </select>
                </div>

                <div className="text-xs text-slate-400 whitespace-nowrap">
                  Tìm thấy <strong>{filteredCategories.length}</strong> danh mục • Trang <strong>{currentCategoryPage} / {totalCategoryPages}</strong>
                </div>
              </div>

              {/* Categories Table */}
              <div className="bg-slate-800/50 border border-slate-700/80 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-700 bg-slate-900/60 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        <th className="py-3.5 px-4">ID</th>
                        <th className="py-3.5 px-4">Tên Danh Mục</th>
                        <th className="py-3.5 px-4">Slug Định Danh</th>
                        <th className="py-3.5 px-4">Mô Tả</th>
                        <th className="py-3.5 px-4 whitespace-nowrap">Số Sản Phẩm</th>
                        <th className="py-3.5 px-4 whitespace-nowrap">Trạng Thái</th>
                        <th className="py-3.5 px-4 text-right whitespace-nowrap">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/60 text-sm">
                      {paginatedCategories.length > 0 ? (
                        paginatedCategories.map((c) => (
                          <tr
                            key={c.id}
                            className={`hover:bg-slate-700/30 transition-colors ${c.is_active === 0 ? "opacity-60 bg-slate-900/40" : ""
                              }`}
                          >
                            <td className="py-3.5 px-4 font-mono text-slate-400">#{c.id}</td>
                            <td className="py-3.5 px-4 font-semibold text-white">
                              <div className="flex items-center gap-2">
                                <span>{c.name}</span>
                                {c.is_active === 0 && (
                                  <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-rose-500/10 text-rose-400 rounded border border-rose-500/20 whitespace-nowrap">
                                    Đã ẩn
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-xs text-cyan-300">{c.slug}</td>
                            <td className="py-3.5 px-4 text-xs text-slate-300 max-w-sm">{c.description || "—"}</td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className="px-2.5 py-1 text-xs font-semibold bg-indigo-500/20 text-indigo-300 rounded-lg border border-indigo-500/30 whitespace-nowrap">
                                {c.product_count || 0} sản phẩm
                              </span>
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {c.is_active !== 0 ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20 whitespace-nowrap">
                                  <Eye className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span>Đang hiện</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-rose-500/10 text-rose-400 rounded-lg border border-rose-500/20 whitespace-nowrap">
                                  <EyeOff className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span>Đã ẩn</span>
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleOpenEditCategory(c)}
                                  className="p-2 bg-slate-700/60 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
                                  title="Sửa danh mục"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleToggleCategoryVisibility(c.id, c.name, c.is_active)}
                                  className={`p-2 rounded-lg transition-colors ${c.is_active !== 0
                                    ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                                    : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400"
                                    }`}
                                  title={c.is_active !== 0 ? "Ẩn danh mục (Không xóa dữ liệu)" : "Hiển thị lại danh mục"}
                                >
                                  {c.is_active !== 0 ? (
                                    <EyeOff className="w-4 h-4" />
                                  ) : (
                                    <Eye className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400 text-sm">
                            Không tìm thấy danh mục nào phù hợp
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Thanh Phân Trang Danh Mục (Mỗi trang 10 danh mục) */}
                {filteredCategories.length > 0 && (
                  <div className="px-5 py-4 bg-slate-900/90 border-t border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="text-slate-400">
                      Hiển thị <span className="font-bold text-white">{categoryStartIndex + 1}</span> -{" "}
                      <span className="font-bold text-white">
                        {Math.min(categoryStartIndex + categoriesPerPage, filteredCategories.length)}
                      </span>{" "}
                      trên tổng số <span className="font-bold text-blue-400">{filteredCategories.length}</span> danh mục
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Nút Trước */}
                      <button
                        onClick={() => setCategoryPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentCategoryPage === 1}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 transition-colors flex items-center gap-1 border border-slate-700"
                        title="Trang trước"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Trước</span>
                      </button>

                      {/* Danh sách số trang */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalCategoryPages }, (_, idx) => idx + 1).map((pageNum) => (
                          <button
                            key={pageNum}
                            onClick={() => setCategoryPage(pageNum)}
                            className={`w-8 h-8 rounded-xl font-bold text-xs transition-all ${currentCategoryPage === pageNum
                              ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                              : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700"
                              }`}
                          >
                            {pageNum}
                          </button>
                        ))}
                      </div>

                      {/* Nút Sau */}
                      <button
                        onClick={() => setCategoryPage((prev) => Math.min(prev + 1, totalCategoryPages))}
                        disabled={currentCategoryPage === totalCategoryPages}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 transition-colors flex items-center gap-1 border border-slate-700"
                        title="Trang sau"
                      >
                        <span>Sau</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================================== */}
          {/* TAB 4: ORDERS MANAGEMENT (AUDIT & RECONCILIATION) */}
          {/* ==================================================================== */}
          {activeTab === "orders" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={orderSearch}
                      onChange={(e) => {
                        setOrderSearch(e.target.value);
                        setOrderPage(1);
                      }}
                      placeholder="Tìm theo Mã đơn, TxHash, Ví, Tên khách..."
                      className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <select
                    value={orderStatusFilter}
                    onChange={(e) => {
                      setOrderStatusFilter(e.target.value);
                      setOrderPage(1);
                    }}
                    className="px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="PAID">Đã thanh toán (PAID)</option>
                    <option value="PENDING">Chờ thanh toán (PENDING)</option>
                    <option value="CANCELLED">Đã hủy (CANCELLED)</option>
                  </select>
                </div>

                <div className="text-xs text-slate-400">
                  Tìm thấy <strong>{filteredOrders.length}</strong> đơn hàng • Trang <strong>{currentOrderPage} / {totalOrderPages}</strong>
                </div>
              </div>

              {/* Orders Table */}
              <div className="bg-slate-800/50 border border-slate-700/80 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-700 bg-slate-900/60 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        <th className="py-3.5 px-4">Mã Đơn</th>
                        <th className="py-3.5 px-4">Khách Hàng</th>
                        <th className="py-3.5 px-4">Tổng ETH</th>
                        <th className="py-3.5 px-4">Trạng Thái</th>
                        <th className="py-3.5 px-4">Thời Gian</th>
                        <th className="py-3.5 px-4">Blockchain TxHash</th>
                        <th className="py-3.5 px-4 text-right">Chi Tiết</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/60 text-sm">
                      {paginatedOrders.length > 0 ? (
                        paginatedOrders.map((o) => (
                          <tr key={o.id} className="hover:bg-slate-700/30 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-200">#{o.id}</td>
                            <td className="py-3.5 px-4">
                              <div>
                                <p className="font-semibold text-white">{o.user_name || "DApp User"}</p>
                                <p className="text-xs text-slate-400">{o.user_email}</p>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-100">
                              {parseFloat(o.total_amount_eth).toFixed(5)} ETH
                            </td>
                            <td className="py-3.5 px-4">
                              {o.status === "PAID" ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  PAID
                                </span>
                              ) : o.status === "PENDING" ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  <Clock className="w-3.5 h-3.5" />
                                  PENDING
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-700 text-slate-400">
                                  {o.status}
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-xs text-slate-300">
                              {new Date(o.created_at).toLocaleDateString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                            <td className="py-3.5 px-4">
                              {o.tx_hash ? (
                                <div className="flex items-center gap-2">
                                  <a
                                    href={`https://sepolia.etherscan.io/tx/${o.tx_hash}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs font-mono text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1"
                                    title={o.tx_hash}
                                  >
                                    {o.tx_hash.slice(0, 10)}...{o.tx_hash.slice(-6)}
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                  <button
                                    onClick={() => handleCopy(o.tx_hash)}
                                    className="text-slate-400 hover:text-slate-200"
                                    title="Copy TxHash"
                                  >
                                    {copiedText === o.tx_hash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-500 italic">Chưa giao dịch</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <button
                                onClick={() => setSelectedOrderDetails(o)}
                                className="px-3 py-1.5 bg-slate-700/60 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded-lg transition-colors inline-flex items-center gap-1.5"
                                title="Xem chi tiết đơn hàng"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Xem</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400 text-sm">
                            Không tìm thấy đơn hàng nào phù hợp với bộ lọc
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Thanh Phân Trang (Mỗi trang 10 đơn) */}
                {filteredOrders.length > 0 && (
                  <div className="px-5 py-4 bg-slate-900/90 border-t border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="text-slate-400">
                      Hiển thị <span className="font-bold text-white">{orderStartIndex + 1}</span> -{" "}
                      <span className="font-bold text-white">
                        {Math.min(orderStartIndex + ordersPerPage, filteredOrders.length)}
                      </span>{" "}
                      trên tổng số <span className="font-bold text-blue-400">{filteredOrders.length}</span> đơn hàng
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Nút Trước */}
                      <button
                        onClick={() => setOrderPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentOrderPage === 1}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 transition-colors flex items-center gap-1 border border-slate-700"
                        title="Trang trước"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Trước</span>
                      </button>

                      {/* Danh sách số trang */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalOrderPages }, (_, idx) => idx + 1).map((pageNum) => (
                          <button
                            key={pageNum}
                            onClick={() => setOrderPage(pageNum)}
                            className={`w-8 h-8 rounded-xl font-bold text-xs transition-all ${currentOrderPage === pageNum
                              ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                              : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700"
                              }`}
                          >
                            {pageNum}
                          </button>
                        ))}
                      </div>

                      {/* Nút Sau */}
                      <button
                        onClick={() => setOrderPage((prev) => Math.min(prev + 1, totalOrderPages))}
                        disabled={currentOrderPage === totalOrderPages}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 transition-colors flex items-center gap-1 border border-slate-700"
                        title="Trang sau"
                      >
                        <span>Sau</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================================== */}
          {/* TAB 5: USERS MANAGEMENT */}
          {/* ==================================================================== */}
          {activeTab === "users" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3 flex-1">
                  {/* Search */}
                  <div className="relative flex-1 min-w-[220px] max-w-md">
                    <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => {
                        setUserSearch(e.target.value);
                        setUserPage(1);
                      }}
                      placeholder="Tìm theo tên, email hoặc ví MetaMask..."
                      className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  {/* Filter Visibility (Ẩn / Hiện) */}
                  <select
                    value={userVisibilityFilter}
                    onChange={(e) => {
                      setUserVisibilityFilter(e.target.value);
                      setUserPage(1);
                    }}
                    className="px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="ALL">Tất cả trạng thái (Hiện & Ẩn)</option>
                    <option value="VISIBLE">Đang hoạt động</option>
                    <option value="HIDDEN">Đã ẩn (Khóa)</option>
                  </select>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-xs text-slate-400 whitespace-nowrap">
                    Tìm thấy <strong>{filteredUsers.length}</strong> người dùng • Trang <strong>{currentUserPage} / {totalUserPages}</strong>
                  </div>

                  <button
                    onClick={handleOpenAddUser}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-600/20 transition-all active:scale-95 whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm Người Dùng</span>
                  </button>
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-slate-800/50 border border-slate-700/80 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-700 bg-slate-900/60 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        <th className="py-3.5 px-4">ID</th>
                        <th className="py-3.5 px-4">Họ và Tên</th>
                        <th className="py-3.5 px-4">Email</th>
                        <th className="py-3.5 px-4">Địa Chỉ Ví Web3</th>
                        <th className="py-3.5 px-4 whitespace-nowrap">Số Đơn Hàng</th>
                        <th className="py-3.5 px-4 whitespace-nowrap">Tổng Chi Tiêu ETH</th>
                        <th className="py-3.5 px-4 whitespace-nowrap">Trạng Thái</th>
                        <th className="py-3.5 px-4 text-right whitespace-nowrap">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/60 text-sm">
                      {paginatedUsers.length > 0 ? (
                        paginatedUsers.map((u) => (
                          <tr
                            key={u.id}
                            className={`hover:bg-slate-700/30 transition-colors ${u.is_active === 0 ? "opacity-60 bg-slate-900/40" : ""
                              }`}
                          >
                            <td className="py-3.5 px-4 font-mono text-slate-400">#{u.id}</td>
                            <td className="py-3.5 px-4 font-semibold text-white">
                              <div className="flex items-center gap-2">
                                <span>{u.full_name}</span>
                                {u.is_active === 0 && (
                                  <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-rose-500/10 text-rose-400 rounded border border-rose-500/20 whitespace-nowrap">
                                    Đã ẩn
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-slate-300">{u.email}</td>
                            <td className="py-3.5 px-4 font-mono text-xs">
                              {u.wallet_address ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-cyan-300">
                                    {u.wallet_address.slice(0, 8)}...{u.wallet_address.slice(-6)}
                                  </span>
                                  <button
                                    onClick={() => handleCopy(u.wallet_address)}
                                    className="text-slate-400 hover:text-slate-200"
                                    title="Copy ví"
                                  >
                                    {copiedText === u.wallet_address ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-500 italic">Chưa liên kết</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className="px-2.5 py-1 text-xs font-semibold bg-slate-700 text-slate-200 rounded-lg whitespace-nowrap">
                                {u.total_orders || 0} đơn
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-emerald-400 whitespace-nowrap">
                              {parseFloat(u.total_eth_spent || 0).toFixed(5)} ETH
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {u.is_active !== 0 ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20 whitespace-nowrap">
                                  <Eye className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span>Đang hiện</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-rose-500/10 text-rose-400 rounded-lg border border-rose-500/20 whitespace-nowrap">
                                  <EyeOff className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span>Đã ẩn</span>
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleOpenEditUser(u)}
                                  className="p-2 bg-slate-700/60 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
                                  title="Sửa người dùng"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleToggleUserVisibility(u.id, u.full_name, u.is_active)}
                                  className={`p-2 rounded-lg transition-colors ${u.is_active !== 0
                                    ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                                    : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400"
                                    }`}
                                  title={u.is_active !== 0 ? "Ẩn người dùng (Không xóa dữ liệu)" : "Kích hoạt lại người dùng"}
                                >
                                  {u.is_active !== 0 ? (
                                    <EyeOff className="w-4 h-4" />
                                  ) : (
                                    <Eye className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400 text-sm">
                            Không tìm thấy người dùng nào phù hợp
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Thanh Phân Trang Người Dùng (Mỗi trang 10 người dùng) */}
                {filteredUsers.length > 0 && (
                  <div className="px-5 py-4 bg-slate-900/90 border-t border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="text-slate-400">
                      Hiển thị <span className="font-bold text-white">{userStartIndex + 1}</span> -{" "}
                      <span className="font-bold text-white">
                        {Math.min(userStartIndex + usersPerPage, filteredUsers.length)}
                      </span>{" "}
                      trên tổng số <span className="font-bold text-violet-400">{filteredUsers.length}</span> người dùng
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Nút Trước */}
                      <button
                        onClick={() => setUserPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentUserPage === 1}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 transition-colors flex items-center gap-1 border border-slate-700"
                        title="Trang trước"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Trước</span>
                      </button>

                      {/* Danh sách số trang */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalUserPages }, (_, idx) => idx + 1).map((pageNum) => (
                          <button
                            key={pageNum}
                            onClick={() => setUserPage(pageNum)}
                            className={`w-8 h-8 rounded-xl font-bold text-xs transition-all ${currentUserPage === pageNum
                              ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                              : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700"
                              }`}
                          >
                            {pageNum}
                          </button>
                        ))}
                      </div>

                      {/* Nút Sau */}
                      <button
                        onClick={() => setUserPage((prev) => Math.min(prev + 1, totalUserPages))}
                        disabled={currentUserPage === totalUserPages}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 transition-colors flex items-center gap-1 border border-slate-700"
                        title="Trang sau"
                      >
                        <span>Sau</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ==================================================================== */}
      {/* MODAL: PRODUCT (ADD / EDIT) */}
      {/* ==================================================================== */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-cyan-400" />
                <span>{editingProduct ? `Sửa Sản Phẩm #${editingProduct.id}` : "Thêm Sản Phẩm Mới"}</span>
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Tên sản phẩm *
                </label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="Ví dụ: Ledger Nano X Web3"
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Danh mục sản phẩm
                  </label>
                  <select
                    value={productForm.category_id}
                    onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400"
                  >
                    <option value="">-- Chưa phân loại --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Đơn giá (ETH) *
                  </label>
                  <input
                    type="number"
                    step="0.00001"
                    min="0.00001"
                    required
                    value={productForm.price_eth}
                    onChange={(e) => setProductForm({ ...productForm, price_eth: e.target.value })}
                    placeholder="0.0005"
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Số lượng tồn kho *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={productForm.stock}
                  onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                  placeholder="10"
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* HÌNH ẢNH SẢN PHẨM - UPLOAD TỪ MÁY */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase">
                    Hình ảnh sản phẩm
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowUrlFallback(!showUrlFallback)}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors underline"
                  >
                    {showUrlFallback ? "← Tải file ảnh từ máy tính" : "Hoặc nhập link URL"}
                  </button>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageFileChange}
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/gif, image/svg+xml"
                  className="hidden"
                />

                {showUrlFallback ? (
                  <div>
                    <input
                      type="url"
                      value={productForm.image_url}
                      onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 font-mono text-xs"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Dán liên kết ảnh trực tiếp từ internet</p>
                  </div>
                ) : (
                  <div>
                    {productForm.image_url ? (
                      /* Đã chọn / Đã tải ảnh lên */
                      <div className="flex items-center gap-4 p-3 bg-slate-800/80 border border-slate-700 rounded-xl">
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-600 bg-slate-900 shrink-0">
                          <img
                            src={productForm.image_url}
                            alt="Ảnh sản phẩm"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium mb-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Ảnh đã chọn sẵn sàng</span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate mb-2 font-mono">
                            {productForm.image_url}
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isUploadingImage}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-cyan-300 text-xs font-medium rounded-lg transition-colors"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>Chọn ảnh khác</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleRemoveImage}
                              disabled={isUploadingImage}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium rounded-lg transition-colors border border-rose-500/20"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Xóa</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Chưa có ảnh -> Khung chọn file từ máy */
                      <div
                        onClick={() => !isUploadingImage && fileInputRef.current?.click()}
                        className={`group relative flex flex-col items-center justify-center p-5 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${isUploadingImage
                          ? "bg-slate-800/40 border-cyan-500/50 cursor-wait"
                          : "bg-slate-800/40 border-slate-700 hover:border-cyan-400 hover:bg-slate-800/80"
                          }`}
                      >
                        {isUploadingImage ? (
                          <div className="flex flex-col items-center gap-2 py-1 text-center">
                            <Loader2 className="w-7 h-7 text-cyan-400 animate-spin" />
                            <span className="text-xs font-medium text-cyan-300">
                              Đang tải ảnh từ máy tính lên máy chủ...
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 py-1 text-center">
                            <div className="w-10 h-10 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Upload className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
                                Nhấp để chọn ảnh từ máy tính
                              </p>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Hỗ trợ JPG, PNG, WEBP, GIF, SVG (Tối đa 10MB)
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Mô tả chi tiết sản phẩm
                </label>
                <textarea
                  rows={3}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Mô tả thông tin chi tiết, tính năng..."
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                  Trạng thái hiển thị trên cửa hàng
                </label>
                <div className="flex items-center gap-6 p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-200">
                    <input
                      type="radio"
                      name="product_is_active"
                      checked={productForm.is_active === 1}
                      onChange={() => setProductForm({ ...productForm, is_active: 1 })}
                      className="text-cyan-500 focus:ring-0"
                    />
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Hiển thị (Khách có thể xem & mua)</span>
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-200">
                    <input
                      type="radio"
                      name="product_is_active"
                      checked={productForm.is_active === 0}
                      onChange={() => setProductForm({ ...productForm, is_active: 0 })}
                      className="text-cyan-500 focus:ring-0"
                    />
                    <span className="flex items-center gap-1.5 text-rose-400">
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Ẩn (Không hiển thị ở Cửa hàng)</span>
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isUploadingImage}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-600/20"
                >
                  {isUploadingImage ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang tải ảnh...</span>
                    </>
                  ) : (
                    editingProduct ? "Lưu thay đổi" : "Tạo sản phẩm"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: CATEGORY (ADD / EDIT) */}
      {/* ==================================================================== */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-indigo-400" />
                <span>{editingCategory ? `Sửa Danh Mục #${editingCategory.id}` : "Thêm Danh Mục Mới"}</span>
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Tên danh mục *
                </label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="Ví dụ: Ví Lạnh & Bảo Mật Web3"
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Slug URL (Định danh)
                </label>
                <input
                  type="text"
                  value={categoryForm.slug}
                  onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                  placeholder="hardware-wallets (tùy chọn, để trống sẽ tự tạo)"
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-mono focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Mô tả danh mục
                </label>
                <textarea
                  rows={3}
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Mô tả thông tin nhóm mặt hàng..."
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                  Trạng thái hiển thị
                </label>
                <div className="flex items-center gap-6 p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-200">
                    <input
                      type="radio"
                      name="category_is_active"
                      checked={categoryForm.is_active !== 0}
                      onChange={() => setCategoryForm({ ...categoryForm, is_active: 1 })}
                      className="text-indigo-500 focus:ring-0"
                    />
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Hiển thị (Khách có thể xem)</span>
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-200">
                    <input
                      type="radio"
                      name="category_is_active"
                      checked={categoryForm.is_active === 0}
                      onChange={() => setCategoryForm({ ...categoryForm, is_active: 0 })}
                      className="text-indigo-500 focus:ring-0"
                    />
                    <span className="flex items-center gap-1.5 text-rose-400">
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Ẩn (Không hiển thị ở Cửa hàng)</span>
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-600/20"
                >
                  {editingCategory ? "Lưu thay đổi" : "Tạo danh mục"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: USER (ADD / EDIT) */}
      {/* ==================================================================== */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-violet-400" />
                <span>{editingUser ? `Sửa Người Dùng #${editingUser.id}` : "Thêm Người Dùng Mới"}</span>
              </h3>
              <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  required
                  value={userForm.full_name}
                  onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                  placeholder="Ví dụ: Satoshi Nakamoto"
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-violet-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Địa chỉ Email *
                </label>
                <input
                  type="email"
                  required
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="user@example.com"
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-violet-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Địa chỉ Ví MetaMask (0x...)
                </label>
                <input
                  type="text"
                  value={userForm.wallet_address}
                  onChange={(e) => setUserForm({ ...userForm, wallet_address: e.target.value })}
                  placeholder="0x..."
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-mono focus:outline-none focus:border-violet-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                  Trạng thái tài khoản
                </label>
                <div className="flex items-center gap-6 p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-200">
                    <input
                      type="radio"
                      name="user_is_active"
                      checked={userForm.is_active !== 0}
                      onChange={() => setUserForm({ ...userForm, is_active: 1 })}
                      className="text-violet-500 focus:ring-0"
                    />
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Hoạt động (Đang hiện)</span>
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-200">
                    <input
                      type="radio"
                      name="user_is_active"
                      checked={userForm.is_active === 0}
                      onChange={() => setUserForm({ ...userForm, is_active: 0 })}
                      className="text-violet-500 focus:ring-0"
                    />
                    <span className="flex items-center gap-1.5 text-rose-400">
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Ẩn (Khóa tài khoản)</span>
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-600/20"
                >
                  {editingUser ? "Lưu thay đổi" : "Tạo người dùng"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: ORDER DETAILS (ITEMS & ON-CHAIN PROOF) */}
      {/* ==================================================================== */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold">
                  #{selectedOrderDetails.id}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Chi tiết Đơn hàng #{selectedOrderDetails.id}</h3>
                  <p className="text-xs text-slate-400">
                    Khách: {selectedOrderDetails.user_name} ({selectedOrderDetails.user_email})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Status & Blockchain Proof Box */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-semibold uppercase">Trạng Thái Sổ Cái</span>
                  {selectedOrderDetails.status === "PAID" ? (
                    <span className="px-3 py-1 text-xs font-bold bg-emerald-500/20 text-emerald-300 rounded-lg border border-emerald-500/30 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      PAID (Đã thanh toán trên Blockchain)
                    </span>
                  ) : selectedOrderDetails.status === "PENDING" ? (
                    <span className="px-3 py-1 text-xs font-bold bg-amber-500/20 text-amber-300 rounded-lg border border-amber-500/30 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      PENDING (Chờ người mua xác nhận ví)
                    </span>
                  ) : (
                    <span className="px-3 py-1 text-xs font-bold bg-slate-700 text-slate-300 rounded-lg flex items-center gap-1.5">
                      <Ban className="w-3.5 h-3.5" />
                      CANCELLED (Đã hủy / Xóa mềm)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-700/60 text-xs">
                  <div>
                    <span className="text-slate-400 block">Ví thanh toán:</span>
                    <span className="font-mono text-slate-200">
                      {selectedOrderDetails.buyer_wallet || "Chưa có"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Thời gian thanh toán:</span>
                    <span className="text-slate-200">
                      {selectedOrderDetails.paid_at
                        ? new Date(selectedOrderDetails.paid_at).toLocaleString("vi-VN")
                        : "Chưa thanh toán"}
                    </span>
                  </div>
                </div>

                {selectedOrderDetails.tx_hash && (
                  <div className="pt-2 border-t border-slate-700/60">
                    <span className="text-slate-400 text-xs block mb-1">Mã băm giao dịch (TxHash):</span>
                    <div className="flex items-center gap-2 bg-slate-900 px-3 py-2 rounded-lg font-mono text-xs text-cyan-300 break-all">
                      <span>{selectedOrderDetails.tx_hash}</span>
                      <a
                        href={`https://sepolia.etherscan.io/tx/${selectedOrderDetails.tx_hash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-auto flex items-center gap-1 text-cyan-400 hover:text-cyan-200 flex-shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">
                  Danh sách sản phẩm trong đơn ({selectedOrderDetails.items?.length || 0})
                </h4>
                <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                  {selectedOrderDetails.items && selectedOrderDetails.items.length > 0 ? (
                    selectedOrderDetails.items.map((item, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image_url}
                            alt={item.product_name}
                            className="w-10 h-10 rounded-lg object-cover bg-slate-900 border border-slate-800"
                          />
                          <div>
                            <h5 className="text-sm font-semibold text-slate-200">{item.product_name}</h5>
                            <p className="text-xs text-slate-400">
                              {parseFloat(item.unit_price_eth).toFixed(5)} ETH × {item.quantity}
                            </p>
                          </div>
                        </div>
                        <div className="text-right font-mono font-bold text-cyan-300 text-sm">
                          {(parseFloat(item.unit_price_eth) * item.quantity).toFixed(5)} ETH
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="p-4 text-xs text-slate-400 text-center">Không có chi tiết mặt hàng</p>
                  )}
                </div>
              </div>

              {/* Total Calculation */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-base font-bold">
                <span className="text-slate-300">Tổng cộng thanh toán:</span>
                <span className="text-xl font-mono text-cyan-400">
                  {parseFloat(selectedOrderDetails.total_amount_eth).toFixed(5)} ETH
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end">
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
