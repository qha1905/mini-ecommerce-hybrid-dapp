// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title EcommercePayment
 * @dev Hợp đồng thông minh nhận thanh toán đơn hàng bằng ETH cho Mini E-Commerce Hybrid DApp.
 * @author Thành viên 1: Database & Smart Contract (Data Layer)
 */
contract EcommercePayment {
    // Địa chỉ ví của chủ sở hữu cửa hàng (Deployer)
    address payable public owner;

    // Lưu vết các OrderID đã được thanh toán trên chuỗi để chống thanh toán trùng lặp (Double-payment)
    mapping(uint256 => bool) public paidOrders;

    // Lưu địa chỉ ví đã thanh toán cho từng OrderID
    mapping(uint256 => address) public orderBuyer;

    // Lưu số tiền ETH đã thanh toán cho từng OrderID
    mapping(uint256 => uint256) public orderAmount;

    /**
     * @dev Sự kiện cốt lõi được phát ra khi người mua thanh toán thành công qua ví MetaMask.
     * Backend Listener (Thành viên 2) sẽ lắng nghe sự kiện này để cập nhật trạng thái đơn hàng trong MySQL.
     * @param orderId Mã đơn hàng đối chiếu với MySQL
     * @param buyer Địa chỉ ví người mua đã ký và gửi ETH
     * @param amount Số lượng Wei (ETH) đã thanh toán
     * @param timestamp Thời điểm khối được tạo
     */
    event PaymentCompleted(
        uint256 indexed orderId,
        address indexed buyer,
        uint256 amount,
        uint256 timestamp
    );

    // Sự kiện khi chủ shop rút tiền từ contract về ví cá nhân
    event FundsWithdrawn(address indexed owner, uint256 amount, uint256 timestamp);

    modifier onlyOwner() {
        require(msg.sender == owner, "EcommercePayment: Caller is not the contract owner");
        _;
    }

    constructor() {
        owner = payable(msg.sender);
    }

    /**
     * @dev Hàm thanh toán đơn hàng bằng ETH.
     * Người mua gọi hàm này từ Frontend (Thành viên 3) và gửi kèm giá trị ETH (msg.value).
     * @param orderId Mã đơn hàng sinh từ Backend
     */
    function payOrder(uint256 orderId) external payable {
        require(orderId > 0, "EcommercePayment: Invalid orderId");
        require(msg.value > 0, "EcommercePayment: Payment amount must be greater than 0");
        require(!paidOrders[orderId], "EcommercePayment: Order has already been paid on-chain");

        // Đánh dấu đơn hàng đã thanh toán
        paidOrders[orderId] = true;
        orderBuyer[orderId] = msg.sender;
        orderAmount[orderId] = msg.value;

        // Phát ra sự kiện cho Backend Listener
        emit PaymentCompleted(orderId, msg.sender, msg.value, block.timestamp);
    }

    /**
     * @dev Kiểm tra nhanh trạng thái đơn hàng trên Blockchain
     */
    function isOrderPaid(uint256 orderId) external view returns (bool) {
        return paidOrders[orderId];
    }

    /**
     * @dev Lấy số dư hiện tại trong Smart Contract
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Rút toàn bộ số dư ETH trong contract về ví của chủ shop (chỉ Owner mới có quyền gọi)
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "EcommercePayment: No funds available to withdraw");

        (bool success, ) = owner.call{value: balance}("");
        require(success, "EcommercePayment: Transfer failed");

        emit FundsWithdrawn(owner, balance, block.timestamp);
    }

    // Nhận ETH trực tiếp
    receive() external payable {}
}
