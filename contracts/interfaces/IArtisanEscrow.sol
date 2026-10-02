// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IArtisanEscrow
 * @dev Interface defining the Artifix Escrow contract on Monad EVM.
 * Adheres to Interface Segregation Principle (ISP) and Single Responsibility Principle (SRP).
 */
interface IArtisanEscrow {
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
        address client;
        address artisan;
        uint256 amount;
        uint256 platformFeeBps; // 100 bps = 1.00%, 500 bps = 5.00%
        EscrowState state;
        uint256 createdAt;
        uint256 completedAt;
    }

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

    // =========================================================================
    // CUSTOM ERRORS
    // =========================================================================

    error Unauthorized();
    error InvalidState(EscrowState current, EscrowState expected);
    error InvalidAmount();
    error InvalidAddress();
    error TransferFailed();
    error DisputeAmountsMismatch(uint256 totalExpected, uint256 provided);
    error TokenDecimalsMismatch(uint8 expected, uint8 actual);
    error PlatformFeeTooHigh(uint256 maxBps, uint256 requestedBps);

    // =========================================================================
    // CLIENT & ARTISAN LIFECYCLE FUNCTIONS
    // =========================================================================

    function createAndFundEscrow(
        string calldata contractCode,
        address artisan,
        uint256 amount,
        uint256 feeBps
    ) external returns (uint256);

    function submitWork(uint256 escrowId) external;

    function approveAndRelease(uint256 escrowId) external;

    function raiseDispute(uint256 escrowId, string calldata reason) external;

    // =========================================================================
    // ARBITER & MUTUAL SETTLEMENT FUNCTIONS
    // =========================================================================

    function resolveDispute(
        uint256 escrowId,
        uint256 artisanAmount,
        uint256 clientRefund
    ) external;

    function refundClient(uint256 escrowId) external;

    // =========================================================================
    // ADMIN FUNCTIONS
    // =========================================================================

    function setArbiter(address newArbiter) external;

    function setFeeRecipient(address newRecipient) external;

    function pause() external;

    function unpause() external;

    // =========================================================================
    // VIEW FUNCTIONS
    // =========================================================================

    function getEscrow(uint256 escrowId) external view returns (Escrow memory);

    function getEscrowByCode(string calldata code) external view returns (Escrow memory);

    function totalEscrows() external view returns (uint256);

    function paymentTokenAddress() external view returns (address);
}
