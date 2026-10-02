// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/IArtisanEscrow.sol";

/**
 * @title ArtisanEscrow
 * @dev Artifix Marketplace - Production-Hardened Stablecoin Escrow on Monad EVM.
 * Adheres strictly to SOLID principles, OpenZeppelin security standards, and SafeERC20.
 *
 * Architecture Highlights:
 * - Single Responsibility Principle (SRP): Escrow lifecycle and state machine management.
 * - Open/Closed Principle (OCP): Extensible via IArtisanEscrow without breaking storage.
 * - Liskov Substitution Principle (LSP): Fully compatible with standard ERC-20 and USDC implementations.
 * - Interface Segregation Principle (ISP): Segregated external interface for consumers.
 * - Dependency Inversion Principle (DIP): Inversion of token dependency via IERC20 abstraction.
 */
contract ArtisanEscrow is IArtisanEscrow, Ownable2Step, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // =========================================================================
    // STATE VARIABLES
    // =========================================================================

    /// @notice Dedicated dispute resolver and automated settlement arbiter
    address public arbiter;

    /// @notice Destination address collecting platform commission fees
    address public feeRecipient;

    /// @notice Canonical payment token (USDC, 6 decimals)
    IERC20 public immutable paymentToken;

    /// @notice Expected token decimals (USDC operates on 6 decimals)
    uint8 public constant EXPECTED_DECIMALS = 6;

    /// @notice Maximum allowable platform fee (2000 bps = 20.00%)
    uint256 public constant MAX_PLATFORM_FEE_BPS = 2000;

    /// @notice Counter for unique auto-incrementing escrow IDs
    uint256 public nextEscrowId;

    /// @notice Storage map of all escrows by numerical ID
    mapping(uint256 => Escrow) public escrows;

    /// @notice Lookup map connecting off-chain contractCode to on-chain escrow ID
    mapping(string => uint256) public codeToEscrowId;

    // =========================================================================
    // MODIFIERS
    // =========================================================================

    modifier onlyArbiter() {
        if (msg.sender != arbiter && msg.sender != owner()) revert Unauthorized();
        _;
    }

    // =========================================================================
    // CONSTRUCTOR
    // =========================================================================

    /**
     * @notice Initializes the ArtisanEscrow contract with required roles and payment token.
     * @param _arbiter Authorized dispute resolution arbiter
     * @param _feeRecipient Dedicated platform commission fee recipient
     * @param _paymentToken Canonical USDC ERC-20 contract address on Monad
     */
    constructor(
        address _arbiter,
        address _feeRecipient,
        address _paymentToken
    ) Ownable(msg.sender) {
        if (_arbiter == address(0) || _feeRecipient == address(0) || _paymentToken == address(0)) {
            revert InvalidAddress();
        }

        // Verify that the token exposes 6 decimals (standard USDC specification)
        try IERC20Metadata(_paymentToken).decimals() returns (uint8 decimals) {
            if (decimals != EXPECTED_DECIMALS) {
                revert TokenDecimalsMismatch(EXPECTED_DECIMALS, decimals);
            }
        } catch {
            // Revert if token does not implement IERC20Metadata
            revert InvalidAddress();
        }

        arbiter = _arbiter;
        feeRecipient = _feeRecipient;
        paymentToken = IERC20(_paymentToken);
        nextEscrowId = 1;
    }

    // =========================================================================
    // CORE ESCROW LOGIC (STABLECOIN / ERC-20)
    // =========================================================================

    /**
     * @inheritdoc IArtisanEscrow
     */
    function createAndFundEscrow(
        string calldata contractCode,
        address artisan,
        uint256 amount,
        uint256 feeBps
    ) external override nonReentrant whenNotPaused returns (uint256) {
        if (amount == 0) revert InvalidAmount();
        if (artisan == address(0) || artisan == msg.sender) revert InvalidAddress();
        if (feeBps > MAX_PLATFORM_FEE_BPS) revert PlatformFeeTooHigh(MAX_PLATFORM_FEE_BPS, feeBps);

        // Safe transfer of stablecoin from client into this contract
        paymentToken.safeTransferFrom(msg.sender, address(this), amount);

        uint256 escrowId = nextEscrowId++;

        escrows[escrowId] = Escrow({
            id: escrowId,
            contractCode: contractCode,
            client: msg.sender,
            artisan: artisan,
            amount: amount,
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
            amount,
            feeBps
        );

        return escrowId;
    }

    /**
     * @inheritdoc IArtisanEscrow
     */
    function submitWork(uint256 escrowId) external override {
        Escrow storage escrow = escrows[escrowId];
        if (msg.sender != escrow.artisan) revert Unauthorized();
        if (escrow.state != EscrowState.FUNDED) {
            revert InvalidState(escrow.state, EscrowState.FUNDED);
        }

        escrow.state = EscrowState.WORK_SUBMITTED;
        emit WorkSubmitted(escrowId, msg.sender);
    }

    /**
     * @inheritdoc IArtisanEscrow
     */
    function approveAndRelease(uint256 escrowId) external override nonReentrant {
        Escrow storage escrow = escrows[escrowId];
        if (msg.sender != escrow.client && msg.sender != arbiter && msg.sender != owner()) {
            revert Unauthorized();
        }
        if (escrow.state != EscrowState.WORK_SUBMITTED && escrow.state != EscrowState.FUNDED) {
            revert InvalidState(escrow.state, EscrowState.WORK_SUBMITTED);
        }

        uint256 totalAmount = escrow.amount;
        uint256 platformFee = (totalAmount * escrow.platformFeeBps) / 10000;
        uint256 artisanAmount = totalAmount - platformFee;

        // Checks-Effects-Interactions pattern
        escrow.state = EscrowState.RELEASED;
        escrow.completedAt = block.timestamp;

        // Disburse platform fee in USDC
        if (platformFee > 0) {
            paymentToken.safeTransfer(feeRecipient, platformFee);
        }

        // Disburse net payout in USDC to artisan
        paymentToken.safeTransfer(escrow.artisan, artisanAmount);

        emit EscrowReleased(escrowId, escrow.artisan, artisanAmount, platformFee);
    }

    /**
     * @inheritdoc IArtisanEscrow
     */
    function raiseDispute(uint256 escrowId, string calldata reason) external override {
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
     * @inheritdoc IArtisanEscrow
     */
    function resolveDispute(
        uint256 escrowId,
        uint256 artisanAmount,
        uint256 clientRefund
    ) external override onlyArbiter nonReentrant {
        Escrow storage escrow = escrows[escrowId];
        if (escrow.state != EscrowState.DISPUTED) {
            revert InvalidState(escrow.state, EscrowState.DISPUTED);
        }

        uint256 totalAmount = escrow.amount;
        if (artisanAmount + clientRefund > totalAmount) {
            revert DisputeAmountsMismatch(totalAmount, artisanAmount + clientRefund);
        }

        // Remainder protection: Unallocated remainder automatically refunded to client
        uint256 effectiveClientRefund = clientRefund;
        if (artisanAmount + clientRefund < totalAmount) {
            effectiveClientRefund += (totalAmount - (artisanAmount + clientRefund));
        }

        // Platform fee calculated strictly on the artisan's payout portion
        uint256 platformFee = 0;
        uint256 netArtisanAmount = artisanAmount;
        if (artisanAmount > 0) {
            platformFee = (artisanAmount * escrow.platformFeeBps) / 10000;
            netArtisanAmount = artisanAmount - platformFee;
        }

        // Checks-Effects-Interactions
        escrow.state = EscrowState.RESOLVED;
        escrow.completedAt = block.timestamp;

        // Disburse platform fee
        if (platformFee > 0) {
            paymentToken.safeTransfer(feeRecipient, platformFee);
        }

        // Disburse artisan settlement
        if (netArtisanAmount > 0) {
            paymentToken.safeTransfer(escrow.artisan, netArtisanAmount);
        }

        // Disburse client refund
        if (effectiveClientRefund > 0) {
            paymentToken.safeTransfer(escrow.client, effectiveClientRefund);
        }

        emit DisputeResolved(
            escrowId,
            netArtisanAmount,
            effectiveClientRefund,
            platformFee
        );
    }

    /**
     * @inheritdoc IArtisanEscrow
     */
    function refundClient(uint256 escrowId) external override nonReentrant {
        Escrow storage escrow = escrows[escrowId];
        if (msg.sender != escrow.artisan && msg.sender != arbiter && msg.sender != owner()) {
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

        // Checks-Effects-Interactions
        escrow.state = EscrowState.REFUNDED;
        escrow.completedAt = block.timestamp;

        paymentToken.safeTransfer(escrow.client, refundAmount);

        emit EscrowRefunded(escrowId, escrow.client, refundAmount);
    }

    // =========================================================================
    // ADMIN FUNCTIONS & EMERGENCY CONTROLS
    // =========================================================================

    /**
     * @inheritdoc IArtisanEscrow
     */
    function setArbiter(address _newArbiter) external override onlyOwner {
        if (_newArbiter == address(0)) revert InvalidAddress();
        emit ArbiterUpdated(arbiter, _newArbiter);
        arbiter = _newArbiter;
    }

    /**
     * @inheritdoc IArtisanEscrow
     */
    function setFeeRecipient(address _newRecipient) external override onlyOwner {
        if (_newRecipient == address(0)) revert InvalidAddress();
        emit FeeRecipientUpdated(feeRecipient, _newRecipient);
        feeRecipient = _newRecipient;
    }

    /**
     * @inheritdoc IArtisanEscrow
     */
    function pause() external override onlyOwner {
        _pause();
    }

    /**
     * @inheritdoc IArtisanEscrow
     */
    function unpause() external override onlyOwner {
        _unpause();
    }

    // =========================================================================
    // VIEW FUNCTIONS
    // =========================================================================

    /**
     * @inheritdoc IArtisanEscrow
     */
    function getEscrow(uint256 escrowId) external view override returns (Escrow memory) {
        return escrows[escrowId];
    }

    /**
     * @inheritdoc IArtisanEscrow
     */
    function getEscrowByCode(string calldata code) external view override returns (Escrow memory) {
        uint256 id = codeToEscrowId[code];
        return escrows[id];
    }

    /**
     * @inheritdoc IArtisanEscrow
     */
    function totalEscrows() external view override returns (uint256) {
        return nextEscrowId - 1;
    }

    /**
     * @inheritdoc IArtisanEscrow
     */
    function paymentTokenAddress() external view override returns (address) {
        return address(paymentToken);
    }
}
