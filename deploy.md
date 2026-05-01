# AHWA Governance · Deploy and Operate

Public reference for how the AHWA governance system on rickletoken.com works — the contract, the page, who can do what, and how to verify everything yourself.

---

## What this is

A small Solidity contract on BSC (`AhwaGovernance`) that records AHWA proposals, votes, and vetoes on-chain. Proposal title and body live in the event log; the live tally (`totalYesWeight` / `totalNoWeight` per proposal) lives in contract state. **No IPFS, no off-chain dependencies, no third-party services.** Eligibility (≥1 AHWA staked) and timing (72-hour window) are enforced on-chain by the contract; the pass/fail determination (`yes > no` of weighted votes cast) is computed by the page reading the on-chain totals — there's nothing to enforce, the totals are already the answer.

The contract itself is deliberately scoped: no admin, no ownership, no upgrade path, no pause. It does interact with two external contracts — AHWA (`balanceOf` for the stake's `transferFrom` flow + `transfer` on unstake) and the multisig safe (`isOwner` to gate vetoes). Both are hardcoded as `address constant` at compile time, so they cannot be redirected after deploy.

- **Contract source**: [`build/assets/AhwaGovernance.sol`](build/assets/AhwaGovernance.sol) — also served at `https://rickletoken.com/assets/AhwaGovernance.sol`
- **ABI**: [`build/assets/AhwaGovernance.abi.json`](build/assets/AhwaGovernance.abi.json) — also at `https://rickletoken.com/assets/AhwaGovernance.abi.json`
- **Page logic**: [`build/assets/governance.js`](build/assets/governance.js) — also at `https://rickletoken.com/assets/governance.js`

---

## Voting rules

| Rule | Detail |
|---|---|
| Who can propose | Any wallet with **≥1 AHWA staked** in the governance contract. Same threshold as voting — skin in the game for both. |
| Who can vote | Any wallet with **≥1 AHWA staked** (`stake()`) into the governance contract. |
| Vote weight | **= staked AHWA amount.** A 100-AHWA staker has 100× the weight of a 1-AHWA staker. |
| Multisig signers (caretakers) | **CAN vote** like anyone else by staking; can additionally **veto** any open proposal. |
| Window | 72 hours from proposal submission, plus 1 hour finalization. |
| Pass | More YES weight than NO weight (i.e., `totalYesWeight > totalNoWeight`), provided no multisig veto fired. |
| Veto | 4 of 5 multisig signer EOAs each post a `Veto` signature → proposal is killed regardless of tally. **Veto does NOT require staking** — it's identity-based (Safe membership), not balance-based. A caretaker who's divested their AHWA still has veto duty. |
| Vote changes | Voter can re-sign with the next nonce to flip their vote during the 72h window. Old signatures invalidate. |
| Unstake | Voter can `unstake()` any time. **Open-proposal votes are nullified on unstake** (their weight is removed from the live tally). Closed-proposal votes are frozen and stay. |
| Vetoes | Final once cast. Cannot be rescinded. A new proposal would be required to retry. |

**Why stake-based weight?** Public BSC RPCs prune historical state aggressively (only the latest block is queryable), so we can't retroactively check "did this address hold AHWA at the proposal block?" Stake-based voting solves this — voting power is whatever's locked in the governance contract right now, recorded in the contract's own state. No archive RPC needed; tally lives entirely in `proposals[id].totalYesWeight` / `totalNoWeight`.

---

## How a proposal works end-to-end

The full flow happens in the browser at rickletoken.com — no IPFS, no API keys, no third-party services. Proposal text lives on-chain in the event data; the live tally lives in contract state.

### One-time per voter: stake AHWA

Before you can vote, you have to stake AHWA into the governance contract:

1. **Approve** — `AHWA.approve(governance, max)` once per wallet (~$0.03)
2. **Stake** — `governance.stake(amount)` for however much AHWA you want to commit (~$0.05)

Your staked balance is your **voting weight on every proposal you participate in**, until you unstake.

### Submitting a proposal

1. **Connect wallet, and stake at least 1 AHWA first** if you haven't — same threshold as voting (the contract enforces `stakedBalance[proposer] >= 1 AHWA` on `submitProposal`).
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
   A single tx calls `submitProposal(proposer, title, body, signature)`. The contract assigns a sequential ID and emits `ProposalSubmitted(id, proposer, title, body, timestamp)` — title and body live in the event log.
4. **Voting opens immediately** with a 72-hour window.

### Voting

Each proposal card shows **Vote YES / Vote NO** buttons for wallets with staked AHWA. Clicking triggers:

- Read current `voteNonce(proposalId, voter)` from contract
- Sign EIP-712 `Vote { voter, yes, proposalId, nonce }` typed data
- Send `submitVote(voter, yes, proposalId, nonce, signature)` tx

The contract reads your *current* `stakedBalance` and uses that as your vote weight. Adding it to `proposals[id].totalYesWeight` (or `totalNoWeight`) live, on-chain. **Anyone can read the running tally with two `eth_call` reads — no log scanning needed.**

You can re-click the opposite button to flip your vote any time during the window — the bumped nonce invalidates the previous signature.

### Vetoing (multisig only)

Multisig signers see a red **VETO** button on every open proposal. Click → sign `Veto { signer, proposalId }` → submit. The contract checks `MULTISIG.isOwner(signer)` cross-contract, on-chain — **no stake check.** When **4 of 5 multisig signer EOAs each submit**, the page marks the proposal `VETOED · REJECTED` regardless of community tally.

Vetoes are deliberately stake-exempt because veto power is identity-based: caretakers' duty to protect the protocol exists by virtue of being in the multisig, not by their personal token holdings. A caretaker who has divested their AHWA still has veto duty.

### Unstaking

`governance.unstake(amount)` returns AHWA to your wallet. **As a side effect, any votes you have on currently-open proposals are nullified** — their weight is removed from the live tally. Votes on already-closed proposals are frozen and survive.

### After 73 hours

The contract refuses any further votes/vetoes after the 72h cutoff via on-chain time check. The tally is final.

---

## Deploying the contract (one-time)

The Deploy panel on rickletoken.com is gated to **dreamingrainbow's address `0xF9B9eE3B0301B511cd5AA4b8D039F63df19C615a`**. Only that wallet can deploy.

### Steps

1. **Visit rickletoken.com** with a wallet on BSC.
2. **Connect dreamingrainbow's wallet.** The Deploy panel becomes visible only if the connected address matches.
3. **Click "Deploy".** The page sends a contract-creation transaction with the bytecode embedded in `governance.js` (≈8 KB, ~5M gas, ~$0.10 in BNB). AHWA token address and multisig safe address are baked into the bytecode as `address constant` — no constructor args.
4. **Wait for receipt.** The page polls until the receipt arrives, then shows the deployed address and stores it in `localStorage`.
5. **Hardcode the address.** Edit [`build/assets/governance.js`](build/assets/governance.js), find `CONTRACT: '',` and `DEPLOY_BLOCK: 0,` in the `GOV` config, set them to the deployed address and block number (the Deploy panel shows both after the receipt arrives). Commit and push.
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

### Routine maintenance

There isn't any. The page reads everything it needs from contract state — no `HOLDER_COUNT`, no exclusion lists, no off-chain index to keep in sync. The voter set is whoever has staked AHWA in the contract; that information lives entirely on-chain.

### When the contract source changes (pre-deployment only)

A deployed contract cannot be patched — to change behavior you redeploy and migrate. Pre-deployment edits flow:

1. Edit `build/assets/AhwaGovernance.sol`.
2. Recompile: `node tools/compile.js` (or `npx hardhat compile`).
3. The script updates `GOV_BYTECODE` / `GOV_DEPLOYED_BYTECODE` in `governance.js` and the ABI JSON automatically — only if they actually changed.
4. Review with `git diff`, commit, push.

If a deployed contract needs replacing later (e.g., AHWA token migrates), the existing one is abandoned and a fresh contract deployed; no on-chain state can be carried over.

---

## Threat model and design choices

- **No admin, no ownership, no upgrade path, no pause.** Once deployed, no one — including the deployer — can change the contract's behavior. Storage *is* mutable (stakes go up/down, vote weights are added and nullified, tallies update) but only via the public functions whose logic is fixed in bytecode.
- **AHWA token + multisig safe addresses are baked in as `address constant`** at compile time — not constructor parameters. If either ever moves, the governance contract becomes obsolete and a new one must be deployed.
- **EIP-712 signing** binds each signature to the specific contract address and chain (BSC, chain 56). A signature valid here cannot be replayed on a clone or different chain.
- **Per-(proposal, voter) nonces** prevent vote-flip replay attacks. An attacker capturing an old vote signature cannot resurrect it after the voter has flipped their position.
- **Anyone can relay** for proposal/vote/veto submission. `msg.sender` is irrelevant; only the recovered EIP-712 signer matters. A holder without BNB for gas can hand their signed message to anyone to submit. Stake/unstake use `msg.sender` directly because they custody tokens.
- **Eligibility is enforced on-chain.** `submitVote` requires `stakedBalance[voter] >= 1 AHWA`; `submitProposal` requires the same of the proposer. `submitVeto` requires `MULTISIG.isOwner(signer)`. No off-chain trust required.
- **Timing is enforced on-chain.** `submitVote` and `submitVeto` revert if `block.timestamp > createdAt + VOTING_WINDOW`. The 72-hour cutoff cannot be evaded.
- **Pass/fail is purely arithmetic.** No threshold check needed — the page just compares `totalYesWeight` to `totalNoWeight`, both of which are kept live in contract state by the contract itself. There's no "denominator" to maintain.
- **No archive RPC required.** All voting state (stakes, vote weights, totals) lives in contract storage at the latest block. The page reads it via plain `eth_call` — no historical state lookups, no snapshot mechanism.
- **Vote-shuffle and vote-buying are impossible.** Staked AHWA is custodied by the contract; it can't be in two wallets at once. Voting power can't be acquired after a proposal opens unless the buyer also stakes (which puts the AHWA in the contract, not their wallet).
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
