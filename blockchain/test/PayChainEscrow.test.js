const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PayChainEscrow", function () {
  let escrow;
  let owner;
  let employer;
  let worker;
  
  beforeEach(async function () {
    [owner, employer, worker] = await ethers.getSigners();
    
    const PayChainEscrow = await ethers.getContractFactory("PayChainEscrow");
    escrow = await PayChainEscrow.deploy();
    await escrow.waitForDeployment();
  });
  
  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await escrow.owner()).to.equal(owner.address);
    });
    
    it("Should have correct platform fee", async function () {
      expect(await escrow.platformFeePercent()).to.equal(2);
    });
  });
  
  describe("Job Creation", function () {
    it("Should create a job with locked funds", async function () {
      const jobId = 1;
      const timeLimitHours = 48;
      const amount = ethers.parseEther("1.0");
      
      await expect(
        escrow.connect(employer).createJob(jobId, timeLimitHours, { value: amount })
      ).to.emit(escrow, "JobCreated");
      
      const job = await escrow.getJob(jobId);
      expect(job.employer).to.equal(employer.address);
      expect(job.isLocked).to.be.true;
      expect(job.amount).to.equal(amount);
    });
    
    it("Should reject job creation with zero ETH", async function () {
      await expect(
        escrow.connect(employer).createJob(1, 48, { value: 0 })
      ).to.be.revertedWith("Must send ETH");
    });
  });
  
  describe("Payment Release", function () {
    it("Should release payment to worker", async function () {
      const jobId = 1;
      const amount = ethers.parseEther("1.0");
      
      // Create job
      await escrow.connect(employer).createJob(jobId, 48, { value: amount });
      
      // Release payment
      await expect(
        escrow.connect(owner).releasePayment(jobId, worker.address)
      ).to.emit(escrow, "PaymentReleased");
      
      const job = await escrow.getJob(jobId);
      expect(job.isCompleted).to.be.true;
      expect(job.worker).to.equal(worker.address);
    });
  });
  
  describe("Refund", function () {
    it("Should refund expired jobs", async function () {
      const jobId = 1;
      const amount = ethers.parseEther("1.0");
      
      // Create job with 1 hour limit
      await escrow.connect(employer).createJob(jobId, 1, { value: amount });
      
      // Fast-forward time by 2 hours
      await ethers.provider.send("evm_increaseTime", [7200]);
      await ethers.provider.send("evm_mine");
      
      // Refund job
      await expect(
        escrow.refundExpiredJob(jobId)
      ).to.emit(escrow, "JobRefunded");
      
      const job = await escrow.getJob(jobId);
      expect(job.isRefunded).to.be.true;
    });
  });
});
