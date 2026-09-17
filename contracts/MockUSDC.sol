// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockUSDC
 * @dev Simple ERC-20 stablecoin with 6 decimals and a public mint faucet for Monad Testnet.
 */
contract MockUSDC {
    string public name = "USD Coin";
    string public symbol = "USDC";
    uint8 public decimals = 6;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor() {
        // Mint 1,000,000 USDC to deployer initially ($1,000,000 with 6 decimals)
        _mint(msg.sender, 1_000_000 * 10**decimals);
    }

    function transfer(address to, uint256 value) external returns (bool) {
        return _transfer(msg.sender, to, value);
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 currentAllowance = allowance[from][msg.sender];
        if (currentAllowance != type(uint256).max) {
            require(currentAllowance >= value, "ERC20: insufficient allowance");
            allowance[from][msg.sender] = currentAllowance - value;
        }
        return _transfer(from, to, value);
    }

    /**
     * @notice Public testnet faucet function allowing any address to mint up to 10,000 USDC per call.
     */
    function mint(address to, uint256 amount) external {
        require(amount <= 10_000 * 10**decimals, "Max 10,000 USDC per mint");
        _mint(to, amount);
    }

    function _transfer(address from, address to, uint256 value) internal returns (bool) {
        require(to != address(0), "ERC20: transfer to the zero address");
        require(balanceOf[from] >= value, "ERC20: transfer amount exceeds balance");

        balanceOf[from] -= value;
        balanceOf[to] += value;
        emit Transfer(from, to, value);
        return true;
    }

    function _mint(address to, uint256 value) internal {
        require(to != address(0), "ERC20: mint to the zero address");
        totalSupply += value;
        balanceOf[to] += value;
        emit Transfer(address(0), to, value);
    }
}
