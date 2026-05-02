// Local config for tools/audit-snapshot.js. Copy this file to
// `audit-config.local.js` (gitignored) and fill in your keys.
//
//   cp tools/audit-config.local.example.js tools/audit-config.local.js
//   # then edit tools/audit-config.local.js
//
// Anything you set here overrides the defaults baked into audit-snapshot.js.
// Anything you leave commented out keeps the default. The indexer requires
// audit-config.local.js silently — if the file doesn't exist, defaults apply.

module.exports = {
  // Per-chain RPC list. Primary first, fallbacks after. Failover walks the
  // list on HTTP 429 / 5xx / network error / NodeReal -32005 (rate limit).
  RPCS: {
     BSC: [
       'https://bsc-mainnet.nodereal.io/v1/b9617fca7de4465bb9271204837c7bdf',
       'https://bsc-rpc.publicnode.com',
     ],
     ETH: [
       'https://eth-mainnet.nodereal.io/v1/b9617fca7de4465bb9271204837c7bdf',
       'https://ethereum-rpc.publicnode.com',
     ],
     POL: [
       'https://polygon-mainnet.nodereal.io/v1/b9617fca7de4465bb9271204837c7bdf',
       'https://polygon-bor-rpc.publicnode.com',
     ],
    // GNO: [
    //   // No NodeReal endpoint provided yet; add one or it'll only do recent.
    //   'https://gnosis-rpc.publicnode.com',
    // ],
    // ARB: [
    //   'https://arbitrum-one-rpc.publicnode.com',
    // ],
  },

  // Per-host minimum interval in milliseconds. Set higher if you keep hitting
  // NodeReal -32005 errors (free tier is 2000 CU/min/IP; eth_getLogs is
  // ~75-100 CU, so 4000ms keeps us comfortably under).
  RPC_MIN_INTERVAL_MS_BY_HOST: {
    // 'bsc-mainnet.nodereal.io':     4000,
    // 'eth-mainnet.nodereal.io':     4000,
    // 'polygon-mainnet.nodereal.io': 4000,
  },

  // Hardcode token deploy blocks here to skip the slow log-walk autodetect.
  // Find on the relevant explorer: paste address, click "Contract Creation".
  TOKEN_DEPLOY_BLOCKS: {
    // ahwa:      16815001,
    // win:       0,
    // 'rkl-bsc': 0,
    // 'rkl-eth': 0,
    // 'rkl-pol': 0,
  },
};
