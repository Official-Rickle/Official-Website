require("@nomicfoundation/hardhat-verify");

/**
 * Minimal Hardhat config — used only for compiling and verifying
 * AhwaGovernance on BSCscan after on-page deploy. No accounts are
 * configured; deployment happens from rickletoken.com via the
 * connected wallet, never via Hardhat.
 *
 * Verify after deploy with:
 *   BSCSCAN_API_KEY=xxx npx hardhat verify --network bsc 0xDEPLOYED
 *   (PowerShell: $env:BSCSCAN_API_KEY="xxx"; npx hardhat verify --network bsc 0xDEPLOYED)
 *
 * Compiler settings here MUST match the bytecode embedded in build/index.html
 * for verification to succeed. Any change here requires re-embedding the
 * compiled bytecode + ABI in the page.
 */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: "paris",
    },
  },
  // Single source of truth — the site serves AhwaGovernance.sol from
  // /assets/, and hardhat compiles from the same file. No duplicates.
  paths: {
    sources: "build/assets",
  },
  networks: {
    bsc: {
      url: "https://bsc-dataseed1.binance.org",
      chainId: 56,
    },
  },
  etherscan: {
    apiKey: {
      bsc: process.env.BSCSCAN_API_KEY || "",
    },
  },
};
