#!/usr/bin/env node
// Standalone Solidity compiler for AhwaGovernance.sol — no npm install
// required. Downloads solc 0.8.24 once into tools/.cache/, then compiles
// build/assets/AhwaGovernance.sol with the same settings as hardhat.config.js.
//
// On success:
//   - Updates build/assets/AhwaGovernance.abi.json
//   - Updates GOV_BYTECODE / GOV_DEPLOYED_BYTECODE in build/assets/governance.js
//     ONLY if they changed (otherwise no-op, leaves git diff clean)
//
// Useful when:
//   - npm install fails / hardhat unavailable
//   - You need a quick recompile after editing the contract
//   - You want to verify the embedded bytecode matches the current source
//
// Canonical path remains `npx hardhat compile`. This is the no-deps backup.

const fs   = require('fs');
const path = require('path');
const https = require('https');

const ROOT      = path.resolve(__dirname, '..');
const SRC       = path.join(ROOT, 'build', 'assets', 'AhwaGovernance.sol');
const ABI_OUT   = path.join(ROOT, 'build', 'assets', 'AhwaGovernance.abi.json');
const GOVJS     = path.join(ROOT, 'build', 'assets', 'governance.js');
const CACHE_DIR = path.join(__dirname, '.cache');
const SOLC_VER  = 'v0.8.24+commit.e11b9ed9';
const SOLC_URL  = `https://binaries.soliditylang.org/bin/soljson-${SOLC_VER}.js`;
const SOLC_LOCAL = path.join(CACHE_DIR, `soljson-${SOLC_VER}.js`);

function download(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return download(res.headers.location).then(resolve, reject);
      }
      if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

(async () => {
  // 1. Fetch solc into cache if missing.
  if (!fs.existsSync(SOLC_LOCAL)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    process.stdout.write(`Downloading solc ${SOLC_VER}... `);
    const body = await download(SOLC_URL);
    fs.writeFileSync(SOLC_LOCAL, body);
    console.log(`${(body.length / 1024 / 1024).toFixed(1)} MB cached`);
  }

  // 2. Compile.
  const soljson = require(SOLC_LOCAL);
  const compile = soljson.cwrap('solidity_compile', 'string', ['string', 'number']);
  const source  = fs.readFileSync(SRC, 'utf8');
  // Source name MUST match what hardhat normalizes to (relative to
  // paths.sources). With paths.sources = "build/assets" and the file at
  // build/assets/AhwaGovernance.sol, the relative name is bare.
  const input = {
    language: 'Solidity',
    sources: { 'AhwaGovernance.sol': { content: source } },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: 'paris',
      outputSelection: {
        '*': { '*': ['abi', 'evm.bytecode.object', 'evm.deployedBytecode.object'] },
      },
    },
  };
  const out = JSON.parse(compile(JSON.stringify(input), 0));
  if (out.errors) {
    let fatal = 0;
    for (const e of out.errors) {
      console[e.severity === 'error' ? 'error' : 'warn'](e.formattedMessage);
      if (e.severity === 'error') fatal++;
    }
    if (fatal) { console.error(`\n✗ Compilation failed with ${fatal} error(s).`); process.exit(1); }
  }
  const c = out.contracts['AhwaGovernance.sol'].AhwaGovernance;
  const bytecode  = '0x' + c.evm.bytecode.object;
  const runtime   = '0x' + c.evm.deployedBytecode.object;
  const abi       = c.abi;

  // 3. Update ABI file (always — tiny file, deterministic format).
  const abiText = JSON.stringify(abi, null, 2) + '\n';
  const abiPrev = fs.existsSync(ABI_OUT) ? fs.readFileSync(ABI_OUT, 'utf8') : '';
  const abiChanged = abiText !== abiPrev;
  if (abiChanged) fs.writeFileSync(ABI_OUT, abiText);

  // 4. Update governance.js bytecode constants if changed.
  const gov = fs.readFileSync(GOVJS, 'utf8');
  const reCreation = /(const GOV_BYTECODE\s+=\s+')0x[0-9a-f]+(')/;
  const reRuntime  = /(const GOV_DEPLOYED_BYTECODE\s+=\s+')0x[0-9a-f]+(')/;
  let next = gov.replace(reCreation, `$1${bytecode}$2`).replace(reRuntime, `$1${runtime}$2`);
  const govChanged = next !== gov;
  if (govChanged) fs.writeFileSync(GOVJS, next);

  // 5. Report.
  console.log();
  console.log(`Compiled  : ${(bytecode.length - 2) / 2} bytes creation, ${(runtime.length - 2) / 2} bytes runtime, ${abi.length} ABI entries`);
  console.log(`ABI file  : ${abiChanged ? 'updated' : 'no change'}`);
  console.log(`governance.js: ${govChanged ? 'bytecode constants updated' : 'no change'}`);
  if (!abiChanged && !govChanged) console.log('\n✓ All up to date.');
  else                            console.log('\n✓ Wrote updates. Review with `git diff`.');
})().catch(e => { console.error('✗', e.message); process.exit(1); });
