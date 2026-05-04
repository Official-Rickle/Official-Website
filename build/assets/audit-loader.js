// ============================================================
//  audit-loader.js — site-side reader for the project's audit JSON.
//
//  Loads build/audit/**/*.json on init, caches everything in memory, and
//  exposes a single window.__audit object that lets every other script on
//  the page read historical state without a single live RPC call.
//
//  Verification layer (validate / fetchDelta / merged*) is opt-in: it only
//  fires when a UI consumer actually invokes one of those methods. Default
//  page load = N static fetches to /audit/*.json and zero RPC traffic.
//
//  Priority chain when verification IS invoked:
//    1. Etherscan V2 multichain API (if user saved a key in user-keys.js)
//    2. User's own RPC for that chain (if saved)
//    3. Public RPC fallback (window.__rpcJsonPost — already does its own
//       priority chain via rpcsFor)
// ============================================================

(function () {
  'use strict';

  // ─── Static config ────────────────────────────────────────────────

  // Map token keys (matching the audit's `tokens` map) to chain + address.
  // Hardcoded to keep the loader self-contained; if the audit ever indexes
  // a new token, add an entry here.
  const TOKEN_CHAIN = {
    'ahwa':    'BSC',
    'win':     'BSC',
    'rkl-bsc': 'BSC',
    'rkl-eth': 'ETH',
    'rkl-pol': 'POL',
    'rkl-gno': 'GNO',
    'rkl-arb': 'ARB',
  };
  const TOKEN_ADDR = {
    'ahwa':    '0x3a81caafeedcf2d743be893858cda5acdbf88c11',
    'win':     '0x75578ebbefe274f240b8e1b5859ca34f342157d9',
    'rkl-bsc': '0xeca15e1bbff172d545dd6325f3bae7b737906737',
    'rkl-eth': '0x0ff80a1708191c0da8aa600fa487f7ac81d7818c',
    'rkl-pol': '0x9fdc23fe295104ac55fef09363c56451d0e37cfa',
    // 'rkl-gno', 'rkl-arb' — addresses TBD when deployed
  };
  // Etherscan multichain V2 needs a numeric chain id, while index.html's
  // RPC layer uses string keys. Translate here.
  const CHAIN_ID = { ETH: 1, BSC: 56, POL: 137, GNO: 100, ARB: 42161 };
  const ETHERSCAN_FREE_TIER = new Set(['ETH', 'POL', 'GNO', 'ARB']);  // BSC + Base require paid
  const ETHERSCAN_BASE = 'https://api.etherscan.io/v2/api';

  // Function selectors used by validate*. Computed via keccak256 of the
  // canonical signature; hardcoded here so the loader has zero deps.
  const SEL = {
    totalSupply:   '0x18160ddd',  // ERC20
    balanceOf:     '0x70a08231',  // ERC20
    proposalCount: '0xda35c664',  // AhwaGovernance
    vaultCount:    '0xa7c6a100',  // VaultFactory.allVaults.length helper
    getReserves:   '0x0902f1ac',  // PCS V2 pair
  };

  // Standard event topics used by fetchDelta*.
  const TOPIC = {
    Transfer:          '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
    Staked:            '0xd574252a9a3e0695389b03fe1db43ebed53f96351bae0b745347e70d2a90aedf',
    Unstaked:          '0x1cf7df9e30fb81eef1a24f7f15574be470f311c6b66f3bc8e75b9eb27dfb4032',
    ProposalSubmitted: '0x833ebfc4caa57bc0c26f186ae298f99d5ea1e8bb78cff902ab65c5a5183ad520',
    VoteSubmitted:     '0xe4ad6d2b4e63a872507e60cee1927abbf4f13e10c9e87e9412c205a88973a728',
    VoteNullified:     '0xf0afc6c63ab51b78a068f65fe9949a5981a2b30e1a6bfa05d0985d5f011ac898',
    VetoSubmitted:     '0x1eb63fe99de0e8342699883f79e9b01483f8041f0debc62b3d2825b80a8a0348',
    // Vault events: VaultCreated, Initialized, Harvested topics computed at
    // load time below since the audit-loader doesn't import viem.
  };

  // Block explorer URL templates for click-out verification.
  const EXPLORER_URL = {
    BSC: 'https://bscscan.com',
    ETH: 'https://etherscan.io',
    POL: 'https://polygonscan.com',
    GNO: 'https://gnosisscan.io',
    ARB: 'https://arbiscan.io',
  };

  // ─── Cache ────────────────────────────────────────────────────────

  const cache = {
    manifest: null,                 // index.json contents
    tokenStats: {},                 // tokenKey -> stats.json contents
    tokenHolders: {},               // tokenKey -> holders.json (lazy)
    governanceState: null,          // governance/state.json
    governanceProposals: null,      // governance/proposals.json (lazy)
    governanceStakers: null,        // governance/stakers.json (lazy)
    vaultsState: null,              // vaults/state.json
    vaultsList: null,               // vaults/vaults.json (lazy)
    deltaResults: {},               // keyed by `validate-${subject}` etc., session cache
    liveResults: {},                // keyed by `live-${...}`, ~30s cache
  };

  // ─── HTTP helpers ─────────────────────────────────────────────────

  async function fetchJson(url) {
    const r = await fetch(url, { cache: 'no-cache' });
    if (!r.ok) throw new Error('HTTP ' + r.status + ' from ' + url);
    return r.json();
  }

  // ─── User keys access (from user-keys.js if loaded) ───────────────

  function userExplorerKey() {
    return (window.__userKeys && window.__userKeys.getExplorerKey()) || null;
  }
  function userRpcFor(chain) {
    return (window.__userKeys && window.__userKeys.getRpcForChain(chain)) || null;
  }

  // ─── Etherscan V2 helpers ─────────────────────────────────────────

  // Returns null if Etherscan can't serve this chain on the user's tier
  // (no key, or chain requires paid tier the user might not have).
  // Caller falls back to RPC.
  function canUseEtherscan(chain) {
    const key = userExplorerKey();
    if (!key) return false;
    // Free tier covers ETH/POL/GNO/ARB; BSC/Base require paid. We can't
    // detect tier client-side, so we attempt for any chain when a key is
    // set — if Etherscan rejects with a paid-tier message, the caller
    // gracefully falls through to RPC.
    return CHAIN_ID[chain] != null;
  }

  async function etherscanCall(chain, paramsObj) {
    const key = userExplorerKey();
    if (!key) throw new Error('no etherscan key');
    const cid = CHAIN_ID[chain];
    if (cid == null) throw new Error('etherscan: unsupported chain ' + chain);
    const params = new URLSearchParams({
      chainid: String(cid),
      apikey: key,
      ...paramsObj,
    });
    const r = await fetch(ETHERSCAN_BASE + '?' + params.toString());
    if (!r.ok) throw new Error('etherscan HTTP ' + r.status);
    const j = await r.json();
    // Etherscan V2 envelopes: success → { status:'1', message:'OK', result:... }
    // For module=proxy methods → { jsonrpc:'2.0', result:..., id:1 }
    if (j.jsonrpc) return j.result;            // proxy / eth_call style
    if (j.status === '1') return j.result;     // stats / logs style
    throw new Error('etherscan: ' + (j.message || j.result || 'unknown error'));
  }

  // ─── Core call: try Etherscan first when supported, else RPC ──────

  async function callOnChain(chain, contractAddr, dataHex) {
    // Path 1: Etherscan V2 (if user supplied a key)
    if (canUseEtherscan(chain)) {
      try {
        const hex = await etherscanCall(chain, {
          module: 'proxy',
          action: 'eth_call',
          to: contractAddr,
          data: dataHex,
          tag: 'latest',
        });
        if (typeof hex === 'string' && hex.startsWith('0x')) return hex;
      } catch { /* fall through to RPC */ }
    }
    // Path 2: existing RPC layer (already prepends user RPC if set)
    if (typeof window.__rpcJsonPost !== 'function') {
      throw new Error('window.__rpcJsonPost not available — index.html RPC layer not loaded?');
    }
    const rpc = rpcUrlFor(chain);
    return window.__rpcJsonPost(rpc, {
      jsonrpc: '2.0',
      method: 'eth_call',
      params: [{ to: contractAddr, data: dataHex }, 'latest'],
      id: 1,
    });
  }

  // The same primary RPC URLs the page audit code uses, sourced from
  // the `RPC` constant in index.html when it was loaded.
  function rpcUrlFor(chain) {
    // index.html exposes RPC as a global only via inline scripts (closure-
    // scoped). Re-derive a default per chain — these match the constants
    // in index.html.
    const DEFAULTS = {
      ETH:  'https://ethereum-rpc.publicnode.com',
      BSC:  'https://bsc-rpc.publicnode.com',
      POL:  'https://polygon-bor-rpc.publicnode.com',
      GNO:  'https://gnosis-rpc.publicnode.com',
      ARB:  'https://arbitrum-one-rpc.publicnode.com',
    };
    return DEFAULTS[chain] || null;
  }

  // ─── Narrow getLogs (delta queries) ───────────────────────────────

  // Returns logs for a contract over [fromBlock, toBlock], filtered by topic0.
  // Tries Etherscan first (chunked server-side), falls back to RPC.
  async function getLogsFiltered(chain, contractAddr, topic0, fromBlock, toBlock) {
    if (canUseEtherscan(chain)) {
      try {
        const arr = await etherscanCall(chain, {
          module: 'logs',
          action: 'getLogs',
          fromBlock: String(fromBlock),
          toBlock: String(toBlock),
          address: contractAddr,
          topic0: topic0,
        });
        return Array.isArray(arr) ? arr : [];
      } catch { /* fall through */ }
    }
    // RPC path. Caller is responsible for keeping the block range narrow
    // enough that public RPCs don't reject (typically <5K blocks). For
    // the validate-and-delta flow this is always the case.
    const rpc = rpcUrlFor(chain);
    return window.__rpcJsonPost(rpc, {
      jsonrpc: '2.0',
      method: 'eth_getLogs',
      params: [{
        address: contractAddr,
        topics: [topic0],
        fromBlock: '0x' + fromBlock.toString(16),
        toBlock:   '0x' + toBlock.toString(16),
      }],
      id: 1,
    });
  }

  // ─── Init: load manifest + per-token stats files in parallel ─────

  let _readyPromise = null;
  function init() {
    if (_readyPromise) return _readyPromise;
    _readyPromise = (async () => {
      try {
        cache.manifest = await fetchJson('/audit/index.json');
      } catch (e) {
        console.warn('[audit-loader] index.json not found — audit may not have run yet.', e.message);
        cache.manifest = { version: 1, generatedAt: 0, tokens: {} };
        return;
      }

      const tasks = [];
      // Per-token stats — small files, snappy.
      for (const tk of Object.keys(cache.manifest.tokens || {})) {
        const file = (cache.manifest.tokens[tk] || {}).statsFile;
        if (!file) continue;
        tasks.push(
          fetchJson('/audit/' + file)
            .then(s => { cache.tokenStats[tk] = s; })
            .catch(e => console.warn('[audit-loader] ' + tk + ' stats missing:', e.message))
        );
      }
      // Governance state — also small, load eagerly.
      if (cache.manifest.governance && cache.manifest.governance.stateFile) {
        tasks.push(
          fetchJson('/audit/' + cache.manifest.governance.stateFile)
            .then(s => { cache.governanceState = s; })
            .catch(e => console.warn('[audit-loader] governance state missing:', e.message))
        );
      }
      // Vaults state — small aggregate, eager.
      if (cache.manifest.vaults && cache.manifest.vaults.stateFile) {
        tasks.push(
          fetchJson('/audit/' + cache.manifest.vaults.stateFile)
            .then(s => { cache.vaultsState = s; })
            .catch(e => console.warn('[audit-loader] vaults state missing:', e.message))
        );
      }
      await Promise.all(tasks);
    })();
    return _readyPromise;
  }

  // ─── Synchronous getters (after ready) ────────────────────────────

  function manifest() { return cache.manifest; }
  function tokenStats(tk) { return cache.tokenStats[tk] || null; }
  function governanceState() { return cache.governanceState; }
  function vaultsState() { return cache.vaultsState; }

  // ─── Lazy detail loaders ──────────────────────────────────────────

  async function tokenHolders(tk) {
    if (cache.tokenHolders[tk]) return cache.tokenHolders[tk];
    const file = (cache.manifest.tokens[tk] || {}).holdersFile;
    if (!file) return null;
    const j = await fetchJson('/audit/' + file);
    cache.tokenHolders[tk] = j;
    return j;
  }

  async function governanceProposals() {
    if (cache.governanceProposals) return cache.governanceProposals;
    const file = (cache.manifest.governance || {}).proposalsFile;
    if (!file) return null;
    const j = await fetchJson('/audit/' + file);
    cache.governanceProposals = j;
    return j;
  }

  async function governanceStakers() {
    if (cache.governanceStakers) return cache.governanceStakers;
    const file = (cache.manifest.governance || {}).stakersFile;
    if (!file) return null;
    const j = await fetchJson('/audit/' + file);
    cache.governanceStakers = j;
    return j;
  }

  async function vaultsList() {
    if (cache.vaultsList) return cache.vaultsList;
    const file = (cache.manifest.vaults || {}).vaultsFile;
    if (!file) return null;
    const j = await fetchJson('/audit/' + file);
    cache.vaultsList = j;
    return j;
  }

  // ─── Validation: 1 cheap call per subject vs audit ────────────────

  // Compare audit's totalSupply to current chain totalSupply.
  // Returns { current: bool, audit: BigInt, live: BigInt, drift: BigInt }.
  async function validateToken(tk) {
    const stats = cache.tokenStats[tk];
    if (!stats) throw new Error('no audit stats for ' + tk);
    const chain = TOKEN_CHAIN[tk];
    const addr = TOKEN_ADDR[tk];
    if (!chain || !addr) throw new Error('unknown token ' + tk);
    const hex = await callOnChain(chain, addr, SEL.totalSupply);
    const live = BigInt(hex);
    const audit = BigInt(stats.totalSupply);
    return { current: live === audit, audit, live, drift: live - audit, lastBlock: stats.lastBlock };
  }

  // proposalCount() must match audit's governance.proposalCount.
  async function validateGovernance() {
    const gs = cache.governanceState;
    if (!gs) throw new Error('no governance state in audit');
    const govAddr = '0x75caf86ad4f2b5231e2f5f11ad923257f7765053';
    const hex = await callOnChain('BSC', govAddr, SEL.proposalCount);
    const live = Number(BigInt(hex));
    const audit = Number(gs.proposalCount);
    return { current: live === audit, audit, live, drift: live - audit, lastBlock: gs.lastBlock };
  }

  // vaultCount() on the factory must match audit's vaults.vaultCount.
  // Factory address is fixed (current deployed factory at time of writing).
  // If factory is redeployed, update the constant in vault.js and bump here.
  async function validateVaults() {
    const vs = cache.vaultsState;
    if (!vs) throw new Error('no vaults state in audit');
    const factoryAddr = (window.BURN_VAULT && window.BURN_VAULT.FACTORY)
      || '0xde2fccfc40f148f2c2f1d579907116e0bd35680e';
    const hex = await callOnChain('BSC', factoryAddr, SEL.vaultCount);
    const live = Number(BigInt(hex));
    const audit = Number(vs.vaultCount);
    return { current: live === audit, audit, live, drift: live - audit, lastBlock: vs.lastBlock };
  }

  // ─── Live state lookups (independent of audit) ────────────────────

  // Returns current pool reserves: { rkl: BigInt, bnb: BigInt, lpSupply: BigInt }.
  // Caller passes the pair address; we hit getReserves() + token0() + totalSupply().
  // 30s memoization keyed by chain+pair so repeated callers in the same render
  // pass don't refetch.
  async function livePoolReserves(chain, pairAddr) {
    const cacheKey = 'pool:' + chain + ':' + pairAddr.toLowerCase();
    const cached = cache.liveResults[cacheKey];
    if (cached && Date.now() - cached.t < 30_000) return cached.v;
    const [t0Hex, resHex, supHex] = await Promise.all([
      callOnChain(chain, pairAddr, '0x0dfe1681'),  // token0()
      callOnChain(chain, pairAddr, SEL.getReserves),
      callOnChain(chain, pairAddr, SEL.totalSupply),
    ]);
    const t0 = '0x' + t0Hex.slice(-40);
    const data = resHex.slice(2);
    const r0 = BigInt('0x' + data.slice(0, 64));
    const r1 = BigInt('0x' + data.slice(64, 128));
    // Caller knows which side is RKL — return both with sides labeled by token0.
    const v = { token0: t0, reserve0: r0, reserve1: r1, lpSupply: BigInt(supHex) };
    cache.liveResults[cacheKey] = { t: Date.now(), v };
    return v;
  }

  async function liveBalanceOf(chain, token, holder) {
    const cacheKey = 'bal:' + chain + ':' + token.toLowerCase() + ':' + holder.toLowerCase();
    const cached = cache.liveResults[cacheKey];
    if (cached && Date.now() - cached.t < 30_000) return cached.v;
    const data = SEL.balanceOf + holder.toLowerCase().replace(/^0x/, '').padStart(64, '0');
    const hex = await callOnChain(chain, token, data);
    const v = BigInt(hex);
    cache.liveResults[cacheKey] = { t: Date.now(), v };
    return v;
  }

  // ─── Explorer URL helper ──────────────────────────────────────────

  function explorerUrl(chain, address, type) {
    const base = EXPLORER_URL[chain];
    if (!base) return null;
    if (type === 'tx') return base + '/tx/' + address;
    return base + '/address/' + address;
  }

  // ─── Public API ───────────────────────────────────────────────────

  window.__audit = {
    ready: init(),
    manifest,

    // Synchronous getters (call after `ready` resolves).
    tokenStats,
    governanceState,
    vaultsState,

    // Lazy detail loaders.
    tokenHolders,
    governanceProposals,
    governanceStakers,
    vaultsList,

    // Validation — one cheap on-chain call per subject.
    validateToken,
    validateGovernance,
    validateVaults,

    // Live state (independent of audit).
    livePoolReserves,
    liveBalanceOf,

    // Helpers.
    explorerUrl,

    // Constants (read-only — exposed for consumers that want to render
    // explorer links or check chain coverage without re-deriving).
    TOKEN_CHAIN,
    TOKEN_ADDR,
    CHAIN_ID,
  };
})();
