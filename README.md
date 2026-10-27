# Hệ Thống Mini E-Commerce Tích Hợp Thanh Toán Smart Contract (Hybrid DApp)

Dự án Thương mại Điện tử tích hợp Web3 theo mô hình **Hybrid DApp** (kết hợp lưu trữ dữ liệu truyền thống Off-chain trên **MySQL** và xử lý thanh toán phi tập trung On-chain qua **Ethereum Smart Contract**).

Dự án được phân bổ độc lập và rõ ràng cho **3 Thành viên**:

---

## Phân Chia Vai Trò Thành Viên (Team Structure)

```
d:\DA-BlockChain\
│
├── database/                     Hà: Database & Data Layer
│   ├── schema.sql               - CSDL MySQL: users, products, cart_items, orders, order_items
│   └── ERD_Documentation.md     - Sơ đồ ERD, phân tích Off-chain vs On-chain, cơ chế Soft Delete
│
├── smart-contract/               Hà: Smart Contract (Solidity & Hardhat)
│   ├── contracts/               - EcommercePayment.sol (Nhận ETH, emit PaymentCompleted)
│   ├── scripts/deploy.js        - Tự động deploy & đồng bộ ABI sang Backend và Frontend
│   ├── test/                    - 8 Automated tests kiểm thử nghiệp vụ thanh toán
│   └── hardhat.config.js        - Cấu hình Hardhat Localhost & Sepolia Testnet
│
├── backend/                      Khang: Backend Developer (Off-chain Logic)
│   ├── src/config/              - Kết nối MySQL Pool (db.js) & Khởi tạo dữ liệu (initDb.js)
│   ├── src/controllers/         - CRUD Sản phẩm, Giỏ hàng, Đơn hàng
│   ├── src/services/            - blockchainListener.js (Lắng nghe PaymentCompleted qua ethers.js)
│   ├── src/routes/              - RESTful API endpoints
│   └── src/server.js            - Express server chạy cổng 5000
│
└── frontend/                     Đông: Frontend Developer (UI/UX & Web3)
    ├── src/components/          - Navbar, ProductCard, CartDrawer, OrderHistory, TransactionModal
    ├── src/services/            - web3Service.js (Tích hợp MetaMask), apiService.js (Gọi Backend)
    └── src/App.jsx              - Giao diện cửa hàng, giỏ hàng và thanh toán Web3
```

---

## Hướng Dẫn Chạy Toàn Bộ Dự Án

### BƯỚC 1: Hà (Database & Smart Contract)

#### 1. Khởi tạo Cơ sở dữ liệu MySQL
1. Mở XAMPP hoặc MySQL Server của bạn (đảm bảo dịch vụ MySQL đang chạy).
2. Tạo database và nạp dữ liệu mẫu bằng cách:
   - Import file [database/schema.sql](database/schema.sql) vào phpMyAdmin / MySQL Workbench.
   - Hoặc từ thư mục `backend/`, chạy lệnh:
     ```powershell
     cd d:\DA-BlockChain\backend
     npm run init-db
     ```

#### 2. Biên dịch & Kiểm thử Smart Contract
```powershell
cd d:\DA-BlockChain\smart-contract
# Chạy bộ Unit Test kiểm tra toàn bộ 8 kịch bản nghiệp vụ
npx hardhat test
```

#### 3. Chạy Mạng Blockchain Thử Nghiệm (Chọn 1 trong 2 cách):
- **Cách A: Chạy mạng Hardhat Localhost (Khuyên dùng để test nhanh không tốn ETH thật/faucet)**:
  - Mở một cửa sổ Terminal riêng và chạy:
    ```powershell
    cd d:\DA-BlockChain\smart-contract
    npx hardhat node
    ```
  - Mở một Terminal khác để deploy Smart Contract lên Localhost:
    ```powershell
    cd d:\DA-BlockChain\smart-contract
    npx hardhat run scripts/deploy.js --network localhost
    ```
    *(Hoặc nếu đang đứng ở thư mục gốc `D:\DA-BlockChain`, bạn chỉ cần gõ: `npm run deploy:local`)*.

- **Cách B: Triển khai lên Sepolia Testnet**:
  - Tạo file `smart-contract/.env` (từ `.env.example`), điền `SEPOLIA_RPC_URL` và `SEPOLIA_PRIVATE_KEY`.
  - Chạy lệnh:
    ```powershell
    npm run deploy:sepolia
    ```

---

### BƯỚC 2: Khang (Backend Developer)

1. Cấu hình file `backend/.env` (nếu cần chỉnh user/mật khẩu MySQL):
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=mini_ecommerce_dapp
   BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
   ```
2. Khởi động Backend Server & Blockchain Listener:
   ```powershell
   cd d:\DA-BlockChain\backend
   npm start
   ```
3. Quan sát log trên màn hình:
   - ` [MySQL] Successfully connected to database`
   - ` [Blockchain Listener] Successfully listening for 'PaymentCompleted' events!`

---

### BƯỚC 3: Đông (Frontend Developer & Web3)

1. Khởi động ứng dụng ReactJS:
   ```powershell
   cd d:\DA-BlockChain\frontend
   npm run dev
   ```
2. Mở trình duyệt tại: `http://localhost:5173`
3. Cài đặt tiện ích mở rộng **MetaMask** trên trình duyệt:
   - Nếu test trên Localhost: Thêm mạng RPC `http://127.0.0.1:8545` (Chain ID: `31337`) và import 1 Private Key bất kỳ do Hardhat sinh ra (có sẵn 10,000 ETH test).
   - Nếu test trên Sepolia: Chọn mạng **Sepolia** trên MetaMask và nhận ETH testnet từ Sepolia Faucet.
4. Bấm **"Kết nối MetaMask"** trên góc phải màn hình.
5. Thêm sản phẩm vào giỏ, bấm **"Thanh toán bằng Smart Contract"**:
   - MetaMask sẽ hiển thị popup xác nhận gửi ETH tương ứng với tổng tiền đơn hàng.
   - Sau khi ký gửi, Smart Contract trên chuỗi sẽ phát ra sự kiện `PaymentCompleted`.
   - Backend Listener tự động bắt sự kiện và cập nhật đơn hàng thành **"Đã thanh toán (PAID)"**.
   - Thử bấm **"Khóa hủy đơn"** trên đơn hàng đã thanh toán để kiểm chứng cơ chế Backend chặn hủy đơn!

---

## Kiểm Thử Cơ Chế Xóa Mềm (Soft Delete) & Khóa Hủy Đơn

1. **Đơn hàng Chờ thanh toán (PENDING)**: Khách hàng có thể bấm **"Hủy đơn (Soft Delete)"**. Bản ghi trong MySQL được cập nhật `status = 'CANCELLED'`, `is_deleted = 1`, `deleted_at = NOW()`.
2. **Đơn hàng Đã thanh toán (PAID)**: Sau khi tiền đã vào Smart Contract, nếu người dùng hoặc kẻ gian gửi request `DELETE /api/orders/:id`, Backend sẽ lập tức trả về HTTP `400 Bad Request`:
   > *"Không thể hủy hoặc xóa đơn hàng đã thanh toán thành công trên Blockchain! Tiền đã được xác thực an toàn vào Smart Contract."*
