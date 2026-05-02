#!/usr/bin/env node
// ============================================================================
// Chain-audit indexer for Rickle / Winston / AHWA on BSC.
//
// Walks every Transfer event for AHWA, WIN, and RKL-BSC plus every governance
// event (Staked, Unstaked, ProposalSubmitted, VoteSubmitted, VoteNullified,
// VetoSubmitted) since each contract's deploy block. Writes time-partitioned
// JSON files under build/audit/<token>/<YYYY>/<MM>.json (or .json.gz once a
// month has rolled past), plus index.json and summary.json at the root.
//
// Resume-friendly: state is persisted to index.json after every chunk. If the
// process is killed mid-run, restarting picks up from the last indexed block
// per token.
//
// Designed to be paced and patient — RPC calls are rate-limited, multi-node
// failover handles 429/5xx, chunk sizes auto-shrink on "too many results".
// A full first-pass backfill is expected to take hours-to-days on free public
// RPCs. Subsequent quarterly runs only scan the delta since last run.
//
// Usage:
//   node tools/audit-snapshot.js                       # incremental
//   node tools/audit-snapshot.js --reset               # full rescan from deploy
//   node tools/audit-snapshot.js --tokens=ahwa,win     # scope subset
//   node tools/audit-snapshot.js --max=BLOCK           # stop at block N (testing)
// ============================================================================

const fs   = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

// Load tools/audit-config.local.js if present. Lets the user override RPC
// URLs (with their own keys), per-host throttle intervals, and token deploy
// blocks without editing this file. The local config is gitignored — see
// tools/audit-config.local.example.js for the template.
let LOCAL_CONFIG = {};
try { LOCAL_CONFIG = require('./audit-config.local.js'); }
catch (e) {
  if (e.code !== 'MODULE_NOT_FOUND') throw e;   // surface real syntax errors
}

// ─── Constants ──────────────────────────────────────────────────────────────

const ROOT = path.resolve(__dirname, '..');
const OUT  = path.join(ROOT, 'build', 'audit');

// Token registry. Hardcoded deploy blocks bypass the slow log-walk autodetect
// (which works but is one-time-expensive on free public RPCs). Find the deploy
// block on the relevant explorer: paste the contract address, click "Contract
// Creation" under "More Info", copy the block number.
// Order matters: scans run sequentially and we want the LIGHTER chains first.
// ETH and POL each have a single low-volume RKL contract; their backfills
// finish in tens of minutes. BSC is the heavy lift — three tokens (AHWA, WIN,
// RKL_BSC), much more historical activity, hours of scanning. Putting BSC
// last means the lighter chains complete and produce visible audit data
// quickly, while BSC keeps churning in the background. If BSC fails midway,
// you still have 4 chains' worth of fresh data committed.
const TOKENS = {
  'rkl-eth': { address: '0x0fF80a1708191C0Da8Aa600Fa487f7aC81D7818c', chainKey: 'ETH', decimals: 18, deployBlock: null /* TODO */ },
  'rkl-pol': { address: '0x9fdc23fe295104ac55fef09363c56451d0e37cfa', chainKey: 'POL', decimals: 18, deployBlock: null /* TODO */ },
  ahwa:      { address: '0x3A81caafeeDCF2D743Be893858cDa5AcDBF88c11', chainKey: 'BSC', decimals: 18, deployBlock: 16815001 },
  win:       { address: '0x75578ebBefe274F240B8E1b5859cA34f342157D9', chainKey: 'BSC', decimals: 18, deployBlock: null /* TODO */ },
  'rkl-bsc': { address: '0xeCa15e1BbFF172D545Dd6325F3Bae7b737906737', chainKey: 'BSC', decimals: 18, deployBlock: null /* TODO */ },
};
// Override deploy blocks from local config (so users can paste blocks without
// touching this file).
if (LOCAL_CONFIG.TOKEN_DEPLOY_BLOCKS) {
  for (const tk of Object.keys(LOCAL_CONFIG.TOKEN_DEPLOY_BLOCKS)) {
    if (TOKENS[tk] && LOCAL_CONFIG.TOKEN_DEPLOY_BLOCKS[tk]) {
      TOKENS[tk].deployBlock = LOCAL_CONFIG.TOKEN_DEPLOY_BLOCKS[tk];
    }
  }
}

// Governance contract is addressed separately (different events, single
// address rather than a bundle). Its deploy block is known + hardcoded.
const GOVERNANCE = {
  address: '0x75caf86ad4f2b5231e2f5f11ad923257f7765053',
  chainKey: 'BSC',
  deployBlock: 95780094,
};

// Per-chain RPC URLs (primary + fallbacks). Mirrors the failover list in
// build/index.html so the page and indexer have consistent provider coverage.
// Primary per chain is NodeReal (archive-capable; user's free-tier endpoints,
// designated public). Public-pruned-history fallbacks below are only useful
// for live chain-head queries — they'll fail on archive log queries against
// years-old blocks. The retry/failover layer handles that gracefully:
// NodeReal handles the historical scan; fallbacks step in only if NodeReal
// hiccups on a recent query.
//
// Note: NodeReal's 2000 CU/min limit is per-IP and shared across ALL chains.
// Since indexToken runs sequentially in main(), only one NodeReal endpoint
// is hit at a time and per-host throttling (4s/call) keeps us well under cap.
const RPCS = {
  BSC: [
    'https://bsc-mainnet.nodereal.io/v1/64a9df0874fb4a93b9d0a3849de012d3',
    'https://bsc-rpc.publicnode.com',
    'https://bsc-dataseed.binance.org',
    'https://bsc-dataseed1.defibit.io',
    'https://bsc.drpc.org',
    'https://bsc.blockpi.network/v1/rpc/public',
  ],
  ETH: [
    'https://eth-mainnet.nodereal.io/v1/1659dfb40aa24bbb8153a677b98064d7',
    'https://ethereum-rpc.publicnode.com',
    'https://eth.llamarpc.com',
    'https://eth.drpc.org',
  ],
  POL: [
    'https://polygon-mainnet.nodereal.io/v1/f510fc4d083b49d1ab383d25246cc7de',
    'https://polygon-bor-rpc.publicnode.com',
    'https://polygon-rpc.com',
    'https://polygon.drpc.org',
  ],
};
// Apply local-config overrides if present. A chain listed in LOCAL_CONFIG.RPCS
// completely replaces the default list for that chain.
if (LOCAL_CONFIG.RPCS) {
  for (const ck of Object.keys(LOCAL_CONFIG.RPCS)) {
    if (LOCAL_CONFIG.RPCS[ck] && LOCAL_CONFIG.RPCS[ck].length) {
      RPCS[ck] = LOCAL_CONFIG.RPCS[ck];
    }
  }
}

// Standard ERC-20 Transfer event topic.
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

// Governance event topics (hardcoded, computed from contract event signatures).
const GOV_TOPICS = {
  Staked:            '0xd574252a9a3e0695389b03fe1db43ebed53f96351bae0b745347e70d2a90aedf',
  Unstaked:          '0x1cf7df9e30fb81eef1a24f7f15574be470f311c6b66f3bc8e75b9eb27dfb4032',
  ProposalSubmitted: '0x833ebfc4caa57bc0c26f186ae298f99d5ea1e8bb78cff902ab65c5a5183ad520',
  VoteSubmitted:     '0xe4ad6d2b4e63a872507e60cee1927abbf4f13e10c9e87e9412c205a88973a728',
  VoteNullified:     '0xf0afc6c63ab51b78a068f65fe9949a5981a2b30e1a6bfa05d0985d5f011ac898',
  VetoSubmitted:     '0x1eb63fe99de0e8342699883f79e9b01483f8041f0debc62b3d2825b80a8a0348',
};

// Reorg buffer: stay this far behind chain head so we never index a tx that
// gets rolled back. BSC finality is ~150 blocks (~2 minutes at 0.75s/block).
const REORG_BUFFER = 150;

// Default chunk size for eth_getLogs. Auto-shrinks on "too many results"
// errors and never permanently grows back (a small chunk that succeeded once
// stays small for the rest of the scan — RKL-heavy chunks won't suddenly fit).
let chunkSize = 5000;
const MIN_CHUNK = 100;

// Throttle: minimum interval between requests, per host. NodeReal free tier
// is 2000 CU/min/IP — eth_getLogs costs ~75-100 CU, so 4s between calls keeps
// us at ~15 calls/min ≈ 1500 CU/min with comfortable margin. Other public
// fallbacks tolerate 1 req/s easily.
const RPC_MIN_INTERVAL_MS_DEFAULT = 1000;
const RPC_MIN_INTERVAL_MS_BY_HOST = Object.assign({
  'bsc-mainnet.nodereal.io':     4000,
  'eth-mainnet.nodereal.io':     4000,
  'polygon-mainnet.nodereal.io': 4000,
}, LOCAL_CONFIG.RPC_MIN_INTERVAL_MS_BY_HOST || {});
function intervalFor(host) {
  return RPC_MIN_INTERVAL_MS_BY_HOST[host] != null
    ? RPC_MIN_INTERVAL_MS_BY_HOST[host]
    : RPC_MIN_INTERVAL_MS_DEFAULT;
}
const RPC_MAX_CONCURRENT = 2;

// How often to flush index.json during a long scan. Every chunk is overkill
// for tiny chunks; every minute caps wear on the disk while keeping the resume
// horizon short.
const FLUSH_INTERVAL_MS = 30000;

// ─── CLI args ───────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const RESET    = args.includes('--reset');
const TOKEN_SCOPE = (args.find(a => a.startsWith('--tokens=')) || '').slice(9).split(',').filter(Boolean);
const MAX_BLOCK   = parseInt((args.find(a => a.startsWith('--max=')) || '').slice(6), 10) || null;

// ─── Per-host throttle + multi-RPC failover ────────────────────────────────

const _throttles = new Map();
function _slot(url) {
  const host = new URL(url).host;
  let s = _throttles.get(host);
  if (!s) { s = { active: 0, queue: [], lastStart: 0 }; _throttles.set(host, s); }
  return s;
}
async function rpcThrottled(url, fn) {
  const host = new URL(url).host;
  const interval = intervalFor(host);
  const t = _slot(url);
  if (t.active >= RPC_MAX_CONCURRENT) await new Promise(r => t.queue.push(r));
  const wait = Math.max(0, t.lastStart + interval - Date.now());
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  t.lastStart = Date.now();
  t.active++;
  try { return await fn(); }
  finally {
    t.active--;
    const next = t.queue.shift();
    if (next) next();
  }
}

// One full pass through the failover list. Logs every per-URL failure.
// Returns the first successful result, or throws an aggregate error after
// every provider rejects.
async function rpcJsonPostOnce(chainKey, body) {
  const urls = RPCS[chainKey];
  const errs = [];
  for (const url of urls) {
    try {
      return await rpcThrottled(url, async () => {
        const r = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (r.status === 429 || r.status >= 500) throw new Error('http ' + r.status);
        const j = await r.json();
        if (j.error) {
          // NodeReal returns -32005 when the per-IP CU budget is exhausted.
          // Surface as a transient error so the retry-backoff loop applies.
          // Other JSON-RPC errors (-32600 invalid request, etc.) propagate
          // normally; the failover walks to the next provider.
          const code = j.error.code;
          const msg = j.error.message || JSON.stringify(j.error);
          if (code === -32005) throw new Error('rate limit (-32005): ' + msg);
          throw new Error(msg);
        }
        return j.result;
      });
    } catch (e) {
      errs.push(new URL(url).host + ' (' + e.message.slice(0, 60) + ')');
    }
  }
  throw new Error('all providers failed: ' + errs.join('; '));
}

// Retry the whole failover round on outage. Backoff caps at ~3.5 min of
// total wait — beyond that the run aborts and resumes on next invocation
// (state is persisted to index.json every 30s, so we lose at most a minute
// of work). Designed for multi-day runs where individual provider outages
// shouldn't kill the whole job.
const RETRY_DELAYS_SEC = [30, 60, 120];
async function rpcJsonPost(chainKey, body) {
  let attempt = 0;
  while (true) {
    try {
      return await rpcJsonPostOnce(chainKey, body);
    } catch (e) {
      if (attempt >= RETRY_DELAYS_SEC.length) throw e;
      const wait = RETRY_DELAYS_SEC[attempt];
      log('  rpc round ' + (attempt + 1) + '/' + RETRY_DELAYS_SEC.length + ' failed: ' + e.message);
      log('  sleeping ' + wait + 's then retrying…');
      await new Promise(r => setTimeout(r, wait * 1000));
      attempt++;
    }
  }
}

async function ethCall(chainKey, method, params) {
  return rpcJsonPost(chainKey, { jsonrpc: '2.0', method, params, id: 1 });
}

// ─── Block helpers ─────────────────────────────────────────────────────────

async function currentBlock(chainKey) {
  const hex = await ethCall(chainKey, 'eth_blockNumber', []);
  return parseInt(hex, 16);
}
async function getBlock(chainKey, blockNum) {
  return ethCall(chainKey, 'eth_getBlockByNumber', ['0x' + blockNum.toString(16), false]);
}
async function getCode(chainKey, addr, blockNum) {
  return ethCall(chainKey, 'eth_getCode', [addr, '0x' + blockNum.toString(16)]);
}

// Find the first block where the token has any Transfer activity. Walks
// BACKWARDS from chain head to genesis via eth_getLogs (supported on all
// public RPCs, no archive state required).
//
// Why all the way to genesis: a dormant token can have a multi-year gap of
// zero transfers between its deploy and any recent activity. Bailing at the
// first empty chunk after finding logs would return a "first recent activity"
// block, not the actual deploy. So we walk the entire chain, accumulate every
// log seen, and return the lowest block.
//
// Slow but reliable. For BSC at ~95M blocks / 50K chunks, expect ~1900 RPC
// calls at 1 req/sec ≈ 30 minutes per dormant token. For active tokens, the
// global chunk-size auto-shrink may pull this down to 5K chunks, which means
// ~5 hours. One-time cost; cached in index.json. Hardcode deployBlock in
// TOKENS to skip detection entirely.
async function findDeployBlock(chainKey, address, latestBlock) {
  const addressLc = address.toLowerCase();
  let chunk = 50000;          // start large; auto-shrinks if RPC rejects
  let to = latestBlock;
  let earliest = null;
  let scanned = 0;
  let lastLog = Date.now();
  while (to > 0) {
    const from = Math.max(0, to - chunk + 1);
    let logs;
    try {
      logs = await getLogs(chainKey, {
        address: addressLc,
        topics: [TRANSFER_TOPIC],
        fromBlock: '0x' + from.toString(16),
        toBlock:   '0x' + to.toString(16),
      });
    } catch (e) {
      if (chunk > MIN_CHUNK && /range|limit|exceed|too many|response size/i.test(e.message)) {
        chunk = Math.max(MIN_CHUNK, Math.floor(chunk / 2));
        continue;
      }
      throw e;
    }
    if (logs.length > 0) {
      let lowest = parseInt(logs[0].blockNumber, 16);
      for (const lg of logs) {
        const b = parseInt(lg.blockNumber, 16);
        if (b < lowest) lowest = b;
      }
      if (earliest == null || lowest < earliest) earliest = lowest;
    }
    scanned += (to - from + 1);
    if (Date.now() - lastLog > 15000) {
      log('    deploy-detect: scanned ' + scanned + ' blocks back, earliest log so far: ' + (earliest || 'none'));
      lastLog = Date.now();
    }
    if (from === 0) break;
    to = from - 1;
  }
  if (earliest == null) {
    throw new Error('no Transfer events found for ' + address + '; verify the address is correct');
  }
  return earliest;
}

// ─── Log scanning ──────────────────────────────────────────────────────────

async function getLogs(chainKey, params) {
  return ethCall(chainKey, 'eth_getLogs', [params]);
}

// Walks fromBlock..toBlock in chunks, calling `onChunk(logs, chunkFromBlock,
// chunkToBlock)` after each successful chunk. Auto-shrinks chunkSize on
// "too many results" errors.
async function scanRange(chainKey, baseParams, fromBlock, toBlock, onChunk) {
  let from = fromBlock;
  while (from <= toBlock) {
    const to = Math.min(from + chunkSize - 1, toBlock);
    let logs;
    try {
      logs = await getLogs(chainKey, {
        ...baseParams,
        fromBlock: '0x' + from.toString(16),
        toBlock:   '0x' + to.toString(16),
      });
    } catch (e) {
      if (chunkSize > MIN_CHUNK && /range|limit|exceed|too many|response size/i.test(e.message)) {
        const oldSize = chunkSize;
        chunkSize = Math.max(MIN_CHUNK, Math.floor(chunkSize / 2));
        log(`  chunk shrink ${oldSize} → ${chunkSize} (${e.message.slice(0, 80)})`);
        continue;
      }
      throw e;
    }
    await onChunk(logs, from, to);
    from = to + 1;
  }
}

// ─── Calendar partitioning ─────────────────────────────────────────────────

// Returns { y, m } from a unix timestamp (seconds).
function ymOf(unixSec) {
  const d = new Date(unixSec * 1000);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1 };
}
function ymKey(y, m) { return y + '-' + String(m).padStart(2, '0'); }

// Cache of block -> timestamp. Populated lazily as we encounter new blocks.
// Subsequent runs reload from index.json so we don't re-fetch boundaries.
let blockTimestamps = {};   // { blockNumber: unixSec }

async function timestampOfBlock(chainKey, blockNum) {
  if (blockTimestamps[blockNum] != null) return blockTimestamps[blockNum];
  const blk = await getBlock(chainKey, blockNum);
  if (!blk || !blk.timestamp) throw new Error('block ' + blockNum + ' has no timestamp');
  const ts = parseInt(blk.timestamp, 16);
  blockTimestamps[blockNum] = ts;
  return ts;
}

// ─── Period files ──────────────────────────────────────────────────────────

const periodBuf = {};  // { tokenKey: { 'YYYY-MM': { txs: [], events: [] } } }
function bufFor(tokenKey, ym) {
  if (!periodBuf[tokenKey]) periodBuf[tokenKey] = {};
  if (!periodBuf[tokenKey][ym]) periodBuf[tokenKey][ym] = { txs: [], events: [] };
  return periodBuf[tokenKey][ym];
}

function periodFilePath(tokenKey, y, m) {
  return path.join(OUT, tokenKey, String(y), String(m).padStart(2, '0') + '.json');
}

// Load existing current-month data (if any) so we resume cleanly without
// dropping previously-indexed transfers.
function loadPeriod(tokenKey, y, m) {
  const p = periodFilePath(tokenKey, y, m);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writePeriod(tokenKey, y, m, data) {
  const p = periodFilePath(tokenKey, y, m);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 0));
}

// Compress a finalized period (one that has rolled past — no more writes
// can happen to it since we only ever scan forward). Adds an 8-char content
// hash so the CDN can cache it forever without invalidation concerns.
function gzipPeriod(tokenKey, y, m) {
  const plain = periodFilePath(tokenKey, y, m);
  if (!fs.existsSync(plain)) return null;
  const raw = fs.readFileSync(plain);
  const gz  = zlib.gzipSync(raw, { level: 9 });
  const sha = crypto.createHash('sha256').update(gz).digest('hex').slice(0, 8);
  const finalName = String(m).padStart(2, '0') + '.' + sha + '.json.gz';
  const finalPath = path.join(path.dirname(plain), finalName);
  fs.writeFileSync(finalPath, gz);
  fs.unlinkSync(plain);
  return finalName;
}

// ─── Index + summary ───────────────────────────────────────────────────────

const INDEX_PATH = path.join(OUT, 'index.json');
let index = {
  version: 1,
  generatedAt: 0,
  // Labels are keyed by LOWERCASE addresses since RPC log responses
  // (log.address, topics[1], topics[2]) come back lowercase. Display layer
  // can re-checksum to EIP-55 form for human-readable output.
  labels: {
    '0x000000000000000000000000000000000000dead': 'BURN',
    '0x40e4da770530e960ae671634d14625f29e3ddb12': 'TRUST',
    '0x75578ebbefe274f240b8e1b5859ca34f342157d9': 'WINSTON',
    '0x75caf86ad4f2b5231e2f5f11ad923257f7765053': 'AHWA_GOV',
    '0x3a81caafeedcf2d743be893858cda5acdbf88c11': 'AHWA_TOKEN',
    '0xeca15e1bbff172d545dd6325f3bae7b737906737': 'RKL_BSC',
  },
  tokens: {},      // tokenKey -> { address, chainId, decimals, deployBlock, lastIndexedBlock, periods: [...] }
  governance: { lastIndexedBlock: 0, deployBlock: 0, periods: [] },
  blockTimestampCache: {},
};

function loadIndex() {
  if (!fs.existsSync(INDEX_PATH)) return;
  try {
    const j = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
    Object.assign(index, j);
    blockTimestamps = index.blockTimestampCache || {};
  } catch (e) {
    log('warning: failed to parse existing index.json (' + e.message + '); starting fresh');
  }
}

function saveIndex() {
  index.generatedAt = Math.floor(Date.now() / 1000);
  index.blockTimestampCache = blockTimestamps;
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2));
}

// ─── Logging ───────────────────────────────────────────────────────────────

const startTime = Date.now();
function log(msg) {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
  console.log('[' + elapsed.padStart(5) + 's] ' + msg);
}

// ─── Main scan logic ───────────────────────────────────────────────────────

async function indexToken(tokenKey, latestBlockSafe) {
  const tok = TOKENS[tokenKey];
  const chainKey = tok.chainKey;
  const tokenAddrLc = tok.address.toLowerCase();
  log('--- ' + tokenKey + ' (' + tok.address + ') ---');

  // Resolve deploy block (cached after first run).
  let deployBlock = (index.tokens[tokenKey] && index.tokens[tokenKey].deployBlock) || tok.deployBlock;
  if (!deployBlock) {
    log('  detecting deploy block (binary-search eth_getCode)…');
    deployBlock = await findDeployBlock(chainKey, tok.address, latestBlockSafe);
    log('  deploy block: ' + deployBlock);
  }

  // Resume from lastIndexedBlock+1, or start fresh if --reset.
  const prev = index.tokens[tokenKey];
  let fromBlock = (RESET || !prev) ? deployBlock : (prev.lastIndexedBlock + 1);
  const toBlock = MAX_BLOCK ? Math.min(latestBlockSafe, MAX_BLOCK) : latestBlockSafe;

  if (fromBlock > toBlock) {
    log('  up to date (last indexed: ' + (prev && prev.lastIndexedBlock) + ', target: ' + toBlock + ')');
    return;
  }
  log('  scanning blocks ' + fromBlock + ' → ' + toBlock + ' (' + (toBlock - fromBlock + 1) + ' blocks)');

  // Pre-load any existing current-month buffer so we append rather than
  // overwrite. (Closed-month files are gzipped + named with a sha8; we never
  // re-touch them.)
  const startTs = await timestampOfBlock(chainKey, fromBlock);
  const startYM = ymOf(startTs);
  const existing = loadPeriod(tokenKey, startYM.y, startYM.m);
  if (existing && existing.txs) {
    bufFor(tokenKey, ymKey(startYM.y, startYM.m)).txs.push(...existing.txs);
  }

  let lastFlush = Date.now();

  await scanRange(chainKey,
    { address: tokenAddrLc, topics: [TRANSFER_TOPIC] },
    fromBlock, toBlock,
    async (logs, from, to) => {
      // Bucket each log by month based on its block timestamp.
      for (const lg of logs) {
        if ((lg.address || '').toLowerCase() !== tokenAddrLc) continue;
        const blkNum = parseInt(lg.blockNumber, 16);
        const ts = await timestampOfBlock(chainKey, blkNum);
        const { y, m } = ymOf(ts);
        const buf = bufFor(tokenKey, ymKey(y, m));
        buf.txs.push({
          h:  lg.transactionHash,
          f:  '0x' + lg.topics[1].slice(-40),
          t:  '0x' + lg.topics[2].slice(-40),
          a:  BigInt(lg.data || '0x0').toString(),
          b:  blkNum,
        });
      }
      // Persist whatever month-buckets we touched in this chunk.
      for (const ym of Object.keys(periodBuf[tokenKey] || {})) {
        const [yStr, mStr] = ym.split('-');
        const y = +yStr, m = +mStr;
        writePeriod(tokenKey, y, m, periodBuf[tokenKey][ym]);
      }
      // Update the per-token cursor in index.json.
      if (!index.tokens[tokenKey]) {
        index.tokens[tokenKey] = {
          address: tok.address,
          chainId: chainKey === 'BSC' ? 56 : 0,
          decimals: tok.decimals,
          deployBlock,
        };
      }
      index.tokens[tokenKey].lastIndexedBlock = to;
      // Throttled disk flush.
      if (Date.now() - lastFlush > FLUSH_INTERVAL_MS) {
        saveIndex();
        lastFlush = Date.now();
        log('  ' + (((to - fromBlock) / (toBlock - fromBlock)) * 100).toFixed(1) + '% — block ' + to + ' — ' + logs.length + ' logs in chunk');
      }
    });
  saveIndex();
  log('  ' + tokenKey + ': scan complete through block ' + toBlock);
}

async function indexGovernance(latestBlockSafe) {
  log('--- governance (' + GOVERNANCE.address + ') ---');
  const chainKey = GOVERNANCE.chainKey;
  const prev = index.governance;
  let fromBlock = (RESET || !prev.lastIndexedBlock) ? GOVERNANCE.deployBlock : (prev.lastIndexedBlock + 1);
  const toBlock = MAX_BLOCK ? Math.min(latestBlockSafe, MAX_BLOCK) : latestBlockSafe;
  if (fromBlock > toBlock) {
    log('  up to date (last indexed: ' + prev.lastIndexedBlock + ', target: ' + toBlock + ')');
    return;
  }
  log('  scanning blocks ' + fromBlock + ' → ' + toBlock + ' (' + (toBlock - fromBlock + 1) + ' blocks)');
  index.governance.deployBlock = GOVERNANCE.deployBlock;

  const topicSet = Object.values(GOV_TOPICS);
  let lastFlush = Date.now();

  // Pre-load the current month's existing events.
  const startTs = await timestampOfBlock(chainKey, fromBlock);
  const startYM = ymOf(startTs);
  const existing = loadPeriod('governance', startYM.y, startYM.m);
  if (existing && existing.events) {
    bufFor('governance', ymKey(startYM.y, startYM.m)).events.push(...existing.events);
  }

  await scanRange(chainKey,
    { address: GOVERNANCE.address.toLowerCase(), topics: [topicSet] },
    fromBlock, toBlock,
    async (logs, from, to) => {
      for (const lg of logs) {
        const blkNum = parseInt(lg.blockNumber, 16);
        const ts = await timestampOfBlock(chainKey, blkNum);
        const { y, m } = ymOf(ts);
        const buf = bufFor('governance', ymKey(y, m));
        buf.events.push(decodeGovEvent(lg, blkNum));
      }
      for (const ym of Object.keys(periodBuf.governance || {})) {
        const [yStr, mStr] = ym.split('-');
        writePeriod('governance', +yStr, +mStr, periodBuf.governance[ym]);
      }
      index.governance.lastIndexedBlock = to;
      if (Date.now() - lastFlush > FLUSH_INTERVAL_MS) {
        saveIndex();
        lastFlush = Date.now();
        log('  ' + (((to - fromBlock) / (toBlock - fromBlock)) * 100).toFixed(1) + '% — block ' + to + ' — ' + logs.length + ' logs in chunk');
      }
    });
  saveIndex();
  log('  governance: scan complete through block ' + toBlock);
}

// Decoder for governance events. Returns a small object with discriminator
// `ev` plus event-specific fields. Mirrors parseProposalLog/parseVetoLog
// shapes from build/assets/governance.js so the page consumer can reuse the
// same display logic.
function decodeGovEvent(lg, blkNum) {
  const top = lg.topics[0];
  const data = (lg.data || '0x').slice(2);
  const t1addr = lg.topics[1] ? '0x' + lg.topics[1].slice(-40) : null;
  const t2num  = lg.topics[2] ? BigInt(lg.topics[2]).toString() : null;
  const baseHash = lg.transactionHash;
  if (top === GOV_TOPICS.Staked) {
    return { ev: 'Staked', h: baseHash, voter: t1addr,
      amount:     BigInt('0x' + data.slice(0, 64)).toString(),
      newBalance: BigInt('0x' + data.slice(64, 128)).toString(),
      b: blkNum };
  }
  if (top === GOV_TOPICS.Unstaked) {
    return { ev: 'Unstaked', h: baseHash, voter: t1addr,
      amount:     BigInt('0x' + data.slice(0, 64)).toString(),
      newBalance: BigInt('0x' + data.slice(64, 128)).toString(),
      b: blkNum };
  }
  if (top === GOV_TOPICS.ProposalSubmitted) {
    return { ev: 'ProposalSubmitted', h: baseHash,
      id: Number(BigInt(lg.topics[1]).toString()),
      proposer: '0x' + lg.topics[2].slice(-40),
      title: decodeStringAtHead(data, 0),
      body:  decodeStringAtHead(data, 1),
      ts:    Number(BigInt('0x' + data.slice(64 * 2, 64 * 3)).toString()),
      b: blkNum };
  }
  if (top === GOV_TOPICS.VoteSubmitted) {
    return { ev: 'VoteSubmitted', h: baseHash, voter: t1addr,
      id: Number(t2num),
      yes:    BigInt('0x' + data.slice(0, 64)) !== 0n,
      weight: BigInt('0x' + data.slice(64, 128)).toString(),
      nonce:  BigInt('0x' + data.slice(128, 192)).toString(),
      ts:     Number(BigInt('0x' + data.slice(192, 256)).toString()),
      b: blkNum };
  }
  if (top === GOV_TOPICS.VoteNullified) {
    return { ev: 'VoteNullified', h: baseHash, voter: t1addr,
      id: Number(t2num),
      weight: BigInt('0x' + data.slice(0, 64)).toString(),
      b: blkNum };
  }
  if (top === GOV_TOPICS.VetoSubmitted) {
    return { ev: 'VetoSubmitted', h: baseHash, signer: t1addr,
      id: Number(t2num),
      ts: Number(BigInt('0x' + data.slice(0, 64)).toString()),
      b: blkNum };
  }
  return { ev: 'Unknown', h: baseHash, topic: top, data: lg.data, b: blkNum };
}

// Decode a dynamic string at a given head-word index from ABI-encoded event
// data. Word 0 = offset to title, word 1 = offset to body, etc.
function decodeStringAtHead(data, headWordIndex) {
  const off = parseInt(data.slice(headWordIndex * 64, (headWordIndex + 1) * 64), 16) * 2;
  const len = parseInt(data.slice(off, off + 64), 16);
  const hex = data.slice(off + 64, off + 64 + len * 2);
  return Buffer.from(hex, 'hex').toString('utf8');
}

// ─── Period rollover + summary ─────────────────────────────────────────────

// Compress every closed period (any month earlier than the latest indexed
// month for that token). Closed periods will never receive more transfers,
// so they're safe to gzip + content-hash and never re-touch.
function rolloverClosedPeriods() {
  const allTokens = Object.keys(TOKENS).concat(['governance']);
  for (const tk of allTokens) {
    const dir = path.join(OUT, tk);
    if (!fs.existsSync(dir)) continue;
    // Find the latest (year, month) we have for this token.
    let latestY = 0, latestM = 0;
    for (const yDir of fs.readdirSync(dir)) {
      if (!/^\d{4}$/.test(yDir)) continue;
      const y = +yDir;
      for (const f of fs.readdirSync(path.join(dir, yDir))) {
        const match = f.match(/^(\d{2})\.json$/);
        if (!match) continue;
        const m = +match[1];
        if (y > latestY || (y === latestY && m > latestM)) { latestY = y; latestM = m; }
      }
    }
    if (!latestY) continue;
    // Gzip everything older than the latest.
    for (const yDir of fs.readdirSync(dir)) {
      if (!/^\d{4}$/.test(yDir)) continue;
      const y = +yDir;
      for (const f of fs.readdirSync(path.join(dir, yDir))) {
        const match = f.match(/^(\d{2})\.json$/);
        if (!match) continue;
        const m = +match[1];
        if (y < latestY || (y === latestY && m < latestM)) {
          const finalName = gzipPeriod(tk, y, m);
          if (finalName) log('  closed: ' + tk + '/' + yDir + '/' + finalName);
        }
      }
    }
  }
}

// Walk the per-token output directories and compile the period list into
// index.json. Hashed names are read from disk; current-month plain names
// are picked up from periodBuf.
function refreshIndexPeriods() {
  for (const tk of Object.keys(TOKENS).concat(['governance'])) {
    const dir = path.join(OUT, tk);
    if (!fs.existsSync(dir)) continue;
    const periods = [];
    for (const yDir of fs.readdirSync(dir).sort()) {
      if (!/^\d{4}$/.test(yDir)) continue;
      const y = +yDir;
      for (const f of fs.readdirSync(path.join(dir, yDir)).sort()) {
        const closed = f.match(/^(\d{2})\.([0-9a-f]+)\.json\.gz$/);
        const open   = f.match(/^(\d{2})\.json$/);
        if (closed) {
          periods.push({ y, m: +closed[1], path: tk + '/' + yDir + '/' + f, sha: closed[2], closed: true });
        } else if (open) {
          periods.push({ y, m: +open[1], path: tk + '/' + yDir + '/' + f, current: true });
        }
      }
    }
    if (tk === 'governance') {
      index.governance.periods = periods;
    } else {
      if (!index.tokens[tk]) index.tokens[tk] = {};
      index.tokens[tk].periods = periods;
    }
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  log('audit-snapshot starting (reset=' + RESET + ', tokens=' + (TOKEN_SCOPE.length ? TOKEN_SCOPE.join(',') : 'all') + ', max=' + (MAX_BLOCK || 'latest-' + REORG_BUFFER) + ')');
  fs.mkdirSync(OUT, { recursive: true });

  if (RESET) {
    log('--reset specified: keeping addresses but clearing scan cursors');
    for (const tk of Object.keys(index.tokens)) index.tokens[tk].lastIndexedBlock = 0;
    index.governance.lastIndexedBlock = 0;
  } else {
    loadIndex();
  }

  // Per-chain head lookup. Block numbers are chain-specific, so each token
  // needs its own chain's latest block for the scan upper bound.
  const targetTokens = TOKEN_SCOPE.length
    ? TOKEN_SCOPE.filter(t => TOKENS[t])
    : Object.keys(TOKENS);
  const chainsNeeded = new Set(targetTokens.map(t => TOKENS[t].chainKey));
  if (!TOKEN_SCOPE.length || TOKEN_SCOPE.includes('governance')) {
    chainsNeeded.add(GOVERNANCE.chainKey);
  }
  const latestSafe = {};
  for (const ck of chainsNeeded) {
    const head = await currentBlock(ck);
    latestSafe[ck] = head - REORG_BUFFER;
    log('chain head ' + ck + ': ' + head + ' / safe target: ' + latestSafe[ck]);
  }

  // Token scans — sequential to keep the host throttle predictable. Resume
  // logic means if we crash partway through, the next run picks up.
  for (const tk of targetTokens) {
    try { await indexToken(tk, latestSafe[TOKENS[tk].chainKey]); }
    catch (e) {
      log('!!! ' + tk + ' failed: ' + e.message);
      saveIndex();
      throw e;
    }
  }

  if (!TOKEN_SCOPE.length || TOKEN_SCOPE.includes('governance')) {
    try { await indexGovernance(latestSafe[GOVERNANCE.chainKey]); }
    catch (e) {
      log('!!! governance failed: ' + e.message);
      saveIndex();
      throw e;
    }
  }

  // Roll over closed periods (gzip + hash). Updates index.periods.
  log('rolling over closed periods…');
  rolloverClosedPeriods();
  refreshIndexPeriods();
  saveIndex();
  log('done. wrote index.json with ' +
      Object.keys(index.tokens).length + ' tokens, ' +
      (index.governance.periods || []).length + ' governance periods.');
}

// Graceful shutdown: flush index on SIGINT/SIGTERM so a long run can be
// killed and resumed without losing the cursor.
let exiting = false;
function bail(sig) {
  if (exiting) return;
  exiting = true;
  log('caught ' + sig + '; flushing index.json and exiting');
  try { saveIndex(); } catch {}
  process.exit(130);
}
process.on('SIGINT', () => bail('SIGINT'));
process.on('SIGTERM', () => bail('SIGTERM'));

main().catch(e => {
  console.error(e);
  process.exit(1);
});
