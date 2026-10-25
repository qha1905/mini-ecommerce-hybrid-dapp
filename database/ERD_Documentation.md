# Tài liệu Thiết kế CSDL & Phân tích Kiến trúc Hybrid DApp
**Thành viên 1: Database & Smart Contract (Data Layer)**

---

## 1. Bản chất Kiến trúc Hybrid DApp (Off-chain vs On-chain)
Trong các ứng dụng phi tập trung kết hợp (Hybrid DApp), chi phí lưu trữ dữ liệu trực tiếp trên mạng lưới Blockchain (On-chain) là rất đắt đỏ (Gas fee) và tốc độ ghi giao dịch phụ thuộc vào thời gian tạo khối (Block time). Do đó, phân tách dữ liệu hợp lý là nguyên tắc sống còn:

| Phân loại | Dữ liệu | Nơi lưu trữ | Lý do kỹ thuật |
| :--- | :--- | :--- | :--- |
| **Off-chain** | Thông tin người dùng (`users`), danh mục sản phẩm (`products`), giỏ hàng (`cart_items`), chi tiết dòng hàng (`order_items`). | Cơ sở dữ liệu **MySQL** | Tốc độ truy vấn cao (millisecond), hỗ trợ tìm kiếm/lọc phong phú, tiết kiệm 100% Gas fee cho các thao tác CRUD thông thường. |
| **On-chain** | Giá trị tiền nạp (ETH), bằng chứng thanh toán (`PaymentCompleted` event), mapping trạng thái thanh toán theo OrderID. | **Smart Contract** (Ethereum/Sepolia) | Đảm bảo tính minh bạch, không thể làm giả hay đảo ngược sau khi thanh toán thành công, người mua tự ký giao dịch bằng private key từ ví MetaMask. |

---

## 2. Sơ đồ Quan hệ Thực thể (Entity Relationship Diagram - ERD)

```mermaid
erDiagram
    USERS ||--o{ CART_ITEMS : "sở hữu"
    PRODUCTS ||--o{ CART_ITEMS : "được thêm vào"
    USERS ||--o{ ORDERS : "đặt hàng"
    ORDERS ||--|{ ORDER_ITEMS : "gồm các mặt hàng"
    PRODUCTS ||--o{ ORDER_ITEMS : "được bán"

    USERS {
        int id PK
        varchar full_name
        varchar email UK
        varchar wallet_address
        datetime created_at
        datetime updated_at
    }

    PRODUCTS {
        int id PK
        varchar name
        text description
        decimal price_eth "18 chữ số, 8 phần thập phân"
        varchar image_url
        int stock
        datetime created_at
    }

    CART_ITEMS {
        int id PK
        int user_id FK
        int product_id FK
        int quantity
        datetime created_at
    }

    ORDERS {
        int id PK "OrderID đối chiếu on-chain"
        int user_id FK
        decimal total_amount_eth
        enum status "PENDING | PAID | CANCELLED"
        varchar buyer_wallet "Ví MetaMask người mua"
        varchar tx_hash "Mã băm giao dịch on-chain"
        datetime paid_at "Thời điểm Listener xác nhận"
        tinyint is_deleted "Soft Delete (0: Active, 1: Deleted)"
        datetime deleted_at "Thời điểm xóa mềm"
        datetime created_at
        datetime updated_at
    }

    ORDER_ITEMS {
        int id PK
        int order_id FK
        int product_id FK
        int quantity
        decimal unit_price_eth
        datetime created_at
    }
```

---

## 3. Cơ chế Xóa Mềm (Soft Delete) trên Bảng Orders

### Tại sao KHÔNG ĐƯỢC dùng Hard Delete (`DELETE FROM orders WHERE id = ?`)?
1. **Toàn vẹn đối soát tài chính**: Khi người dùng đặt hàng và giao dịch được đẩy lên mạng Blockchain, nếu bản ghi đơn hàng bị xóa cứng khỏi CSDL, Backend Event Listener khi bắt được sự kiện `PaymentCompleted` sẽ không tìm thấy `orderId` trong DB để cập nhật, dẫn tới thất thoát hoặc xung đột dữ liệu.
2. **Khả năng phục hồi và Kiểm toán (Audit Trail)**: Giữ lại lịch sử đơn bị hủy giúp quản trị viên phân tích tỉ lệ hủy đơn (abandoned orders) mà không làm rác giao diện hiển thị thông thường của khách hàng.

### Cách thức Hoạt động:
- **Trường dữ liệu**:
  - `is_deleted`: Giá trị mặc định là `0` (Đang hoạt động). Khi hủy đơn, cập nhật thành `1`.
  - `deleted_at`: Lưu thời điểm thực hiện thao tác hủy/xóa mềm (`NOW()`).
- **Quy tắc truy vấn thông thường**:
  ```sql
  SELECT * FROM orders WHERE user_id = ? AND is_deleted = 0 ORDER BY created_at DESC;
  ```
- **Ràng buộc nghiệp vụ quan trọng**:
  - Nếu đơn hàng có `status = 'PAID'` (hoặc đã có `tx_hash`), Backend **từ chối tuyệt đối** thao tác xóa mềm hoặc hủy đơn!
  - Chỉ cho phép xóa mềm khi đơn hàng ở trạng thái `PENDING`.
