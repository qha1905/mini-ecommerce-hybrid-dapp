# 🛒 Mini E-Commerce Hybrid DApp — Backend Service

> **Dự án Môn học / Course Project:** Mini E-Commerce Hybrid Decentralized Application  
> **Kỹ sư phụ trách Backend:** Khang (Member 2 - Backend & Blockchain Integration Engineer)  
> **Email Sinh viên:** `ntakhanghttt2311013@student.ctuet.edu.vn`  
> **Trường Đại học:** Đại học Kỹ thuật - Công nghệ Cần Thơ (CTUT)  

---

## 📌 1. Giới thiệu tổng quan

Hệ thống **Backend** đóng vai trò là xương sống trung gian trong kiến trúc **Hybrid Web3**, kết nối giữa **Frontend (React)**, cơ sở dữ liệu quan hệ **MySQL (Off-chain)** và hợp đồng thông minh **Smart Contract trên mạng Ethereum Sepolia (On-chain)**.

Mã nguồn backend được thiết kế theo kiến trúc chuẩn RESTful API, bảo mật cao cấp, tối ưu hóa toàn vẹn dữ liệu tài chính và tồn kho.

---

## 🛡️ 2. Các cơ chế bảo mật & Kỹ thuật chuyên sâu đã triển khai

### 2.1. Kiểm toán tài chính On-chain (Chống gian lận 1 Wei)
- **Vấn đề tiềm ẩn:** Trong các hệ thống Web3 sơ sài, backend chỉ nghe sự kiện `PaymentCompleted` mà không đối soát số tiền thực trả. Kẻ tấn công có thể tương tác trực tiếp với hợp đồng thông minh, truyền `orderId` của một đơn hàng đắt tiền nhưng chỉ trả `1 wei` (0.000000000000000001 ETH).
- **Giải pháp:** Trong `blockchainListener.js`, hàm `handlePaymentCompletedEvent` luôn giải mã số `amountEth` trả thực tế và đối chiếu với `orders.total_amount_eth`. Nếu `amountEth < expectedEth`, đơn hàng lập tức bị đánh dấu `UNDERPAID` và kích hoạt cờ cảnh báo gian lận.

### 2.2. Chống giả mạo Transaction Hash (Fake txHash Exploit)
- **Vấn đề tiềm ẩn:** Kẻ tấn công lấy bất kỳ txHash thành công nào trên mạng Sepolia (ví dụ chuyển ETH giữa 2 ví cá nhân) và gửi lên `/api/blockchain/verify-payment`.
- **Giải pháp:** Hệ thống kiểm tra nghiêm ngặt `receipt.to.toLowerCase() === contractAddress.toLowerCase()`. Bất kỳ giao dịch nào không gửi trực tiếp đến Smart Contract của cửa hàng sẽ bị từ chối ngay lập tức (HTTP 400).

### 2.3. Giải quyết bài toán Race Condition & Tồn kho khi thanh toán trễ
- **Kịch bản thực tế:** Khách hàng đặt đơn hàng (kho đã trừ). Sau đó khách bấm Hủy đơn (kho được hoàn lại). Tuy nhiên, trên mạng Blockchain giao dịch thanh toán gửi trước đó bị tắc nghẽn (pending) và vừa được đào thành công.
- **Giải pháp:** Nếu sự kiện `PaymentCompleted` nhận được cho một đơn hàng đã ở trạng thái `CANCELLED`:
  - Khởi tạo **Database Transaction** (`pool.getConnection() -> beginTransaction()`).
  - Khóa dòng sản phẩm bằng `SELECT ... FOR UPDATE`.
  - Trừ lại số lượng tồn kho tương ứng của các mặt hàng trong đơn.
  - Cập nhật trạng thái đơn thành `PAID` và khôi phục `is_deleted = 0`.
  - Đảm bảo tính bất biến của hợp đồng thông minh và không thất thoát tồn kho.

### 2.4. Tính toán chính xác tuyệt đối với BigInt Wei (ethers.js)
- **Vấn đề:** Phép tính dấu phẩy động trong JavaScript (`parseFloat`, `*`, `+`) mắc lỗi sai số IEEE 754 với các số thập phân nhỏ của ETH (ví dụ: `0.0001 * 3 = 0.00030000000000000003`).
- **Giải pháp:** Sử dụng `ethers.parseEther()` và `BigInt` để tính toán tổng giá trị đơn hàng và giỏ hàng dưới đơn vị cơ sở Wei, sau đó định dạng lại qua `ethers.formatEther()`.

### 2.5. Bảo vệ dữ liệu nhạy cảm (CWE-200 Sensitive Data Exposure)
- Triệt tiêu hoàn toàn `SELECT u.*` trong `userController.js`.
- Tuyệt đối không trả chuỗi băm mật khẩu `password` (bcrypt) trong bất kỳ phản hồi JSON nào của API công khai hoặc API quản trị.

### 2.6. Khả năng tự phục hồi (Self-Healing Event Listener)
- Mạng thử nghiệm Sepolia RPC thường xuyên gặp tình trạng nghẽn hoặc giới hạn tần suất (HTTP 429 Rate Limit).
- Tích hợp cơ chế tự động kết nối lại theo thuật toán lùi số mũ (**Exponential Backoff**), bắt lỗi `_websocket` ngầm, ngăn chặn tình trạng crash tiến trình máy chủ.

### 2.7. Chống lỗ hổng IDOR (Insecure Direct Object Reference)
- Tự động trích xuất thông tin người dùng từ JWT Token (`extractUser`).
- Khi tạo đơn hàng hoặc thêm vào giỏ, ưu tiên `req.user.id` hợp lệ thay vì tin tưởng mù quáng tham số `userId` do client gửi lên.
- Chặn người dùng thường xem hoặc hủy đơn hàng của người khác (HTTP 403 Forbidden).

---

## 📂 3. Cấu trúc thư mục Backend

```text
backend/
├── src/
│   ├── config/
│   │   ├── db.js                   # Kết nối cơ sở dữ liệu MySQL (Connection Pool)
│   │   ├── initDb.js               # Khởi tạo bảng dữ liệu tự động
│   │   ├── migrateAuth.js          # Migration phân quyền & ví người dùng
│   │   └── migrateCategories.js    # Migration danh mục sản phẩm
│   ├── controllers/
│   │   ├── adminController.js      # Báo cáo thống kê & Dashboard số liệu
│   │   ├── authController.js       # Đăng ký, đăng nhập JWT, liên kết ví MetaMask
│   │   ├── cartController.js       # Giỏ hàng, kiểm toán số lượng tồn kho
│   │   ├── categoryController.js   # Quản lý danh mục sản phẩm
│   │   ├── orderController.js      # Tạo, hủy, phục hồi đơn hàng & quản lý kho
│   │   ├── productController.js    # Quản lý sản phẩm & chuyển đổi ẩn/hiện
│   │   └── userController.js       # Quản trị người dùng & bảo mật thông tin
│   ├── middleware/
│   │   └── authMiddleware.js       # Xác thực JWT, extractUser, requireAdmin
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   ├── cartRoutes.js
│   │   ├── categoryRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── productRoutes.js
│   │   ├── uploadRoutes.js
│   │   └── userRoutes.js
│   ├── services/
│   │   └── blockchainListener.js   # Module lắng nghe sự kiện Smart Contract Sepolia
│   └── server.js                   # Điểm khởi chạy ứng dụng Express & bộ lọc lỗi
├── uploads/                        # Thư mục lưu trữ hình ảnh tải lên
├── .env.example                    # Tệp mẫu cấu hình môi trường
├── package.json                    # Cấu hình dự án & thư viện phụ thuộc
└── README.md                       # Tài liệu hướng dẫn kỹ thuật
```

---

## 🚀 4. Hướng dẫn cài đặt & Khởi chạy

### Bước 1: Cài đặt thư viện phụ thuộc
```bash
cd backend
npm install
```

### Bước 2: Cấu hình biến môi trường
Tạo file `.env` tại thư mục `backend/` hoặc thư mục gốc dự án:
```ini
PORT=5000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=mini_ecommerce

JWT_SECRET=super_secret_dapp_key_2026
BLOCKCHAIN_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
CONTRACT_ADDRESS=0xYourSepoliaContractAddress
```

### Bước 3: Khởi tạo CSDL MySQL
```bash
npm run init-db
```

### Bước 4: Khởi động máy chủ API & Blockchain Listener
```bash
# Chế độ phát triển (Development với tự động tải lại)
npm run dev

# Chế độ sản xuất (Production)
npm start
```

---

## 📡 5. Danh mục API Endpoints chính

| Phương thức | Endpoint | Mô tả | Phân quyền |
|---|---|---|---|
| `GET` | `/api/health` | Kiểm tra trạng thái hoạt động của Backend & RPC | Công khai |
| `POST` | `/api/auth/register` | Đăng ký tài khoản mới | Công khai |
| `POST` | `/api/auth/login` | Đăng nhập hệ thống & nhận JWT Token | Công khai |
| `GET` | `/api/auth/profile` | Lấy thông tin tài khoản hiện tại | Đã xác thực |
| `PUT` | `/api/auth/link-wallet` | Liên kết địa chỉ ví MetaMask | Đã xác thực |
| `GET` | `/api/products` | Lấy danh sách sản phẩm | Công khai |
| `POST` | `/api/products` | Thêm sản phẩm mới | Admin |
| `GET` | `/api/cart/:userId` | Xem giỏ hàng & tính tổng tiền ETH | Đã xác thực / Mặc định |
| `POST` | `/api/cart/add` | Thêm sản phẩm vào giỏ (kiểm tra tồn kho) | Đã xác thực / Mặc định |
| `POST` | `/api/orders/create` | Tạo đơn hàng (Transaction + Trừ tồn kho) | Đã xác thực / Mặc định |
| `PATCH` | `/api/orders/:id/cancel`| Hủy đơn hàng (Hoàn trả tồn kho tự động) | Chủ đơn / Admin |
| `POST` | `/api/blockchain/verify-payment` | Xác minh txHash thanh toán On-chain | Công khai |
| `GET` | `/api/admin/stats` | Thống kê doanh thu ETH, đơn hàng, tồn kho | Admin |

---
*Bản quyền tài liệu thuộc về Nhóm dự án Mini E-Commerce Hybrid DApp — Kỹ sư Khang (Member 2).*
