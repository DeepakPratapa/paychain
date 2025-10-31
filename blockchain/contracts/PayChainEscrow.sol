// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PayChainEscrow
 * @dev Escrow contract for gig economy platform
 * @notice Holds funds in escrow until job completion
 */
contract PayChainEscrow {
    
    // ============================================
    // STATE VARIABLES
    // ============================================
    
    address public owner;  // Platform address
    uint256 public platformFeePercent = 2; // 2% platform fee
    uint256 public totalEscrowLocked;
    uint256 public totalFeesCollected;
    
    struct Job {
        uint256 jobId;
        address payable employer;
        address payable worker;
        uint256 amount;           // Total amount locked (including fee)
        uint256 workerAmount;     // Amount worker receives
        uint256 platformFee;      // Platform fee
        uint256 deadline;         // Unix timestamp
        bool isLocked;
        bool isCompleted;
        bool isRefunded;
        uint256 createdAt;
    }
    
    mapping(uint256 => Job) public jobs;
    mapping(address => uint256) public employerJobCount;
    mapping(address => uint256) public workerJobCount;
    
    // ============================================
    // EVENTS
    // ============================================
    
    event JobCreated(
        uint256 indexed jobId,
        address indexed employer,
        uint256 totalAmount,
        uint256 workerAmount,
        uint256 platformFee,
        uint256 deadline
    );
    
    event PaymentReleased(
        uint256 indexed jobId,
        address indexed worker,
        uint256 amount,
        uint256 platformFee
    );
    
    event JobRefunded(
        uint256 indexed jobId,
        address indexed employer,
        uint256 amount
    );
    
    event PlatformFeeWithdrawn(
        address indexed owner,
        uint256 amount
    );
    
    // ============================================
    // MODIFIERS
    // ============================================
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }
    
    modifier jobExists(uint256 _jobId) {
        require(jobs[_jobId].employer != address(0), "Job does not exist");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }
    
    // ============================================
    // CONSTRUCTOR
    // ============================================
    
    constructor() {
        owner = msg.sender;
    }
    
    // ============================================
    // MAIN FUNCTIONS
    // ============================================
    
    /**
     * @dev Create new job and lock funds in escrow
     * @param _jobId Unique job identifier from database
     * @param _timeLimitHours Number of hours to complete job
     */
    function createJob(uint256 _jobId, uint256 _timeLimitHours) 
        external 
        payable 
        whenNotPaused
    {
        require(msg.value > 0, "Must send ETH");
        require(jobs[_jobId].employer == address(0), "Job ID already exists");
        require(_timeLimitHours > 0, "Time limit must be positive");
        
        // Calculate amounts
        uint256 platformFee = (msg.value * platformFeePercent) / 100;
        uint256 workerAmount = msg.value - platformFee;
        
        // Create job
        jobs[_jobId] = Job({
            jobId: _jobId,
            employer: payable(msg.sender),
            worker: payable(address(0)),
            amount: msg.value,
            workerAmount: workerAmount,
            platformFee: platformFee,
            deadline: block.timestamp + (_timeLimitHours * 1 hours),
            isLocked: true,
            isCompleted: false,
            isRefunded: false,
            createdAt: block.timestamp
        });
        
        totalEscrowLocked += msg.value;
        employerJobCount[msg.sender]++;
        
        emit JobCreated(
            _jobId,
            msg.sender,
            msg.value,
            workerAmount,
            platformFee,
            jobs[_jobId].deadline
        );
    }
    
    /**
     * @dev Release payment to worker upon job completion
     * @param _jobId Job identifier
     * @param _worker Worker's address
     */
    function releasePayment(uint256 _jobId, address payable _worker) 
        external 
        onlyOwner 
        jobExists(_jobId) 
        whenNotPaused
    {
        Job storage job = jobs[_jobId];
        
        require(job.isLocked, "Job is not locked");
        require(!job.isCompleted, "Job already completed");
        require(!job.isRefunded, "Job already refunded");
        require(_worker != address(0), "Invalid worker address");
        // Note: Removed deadline check to allow payment release even after deadline
        // The platform decides when work is satisfactory, not the timer
        
        // Update state
        job.worker = _worker;
        job.isCompleted = true;
        job.isLocked = false;
        
        totalEscrowLocked -= job.amount;
        totalFeesCollected += job.platformFee;
        workerJobCount[_worker]++;
        
        // Transfer funds
        _worker.transfer(job.workerAmount);
        
        emit PaymentReleased(_jobId, _worker, job.workerAmount, job.platformFee);
    }
    
    /**
     * @dev Refund employer if job expired without completion
     * @param _jobId Job identifier
     */
    function refundExpiredJob(uint256 _jobId) 
        external 
        jobExists(_jobId) 
        whenNotPaused
    {
        Job storage job = jobs[_jobId];
        
        require(job.isLocked, "Job is not locked");
        require(!job.isCompleted, "Job already completed");
        require(!job.isRefunded, "Job already refunded");
        require(block.timestamp > job.deadline, "Job not expired yet");
        
        // Update state
        job.isRefunded = true;
        job.isLocked = false;
        
        totalEscrowLocked -= job.amount;
        
        // Refund full amount (including platform fee since job wasn't completed)
        job.employer.transfer(job.amount);
        
        emit JobRefunded(_jobId, job.employer, job.amount);
    }
    
    /**
     * @dev Platform owner withdraws collected fees
     */
    function withdrawPlatformFees() 
        external 
        onlyOwner 
    {
        require(totalFeesCollected > 0, "No fees to withdraw");
        
        uint256 amount = totalFeesCollected;
        totalFeesCollected = 0;
        
        payable(owner).transfer(amount);
        
        emit PlatformFeeWithdrawn(owner, amount);
    }
    
    // ============================================
    // VIEW FUNCTIONS
    // ============================================
    
    /**
     * @dev Get job details
     */
    function getJob(uint256 _jobId) 
        external 
        view 
        jobExists(_jobId) 
        returns (Job memory) 
    {
        return jobs[_jobId];
    }
    
    /**
     * @dev Get locked balance for specific job
     */
    function getJobBalance(uint256 _jobId) 
        external 
        view 
        jobExists(_jobId) 
        returns (uint256) 
    {
        return jobs[_jobId].isLocked ? jobs[_jobId].amount : 0;
    }
    
    /**
     * @dev Check if job has expired
     */
    function isJobExpired(uint256 _jobId) 
        external 
        view 
        jobExists(_jobId) 
        returns (bool) 
    {
        return block.timestamp > jobs[_jobId].deadline;
    }
    
    /**
     * @dev Get contract stats
     */
    function getContractStats() 
        external 
        view 
        returns (
            uint256 _totalEscrowLocked,
            uint256 _totalFeesCollected,
            uint256 _contractBalance
        ) 
    {
        return (
            totalEscrowLocked,
            totalFeesCollected,
            address(this).balance
        );
    }
    
    // ============================================
    // EMERGENCY FUNCTIONS
    // ============================================
    
    /**
     * @dev Emergency pause (for critical bugs)
     * @notice In production, use OpenZeppelin's Pausable
     */
    bool public paused = false;
    
    function togglePause() external onlyOwner {
        paused = !paused;
    }
}
