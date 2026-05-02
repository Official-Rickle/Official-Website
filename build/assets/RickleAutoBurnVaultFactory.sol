// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IVaultInit {
    function initialize(address recipient) external payable;
}

/// @title  RickleAutoBurnVaultFactory
/// @notice One-shot deployer for personal AutoBurnVault clones. Anyone calls
///         `createVault(recipient)` with BNB attached; the factory clones the
///         hardcoded implementation via EIP-1167 and forwards the BNB to the
///         clone's `initialize`. The clone immediately seeds its LP and
///         starts its 29-day harvest cycle.
///
///         The factory has no admin keys, no upgrade path, and never holds
///         user funds — every BNB sent in goes straight to the new clone.
///         A simple registry tracks clones by their creator's address so
///         the rickletoken.com UI can list "your vaults" without any
///         centralized index.
contract RickleAutoBurnVaultFactory {
    /// @notice The implementation contract clones delegate-call into.
    ///         Set once at deploy, never changes.
    address public immutable IMPLEMENTATION;

    /// @notice Every clone the factory has ever created, in order.
    address[] public allVaults;

    /// @notice Vaults grouped by the wallet that called createVault().
    mapping(address => address[]) public vaultsByCreator;

    event VaultCreated(
        address indexed creator,
        address indexed vault,
        address indexed recipient,
        uint256 bnbSeed
    );

    constructor(address implementation_) {
        require(implementation_ != address(0), "implementation = 0");
        IMPLEMENTATION = implementation_;
    }

    /// @notice Deploy a new clone, fund it with msg.value BNB, and initialize
    ///         it with the chosen recipient. Returns the new clone address.
    ///
    ///         The recipient is where 40% of every harvest's RKL goes:
    ///           · 0x000000000000000000000000000000000000dEaD → burn
    ///           · your wallet → personal RKL drip
    ///           · any other address → custom (DAO, charity, etc.)
    ///
    ///         Anyone can create a vault for any recipient. The vault is
    ///         immediately operational — first harvest unlocks 29 days from
    ///         deploy time.
    function createVault(address recipient) external payable returns (address clone) {
        require(recipient != address(0), "recipient = 0");
        require(msg.value > 0, "no seed");

        clone = _clone(IMPLEMENTATION);
        IVaultInit(clone).initialize{value: msg.value}(recipient);

        allVaults.push(clone);
        vaultsByCreator[msg.sender].push(clone);
        emit VaultCreated(msg.sender, clone, recipient, msg.value);
    }

    // ─── View helpers ─────────────────────────────────────────────────

    function vaultCount() external view returns (uint256) { return allVaults.length; }
    function vaultsOf(address creator) external view returns (address[] memory) {
        return vaultsByCreator[creator];
    }

    // ─── EIP-1167 minimal proxy (Clone) ───────────────────────────────
    // Standard Sequence: 0x3d602d80600a3d3981f3 + impl + 0x5af43d82803e903d91602b57fd5bf3
    // Total runtime bytecode: 45 bytes. Deploys for ~32K gas.
    function _clone(address impl) private returns (address result) {
        bytes20 implBytes = bytes20(impl);
        assembly {
            let ptr := mload(0x40)
            mstore(ptr,        0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000)
            mstore(add(ptr, 0x14), implBytes)
            mstore(add(ptr, 0x28), 0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000)
            result := create(0, ptr, 0x37)
        }
        require(result != address(0), "clone failed");
    }
}
