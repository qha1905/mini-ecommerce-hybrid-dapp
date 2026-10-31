-- =====================================================================
-- Mini E-Commerce Hybrid DApp Database Schema
-- Member 1: Database & Smart Contract (Data Layer)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `mini_ecommerce_dapp` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `mini_ecommerce_dapp`;

-- ---------------------------------------------------------------------
-- 1. Table: users (Người dùng)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `full_name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `password` VARCHAR(255) NULL COMMENT 'Mật khẩu đã được mã hóa bằng bcrypt',
    `role` ENUM('ADMIN', 'CUSTOMER') NOT NULL DEFAULT 'CUSTOMER' COMMENT 'Phân quyền: ADMIN hoặc CUSTOMER',
    `wallet_address` VARCHAR(42) NULL COMMENT 'Địa chỉ ví MetaMask người dùng (0x...)',
    `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 = Hoạt động, 0 = Ẩn/Khóa tài khoản',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 2. Table: categories (Danh mục sản phẩm)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `categories` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL UNIQUE,
    `description` TEXT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 = Hiển thị danh mục, 0 = Ẩn danh mục',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 3. Table: products (Sản phẩm)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `products` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `category_id` INT NULL,
    `name` VARCHAR(200) NOT NULL,
    `description` TEXT,
    `price_eth` DECIMAL(18, 8) NOT NULL COMMENT 'Đơn giá tính bằng ETH',
    `image_url` VARCHAR(500) NULL,
    `stock` INT NOT NULL DEFAULT 0,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 = Hiển thị trên cửa hàng, 0 = Ẩn sản phẩm',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_product_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 3. Table: cart_items (Giỏ hàng người dùng)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cart_items` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `product_id` INT NOT NULL,
    `quantity` INT NOT NULL DEFAULT 1,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_cart_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_cart_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
    UNIQUE KEY `uk_user_product` (`user_id`, `product_id`)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 4. Table: orders (Đơn hàng - Áp dụng Soft Delete & On-chain Tracking)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `orders` (
    `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT 'OrderID dùng trực tiếp khi gọi Smart Contract',
    `user_id` INT NOT NULL,
    `total_amount_eth` DECIMAL(18, 8) NOT NULL COMMENT 'Tổng số ETH cần thanh toán',
    `status` ENUM('PENDING', 'PAID', 'CANCELLED') NOT NULL DEFAULT 'PENDING' COMMENT 'Trạng thái đơn hàng',
    `buyer_wallet` VARCHAR(42) NULL COMMENT 'Địa chỉ ví thực tế đã thanh toán qua Smart Contract',
    `tx_hash` VARCHAR(66) NULL COMMENT 'Mã băm giao dịch trên Blockchain (0x...)',
    `paid_at` DATETIME NULL COMMENT 'Thời điểm Event Listener xác nhận thanh toán',
    `is_deleted` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Soft Delete Flag (0: Active, 1: Deleted)',
    `deleted_at` DATETIME NULL COMMENT 'Thời điểm thực hiện Soft Delete',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_order_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
    INDEX `idx_order_status` (`status`),
    INDEX `idx_order_soft_delete` (`is_deleted`),
    INDEX `idx_order_tx_hash` (`tx_hash`)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 5. Table: order_items (Chi tiết sản phẩm trong đơn hàng)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `order_items` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `order_id` INT NOT NULL,
    `product_id` INT NOT NULL,
    `quantity` INT NOT NULL DEFAULT 1,
    `unit_price_eth` DECIMAL(18, 8) NOT NULL COMMENT 'Đơn giá ETH tại thời điểm đặt đơn',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_item_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_item_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB;

-- =====================================================================
-- DỮ LIỆU MẪU (SEED DATA)
-- =====================================================================

-- Người dùng mặc định
INSERT INTO `users` (`id`, `full_name`, `email`, `wallet_address`) 
VALUES 
(1, 'DApp Tester', 'tester@hybrid-dapp.com', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266')
ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`);

-- Danh sách sản phẩm mẫu giá ETH nhỏ (rất thuận tiện test Sepolia Testnet)
INSERT INTO `products` (`id`, `name`, `description`, `price_eth`, `image_url`, `stock`) 
VALUES 
(1, 'Ledger Nano X Web3 Hardware Wallet', 'Ví lạnh bảo mật khóa riêng tư tối đa, hỗ trợ kết nối Bluetooth và hơn 5,500 token crypto.', 0.00050000, 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?auto=format&fit=crop&w=800&q=80', 25),
(2, 'Cyberpunk Mechanical Keyboard', 'Bàn phím cơ thiết kế Cyberpunk tích hợp đèn RGB chuyển màu và keycap xuyên led PBT cao cấp.', 0.00080000, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80', 15),
(3, 'Exclusive Web3 Genesis NFT Hoodie', 'Áo Hoodie phiên bản giới hạn kỷ niệm khởi chạy mạng Web3, vải cotton nỉ 100% thoáng mát.', 0.00030000, 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80', 50),
(4, 'Ethereum Crystal Hologram Lamp', 'Đèn decor biểu tượng Ethereum hiệu ứng Hologram 3D phát sáng nhiều chế độ màu.', 0.00020000, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80', 40),
(5, 'Smart Hardware Security Key FIDO2', 'Khóa bảo mật vật lý chống phishing 2FA/WebAuthn chuẩn bảo mật quốc tế.', 0.00040000, 'https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=800&q=80', 30)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `price_eth` = VALUES(`price_eth`), `stock` = VALUES(`stock`);
