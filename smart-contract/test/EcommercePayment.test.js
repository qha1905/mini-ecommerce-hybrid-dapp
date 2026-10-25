const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EcommercePayment Smart Contract", function () {
  let contract;
  let owner;
  let buyer1;
  let buyer2;

  beforeEach(async function () {
    [owner, buyer1, buyer2] = await ethers.getSigners();
    const EcommercePayment = await ethers.getContractFactory("EcommercePayment");
    contract = await EcommercePayment.deploy();
    await contract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct contract owner", async function () {
      expect(await contract.owner()).to.equal(owner.address);
    });

    it("Should start with 0 balance", async function () {
      expect(await contract.getBalance()).to.equal(0);
    });
  });

  describe("payOrder Execution & Event Emission", function () {
    const orderId = 101;
    const paymentAmount = ethers.parseEther("0.005");

    it("Should accept payment and emit PaymentCompleted event", async function () {
      await expect(
        contract.connect(buyer1).payOrder(orderId, { value: paymentAmount })
      )
        .to.emit(contract, "PaymentCompleted")
        .withArgs(orderId, buyer1.address, paymentAmount, (val) => val > 0);

      expect(await contract.isOrderPaid(orderId)).to.be.true;
      expect(await contract.orderBuyer(orderId)).to.equal(buyer1.address);
      expect(await contract.orderAmount(orderId)).to.equal(paymentAmount);
      expect(await contract.getBalance()).to.equal(paymentAmount);
    });

    it("Should reject payment with 0 ETH", async function () {
      await expect(
        contract.connect(buyer1).payOrder(orderId, { value: 0 })
      ).to.be.revertedWith("EcommercePayment: Payment amount must be greater than 0");
    });

    it("Should reject payment with invalid orderId (0)", async function () {
      await expect(
        contract.connect(buyer1).payOrder(0, { value: paymentAmount })
      ).to.be.revertedWith("EcommercePayment: Invalid orderId");
    });

    it("Should reject double payment for the same orderId", async function () {
      // First payment succeeds
      await contract.connect(buyer1).payOrder(orderId, { value: paymentAmount });

      // Second payment with same orderId must fail
      await expect(
        contract.connect(buyer2).payOrder(orderId, { value: paymentAmount })
      ).to.be.revertedWith("EcommercePayment: Order has already been paid on-chain");
    });
  });

  describe("Withdrawal by Owner", function () {
    const orderId = 202;
    const paymentAmount = ethers.parseEther("0.01");

    beforeEach(async function () {
      await contract.connect(buyer1).payOrder(orderId, { value: paymentAmount });
    });

    it("Should allow the owner to withdraw funds", async function () {
      const initialBalance = await ethers.provider.getBalance(owner.address);

      const tx = await contract.connect(owner).withdraw();
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;

      const finalBalance = await ethers.provider.getBalance(owner.address);
      expect(await contract.getBalance()).to.equal(0);
      expect(finalBalance).to.equal(initialBalance + paymentAmount - gasCost);
    });

    it("Should reject withdrawal from non-owner accounts", async function () {
      await expect(
        contract.connect(buyer1).withdraw()
      ).to.be.revertedWith("EcommercePayment: Caller is not the contract owner");
    });
  });
});
