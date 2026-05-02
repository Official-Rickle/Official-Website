# RickleAutoBurnVault · Deployment Guide

Two contracts, deployed in order. Both BSC mainnet, both verified on BSCscan,
both immutable forever after deploy.

## Order of deploy

### 1. Deploy the implementation

The implementation contract is the master logic. **No constructor args**.
Anyone deploys it once; every clone forever after delegate-calls into this
exact contract.

```bash
# from repo root
$env:BSCSCAN_API_KEY = "your_key_here"
yarn hardhat run scripts/deploy-vault-impl.js --network bsc

# or with raw deploy via the connected wallet on rickletoken.com — same as
# how AhwaGovernance was deployed. Bytecode is in
# build/assets/RickleAutoBurnVault.sol after compile.
```

After deploy, copy the address. Verify:

```bash
yarn hardhat verify --network bsc 0xIMPLEMENTATION_ADDR
```

Constructor args: none.

### 2. Deploy the factory

The factory takes the implementation address as its only constructor arg.

```bash
yarn hardhat verify --network bsc 0xFACTORY_ADDR 0xIMPLEMENTATION_ADDR
```

After deploy, copy the factory address. **This is the address rickletoken.com
will call** when users click the "Create my burn vault" button.

### 3. Deploy your first clone (your own vault)

You're the first user. Your recipient is the burn address — your vault
permanently shrinks RKL supply with every harvest cycle.

```javascript
// Via the connected wallet, send a tx to the factory:
factory.createVault(
  "0x000000000000000000000000000000000000dEaD",  // burn — your design
  { value: ethers.parseEther("0.5") }             // ~$300 BNB seed (your call)
)
```

Returns: your vault's clone address. Copy it.

The vault is now self-running. First harvest unlocks 29 days from this
moment. Anyone (you, a bot, anyone) calls `harvest()` after that and the
loop runs forever.

## Verification of clones

Clone bytecode is the EIP-1167 minimal proxy template (45 bytes pointing at
the implementation). On BSCscan, every clone shows up as a "Proxy" pointing
to your verified implementation contract — full source is visible without
re-verification.

## Public hardcoded addresses (BSC mainnet)

| Constant | Address |
|---|---|
| RKL | `0xeCa15e1BbFF172D545Dd6325F3Bae7b737906737` |
| WBNB | `0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c` |
| PCS V2 Router | `0x10ED43C718714eb63d5aA57B78B54704E256024E` |
| RKL/WBNB Pair (PCS V2) | `0x4dcE12240b37879610601eb70685d396Faf06417` |
| Burn (recommended for your version) | `0x000000000000000000000000000000000000dEaD` |

## Operating parameters (immutable, hardcoded in implementation)

| Parameter | Value | Effect |
|---|---|---|
| `HARVEST_INTERVAL` | 29 days | Cooldown between harvests |
| `LP_HARVEST_BPS` | 0.4% | Fraction of LP withdrawn per cycle |
| `RECIPIENT_BPS` | 40% | Of harvested RKL, sent to recipient |
| `BOUNTY_BPS` | 10% | Of harvested BNB, paid to caller |
| `ZAP_BPS` | 15% | Of harvested BNB, swapped to RKL pre-add |
| `SLIPPAGE_BPS` | 0.5% | Tolerance on swap + add |

## Per-cycle math at a glance

If a cycle harvests `V` total value from LP (≈ 50% RKL / 50% BNB by value):

| Slice | Fraction of V | Where it goes |
|---|---|---|
| To recipient (burn for your vault) | 20% | RECIPIENT (e.g. dead address) |
| Re-added to LP via zap+addLiquidity | ~74% | Compounds into the pool |
| Caller bounty | 5% | msg.sender (whoever called) |
| Tiny rounding dust | <1% | Stays in clone for next cycle |

## Failure modes

- **Harvest yield too small to cover bounty** → revert. Cooldown resets to
  let yields accumulate; bot tries again next cycle.
- **PCS V2 router pauses or pair is delisted** → harvest reverts. Vault
  freezes safely, LP tokens still recoverable through direct router calls
  by anyone willing to pay gas. (Funds aren't lost, but the autonomous loop
  stops until pool is restored.)
- **Pool gets drained / catastrophic depeg** → slippage tolerance trips,
  harvest reverts. Same recovery path.

## Next steps after deploy

1. Wire `factory.createVault()` into rickletoken.com — give visitors the
   "$1 button" to spawn their own clones with their wallet as the recipient.
2. (Optional) Add a "your vaults" panel that calls
   `factory.vaultsOf(connectedWallet)` and shows their personal vaults.
3. Watch the first harvest land ~29 days post-deploy. A keeper bot should
   pick it up automatically.

That's the full end-to-end. No admin, no upgrade path, no migrations.
