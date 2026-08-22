// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ArtisanEscrow
 * @dev Monad Blitz Hackathon - Artisan Escrow Platform
 * @notice Trust and settlement infrastructure for local artisan service transactions on Monad.
 */
contract ArtisanEscrow {
    // =========================================================================
    // ENUMS & STRUCTS
    // =========================================================================

    enum EscrowState {
        FUNDED,
        WORK_SUBMITTED,
        RELEASED,
        DISPUTED,
        RESOLVED,
        REFUNDED
    }

    struct Escrow {
        uint256 id;
        string contractCode;
        address payable client;
        address payable artisan;
        uint256 amount;
        uint256 platformFeeBps; // 100 bps = 1.00%, 500 bps = 5.00%
        EscrowState state;
        uint256 createdAt;
        uint256 completedAt;
    }

    // =========================================================================
    // STATE VARIABLES
    // =========================================================================

    address public owner;
    address public arbiter;
    address payable public feeRecipient;
    uint256 public nextEscrowId;

    mapping(uint256 => Escrow) public escrows;
    mapping(string => uint256) public codeToEscrowId;

    // Simple reentrancy status
    uint256 private _status;
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    // Pausable state for emergency controls
    bool public paused;

    // =========================================================================
    // EVENTS
    // =========================================================================

    event EscrowCreated(
        uint256 indexed escrowId,
        string contractCode,
        address indexed client,
        address indexed artisan,
        uint256 amount,
        uint256 feeBps
    );

    event WorkSubmitted(
        uint256 indexed escrowId,
        address indexed artisan
    );

    event EscrowReleased(
        uint256 indexed escrowId,
        address indexed artisan,
        uint256 artisanAmount,
        uint256 platformFee
    );

    event DisputeRaised(
        uint256 indexed escrowId,
        address indexed raisedBy,
        string reason
    );

    event DisputeResolved(
        uint256 indexed escrowId,
        uint256 artisanAmount,
        uint256 clientRefund,
        uint256 platformFee
    );

    event EscrowRefunded(
        uint256 indexed escrowId,
        address indexed client,
        uint256 refundAmount
    );

    event ArbiterUpdated(address indexed oldArbiter, address indexed newArbiter);
    event FeeRecipientUpdated(address indexed oldRecipient, address indexed newRecipient);
    event Paused(address account);
    event Unpaused(address account);

    // =========================================================================
    // ERRORS
    // =========================================================================

    error Unauthorized();
    error InvalidState(EscrowState current, EscrowState expected);
    error InvalidAmount();
    error InvalidAddress();
    error TransferFailed();
    error DisputeAmountsMismatch(uint256 totalExpected, uint256 provided);
    error ReentrancyGuardReentrantCall();
    error ContractPaused();

    // =========================================================================
    // MODIFIERS
    // =========================================================================

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier onlyArbiter() {
        if (msg.sender != arbiter && msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier nonReentrant() {
        if (_status == _ENTERED) revert ReentrancyGuardReentrantCall();
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    modifier whenNotPaused() {
        if (paused) revert ContractPaused();
        _;
    }

    // =========================================================================
    // CONSTRUCTOR
    // =========================================================================

    constructor(address _arbiter, address payable _feeRecipient) {
        if (_arbiter == address(0) || _feeRecipient == address(0)) revert InvalidAddress();
        owner = msg.sender;
        arbiter = _arbiter;
        feeRecipient = _feeRecipient;
        _status = _NOT_ENTERED;
        paused = false;
        nextEscrowId = 1;
    }

    // =========================================================================
    // CORE ESCROW LOGIC
    // =========================================================================

    /**
     * @notice Creates a new escrow and locks native MON funds in a single transaction.
     * @param contractCode Unique backend contract code (e.g., CTR-2026-10492)
     * @param artisan Address of the artisan performing the work
     * @param feeBps Platform fee in basis points (e.g. 500 for 5%)
     */
    function createAndFundEscrow(
        string calldata contractCode,
        address payable artisan,
        uint256 feeBps
    ) external payable nonReentrant whenNotPaused returns (uint256) {
        if (msg.value == 0) revert InvalidAmount();
        if (artisan == address(0) || artisan == msg.sender) revert InvalidAddress();
        if (feeBps > 2000) revert InvalidAmount(); // Max 20% platform fee protection

        uint256 escrowId = nextEscrowId++;

        escrows[escrowId] = Escrow({
            id: escrowId,
            contractCode: contractCode,
            client: payable(msg.sender),
            artisan: artisan,
            amount: msg.value,
            platformFeeBps: feeBps,
            state: EscrowState.FUNDED,
            createdAt: block.timestamp,
            completedAt: 0
        });

        codeToEscrowId[contractCode] = escrowId;

        emit EscrowCreated(
            escrowId,
            contractCode,
            msg.sender,
            artisan,
            msg.value,
            feeBps
        );

        return escrowId;
    }

    /**
     * @notice Artisan marks the work as complete and submits for review.
     * @param escrowId The ID of the escrow.
     */
    function submitWork(uint256 escrowId) external {
        Escrow storage escrow = escrows[escrowId];
        if (msg.sender != escrow.artisan) revert Unauthorized();
        if (escrow.state != EscrowState.FUNDED) {
            revert InvalidState(escrow.state, EscrowState.FUNDED);
        }

        escrow.state = EscrowState.WORK_SUBMITTED;
        emit WorkSubmitted(escrowId, msg.sender);
    }

    /**
     * @notice Customer approves the completed work and triggers fund release.
     * @param escrowId The ID of the escrow.
     */
    function approveAndRelease(uint256 escrowId) external nonReentrant {
        Escrow storage escrow = escrows[escrowId];
        if (msg.sender != escrow.client && msg.sender != arbiter) revert Unauthorized();
        if (escrow.state != EscrowState.WORK_SUBMITTED && escrow.state != EscrowState.FUNDED) {
            revert InvalidState(escrow.state, EscrowState.WORK_SUBMITTED);
        }

        uint256 totalAmount = escrow.amount;
        uint256 platformFee = (totalAmount * escrow.platformFeeBps) / 10000;
        uint256 artisanAmount = totalAmount - platformFee;

        escrow.state = EscrowState.RELEASED;
        escrow.completedAt = block.timestamp;

        // Transfers
        if (platformFee > 0) {
            (bool feeSuccess, ) = feeRecipient.call{value: platformFee}("");
            if (!feeSuccess) revert TransferFailed();
        }

        (bool artisanSuccess, ) = escrow.artisan.call{value: artisanAmount}("");
        if (!artisanSuccess) revert TransferFailed();

        emit EscrowReleased(escrowId, escrow.artisan, artisanAmount, platformFee);
    }

    /**
     * @notice Either client or artisan can raise a dispute if conditions are not met.
     * @param escrowId The ID of the escrow.
     * @param reason Description of why dispute is raised.
     */
    function raiseDispute(uint256 escrowId, string calldata reason) external {
        Escrow storage escrow = escrows[escrowId];
        if (msg.sender != escrow.client && msg.sender != escrow.artisan) revert Unauthorized();
        if (
            escrow.state != EscrowState.FUNDED &&
            escrow.state != EscrowState.WORK_SUBMITTED
        ) {
            revert InvalidState(escrow.state, EscrowState.FUNDED);
        }

        escrow.state = EscrowState.DISPUTED;
        emit DisputeRaised(escrowId, msg.sender, reason);
    }

    /**
     * @notice Admin / Arbiter resolves the dispute with an agreed split or full resolution.
     * @param escrowId The ID of the escrow.
     * @param artisanAmount Amount allocated to the artisan (in wei).
     * @param clientRefund Amount refunded back to the customer (in wei).
     */
    function resolveDispute(
        uint256 escrowId,
        uint256 artisanAmount,
        uint256 clientRefund
    ) external onlyArbiter nonReentrant {
        Escrow storage escrow = escrows[escrowId];
        if (escrow.state != EscrowState.DISPUTED) {
            revert InvalidState(escrow.state, EscrowState.DISPUTED);
        }

        uint256 totalAmount = escrow.amount;
        if (artisanAmount + clientRefund > totalAmount) {
            revert DisputeAmountsMismatch(totalAmount, artisanAmount + clientRefund);
        }

        // Prevent trapped funds: any unallocated remainder is automatically refunded to client
        uint256 effectiveClientRefund = clientRefund;
        if (artisanAmount + clientRefund < totalAmount) {
            effectiveClientRefund += (totalAmount - (artisanAmount + clientRefund));
        }

        // Platform fee is proportionally calculated on the artisan's payout portion
        uint256 platformFee = 0;
        uint256 netArtisanAmount = artisanAmount;
        if (artisanAmount > 0) {
            platformFee = (artisanAmount * escrow.platformFeeBps) / 10000;
            netArtisanAmount = artisanAmount - platformFee;
        }

        escrow.state = EscrowState.RESOLVED;
        escrow.completedAt = block.timestamp;

        // Execute distributions
        if (platformFee > 0) {
            (bool feeSuccess, ) = feeRecipient.call{value: platformFee}("");
            if (!feeSuccess) revert TransferFailed();
        }

        if (netArtisanAmount > 0) {
            (bool artisanSuccess, ) = escrow.artisan.call{value: netArtisanAmount}("");
            if (!artisanSuccess) revert TransferFailed();
        }

        if (effectiveClientRefund > 0) {
            (bool clientSuccess, ) = escrow.client.call{value: effectiveClientRefund}("");
            if (!clientSuccess) revert TransferFailed();
        }

        emit DisputeResolved(
            escrowId,
            netArtisanAmount,
            effectiveClientRefund,
            platformFee
        );
    }

    /**
     * @notice Mutual or Admin refund directly to client if contract is cancelled.
     * @param escrowId The ID of the escrow.
     */
    function refundClient(uint256 escrowId) external nonReentrant {
        Escrow storage escrow = escrows[escrowId];
        if (msg.sender != escrow.artisan && msg.sender != arbiter && msg.sender != owner) {
            revert Unauthorized();
        }
        if (
            escrow.state != EscrowState.FUNDED &&
            escrow.state != EscrowState.WORK_SUBMITTED &&
            escrow.state != EscrowState.DISPUTED
        ) {
            revert InvalidState(escrow.state, EscrowState.FUNDED);
        }

        uint256 refundAmount = escrow.amount;
        escrow.state = EscrowState.REFUNDED;
        escrow.completedAt = block.timestamp;

        (bool success, ) = escrow.client.call{value: refundAmount}("");
        if (!success) revert TransferFailed();

        emit EscrowRefunded(escrowId, escrow.client, refundAmount);
    }

    // =========================================================================
    // ADMIN FUNCTIONS & EMERGENCY CONTROLS
    // =========================================================================

    function setArbiter(address _newArbiter) external onlyOwner {
        if (_newArbiter == address(0)) revert InvalidAddress();
        emit ArbiterUpdated(arbiter, _newArbiter);
        arbiter = _newArbiter;
    }

    function setFeeRecipient(address payable _newRecipient) external onlyOwner {
        if (_newRecipient == address(0)) revert InvalidAddress();
        emit FeeRecipientUpdated(feeRecipient, _newRecipient);
        feeRecipient = _newRecipient;
    }

    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }

    // =========================================================================
    // VIEW FUNCTIONS
    // =========================================================================

    function getEscrow(uint256 escrowId) external view returns (Escrow memory) {
        return escrows[escrowId];
    }

    function getEscrowByCode(string calldata code) external view returns (Escrow memory) {
        uint256 id = codeToEscrowId[code];
        return escrows[id];
    }

    function totalEscrows() external view returns (uint256) {
        return nextEscrowId - 1;
    }
}
