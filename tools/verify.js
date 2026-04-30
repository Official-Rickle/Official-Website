#!/usr/bin/env node
// Verify that the bytecode + ABI embedded in build/assets/governance.js
// and build/assets/AhwaGovernance.abi.json exactly match a fresh compile
// of build/assets/AhwaGovernance.sol with hardhat's settings.
//
// Run with:  node tools/verify.js   (or `yarn verify:bytecode`)
//
// Exit codes:
//   0 — all match, safe to push
//   1 — compilation error
//   2 — embedded artifacts diverge from fresh compile (review needed)

const fs   = require('fs');
const path = require('path');

const ROOT  = path.resolve(__dirname, '..');
const SRC   = path.join(ROOT, 'build', 'assets', 'AhwaGovernance.sol');
const GOVJS = path.join(ROOT, 'build', 'assets', 'governance.js');
const ABIF  = path.join(ROOT, 'build', 'assets', 'AhwaGovernance.abi.json');
const SOLC  = path.join(__dirname, '.cache', 'soljson-v0.8.24+commit.e11b9ed9.js');

if (!fs.existsSync(SOLC)) {
  console.error('✗ solc not cached at', SOLC);
  console.error('  Run `node tools/compile.js` first to download it.');
  process.exit(1);
}

const soljson = require(SOLC);
const compile = soljson.cwrap('solidity_compile', 'string', ['string', 'number']);

const sourceBytes = fs.readFileSync(SRC);
const sourceHasCRLF = sourceBytes.includes(Buffer.from([0x0D, 0x0A]));

const input = {
  language: 'Solidity',
  sources: { 'AhwaGovernance.sol': { content: sourceBytes.toString('utf8') } },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    evmVersion: 'paris',
    outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object', 'evm.deployedBytecode.object'] } },
  },
};
const out = JSON.parse(compile(JSON.stringify(input), 0));
if (out.errors) {
  let fatal = 0;
  for (const e of out.errors) {
    console[e.severity === 'error' ? 'error' : 'warn'](e.formattedMessage);
    if (e.severity === 'error') fatal++;
  }
  if (fatal) process.exit(1);
}

const c = out.contracts['AhwaGovernance.sol'].AhwaGovernance;
const freshCreation = '0x' + c.evm.bytecode.object;
const freshRuntime  = '0x' + c.evm.deployedBytecode.object;
const freshAbi      = JSON.stringify(c.abi, null, 2) + '\n';

const gov = fs.readFileSync(GOVJS, 'utf8');
const embCreation = (gov.match(/const GOV_BYTECODE\s+=\s+'(0x[0-9a-f]+)'/)        || [])[1] || '';
const embRuntime  = (gov.match(/const GOV_DEPLOYED_BYTECODE\s+=\s+'(0x[0-9a-f]+)'/) || [])[1] || '';
const embAbi      = fs.readFileSync(ABIF, 'utf8');

console.log('Source file:');
console.log('  bytes      :', sourceBytes.length);
console.log('  lines      :', sourceBytes.toString('utf8').split('\n').length);
console.log('  has CRLF   :', sourceHasCRLF, sourceHasCRLF ? '⚠ should be LF' : '✓ pure LF');
console.log();
console.log('Fresh compile vs. embedded:');
console.log('  creation bytecode  :', freshCreation === embCreation ? `✓ MATCH (${(freshCreation.length-2)/2} bytes)` : '✗ DIFFER');
console.log('  runtime bytecode   :', freshRuntime  === embRuntime  ? `✓ MATCH (${(freshRuntime.length-2)/2}  bytes)` : '✗ DIFFER');
console.log('  ABI JSON           :', freshAbi === embAbi ? '✓ MATCH' : '✗ DIFFER');
console.log();

const allMatch = (freshCreation === embCreation) && (freshRuntime === embRuntime) && (freshAbi === embAbi);
if (allMatch) {
  console.log('✓ Embedded artifacts are EXACT match for fresh compilation. Safe to push.');
  process.exit(0);
} else {
  console.log('✗ Mismatch detected. Run `node tools/compile.js` to regenerate, then review with `git diff`.');
  process.exit(2);
}
