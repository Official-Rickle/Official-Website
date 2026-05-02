// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

// ─── External interfaces ──────────────────────────────────────────────
interface IERC20 {
    function balanceOf(address) external view returns (uint256);
    function transfer(address, uint256) external returns (bool);
    function transferFrom(address, address, uint256) external returns (bool);
    function approve(address, uint256) external returns (bool);
    function allowance(address, address) external view returns (uint256);
    function totalSupply() external view returns (uint256);
}
interface IPancakePair is IERC20 {
    function getReserves() external view returns (uint112 r0, uint112 r1, uint32 ts);
    function token0() external view returns (address);
    function token1() external view returns (address);
}
interface IPancakeRouter {
    function addLiquidityETH(
        address token,
        uint256 amountTokenDesired,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    ) external payable returns (uint256, uint256, uint256);

    function removeLiquidityETH(
        address token,
        uint256 liquidity,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    ) external returns (uint256, uint256);

    function swapExactETHForTokensSupportingFeeOnTransferTokens(
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable;
}

/// @title  RickleAutoBurnVault
/// @notice Personal autocompounding LP vault with a configurable RKL sink.
///
///         Anyone can deploy a clone of this implementation via the factory,
///         seed it with BNB, and the contract permanently holds an LP
///         position in the PancakeSwap V2 RKL/WBNB pool. Every 29 days,
///         anyone can call `harvest()`:
///
///           · 0.4% of LP tokens are removed
///           · 40% of the harvested RKL goes to RECIPIENT
///                (= 0x...dEaD for burn, or your wallet for self-reward)
///           · 10% of the harvested BNB goes to msg.sender (caller bounty)
///           · A small zap-swap balances the remainder
///           · 74% of the harvested value re-enters the LP, compounding
///
///         The vault is fully immutable after `initialize()`: no admin keys,
///         no upgrade path, no withdrawal. RECIPIENT is set once and locked.
///         Each clone runs forever; harvest is gas-paid by whichever bot
///         lands the call first after the 29-day unlock, funded by the BNB
///         bounty pulled from the harvest itself.
///
/// @dev Designed to be cloned via EIP-1167 minimal proxy. The `initialize`
///      function is the proxy's substitute for a constructor; it can only
///      be called once per clone.
contract RickleAutoBurnVault {
    // ─── BSC mainnet constants (PancakeSwap V2) ──────────────────────
    address public constant RKL    = 0xeCa15e1BbFF172D545Dd6325F3Bae7b737906737;
    address public constant WBNB   = 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c;
    address public constant ROUTER = 0x10ED43C718714eb63d5aA57B78B54704E256024E;
    address public constant PAIR   = 0x4dcE12240b37879610601eb70685d396Faf06417;

    // ─── Immutable parameters ────────────────────────────────────────
    uint256 public constant HARVEST_INTERVAL = 29 days;
    uint256 public constant LP_HARVEST_BPS   =   40;  // 0.4% of LP per cycle
    uint256 public constant RECIPIENT_BPS    = 4000;  // 40% of harvested RKL
    uint256 public constant BOUNTY_BPS       = 1000;  // 10% of harvested BNB
    uint256 public constant SLIPPAGE_BPS     =   50;  // 0.5% on swap + add
    uint256 public constant DENOMINATOR      = 10000;

    // Pre-computed: the BNB-side zap fraction that, post-swap, leaves us
    // with balanced RKL+BNB to add to the pool. Derived from the equality
    // (1 - RECIPIENT_BPS) RKL_value == (1 - BOUNTY_BPS) BNB_value − 2×swap,
    // ignoring slippage. With our 4000/1000 split this evaluates to 1500.
    uint256 public constant ZAP_BPS = (RECIPIENT_BPS - BOUNTY_BPS) / 2;  // = 1500

    // ─── Per-clone state (set on initialize) ─────────────────────────
    address public recipient;
    uint256 public lastHarvest;
    bool    public initialized;

    // ─── Reentrancy guard ─────────────────────────────────────────────
    // Uses 0 as the "unlocked" state so EIP-1167 clones work without an
    // explicit initializer. Clones inherit zeroed storage and the
    // implementation's `uint256 private _locked = 1` would only fire in
    // the impl's constructor — never for clones — bricking initialize.
    uint256 private _locked;
    modifier nonReentrant() {
        require(_locked == 0, "reentrant");
        _locked = 1;
        _;
        _locked = 0;
    }

    // ─── Events ───────────────────────────────────────────────────────
    event Initialized(address indexed recipient, uint256 bnbSeed, uint256 lpReceived);
    event Harvested(
        address indexed caller,
        uint256 lpRemoved,
        uint256 rklHarvested,
        uint256 bnbHarvested,
        uint256 rklToRecipient,
        uint256 bnbBounty,
        uint256 lpAdded
    );

    // ─── Initialize (one-shot, factory calls this with seed BNB) ─────
    function initialize(address recipient_) external payable nonReentrant {
        require(!initialized, "already initialized");
        require(recipient_ != address(0), "recipient = 0");
        require(msg.value > 0, "no seed");

        initialized = true;
        recipient   = recipient_;
        lastHarvest = block.timestamp;

        // Approve router for RKL once (used by addLiquidityETH).
        require(IERC20(RKL).approve(ROUTER, type(uint256).max), "approve RKL failed");

        // Half the BNB goes to swap → RKL, the other half pairs with it.
        // For an empty starting position this is the standard 50/50 split;
        // pool's small price impact + slippage tolerance handle the gap.
        uint256 swap = msg.value / 2;
        uint256 bnbForLp = msg.value - swap;

        // Swap swap-amount BNB → RKL via WBNB->RKL path.
        address[] memory path = new address[](2);
        path[0] = WBNB;
        path[1] = RKL;
        IPancakeRouter(ROUTER).swapExactETHForTokensSupportingFeeOnTransferTokens{value: swap}(
            0,                          // accept any output (slippage handled at addLiquidity)
            path,
            address(this),
            block.timestamp + 600
        );

        uint256 rklReceived = IERC20(RKL).balanceOf(address(this));
        uint256 minRkl = rklReceived * (DENOMINATOR - SLIPPAGE_BPS) / DENOMINATOR;
        uint256 minBnb = bnbForLp     * (DENOMINATOR - SLIPPAGE_BPS) / DENOMINATOR;

        (, , uint256 liquidity) = IPancakeRouter(ROUTER).addLiquidityETH{value: bnbForLp}(
            RKL, rklReceived, minRkl, minBnb, address(this), block.timestamp + 600
        );

        emit Initialized(recipient_, msg.value, liquidity);
    }

    // ─── Harvest (public, anyone calls after 29-day cooldown) ───────
    function harvest() external nonReentrant {
        require(initialized, "not initialized");
        require(block.timestamp >= lastHarvest + HARVEST_INTERVAL, "cooldown");
        lastHarvest = block.timestamp;

        // 1. Compute LP slice and remove it from the pool.
        uint256 lpBalance = IPancakePair(PAIR).balanceOf(address(this));
        uint256 lpToRemove = lpBalance * LP_HARVEST_BPS / DENOMINATOR;
        require(lpToRemove > 0, "no LP");
        require(IPancakePair(PAIR).approve(ROUTER, lpToRemove), "approve LP failed");

        (uint256 rklH, uint256 bnbH) = IPancakeRouter(ROUTER).removeLiquidityETH(
            RKL, lpToRemove, 0, 0, address(this), block.timestamp + 600
        );

        // 2. Send RECIPIENT_BPS of harvested RKL to recipient (burn or reward).
        uint256 toRecipient = rklH * RECIPIENT_BPS / DENOMINATOR;
        require(IERC20(RKL).transfer(recipient, toRecipient), "transfer recipient failed");

        // 3. Compute caller bounty (paid LAST from contract balance).
        uint256 bounty = bnbH * BOUNTY_BPS / DENOMINATOR;
        // Failsafe: if harvest yield is too small to fund a bounty, revert
        // and keep the cooldown intact so bots try again next cycle.
        require(bounty > 0, "harvest too small");

        // 4. Zap: swap a small slice of BNB to RKL so resulting balances
        //    line up with the pool's current ratio for a clean addLiquidity.
        //    Fixed fraction works because the imbalance is always proportional
        //    to (RECIPIENT_BPS - BOUNTY_BPS), independent of pool size.
        uint256 zapBnb = bnbH * ZAP_BPS / DENOMINATOR;
        if (zapBnb > 0) {
            address[] memory path = new address[](2);
            path[0] = WBNB;
            path[1] = RKL;
            IPancakeRouter(ROUTER).swapExactETHForTokensSupportingFeeOnTransferTokens{value: zapBnb}(
                0, path, address(this), block.timestamp + 600
            );
        }

        // 5. Add liquidity with everything we have minus the bounty.
        uint256 rklForLp = IERC20(RKL).balanceOf(address(this));
        uint256 bnbForLp = address(this).balance - bounty;
        uint256 minRkl = rklForLp * (DENOMINATOR - SLIPPAGE_BPS) / DENOMINATOR;
        uint256 minBnb = bnbForLp * (DENOMINATOR - SLIPPAGE_BPS) / DENOMINATOR;

        (, , uint256 lpAdded) = IPancakeRouter(ROUTER).addLiquidityETH{value: bnbForLp}(
            RKL, rklForLp, minRkl, minBnb, address(this), block.timestamp + 600
        );

        // 6. Pay caller their bounty. Using `call` (not transfer) since the
        //    caller may be a contract with non-trivial fallback.
        (bool ok, ) = msg.sender.call{value: bounty}("");
        require(ok, "bounty pay failed");

        emit Harvested(msg.sender, lpToRemove, rklH, bnbH, toRecipient, bounty, lpAdded);
    }

    // ─── View helpers ─────────────────────────────────────────────────
    function nextHarvestAt() external view returns (uint256) {
        return lastHarvest + HARVEST_INTERVAL;
    }
    function timeUntilHarvest() external view returns (uint256) {
        uint256 next = lastHarvest + HARVEST_INTERVAL;
        return block.timestamp >= next ? 0 : next - block.timestamp;
    }
    function lpHeld() external view returns (uint256) {
        return IPancakePair(PAIR).balanceOf(address(this));
    }

    // Required so the router can refund excess BNB on addLiquidityETH.
    receive() external payable {}
}
