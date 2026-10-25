const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("==================================================");
  console.log("🚀 Starting EcommercePayment Contract Deployment...");
  console.log(`🌐 Target Network: ${hre.network.name}`);
  console.log("==================================================");

  const [deployer] = await hre.ethers.getSigners();
  console.log(`👤 Deploying with account: ${deployer.address}`);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`💰 Account balance: ${hre.ethers.formatEther(balance)} ETH`);

  // Deploy Contract
  const EcommercePayment = await hre.ethers.getContractFactory("EcommercePayment");
  const contract = await EcommercePayment.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("--------------------------------------------------");
  console.log(`✅ EcommercePayment deployed successfully!`);
  console.log(`📍 Contract Address: ${contractAddress}`);
  console.log("--------------------------------------------------");

  // Lấy ABI từ artifacts
  const artifactPath = path.join(__dirname, "../artifacts/contracts/EcommercePayment.sol/EcommercePayment.json");
  if (!fs.existsSync(artifactPath)) {
    console.error("Artifact not found. Please compile contract first.");
    return;
  }
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const contractData = {
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    address: contractAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    abi: artifact.abi,
  };

  // Đồng bộ ABI và Địa chỉ sang các thư mục của Thành viên 2 (Backend) và Thành viên 3 (Frontend)
  const targetPaths = [
    path.join(__dirname, "../deployedAddress.json"),
    path.join(__dirname, "../../backend/src/config/contractData.json"),
    path.join(__dirname, "../../frontend/src/contracts/contractData.json"),
  ];

  for (const targetPath of targetPaths) {
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(targetPath, JSON.stringify(contractData, null, 2), "utf8");
    console.log(`📁 Synced contract ABI & Address to: ${targetPath}`);
  }

  console.log("==================================================");
  console.log("🎉 All modules synchronized successfully!");
  console.log("==================================================");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
