# AHWA Governance · Deploy and Operate

Public reference for how the AHWA governance system on rickletoken.com works — the contract, the page, who can do what, and how to verify everything yourself.

---

## What this is

A small Solidity contract on BSC (`AhwaGovernance`) that records AHWA proposals, votes, and vetoes as on-chain events. Proposal title and body live entirely in the event log — **no IPFS, no off-chain dependencies, no third-party services**. All voting policy (eligibility, 51% threshold, timing) is enforced off-chain by the page at rickletoken.com reading these events.

The contract itself is deliberately minimal — append-only, no admin, no ownership, no upgrades, no token interactions.

- **Contract source**: [`build/assets/AhwaGovernance.sol`](build/assets/AhwaGovernance.sol) — also served at `https://rickletoken.com/assets/AhwaGovernance.sol`
- **ABI**: [`build/assets/AhwaGovernance.abi.json`](build/assets/AhwaGovernance.abi.json) — also at `https://rickletoken.com/assets/AhwaGovernance.abi.json`
- **Page logic**: [`build/assets/governance.js`](build/assets/governance.js) — also at `https://rickletoken.com/assets/governance.js`

---

## Voting rules

| Rule | Detail |
|---|---|
| Who can propose | Any AHWA holder with ≥1 AHWA at the proposal block |
| Who can vote | Any AHWA holder with ≥1 AHWA at the proposal block, **except** the multisig safe address (the safe itself, not its signers) and LP/staking pools |
| Vote weight | 1 holder = 1 vote, regardless of balance (a 400-AHWA holder gets the same 1 vote as a 1-AHWA holder) |
| Multisig signers (caretakers) | **CAN vote** with their personal wallets if they hold AHWA personally |
| Window | 72 hours from proposal block, plus 1 hour finalization |
| Pass threshold | ≥51% of eligible holders must vote YES |
| Veto | 4 of 5 multisig signer EOAs each post a `Veto` signature → proposal is killed regardless of tally |
| Vote changes | A voter can re-sign with the next nonce to flip their vote during the 72h window. Old signatures are invalidated by the nonce check. |
| Vetoes | Final once cast. Cannot be rescinded. A new proposal would be required to retry. |

The 51% denominator is computed as: `HOLDER_COUNT − (multisig safe holds AHWA ? 1 : 0) − (count of LPs/staking pools holding AHWA at proposal block)`. `HOLDER_COUNT` is maintained manually in `governance.js` from BSCscan's holder count.

---

## How a proposal works end-to-end

The full flow happens in the browser at rickletoken.com — no IPFS, no API keys, no third-party services. Proposal text lives on-chain in the event data; everything else (votes, vetoes, tally) comes from contract events.

1. **Connect your wallet** — the site checks AHWA balance at the current block. Need ≥1 AHWA to propose or vote.
2. **Open "Create a proposal"**, fill in **title** (≤200 chars) and **body** (≤90,000 bytes / ~25,000 words).
3. **Click "Sign &amp; submit"**. One wallet popup signs EIP-712 typed data:
   ```
   domain  = { name: "AhwaGovernance", version: "1", chainId: 56, verifyingContract: <CONTRACT> }
   types   = { Proposal: [
     { name: "proposer", type: "address" },
     { name: "title",    type: "string"  },
     { name: "body",     type: "string"  }
   ]}
   value   = { proposer: <YOUR_ADDR>, title, body }
   ```
   Then a single tx calls `submitProposal(proposer, title, body, signature)`. The contract verifies the signature, assigns a sequential ID, and emits `ProposalSubmitted(id, proposer, title, body, timestamp)` — full text in the event log.
4. **Voting opens immediately** with a 72-hour window. Each proposal card on the page shows **Vote YES / Vote NO** buttons for connected wallets that hold ≥1 AHWA. Click triggers:
   - Read current `voteNonce(proposalId, voter)` from contract
   - Sign EIP-712 `Vote { voter, yes, proposalId, nonce }` typed data
   - Send `submitVote(voter, yes, proposalId, nonce, signature)` tx
   - Voter can re-click the opposite button before the window closes; old signatures invalidate via the bumped nonce
5. **Multisig signers see a red VETO button** on each open proposal. Click prompts confirmation, signs `Veto { signer, proposalId }`, sends `submitVeto`. When 4 of 5 multisig signer EOAs each submit, the page marks the proposal `VETOED · REJECTED` regardless of the community tally.
6. **After 73 hours** (72h window + 1h finalization), the tally is final. The contract refuses any further votes/vetoes after the 72h cutoff via on-chain time check.

Anyone can re-read the full history via `eth_getLogs` on the contract — title and body live in event data, no off-chain dependency required to reconstruct the state.

---

## Deploying the contract (one-time)

The Deploy panel on rickletoken.com is gated to **dreamingrainbow's address `0xF9B9eE3B0301B511cd5AA4b8D039F63df19C615a`**. Only that wallet can deploy.

### Steps

1. **Visit rickletoken.com** with a wallet on BSC.
2. **Connect dreamingrainbow's wallet.** The Deploy panel becomes visible only if the connected address matches.
3. **Click "Deploy".** The page sends a contract-creation transaction with the bytecode embedded in `governance.js` (≈4.7 KB, ~3M gas, ~$0.05 in BNB).
4. **Wait for receipt.** The page polls until the receipt arrives, then shows the deployed address and stores it in `localStorage`.
5. **Hardcode the address.** Edit [`build/index.html`](build/index.html), find `CONTRACT: '',` in the `GOV` config (one place), set to the deployed address. Commit and push.
6. **Verify on BSCscan** (next section).

The deploy is one-shot. Once the contract is deployed and the address is committed to the repo, the Deploy panel disappears for everyone.

---

## Verifying

There are three independent ways to verify the deployed contract matches the published source:

### 1. In-browser bytecode diff (fastest)

The Audit panel on the page has a **"Verify on chain"** button. It calls `eth_getCode(<CONTRACT>)` against BSC's public RPC, compares the runtime bytecode to the embedded `GOV_DEPLOYED_BYTECODE`, and shows match/mismatch. Anyone can click; no key needed.

### 2. BSCscan verification (canonical, persistent)

Run locally after deploy:

```bash
# Bash
BSCSCAN_API_KEY=your_key npx hardhat verify --network bsc 0xDEPLOYED_ADDRESS

# PowerShell
$env:BSCSCAN_API_KEY="your_key"; npx hardhat verify --network bsc 0xDEPLOYED_ADDRESS
```

The key is read from the environment for that one command — no `.env` file. Hardhat compiles fresh from `build/assets/AhwaGovernance.sol` (configured in `hardhat.config.js`) and submits the source to BSCscan. Once verified, BSCscan shows the source publicly under the contract's "Contract" tab.

### 3. Reproduce the build yourself

```bash
# Option A — hardhat (canonical)
yarn install
npx hardhat compile

# Option B — standalone (no npm install required)
node tools/compile.js
```

Both produce byte-for-byte identical bytecode (verified). The standalone path downloads `solc 0.8.24` once into `tools/.cache/` and compiles in pure Node — useful when hardhat install isn't available.

---

## Compiler settings (for verification)

| Setting | Value |
|---|---|
| Compiler | `solc 0.8.24+commit.e11b9ed9` |
| Optimizer | enabled, `runs: 200` |
| EVM target | `paris` |
| License | MIT |
| Source file | `AhwaGovernance.sol` (single file, no imports) |

These are pinned in [`hardhat.config.js`](hardhat.config.js). Any change here would require recompiling and re-embedding the bytecode in `governance.js`.

---

## Maintenance

### When AHWA holder count changes

The 51% denominator depends on the total number of AHWA holders. When holders join or sell out completely, update one constant:

1. Check BSCscan: `https://bscscan.com/token/0x3A81caafeeDCF2D743Be893858cDa5AcDBF88c11` → "Holders: N"
2. Edit [`build/assets/governance.js`](build/assets/governance.js), find `HOLDER_COUNT: 40,` in the `GOV` object, set to N.
3. Commit and push.

The page automatically subtracts the multisig safe + LPs holding AHWA at each proposal block — those are not maintained manually.

### When the contract source changes (rare)

The contract is immutable once deployed. Source changes only happen pre-deployment or for a future v2:

1. Edit `build/assets/AhwaGovernance.sol`.
2. Recompile: `node tools/compile.js` (or `npx hardhat compile`).
3. The script updates `GOV_BYTECODE` / `GOV_DEPLOYED_BYTECODE` in `governance.js` and the ABI JSON automatically — only if they actually changed.
4. Review with `git diff`, commit, push.

---

## Threat model and design choices

- **Append-only events, no state-changing admin.** The contract has zero ownership, zero upgrade path, zero pause function. Once deployed it cannot be altered.
- **EIP-712 signing** binds each signature to the specific contract address and chain (BSC, chain 56). A signature valid here cannot be replayed on a clone or a different chain.
- **Per-(proposal, voter) nonces** prevent vote-flip replay attacks. An attacker capturing an old vote signature cannot resurrect it after the voter has changed their position.
- **Anyone can relay.** `msg.sender` is irrelevant — only the recovered signer matters. A holder without BNB for gas can hand their signed message to anyone to submit.
- **Off-chain policy.** All eligibility, threshold, and timing logic lives in the page (and is auditable as plain JavaScript). The contract is intentionally policy-free so policy can evolve without redeploying.
- **No AHWA token snapshots.** The page checks `balanceOf(voter)` at the proposal's creation block via standard ERC-20 — public BSC RPC retains state for ~6 months which more than covers the 73-hour proposal lifecycle.
- **No IPFS, no API keys.** Proposal text lives on-chain in event data. No client-side credentials, no off-chain pinning service, no risk of a "site key" being scraped and abused.
- **On-chain size cap.** The contract enforces `body ≤ 90,000 bytes` and `title ≤ 200 chars` so proposers can't abuse the gas economics. Practical proposal cost: ~$0.05–$1 in BNB depending on length.

---

## File map

```
.
├── build/
│   ├── index.html                          ← static page (served as-is via GitHub Pages)
│   └── assets/
│       ├── AhwaGovernance.sol              ← contract source (single source of truth)
│       ├── AhwaGovernance.abi.json         ← compiled ABI
│       └── governance.js                   ← page logic + bytecode constants
├── hardhat.config.js                       ← compile + verify settings
├── package.json                            ← hardhat devDeps
├── yarn.lock                               ← pinned versions
├── tools/
│   ├── compile.js                          ← no-npm standalone compiler (backup)
│   └── verify.js                           ← bytecode parity check (yarn verify:bytecode)
├── deploy.md                               ← this file
├── .gitattributes                          ← pins LF endings for reproducible builds
└── .gitignore
```

The site itself is `build/` — pushed to GitHub Pages, served directly. There is no build step; the HTML is the deployed artifact.
