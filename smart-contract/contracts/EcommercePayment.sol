// SPDX-License-Identifier: MIT
// Dòng trên khai báo giấy phép mã nguồn (MIT). Trình biên dịch Solidity sẽ cảnh báo nếu thiếu dòng này.

// Khai báo phiên bản trình biên dịch: dùng bản 0.8.24 trở lên (nhưng dưới 0.9.0).
// Từ Solidity 0.8.x, phép cộng/trừ tự động kiểm tra tràn số (overflow/underflow) nên an toàn hơn bản cũ.
pragma solidity ^0.8.24;

/**
 * @title EcommercePayment
 * @dev Hợp đồng thông minh nhận thanh toán đơn hàng bằng ETH cho Mini E-Commerce Hybrid DApp.
 * @author Thành viên 1: Database & Smart Contract (Data Layer)
 */
contract EcommercePayment {
    // Địa chỉ ví của chủ sở hữu cửa hàng (Deployer)
    // - "payable": cho phép contract chuyển ETH về địa chỉ này (cần khi rút tiền).
    // - "public": Solidity tự sinh hàm đọc owner() để Frontend/Backend tra cứu.
    address payable public owner;

    // Lưu vết các OrderID đã được thanh toán trên chuỗi để chống thanh toán trùng lặp (Double-payment)
    // Dạng bảng tra cứu: paidOrders[orderId] = true nghĩa là đơn đó đã được trả tiền.
    // Giá trị mặc định của mapping là false nên đơn chưa từng thanh toán sẽ trả về false.
    mapping(uint256 => bool) public paidOrders;

    // Lưu địa chỉ ví đã thanh toán cho từng OrderID
    mapping(uint256 => address) public orderBuyer;

    // Lưu số tiền ETH đã thanh toán cho từng OrderID
    // Đơn vị là Wei (1 ETH = 10^18 Wei), kiểu số nguyên nên không bị sai số thập phân.
    mapping(uint256 => uint256) public orderAmount;

    /**
     * @dev Sự kiện cốt lõi được phát ra khi người mua thanh toán thành công qua ví MetaMask.
     * Backend Listener (Thành viên 2) sẽ lắng nghe sự kiện này để cập nhật trạng thái đơn hàng trong MySQL.
     * @param orderId Mã đơn hàng đối chiếu với MySQL
     * @param buyer Địa chỉ ví người mua đã ký và gửi ETH
     * @param amount Số lượng Wei (ETH) đã thanh toán
     * @param timestamp Thời điểm khối được tạo
     */
    // Từ khóa "indexed" giúp lọc/tìm nhanh event theo orderId hoặc buyer.
    // Mỗi event chỉ được đánh dấu tối đa 3 tham số indexed.
    // Ghi event rẻ gas hơn nhiều so với lưu vào storage, và được lưu vĩnh viễn trong log của chuỗi.
    event PaymentCompleted(
        uint256 indexed orderId,
        address indexed buyer,
        uint256 amount,
        uint256 timestamp
    );

    // Sự kiện khi chủ shop rút tiền từ contract về ví cá nhân
    event FundsWithdrawn(address indexed owner, uint256 amount, uint256 timestamp);

    // Modifier là "bộ lọc quyền": hàm nào gắn onlyOwner chỉ chạy khi người gọi chính là owner.
    // Nếu ví khác gọi, giao dịch bị hủy (revert) kèm thông báo lỗi bên dưới.
    // Ký hiệu "_;" là vị trí mà phần thân của hàm được gắn vào sau khi kiểm tra quyền xong.
    modifier onlyOwner() {
        require(msg.sender == owner, "EcommercePayment: Caller is not the contract owner");
        _;
    }

    // Constructor chỉ chạy đúng 1 lần duy nhất lúc deploy.
    // msg.sender lúc này là ví đang deploy, nên ví đó trở thành owner và là người duy nhất rút được tiền.
    constructor() {
        owner = payable(msg.sender);
    }

    /**
     * @dev Hàm thanh toán đơn hàng bằng ETH.
     * Người mua gọi hàm này từ Frontend (Thành viên 3) và gửi kèm giá trị ETH (msg.value).
     * @param orderId Mã đơn hàng sinh từ Backend
     */
    // "external": chỉ gọi được từ bên ngoài contract.
    // "payable": cho phép hàm nhận ETH kèm theo giao dịch (không có từ khóa này thì gửi ETH sẽ bị lỗi).
    function payOrder(uint256 orderId) external payable {
        // Kiểm tra 1: mã đơn phải lớn hơn 0 (tránh mã không hợp lệ).
        require(orderId > 0, "EcommercePayment: Invalid orderId");
        // Kiểm tra 2: msg.value là số ETH (Wei) đi kèm giao dịch, phải lớn hơn 0.
        // Lưu ý: contract không biết giá đơn hàng, việc đối chiếu đúng số tiền do Backend đảm nhiệm.
        require(msg.value > 0, "EcommercePayment: Payment amount must be greater than 0");
        // Kiểm tra 3: chặn thanh toán trùng - đơn đã trả rồi thì không cho trả lần nữa.
        require(!paidOrders[orderId], "EcommercePayment: Order has already been paid on-chain");

        // Đánh dấu đơn hàng đã thanh toán
        // (msg.sender là ví đang gọi hàm, tức ví của người mua)
        paidOrders[orderId] = true;
        orderBuyer[orderId] = msg.sender;
        orderAmount[orderId] = msg.value;

        // Phát ra sự kiện cho Backend Listener
        // block.timestamp là thời điểm (giây, theo chuẩn Unix) của khối chứa giao dịch này.
        emit PaymentCompleted(orderId, msg.sender, msg.value, block.timestamp);
    }

    /**
     * @dev Kiểm tra nhanh trạng thái đơn hàng trên Blockchain
     */
    // "view": chỉ đọc dữ liệu, không ghi, nên gọi từ bên ngoài hoàn toàn miễn phí gas.
    function isOrderPaid(uint256 orderId) external view returns (bool) {
        return paidOrders[orderId];
    }

    /**
     * @dev Lấy số dư hiện tại trong Smart Contract
     */
    // address(this) là địa chỉ của chính contract này; .balance là số ETH (Wei) contract đang giữ.
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Rút toàn bộ số dư ETH trong contract về ví của chủ shop (chỉ Owner mới có quyền gọi)
     */
    // Gắn modifier onlyOwner: chỉ ví owner mới rút được, ví khác bị từ chối.
    function withdraw() external onlyOwner {
        // Lấy toàn bộ số dư hiện có và bắt buộc phải có tiền mới rút.
        uint256 balance = address(this).balance;
        require(balance > 0, "EcommercePayment: No funds available to withdraw");

        // Chuyển ETH bằng call{value: ...}. Cách này được khuyến nghị hơn transfer() vì
        // transfer() bị giới hạn cứng 2300 gas, dễ lỗi nếu ví nhận là một contract (ví đa chữ ký...).
        // "success" cho biết việc chuyển tiền có thành công hay không.
        (bool success, ) = owner.call{value: balance}("");
        // Nếu chuyển thất bại thì hủy toàn bộ giao dịch, tiền vẫn nằm nguyên trong contract.
        require(success, "EcommercePayment: Transfer failed");

        emit FundsWithdrawn(owner, balance, block.timestamp);
    }

    // Nhận ETH trực tiếp
    // Hàm đặc biệt chạy khi ai đó gửi ETH thẳng vào địa chỉ contract mà không gọi hàm nào.
    // Số ETH này cộng vào số dư contract và chủ shop có thể rút qua withdraw().
    // Lưu ý: cách gửi này KHÔNG gắn với orderId nào và không phát ra event PaymentCompleted.
    receive() external payable {}
}
