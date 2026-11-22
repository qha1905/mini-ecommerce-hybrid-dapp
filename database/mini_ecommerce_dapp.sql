-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th10 22, 2026 lúc 06:08 AM
-- Phiên bản máy phục vụ: 8.0.43
-- Phiên bản PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `mini_ecommerce_dapp`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `cart_items`
--

CREATE TABLE `cart_items` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `categories`
--

CREATE TABLE `categories` (
  `id` int NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `categories`
--

INSERT INTO `categories` (`id`, `name`, `slug`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Ví Lạnh & Bảo Mật Web3', 'hardware-wallets', 'Thiết bị lưu trữ khóa riêng tư lạnh, USB FIDO2 chống tấn công lừa đảo.', 1, '2026-10-27 12:32:44', '2026-10-27 12:32:44'),
(2, 'Phụ Kiện Công Nghệ Cyberpunk', 'cyberpunk-gear', 'Bàn phím cơ, chuột và phụ kiện công nghệ phong cách tương lai Cyberpunk.', 1, '2026-10-27 12:32:44', '2026-10-27 12:32:44'),
(3, 'Thời Trang Web3 & NFT Merch', 'web3-fashion', 'Áo hoodie, áo thun và phụ kiện thương hiệu Web3 phiên bản giới hạn.', 1, '2026-10-27 12:32:44', '2026-10-27 12:32:44'),
(4, 'Decor & Đèn Hologram 3D', 'decor-hologram', 'Đèn LED biểu tượng Ethereum, quà tặng decor góc setup công nghệ.', 1, '2026-10-27 12:32:44', '2026-10-28 12:38:05');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `orders`
--

CREATE TABLE `orders` (
  `id` int NOT NULL COMMENT 'OrderID dùng trực tiếp khi gọi Smart Contract',
  `user_id` int NOT NULL,
  `total_amount_eth` decimal(18,8) NOT NULL COMMENT 'Tổng số ETH cần thanh toán',
  `status` enum('PENDING','PAID','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING' COMMENT 'Trạng thái đơn hàng',
  `buyer_wallet` varchar(42) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Địa chỉ ví thực tế đã thanh toán qua Smart Contract',
  `tx_hash` varchar(66) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Mã băm giao dịch trên Blockchain (0x...)',
  `paid_at` datetime DEFAULT NULL COMMENT 'Thời điểm Event Listener xác nhận thanh toán',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Soft Delete Flag (0: Active, 1: Deleted)',
  `deleted_at` datetime DEFAULT NULL COMMENT 'Thời điểm thực hiện Soft Delete',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `orders`
--

INSERT INTO `orders` (`id`, `user_id`, `total_amount_eth`, `status`, `buyer_wallet`, `tx_hash`, `paid_at`, `is_deleted`, `deleted_at`, `created_at`, `updated_at`) VALUES
(1, 1, 0.00080000, 'PAID', '0xbaa0bc524fcc1f347bd5c7991a09d48d88bd63a9', '0x171261f819ba04b6b693aed9068e2cfd6430d7a3ab4004e6d3e35795da36a091', '2026-10-27 09:54:54', 0, NULL, '2026-10-24 19:22:58', '2026-10-27 09:54:54'),
(2, 1, 0.00080000, 'PAID', '0xbaa0bc524fcc1f347bd5c7991a09d48d88bd63a9', '0xe329938f7b653b79961fd6ef9330f1839520ca589c5562e5fc8f54c9663f891e', '2026-10-27 09:55:41', 0, NULL, '2026-10-24 19:25:25', '2026-10-27 09:55:41'),
(3, 1, 0.00080000, 'PAID', '0xbaa0bc524fcc1f347bd5c7991a09d48d88bd63a9', '0xe4aeb8b19840967bd9a3e786444deb88b0d2e567127d11b7de1a2ca4cb406064', '2026-10-27 09:55:55', 0, NULL, '2026-10-24 19:31:18', '2026-10-27 09:55:55'),
(4, 1, 0.00080000, 'PAID', '0xbaa0bc524fcc1f347bd5c7991a09d48d88bd63a9', '0x7e29cce3ed1ced2d47da3e5c67779836713e03df8e9fdd7450aba555040c3bdf', '2026-10-27 09:56:06', 0, NULL, '2026-10-24 19:31:35', '2026-10-27 09:56:06'),
(5, 1, 0.00080000, 'PAID', '0xbaa0bc524fcc1f347bd5c7991a09d48d88bd63a9', '0xc321ea686ef3625f3514448dc54439b4dd2068cca3eebaef2fca0ba8a9363afb', '2026-10-27 09:56:18', 0, NULL, '2026-10-24 19:32:17', '2026-10-27 09:56:18'),
(6, 1, 0.00080000, 'PAID', '0xbaa0bc524fcc1f347bd5c7991a09d48d88bd63a9', '0x123e4ccab95640dfd57f4683345f690211254b2dbaea5de52737c400fc7622a8', '2026-10-27 09:56:28', 0, NULL, '2026-10-24 19:32:55', '2026-10-27 09:56:28'),
(7, 1, 0.00080000, 'PAID', '0xbaa0bc524fcc1f347bd5c7991a09d48d88bd63a9', '0x43e1fb1a40ae9c9dc8b91797502db4172f10a083f949dfba65bad8696ffe59ac', '2026-10-27 09:56:53', 0, NULL, '2026-10-24 19:33:45', '2026-10-27 09:56:53'),
(8, 1, 0.00080000, 'PENDING', NULL, NULL, NULL, 0, NULL, '2026-10-24 19:37:21', '2026-10-28 12:07:26'),
(9, 1, 0.00080000, 'PAID', '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266', '0x_confirmed_on_chain', '2026-10-24 19:45:28', 0, NULL, '2026-10-24 19:38:20', '2026-10-24 19:45:28'),
(10, 1, 0.00030000, 'PAID', '0xbaa0bc524fcc1f347bd5c7991a09d48d88bd63a9', '0x03f7c3b850f7c76391a9e1f505b2ecb1b5037667360942279bb2cf65769d5e56', '2026-10-27 09:57:44', 0, NULL, '2026-10-24 19:38:46', '2026-10-27 09:57:44'),
(11, 1, 0.00080000, 'PAID', '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266', '0x_confirmed_on_chain', '2026-10-24 19:42:21', 0, NULL, '2026-10-24 19:42:18', '2026-10-24 19:42:21'),
(12, 1, 0.00030000, 'PENDING', NULL, NULL, NULL, 0, NULL, '2026-10-24 21:45:19', '2026-10-24 21:45:19'),
(13, 1, 0.00020000, 'PAID', '0xbaa0bc524fcc1f347bd5c7991a09d48d88bd63a9', '0xfe68d1df110a564cef9272ce4e3eb8a921b00403af93088d8ae506512e767841', '2026-10-24 21:54:30', 0, NULL, '2026-10-24 21:54:03', '2026-10-24 22:24:54'),
(14, 1, 0.00040000, 'PAID', '0xbaa0bc524fcc1f347bd5c7991a09d48d88bd63a9', '0xa44b7331dcc07415c134c2326f93a9dec758c8d4feec3dbb0b8fefd2f5b6a0de', '2026-10-24 22:17:32', 0, NULL, '2026-10-24 22:17:12', '2026-10-24 22:24:54'),
(15, 1, 0.00170000, 'PENDING', NULL, NULL, NULL, 0, NULL, '2026-10-24 22:29:42', '2026-10-24 22:29:42'),
(16, 1, 0.00030000, 'PAID', '0xbaa0bc524fcc1f347bd5c7991a09d48d88bd63a9', '0xb46ed26a92ea1db2d0339e8e6f56131e9ad05aa86a2bbd602b095d45bbc8049c', '2026-10-24 22:47:42', 0, NULL, '2026-10-24 22:47:22', '2026-10-24 22:47:42'),
(17, 1, 0.00020000, 'PAID', '0xbaa0bc524fcc1f347bd5c7991a09d48d88bd63a9', '0x155e1d4d6a90085747becc1fcd4b545e2781d827b771d3fd0ddd33d59f6a8785', '2026-10-26 20:01:56', 0, NULL, '2026-10-26 20:01:34', '2026-10-26 20:01:56'),
(18, 1, 0.00040000, 'PENDING', NULL, NULL, NULL, 0, NULL, '2026-10-27 07:31:26', '2026-10-27 07:31:26'),
(19, 1, 0.00020000, 'PAID', '0xbaa0bc524fcc1f347bd5c7991a09d48d88bd63a9', '0x0c7f0532c7ebe8dac76dec964f2b17ee04a7e43a5a2b0435f5218a011c92f9a6', '2026-10-27 08:10:42', 0, NULL, '2026-10-27 08:10:18', '2026-10-27 08:10:42'),
(20, 1, 0.00450000, 'PENDING', NULL, NULL, NULL, 0, NULL, '2026-10-27 08:17:13', '2026-10-27 08:17:13'),
(21, 1, 0.00190000, 'PENDING', NULL, NULL, NULL, 1, '2026-10-28 12:09:26', '2026-10-27 08:58:19', '2026-10-31 21:13:19'),
(22, 1, 0.00020000, 'PAID', '0xbaa0bc524fcc1f347bd5c7991a09d48d88bd63a9', '0xc6a420e0f4ea23b472b07cc33838c2a97c40072cfe8f7d39399352b65c27e2ac', '2026-10-27 09:00:19', 0, NULL, '2026-10-27 08:58:55', '2026-10-27 09:44:58'),
(23, 1, 0.00030000, 'PAID', '0xbaa0bc524fcc1f347bd5c7991a09d48d88bd63a9', '0x51a2006129a697d4941e054f29c9a141ef6047e2d64332cc639c9bf983344afa', '2026-10-28 12:10:30', 0, NULL, '2026-10-28 12:10:12', '2026-10-28 12:10:30'),
(25, 5, 0.00020000, 'PAID', '0xbaa0bc524fcc1f347bd5c7991a09d48d88bd63a9', '0x085abea210beed174d3cfcfc4724b7b0bb7cb5f59794a159dd26b31b0ba8d24c', '2026-10-29 09:41:17', 0, NULL, '2026-10-29 09:40:59', '2026-10-29 09:41:17'),
(26, 5, 0.00020000, 'PAID', '0xbaa0bc524fcc1f347bd5c7991a09d48d88bd63a9', '0x82a1684748c299eaf01921ec5b648d8896bef7a191997fec8aecbcf3269f47a2', '2026-10-29 09:54:40', 0, NULL, '2026-10-29 09:54:29', '2026-10-29 09:54:40'),
(27, 5, 0.00030000, 'PAID', '0xbaa0bc524fcc1f347bd5c7991a09d48d88bd63a9', '0x38419ccfdb45f7fa7dc8a0c22cb9fb0864d29b1e81b577ca2ac3fdd28fcbbad2', '2026-10-30 12:59:53', 0, NULL, '2026-10-30 12:59:35', '2026-10-30 12:59:53'),
(28, 3, 0.00020000, 'PAID', '0x537785f8889f168320d6568ffdc484843362514a', '0x39a5114eafc615d9389a6011cdf2e5ac165f022afc1b1dd5449a095e3dcbebdd', '2026-10-31 20:46:31', 0, NULL, '2026-10-31 20:46:18', '2026-10-31 20:46:31'),
(29, 3, 0.00020000, 'PAID', '0x537785f8889f168320d6568ffdc484843362514a', '0x9e79df6cf727d87523adaf208ba72ef4fa553060501b2ba617aa2c7c51ae3795', '2026-10-31 22:01:18', 0, NULL, '2026-10-31 22:01:00', '2026-10-31 22:01:18'),
(30, 3, 0.00030000, 'PAID', '0xbaa0bc524fcc1f347bd5c7991a09d48d88bd63a9', '0x6e044342169d904cf4b623bdf81fce8ddc5eab753882932c0f161f140a4f0424', '2026-11-05 09:49:07', 0, NULL, '2026-11-05 09:48:53', '2026-11-05 09:49:07'),
(31, 3, 0.00080000, 'PAID', '0xbaa0bc524fcc1f347bd5c7991a09d48d88bd63a9', '0x2581e21779164794694bf685eeb6b79849ad9de4583372e3e2196f47b5fe08b1', '2026-11-05 09:51:07', 0, NULL, '2026-11-05 09:50:54', '2026-11-05 09:51:07'),
(32, 3, 0.00020000, 'PAID', '0xbaa0bc524fcc1f347bd5c7991a09d48d88bd63a9', '0x4b7e8aa46c8382cdbc77af35a60db8306a5d90b836c4482299ec8aa5e6aca27a', '2026-11-05 20:27:09', 0, NULL, '2026-11-05 20:26:57', '2026-11-05 20:27:09'),
(33, 3, 0.00020000, 'PAID', '0xbaa0bc524fcc1f347bd5c7991a09d48d88bd63a9', '0xa6377de4c76e0c6e7d64fe88dcf736a147b677fac541249a97ffa4f5235fbdd5', '2026-11-08 16:48:08', 0, NULL, '2026-11-08 16:47:49', '2026-11-08 16:48:08'),
(34, 3, 0.00020000, 'PAID', '0x537785f8889f168320d6568ffdc484843362514a', '0x5a7874c3dc393a09da02914c874fcf59debfa92e44b179a7f4f486ef4d759901', '2026-11-09 11:23:06', 0, NULL, '2026-11-09 11:22:53', '2026-11-09 11:23:06'),
(35, 3, 0.00050000, 'CANCELLED', NULL, NULL, NULL, 1, '2026-11-09 19:22:05', '2026-11-09 18:32:17', '2026-11-09 19:22:05'),
(36, 3, 0.00050000, 'CANCELLED', NULL, NULL, NULL, 1, '2026-11-09 19:22:24', '2026-11-09 18:37:25', '2026-11-09 19:22:24'),
(37, 3, 0.00050000, 'CANCELLED', NULL, NULL, NULL, 1, '2026-11-09 19:22:22', '2026-11-09 18:53:10', '2026-11-09 19:22:22'),
(38, 3, 0.00030000, 'CANCELLED', NULL, NULL, NULL, 1, '2026-11-09 19:22:19', '2026-11-09 18:56:07', '2026-11-09 19:22:19'),
(39, 3, 0.00050000, 'PAID', '0x537785f8889f168320d6568ffdc484843362514a', '0xdca5011bddae661d989ef24585372d530eba41af77010353478839ffdb9b8dbe', '2026-11-09 19:21:43', 0, NULL, '2026-11-09 19:21:26', '2026-11-09 19:21:43'),
(40, 3, 0.00170000, 'PAID', '0x537785f8889f168320d6568ffdc484843362514a', '0x52dab7dfbc6e4235a71baf09a3aa6a2e300aceca6131aaf433e6ffa5cb0e6ab1', '2026-11-10 08:22:31', 0, NULL, '2026-11-10 08:22:04', '2026-11-10 08:22:31'),
(41, 3, 0.00050000, 'PAID', '0x537785f8889f168320d6568ffdc484843362514a', '0x184378f8185e15cb8e5323960ce185da72ec8f540d0d85e9a2f122dc4e71d512', '2026-11-16 11:31:56', 0, NULL, '2026-11-16 11:30:04', '2026-11-16 11:31:56'),
(42, 3, 0.00080000, 'PAID', '0x537785f8889f168320d6568ffdc484843362514a', '0x1a0d19fc186d0310b42a8e95bb826cdcd51347c8ebbcd3f146887f8c7ceae7a2', '2026-11-16 11:34:32', 0, NULL, '2026-11-16 11:34:04', '2026-11-16 11:34:32'),
(43, 3, 0.00030000, 'CANCELLED', NULL, NULL, NULL, 1, '2026-11-16 18:36:04', '2026-11-16 11:39:25', '2026-11-16 18:36:04'),
(44, 3, 0.00020000, 'PAID', '0xbaa0bc524fcc1f347bd5c7991a09d48d88bd63a9', '0xda46f5ca0efe5d3a4363c3e8a732cf8a6d6dcf4a8cd402bc0c30bb922ec4aa2f', '2026-11-16 18:35:56', 0, NULL, '2026-11-16 18:35:41', '2026-11-16 18:35:56'),
(45, 3, 0.00030000, 'CANCELLED', NULL, NULL, NULL, 1, '2026-11-16 20:23:04', '2026-11-16 20:12:45', '2026-11-16 20:23:04'),
(46, 3, 0.00080000, 'PAID', '0x537785f8889f168320d6568ffdc484843362514a', '0x5f377537fc7cf12dade8f7e8a42d3ff6140853f425cb4da0016af856547dde43', '2026-11-17 10:35:44', 0, NULL, '2026-11-17 10:35:25', '2026-11-17 10:35:44'),
(47, 3, 0.00080000, 'CANCELLED', NULL, NULL, NULL, 1, '2026-11-17 16:30:19', '2026-11-17 16:19:54', '2026-11-17 16:30:19'),
(48, 3, 0.00030000, 'PAID', '0xbaa0bc524fcc1f347bd5c7991a09d48d88bd63a9', '0x499b58e0ce26c43de852dc9e5267a947cf53239c280d8ae5f6725dd5c57a4e3b', '2026-11-17 16:28:06', 0, NULL, '2026-11-17 16:27:28', '2026-11-17 16:28:06'),
(49, 3, 0.00030000, 'CANCELLED', NULL, NULL, NULL, 1, '2026-11-20 14:03:39', '2026-11-20 14:03:08', '2026-11-20 14:03:39'),
(50, 3, 0.00030000, 'PAID', '0x537785f8889f168320d6568ffdc484843362514a', '0xa17fc3ed5dc81540d3b9e4d9be3fd14ada09bec11d4c6510faf32e430d803095', '2026-11-20 14:04:28', 0, NULL, '2026-11-20 14:04:18', '2026-11-20 14:04:28'),
(51, 3, 0.00040000, 'PAID', '0x537785f8889f168320d6568ffdc484843362514a', '0x20ee8fae11747ded96a6a04b0496518499fa1707888a1a0689d92c798adb8ca8', '2026-11-20 14:09:55', 0, NULL, '2026-11-20 14:09:33', '2026-11-20 14:09:55'),
(52, 2, 0.00030000, 'PAID', '0xbaa0bc524fcc1f347bd5c7991a09d48d88bd63a9', '0x23aaa39d5f8b1e868a119c3b5967a1fc394e4272c43e0267a07c7935380088bb', '2026-11-20 14:27:03', 0, NULL, '2026-11-20 14:26:32', '2026-11-20 14:27:03'),
(53, 2, 0.01220000, 'PAID', '0xbaa0bc524fcc1f347bd5c7991a09d48d88bd63a9', '0xbaa68b49e516c5ff6cdff1dc35a5b51a8e5dc1957e8fb0cbb508d81a65aa8b75', '2026-11-20 14:28:31', 0, NULL, '2026-11-20 14:28:05', '2026-11-20 14:28:31'),
(54, 3, 0.00130000, 'PAID', '0xbaa0bc524fcc1f347bd5c7991a09d48d88bd63a9', '0x75ba997483e94d1e0d8a11940178044daeb9e63fab2fb199e93b6bd6c8d784d1', '2026-11-20 14:33:39', 0, NULL, '2026-11-20 14:33:06', '2026-11-20 14:33:39');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `order_items`
--

CREATE TABLE `order_items` (
  `id` int NOT NULL,
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `unit_price_eth` decimal(18,8) NOT NULL COMMENT 'Đơn giá ETH tại thời điểm đặt đơn',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `quantity`, `unit_price_eth`, `created_at`) VALUES
(1, 1, 2, 1, 0.00080000, '2026-10-24 19:22:58'),
(2, 2, 2, 1, 0.00080000, '2026-10-24 19:25:25'),
(3, 3, 2, 1, 0.00080000, '2026-10-24 19:31:18'),
(4, 4, 2, 1, 0.00080000, '2026-10-24 19:31:35'),
(5, 5, 2, 1, 0.00080000, '2026-10-24 19:32:17'),
(6, 6, 2, 1, 0.00080000, '2026-10-24 19:32:55'),
(7, 7, 2, 1, 0.00080000, '2026-10-24 19:33:45'),
(8, 8, 2, 1, 0.00080000, '2026-10-24 19:37:21'),
(9, 9, 2, 1, 0.00080000, '2026-10-24 19:38:20'),
(10, 10, 3, 1, 0.00030000, '2026-10-24 19:38:46'),
(11, 11, 2, 1, 0.00080000, '2026-10-24 19:42:18'),
(12, 12, 3, 1, 0.00030000, '2026-10-24 21:45:19'),
(13, 13, 4, 1, 0.00020000, '2026-10-24 21:54:03'),
(14, 14, 5, 1, 0.00040000, '2026-10-24 22:17:12'),
(15, 15, 2, 1, 0.00080000, '2026-10-24 22:29:42'),
(16, 15, 3, 1, 0.00030000, '2026-10-24 22:29:42'),
(17, 15, 4, 1, 0.00020000, '2026-10-24 22:29:42'),
(18, 15, 5, 1, 0.00040000, '2026-10-24 22:29:42'),
(19, 16, 3, 1, 0.00030000, '2026-10-24 22:47:22'),
(20, 17, 4, 1, 0.00020000, '2026-10-26 20:01:34'),
(21, 18, 5, 1, 0.00040000, '2026-10-27 07:31:26'),
(22, 19, 4, 1, 0.00020000, '2026-10-27 08:10:18'),
(23, 20, 2, 4, 0.00080000, '2026-10-27 08:17:13'),
(24, 20, 3, 1, 0.00030000, '2026-10-27 08:17:13'),
(25, 20, 4, 1, 0.00020000, '2026-10-27 08:17:13'),
(26, 20, 5, 2, 0.00040000, '2026-10-27 08:17:13'),
(27, 21, 2, 2, 0.00080000, '2026-10-27 08:58:19'),
(28, 21, 3, 1, 0.00030000, '2026-10-27 08:58:19'),
(29, 22, 4, 1, 0.00020000, '2026-10-27 08:58:55'),
(30, 23, 3, 1, 0.00030000, '2026-10-28 12:10:12'),
(32, 25, 4, 1, 0.00020000, '2026-10-29 09:40:59'),
(33, 26, 4, 1, 0.00020000, '2026-10-29 09:54:29'),
(34, 27, 3, 1, 0.00030000, '2026-10-30 12:59:35'),
(35, 28, 4, 1, 0.00020000, '2026-10-31 20:46:18'),
(36, 29, 4, 1, 0.00020000, '2026-10-31 22:01:00'),
(37, 30, 3, 1, 0.00030000, '2026-11-05 09:48:53'),
(38, 31, 2, 1, 0.00080000, '2026-11-05 09:50:54'),
(39, 32, 4, 1, 0.00020000, '2026-11-05 20:26:57'),
(40, 33, 4, 1, 0.00020000, '2026-11-08 16:47:49'),
(41, 34, 4, 1, 0.00020000, '2026-11-09 11:22:53'),
(42, 35, 3, 1, 0.00030000, '2026-11-09 18:32:17'),
(43, 35, 4, 1, 0.00020000, '2026-11-09 18:32:17'),
(44, 36, 3, 1, 0.00030000, '2026-11-09 18:37:25'),
(45, 36, 4, 1, 0.00020000, '2026-11-09 18:37:25'),
(46, 37, 3, 1, 0.00030000, '2026-11-09 18:53:10'),
(47, 37, 4, 1, 0.00020000, '2026-11-09 18:53:10'),
(48, 38, 3, 1, 0.00030000, '2026-11-09 18:56:07'),
(49, 39, 3, 1, 0.00030000, '2026-11-09 19:21:26'),
(50, 39, 4, 1, 0.00020000, '2026-11-09 19:21:26'),
(51, 40, 2, 1, 0.00080000, '2026-11-10 08:22:04'),
(52, 40, 3, 1, 0.00030000, '2026-11-10 08:22:04'),
(53, 40, 4, 1, 0.00020000, '2026-11-10 08:22:04'),
(54, 40, 5, 1, 0.00040000, '2026-11-10 08:22:04'),
(55, 41, 3, 1, 0.00030000, '2026-11-16 11:30:04'),
(56, 41, 4, 1, 0.00020000, '2026-11-16 11:30:04'),
(57, 42, 2, 1, 0.00080000, '2026-11-16 11:34:04'),
(58, 43, 3, 1, 0.00030000, '2026-11-16 11:39:25'),
(59, 44, 4, 1, 0.00020000, '2026-11-16 18:35:41'),
(60, 45, 3, 1, 0.00030000, '2026-11-16 20:12:45'),
(61, 46, 2, 1, 0.00080000, '2026-11-17 10:35:25'),
(62, 47, 2, 1, 0.00080000, '2026-11-17 16:19:54'),
(63, 48, 3, 1, 0.00030000, '2026-11-17 16:27:28'),
(64, 49, 3, 1, 0.00030000, '2026-11-20 14:03:08'),
(65, 50, 3, 1, 0.00030000, '2026-11-20 14:04:18'),
(66, 51, 4, 2, 0.00020000, '2026-11-20 14:09:33'),
(67, 52, 3, 1, 0.00030000, '2026-11-20 14:26:32'),
(68, 53, 2, 6, 0.00080000, '2026-11-20 14:28:05'),
(69, 53, 3, 10, 0.00030000, '2026-11-20 14:28:05'),
(70, 53, 4, 6, 0.00020000, '2026-11-20 14:28:05'),
(71, 53, 5, 8, 0.00040000, '2026-11-20 14:28:05'),
(72, 54, 2, 1, 0.00080000, '2026-11-20 14:33:06'),
(73, 54, 3, 1, 0.00030000, '2026-11-20 14:33:06'),
(74, 54, 4, 1, 0.00020000, '2026-11-20 14:33:06');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `products`
--

CREATE TABLE `products` (
  `id` int NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `category_id` int DEFAULT NULL,
  `price_eth` decimal(18,8) NOT NULL COMMENT 'Đơn giá tính bằng ETH',
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stock` int NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `products`
--

INSERT INTO `products` (`id`, `name`, `description`, `category_id`, `price_eth`, `image_url`, `stock`, `is_active`, `created_at`, `updated_at`) VALUES
(2, 'Cyberpunk Mechanical Keyboard', 'Bàn phím cơ thiết kế Cyberpunk tích hợp đèn RGB chuyển màu và keycap xuyên led PBT cao cấp.', 2, 0.00080000, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80', 4, 1, '2026-10-24 18:56:02', '2026-11-20 14:33:06'),
(3, 'Exclusive Web3 Genesis NFT Hoodie', 'Áo Hoodie phiên bản giới hạn kỷ niệm khởi chạy mạng Web3, vải cotton nỉ 100% thoáng mát.', 3, 0.00030000, 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80', 31, 1, '2026-10-24 18:56:02', '2026-11-20 14:33:06'),
(4, 'Ethereum Crystal Hologram Lamp', 'Đèn decor biểu tượng Ethereum hiệu ứng Hologram 3D phát sáng nhiều chế độ màu.', 4, 0.00020000, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80', 20, 1, '2026-10-24 18:56:02', '2026-11-20 14:33:06'),
(5, 'Smart Hardware Security Key FIDO2', 'Khóa bảo mật vật lý chống phishing 2FA/WebAuthn chuẩn bảo mật quốc tế.', 1, 0.00040000, 'https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=800&q=80', 21, 1, '2026-10-24 18:56:02', '2026-11-20 14:28:05');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `full_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('ADMIN','CUSTOMER') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CUSTOMER',
  `wallet_address` varchar(42) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Địa chỉ ví MetaMask người dùng (0x...)',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT '1 = Hoat dong, 0 = An tai khoan',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `users`
--

INSERT INTO `users` (`id`, `full_name`, `email`, `password`, `role`, `wallet_address`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Tester (Khách hàng)', 'tester@dapp.com', '$2b$10$gu0jMxwXdxMuWnPkTHKHbeKsdjszbtqGKBpHoV1ONTcCmHngUHJ/a', 'CUSTOMER', '0xbAA0bc524fCC1f347Bd5C7991A09d48d88bd63a9', 0, '2026-10-24 18:56:02', '2026-11-20 13:59:02'),
(2, 'Quản Trị Viên', 'admin@dapp.com', '$2b$10$77Tx/3ayn/cZg/6FEYa7y.cbXvHL14yrfVJKq51q34empv8cDIzv6', 'ADMIN', '0xbAA0bc524fCC1f347Bd5C7991A09d48d88bd63a9', 1, '2026-10-27 12:45:14', '2026-11-20 14:24:16'),
(3, 'Nguyễn Văn Khách', 'user1@gmail.com', '$2b$10$gu0jMxwXdxMuWnPkTHKHbeKsdjszbtqGKBpHoV1ONTcCmHngUHJ/a', 'CUSTOMER', '0xbAA0bc524fCC1f347Bd5C7991A09d48d88bd63a9', 1, '2026-10-27 12:45:14', '2026-11-20 14:32:48'),
(4, 'Trần Mai', 'mai.tran@gmail.com', '$2b$10$zdyWPo6IJr3X.Jo9hREFYehfaR4Ng8hg.eEPJ5kjXfZgEru16G8NK', 'CUSTOMER', '0x1234567890123456789012345678901234567890', 0, '2026-10-27 12:50:30', '2026-10-31 20:11:58'),
(5, 'khach1', 'nva@gmail.com', '$2b$10$KfUa075UXYgu5TFL1JAE3OZa2X0DgPu3I2K./TNLI1fHOcB.dKCka', 'CUSTOMER', '0xbAA0bc524fCC1f347Bd5C7991A09d48d88bd63a9', 0, '2026-10-27 13:05:39', '2026-10-31 20:12:00');

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `cart_items`
--
ALTER TABLE `cart_items`
  ADD UNIQUE KEY `uk_user_product` (`user_id`,`product_id`),
  ADD KEY `fk_cart_product` (`product_id`);

--
-- Chỉ mục cho bảng `categories`
--
ALTER TABLE `categories`
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Chỉ mục cho bảng `orders`
--
ALTER TABLE `orders`
  ADD KEY `fk_order_user` (`user_id`),
  ADD KEY `idx_order_status` (`status`),
  ADD KEY `idx_order_soft_delete` (`is_deleted`),
  ADD KEY `idx_order_tx_hash` (`tx_hash`);

--
-- Chỉ mục cho bảng `order_items`
--
ALTER TABLE `order_items`
  ADD KEY `fk_item_order` (`order_id`),
  ADD KEY `fk_item_product` (`product_id`);

--
-- Chỉ mục cho bảng `products`
--
ALTER TABLE `products`
  ADD KEY `fk_product_category` (`category_id`);

--
-- Chỉ mục cho bảng `users`
--
ALTER TABLE `users`
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `cart_items`
--
ALTER TABLE `cart_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=102;

--
-- AUTO_INCREMENT cho bảng `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT cho bảng `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int NOT NULL AUTO_INCREMENT COMMENT 'OrderID dùng trực tiếp khi gọi Smart Contract', AUTO_INCREMENT=55;

--
-- AUTO_INCREMENT cho bảng `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=75;

--
-- AUTO_INCREMENT cho bảng `products`
--
ALTER TABLE `products`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT cho bảng `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Các ràng buộc cho các bảng đã đổ
--

--
-- Các ràng buộc cho bảng `cart_items`
--
ALTER TABLE `cart_items`
  ADD CONSTRAINT `fk_cart_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_cart_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `fk_order_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Các ràng buộc cho bảng `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `fk_item_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_item_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

--
-- Các ràng buộc cho bảng `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `fk_product_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
