import { ethers } from "ethers";
import defaultContractData from "../contracts/contractData.json";

class Web3Service {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contractData = defaultContractData;
  }

  // Kiểm tra tiện ích MetaMask đã được cài đặt chưa
  isInstalled() {
    return typeof window !== "undefined" && Boolean(window.ethereum);
  }

  // Luôn tạo BrowserProvider mới để không bị cache dữ liệu mạng cũ
  getProvider() {
    if (this.isInstalled()) {
      this.provider = new ethers.BrowserProvider(window.ethereum);
    }
    return this.provider;
  }

  // Lấy Chain ID trực tiếp từ MetaMask (tránh tình trạng Provider bị cache chainId cũ)
  async getCurrentChainId() {
    if (!this.isInstalled()) return null;
    try {
      const hexChainId = await window.ethereum.request({ method: "eth_chainId" });
      return parseInt(hexChainId, 16).toString();
    } catch (e) {
      console.warn("Could not get chainId from window.ethereum:", e);
      return null;
    }
  }

  // Kết nối ví MetaMask
  async connect() {
    if (!this.isInstalled()) {
      throw new Error("Trình duyệt chưa cài đặt ví MetaMask. Vui lòng cài đặt tiện ích MetaMask để thanh toán!");
    }

    const provider = this.getProvider();
    // Yêu cầu cấp quyền truy cập tài khoản
    const accounts = await provider.send("eth_requestAccounts", []);
    if (!accounts || accounts.length === 0) {
      throw new Error("Không tìm thấy tài khoản nào được kết nối");
    }

    this.signer = await provider.getSigner();
    const address = await this.signer.getAddress();
    const balanceWei = await provider.getBalance(address);
    const balance = ethers.formatEther(balanceWei);
    
    // Lấy chain ID trực tiếp thời gian thực
    const currentChainId = (await this.getCurrentChainId()) || "31337";

    return {
      address,
      balance: parseFloat(balance).toFixed(4),
      chainId: currentChainId,
      networkName: this.getNetworkName(currentChainId),
    };
  }

  getNetworkName(chainId) {
    if (chainId === "31337" || chainId === "1337") return "Hardhat Localhost";
    if (chainId === "11155111") return "Sepolia Testnet";
    if (chainId === "1") return "Ethereum Mainnet";
    if (chainId === "50002") return "Mantle Hoodi Testnet";
    return `Chain ID ${chainId}`;
  }

  // Chuyển sang mạng Hardhat Localhost (Chain ID 31337)
  async switchToHardhatLocalhost() {
    if (!this.isInstalled()) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x7a69" }], // 31337 in hex
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x7a69",
              chainName: "Hardhat Localhost",
              rpcUrls: ["http://127.0.0.1:8545"],
              nativeCurrency: {
                name: "Ethereum",
                symbol: "ETH",
                decimals: 18,
              },
            },
          ],
        });
      }
    }
  }

  // Chuyển sang mạng Sepolia (Chain ID 11155111)
  async switchToSepolia() {
    if (!this.isInstalled()) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }], // 11155111 in hex
      });
    } catch (switchError) {
      console.warn("Switch network error:", switchError);
    }
  }

  // Tương tác trực tiếp Smart Contract: Gọi hàm payOrder(orderId) kèm gửi ETH
  async payOrder(orderId, amountEth, onStatusChange) {
    if (!this.isInstalled()) {
      throw new Error("MetaMask chưa được cài đặt");
    }

    const provider = this.getProvider();
    this.signer = await provider.getSigner();

    // 1. Kiểm tra mạng Blockchain hiện tại thời gian thực từ MetaMask
    let currentChainId = await this.getCurrentChainId();
    const expectedChainId = this.contractData.chainId ? this.contractData.chainId.toString() : "31337";

    // Nếu phát hiện sai mạng, tự động yêu cầu MetaMask chuyển mạng
    if (currentChainId !== expectedChainId) {
      console.log(`Switching network from ${currentChainId} to ${expectedChainId}...`);
      if (expectedChainId === "31337") {
        await this.switchToHardhatLocalhost();
      } else if (expectedChainId === "11155111") {
        await this.switchToSepolia();
      }
      // Đọc lại chainId sau khi chuyển
      currentChainId = await this.getCurrentChainId();
    }

    if (currentChainId !== expectedChainId) {
      const currentName = this.getNetworkName(currentChainId);
      const expectedName = this.getNetworkName(expectedChainId);
      throw new Error(
        `Bạn đang kết nối sai mạng trên MetaMask!\n` +
        `• Mạng hiện tại: ${currentName} (Chain ID ${currentChainId})\n` +
        `• Mạng yêu cầu: ${expectedName} (Chain ID ${expectedChainId})\n\n` +
        `👉 Vui lòng mở MetaMask, bấm vào mục Mạng và chọn "${expectedName}" rồi thử lại!`
      );
    }

    const contractAddress = this.contractData.address;
    const contractAbi = this.contractData.abi;

    if (!contractAddress || !contractAbi) {
      throw new Error("Thông tin Smart Contract chưa được cấu hình. Hãy chạy script deploy trước.");
    }

    const contract = new ethers.Contract(contractAddress, contractAbi, this.signer);

    // Chuyển đổi số tiền ETH sang Wei (18 chữ số thập phân)
    const weiAmount = ethers.parseEther(amountEth.toString());

    if (onStatusChange) onStatusChange({ step: "AWAITING_CONFIRMATION", message: "Vui lòng xác nhận giao dịch trên ví MetaMask..." });

    // Gọi hàm payOrder trên Smart Contract
    const tx = await contract.payOrder(orderId, { value: weiAmount });

    if (onStatusChange) {
      onStatusChange({
        step: "TRANSACTION_SENT",
        txHash: tx.hash,
        message: "Giao dịch đã được gửi lên Blockchain. Đang chờ xác thực...",
      });
    }

    // Đợi Transaction được đào thành công (1 confirmation)
    const receipt = await tx.wait(1);

    if (onStatusChange) {
      onStatusChange({
        step: "SUCCESS",
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        message: "Thanh toán thành công! Backend Event Listener đang cập nhật trạng thái đơn hàng.",
      });
    }

    return {
      txHash: tx.hash,
      receipt,
      blockNumber: receipt.blockNumber,
    };
  }
}

export const web3Service = new Web3Service();
