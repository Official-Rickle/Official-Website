// ============================================================
//  RickleAutoBurnVault — page UI
//
//  Two-stage deployment, mirrors AhwaGovernance pattern:
//
//   1. Deploy panel (only visible to dreamingrainbow's wallet, only while
//      IMPLEMENTATION/FACTORY constants are empty):
//        a) Deploy the implementation contract (no constructor args)
//        b) Copy the impl address into the factory deploy step
//        c) Deploy the factory (constructor: implementation address)
//        d) Hardcode both addresses below, push, the panel disappears.
//
//   2. Public Commonwealth panel (visible to ALL once factory is committed):
//        - Connect wallet, choose a recipient (burn / self / custom),
//          choose a BNB seed amount, click Create. Factory deploys an
//          EIP-1167 clone, seeds it, and the clone runs forever.
//        - "Your vaults" lists clones the connected wallet has created.
//
//  Both files (this + RickleAutoBurnVault.sol + factory) are immutable
//  once committed — same security model as AhwaGovernance.
// ============================================================

// Renamed from VAULT → BURN_VAULT to avoid colliding with index.html's
// Winston-vault address map (also `const VAULT`). Both files share global
// scope when loaded as plain <script> tags.
const BURN_VAULT = {
  // Filled after deploy. Empty → deploy panel shows for the deployer.
  // Old addresses (bricked due to a clone-init reentrancy bug, kept for
  // history): IMPLEMENTATION 0x7C5B5b39bF7e5a6922ABb74E08317f6f9fA9540a,
  // FACTORY 0x6cc4a005324c90e31eb788594ebd1f672a2a6857. Both are abandoned —
  // the old impl can never initialize a clone.
  IMPLEMENTATION: '0xfb65d11a375e7d61fcd8ea205558375521e8a30f',
  FACTORY:        '',

  CHAIN_ID:       56,
  RPC:            'https://bsc-rpc.publicnode.com',
  DEPLOYER:       '0xf9b9ee3b0301b511cd5aa4b8d039f63df19c615a',

  // Token + DEX constants (same on every clone).
  RKL:    '0xeCa15e1BbFF172D545Dd6325F3Bae7b737906737',
  WBNB:   '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
  PAIR:   '0x4dcE12240b37879610601eb70685d396Faf06417',
  ROUTER: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
  DEAD:   '0x000000000000000000000000000000000000dEaD',
};

// Selectors (computed from compiled contracts). If you ever change the
// Solidity, regenerate via tools/compile.js and update these.
const VAULT_SEL = {
  // Vault (clone)
  initialize:       '0xc4d66de8',
  harvest:          '0x4641257d',
  recipient:        '0x66d003ac',
  lastHarvest:      '0xf1a392da',
  initialized:      '0x158ef93e',
  lpHeld:           '0xb1aac8f2',
  timeUntilHarvest: '0x0e176ca0',
  // Factory
  createVault:      '0xb4bd6f46',
  vaultCount:       '0xa7c6a100',
  vaultsOf:         '0x6cc811f8',
  IMPLEMENTATION_:  '0x3a4741bd',
};

// ─── Embedded bytecode ─────────────────────────────────────────────
// These are emitted by `tools/compile.js` from the Solidity sources.
// They go on-chain via the deploy panel below; nothing here runs locally.

const VAULT_BYTECODE = '0x608060405234801561001057600080fd5b506113b8806100206000396000f3fe6080604052600436106101185760003560e01c8063918f8674116100a0578063bd134ce411610064578063bd134ce4146102e7578063c4d66de8146102fd578063cdb225f414610310578063d75901f414610325578063f1a392da1461033a57600080fd5b8063918f867414610257578063ace3a8a71461026d578063b1aac8f214610295578063b621a237146102aa578063bace6b10146102d257600080fd5b806332fe7b26116100e757806332fe7b26146101a35780634641257d146101e357806366d003ac146101fa57806377f8bb6d1461021a5780638dd950021461022f57600080fd5b8063027678f3146101245780630d9a34a21461014d5780630e176ca014610164578063158ef93e1461017957600080fd5b3661011f57005b600080fd5b34801561013057600080fd5b5061013a6103e881565b6040519081526020015b60405180910390f35b34801561015957600080fd5b5061013a62263b8081565b34801561017057600080fd5b5061013a610350565b34801561018557600080fd5b506002546101939060ff1681565b6040519015158152602001610144565b3480156101af57600080fd5b506101cb7310ed43c718714eb63d5aa57b78b54704e256024e81565b6040516001600160a01b039091168152602001610144565b3480156101ef57600080fd5b506101f8610386565b005b34801561020657600080fd5b506000546101cb906001600160a01b031681565b34801561022657600080fd5b5061013a603281565b34801561023b57600080fd5b506101cb73bb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c81565b34801561026357600080fd5b5061013a61271081565b34801561027957600080fd5b506101cb734dce12240b37879610601eb70685d396faf0641781565b3480156102a157600080fd5b5061013a610bd0565b3480156102b657600080fd5b506101cb73eca15e1bbff172d545dd6325f3bae7b73790673781565b3480156102de57600080fd5b5061013a610c4b565b3480156102f357600080fd5b5061013a610fa081565b6101f861030b36600461118d565b610c5e565b34801561031c57600080fd5b5061013a611170565b34801561033157600080fd5b5061013a602881565b34801561034657600080fd5b5061013a60015481565b60008062263b8060015461036491906111d3565b90508042101561037d5761037842826111ec565b610380565b60005b91505090565b600354156103c75760405162461bcd60e51b81526020600482015260096024820152681c99595b9d1c985b9d60ba1b60448201526064015b60405180910390fd5b600160035560025460ff166104105760405162461bcd60e51b815260206004820152600f60248201526e1b9bdd081a5b9a5d1a585b1a5e9959608a1b60448201526064016103be565b62263b8060015461042191906111d3565b42101561045b5760405162461bcd60e51b815260206004820152600860248201526731b7b7b63237bbb760c11b60448201526064016103be565b426001556040516370a0823160e01b8152306004820152600090734dce12240b37879610601eb70685d396faf06417906370a0823190602401602060405180830381865afa1580156104b1573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906104d591906111ff565b905060006127106104e7602884611218565b6104f1919061122f565b90506000811161052b5760405162461bcd60e51b815260206004820152600560248201526406e6f204c560dc1b60448201526064016103be565b60405163095ea7b360e01b81527310ed43c718714eb63d5aa57b78b54704e256024e600482015260248101829052734dce12240b37879610601eb70685d396faf064179063095ea7b3906044016020604051808303816000875af1158015610597573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906105bb9190611251565b6105fb5760405162461bcd60e51b8152602060048201526011602482015270185c1c1c9bdd994813140819985a5b1959607a1b60448201526064016103be565b6000807310ed43c718714eb63d5aa57b78b54704e256024e6302751cec73eca15e1bbff172d545dd6325f3bae7b7379067378584803061063d426102586111d3565b6040518763ffffffff1660e01b815260040161065e96959493929190611273565b60408051808303816000875af115801561067c573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906106a091906112ae565b909250905060006127106106b6610fa085611218565b6106c0919061122f565b60005460405163a9059cbb60e01b81526001600160a01b0390911660048201526024810182905290915073eca15e1bbff172d545dd6325f3bae7b7379067379063a9059cbb906044016020604051808303816000875af1158015610728573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061074c9190611251565b6107985760405162461bcd60e51b815260206004820152601960248201527f7472616e7366657220726563697069656e74206661696c65640000000000000060448201526064016103be565b60006127106107a96103e885611218565b6107b3919061122f565b9050600081116107f95760405162461bcd60e51b81526020600482015260116024820152701a185c9d995cdd081d1bdbc81cdb585b1b607a1b60448201526064016103be565b6000612710600261080e6103e8610fa06111ec565b610818919061122f565b6108229086611218565b61082c919061122f565b9050801561095b5760408051600280825260608201835260009260208301908036833701905050905073bb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c8160008151811061087d5761087d6112d2565b60200260200101906001600160a01b031690816001600160a01b03168152505073eca15e1bbff172d545dd6325f3bae7b737906737816001815181106108c5576108c56112d2565b6001600160a01b03909216602092830291909101909101527310ed43c718714eb63d5aa57b78b54704e256024e63b6f9de958360008430610908426102586111d3565b6040518663ffffffff1660e01b815260040161092794939291906112e8565b6000604051808303818588803b15801561094057600080fd5b505af1158015610954573d6000803e3d6000fd5b5050505050505b6040516370a0823160e01b815230600482015260009073eca15e1bbff172d545dd6325f3bae7b737906737906370a0823190602401602060405180830381865afa1580156109ad573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906109d191906111ff565b905060006109df84476111ec565b905060006127106109f16032826111ec565b6109fb9085611218565b610a05919061122f565b90506000612710610a176032826111ec565b610a219085611218565b610a2b919061122f565b905060007310ed43c718714eb63d5aa57b78b54704e256024e63f305d7198573eca15e1bbff172d545dd6325f3bae7b73790673788878730610a6f426102586111d3565b6040518863ffffffff1660e01b8152600401610a9096959493929190611273565b60606040518083038185885af1158015610aae573d6000803e3d6000fd5b50505050506040513d601f19601f82011682018060405250810190610ad39190611354565b6040519093506000925033915089908381818185875af1925050503d8060008114610b1a576040519150601f19603f3d011682016040523d82523d6000602084013e610b1f565b606091505b5050905080610b645760405162461bcd60e51b8152602060048201526011602482015270189bdd5b9d1e481c185e4819985a5b1959607a1b60448201526064016103be565b604080518d8152602081018d90529081018b9052606081018a90526080810189905260a0810183905233907fd3871e10847aba2b6ebf3041d29f0ac7707274f1b12ba764093e1cf187aa00589060c00160405180910390a2505060006003555050505050505050505050565b6040516370a0823160e01b8152306004820152600090734dce12240b37879610601eb70685d396faf06417906370a0823190602401602060405180830381865afa158015610c22573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610c4691906111ff565b905090565b600062263b80600154610c4691906111d3565b60035415610c9a5760405162461bcd60e51b81526020600482015260096024820152681c99595b9d1c985b9d60ba1b60448201526064016103be565b600160035560025460ff1615610ce85760405162461bcd60e51b8152602060048201526013602482015272185b1c9958591e481a5b9a5d1a585b1a5e9959606a1b60448201526064016103be565b6001600160a01b038116610d2e5760405162461bcd60e51b815260206004820152600d60248201526c0726563697069656e74203d203609c1b60448201526064016103be565b60003411610d685760405162461bcd60e51b81526020600482015260076024820152661b9bc81cd9595960ca1b60448201526064016103be565b60028054600160ff199091168117909155600080546001600160a01b0319166001600160a01b03841617905542905560405163095ea7b360e01b81527310ed43c718714eb63d5aa57b78b54704e256024e6004820152600019602482015273eca15e1bbff172d545dd6325f3bae7b7379067379063095ea7b3906044016020604051808303816000875af1158015610e04573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610e289190611251565b610e695760405162461bcd60e51b8152602060048201526012602482015271185c1c1c9bdd99481492d30819985a5b195960721b60448201526064016103be565b6000610e7660023461122f565b90506000610e8482346111ec565b604080516002808252606082018352929350600092909160208301908036833701905050905073bb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c81600081518110610ed257610ed26112d2565b60200260200101906001600160a01b031690816001600160a01b03168152505073eca15e1bbff172d545dd6325f3bae7b73790673781600181518110610f1a57610f1a6112d2565b6001600160a01b03909216602092830291909101909101527310ed43c718714eb63d5aa57b78b54704e256024e63b6f9de958460008430610f5d426102586111d3565b6040518663ffffffff1660e01b8152600401610f7c94939291906112e8565b6000604051808303818588803b158015610f9557600080fd5b505af1158015610fa9573d6000803e3d6000fd5b50506040516370a0823160e01b81523060048201526000935073eca15e1bbff172d545dd6325f3bae7b73790673792506370a082319150602401602060405180830381865afa158015611000573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061102491906111ff565b905060006127106110366032826111ec565b6110409084611218565b61104a919061122f565b9050600061271061105c6032826111ec565b6110669087611218565b611070919061122f565b905060007310ed43c718714eb63d5aa57b78b54704e256024e63f305d7198773eca15e1bbff172d545dd6325f3bae7b737906737878787306110b4426102586111d3565b6040518863ffffffff1660e01b81526004016110d596959493929190611273565b60606040518083038185885af11580156110f3573d6000803e3d6000fd5b50505050506040513d601f19601f820116820180604052508101906111189190611354565b60408051348152602081018390529194506001600160a01b038c1693507f0f91882b50d9330af0b1d4998e6af7f2eaee90ce7e77ea54fea089af166d021d92500160405180910390a250506000600355505050505050565b60026111806103e8610fa06111ec565b61118a919061122f565b81565b60006020828403121561119f57600080fd5b81356001600160a01b03811681146111b657600080fd5b9392505050565b634e487b7160e01b600052601160045260246000fd5b808201808211156111e6576111e66111bd565b92915050565b818103818111156111e6576111e66111bd565b60006020828403121561121157600080fd5b5051919050565b80820281158282048414176111e6576111e66111bd565b60008261124c57634e487b7160e01b600052601260045260246000fd5b500490565b60006020828403121561126357600080fd5b815180151581146111b657600080fd5b6001600160a01b039687168152602081019590955260408501939093526060840191909152909216608082015260a081019190915260c00190565b600080604083850312156112c157600080fd5b505080516020909101519092909150565b634e487b7160e01b600052603260045260246000fd5b60006080820186835260206080602085015281875180845260a08601915060208901935060005b818110156113345784516001600160a01b03168352938301939183019160010161130f565b50506001600160a01b039690961660408501525050506060015292915050565b60008060006060848603121561136957600080fd5b835192506020840151915060408401519050925092509256fea26469706673582212203ad3e681e572e5e7e97827a59ca65ab7e13b4103b35c7d33e57efebdbbb58c4164736f6c63430008180033';

const FACTORY_BYTECODE = '0x60a060405234801561001057600080fd5b5060405161066538038061066583398101604081905261002f9161008f565b6001600160a01b03811661007e5760405162461bcd60e51b81526020600482015260126024820152710696d706c656d656e746174696f6e203d20360741b604482015260640160405180910390fd5b6001600160a01b03166080526100bf565b6000602082840312156100a157600080fd5b81516001600160a01b03811681146100b857600080fd5b9392505050565b6080516105856100e060003960008181606c01526102ad01526105856000f3fe6080604052600436106100555760003560e01c80633a4741bd1461005a5780636cc811f8146100ab578063828986f1146100d85780639094a91e146100f8578063a7c6a10014610118578063b4bd6f4614610136575b600080fd5b34801561006657600080fd5b5061008e7f000000000000000000000000000000000000000000000000000000000000000081565b6040516001600160a01b0390911681526020015b60405180910390f35b3480156100b757600080fd5b506100cb6100c636600461049d565b610149565b6040516100a291906104bf565b3480156100e457600080fd5b5061008e6100f336600461050c565b6101bf565b34801561010457600080fd5b5061008e610113366004610536565b6101f7565b34801561012457600080fd5b506000546040519081526020016100a2565b61008e61014436600461049d565b610221565b6001600160a01b0381166000908152600160209081526040918290208054835181840281018401909452808452606093928301828280156101b357602002820191906000526020600020905b81546001600160a01b03168152600190910190602001808311610195575b50505050509050919050565b600160205281600052604060002081815481106101db57600080fd5b6000918252602090912001546001600160a01b03169150829050565b6000818154811061020757600080fd5b6000918252602090912001546001600160a01b0316905081565b60006001600160a01b03821661026e5760405162461bcd60e51b815260206004820152600d60248201526c0726563697069656e74203d203609c1b60448201526064015b60405180910390fd5b600034116102a85760405162461bcd60e51b81526020600482015260076024820152661b9bc81cd9595960ca1b6044820152606401610265565b6102d17f00000000000000000000000000000000000000000000000000000000000000006103e9565b60405163189acdbd60e31b81526001600160a01b0384811660048301529192509082169063c4d66de89034906024016000604051808303818588803b15801561031957600080fd5b505af115801561032d573d6000803e3d6000fd5b505060008054600181810183557f290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e56390910180546001600160a01b038089166001600160a01b03199283168117909355338086526020858152604080882080549788018155885296209094018054909216831790915592519288169550935091507f4dda9a6d0ba03769e9813c47681795a7210f951e6ef31e64772e13b9ea0f1406906103dc9034815260200190565b60405180910390a4919050565b6000808260601b9050604051733d602d80600a3d3981f3363d3d373d3d3d363d7360601b81528160148201526e5af43d82803e903d91602b57fd5bf360881b60288201526037816000f09250506001600160a01b03821661047b5760405162461bcd60e51b815260206004820152600c60248201526b18db1bdb994819985a5b195960a21b6044820152606401610265565b50919050565b80356001600160a01b038116811461049857600080fd5b919050565b6000602082840312156104af57600080fd5b6104b882610481565b9392505050565b6020808252825182820181905260009190848201906040850190845b818110156105005783516001600160a01b0316835292840192918401916001016104db565b50909695505050505050565b6000806040838503121561051f57600080fd5b61052883610481565b946020939093013593505050565b60006020828403121561054857600080fd5b503591905056fea2646970667358221220c48ee764ccdadae0dcb8633fbe9a0dee97af4753b8618c6ebb340ff16247c46464736f6c63430008180033';

// ─── Helpers (small + duplicated to avoid coupling with governance.js) ──

function vEncodeAddr(a) { return '000000000000000000000000' + a.slice(2).toLowerCase(); }
function vEncodeUint(n) { return BigInt(n).toString(16).padStart(64, '0'); }
function vShortAddr(a)  { return a.slice(0, 6) + '…' + a.slice(-4); }
function vIsAddr(s) { return /^0x[0-9a-fA-F]{40}$/.test((s || '').trim()); }

async function vRpcCall(to, data) {
  const r = await window.__rpcJsonPost(BURN_VAULT.RPC, {
    jsonrpc: '2.0', method: 'eth_call', params: [{ to, data }, 'latest'], id: 1,
  });
  return r || '0x';
}

// Wait for a tx receipt with a 5-minute timeout. Polls every 2s.
async function vWaitReceipt(txHash) {
  for (let i = 0; i < 150; i++) {
    await new Promise(r => setTimeout(r, 2000));
    try {
      const result = await window.__rpcJsonPost(BURN_VAULT.RPC, {
        jsonrpc: '2.0', method: 'eth_getTransactionReceipt', params: [txHash], id: 1,
      });
      if (result) return result;
    } catch { /* keep polling */ }
  }
  throw new Error('Receipt timeout (5 min). Check tx on BSCscan: ' + txHash);
}

// Read the BNB-USD price the trust-position section already fetched from
// CoinGecko (exposed on window.__prices). Waits up to 5 seconds for it to
// arrive; falls through to null if the page audit hasn't run yet.
async function vGetBnbPrice() {
  for (let i = 0; i < 50; i++) {
    const p = window.__prices && window.__prices.binancecoin;
    if (typeof p === 'number' && p > 0) return p;
    await new Promise(r => setTimeout(r, 100));
  }
  return null;
}

async function vConnect() {
  if (!window.ethereum) throw new Error('No wallet detected');
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  return accounts[0].toLowerCase();
}

async function vEnsureBSC() {
  if (!window.ethereum) throw new Error('No wallet');
  const cid = await window.ethereum.request({ method: 'eth_chainId' });
  if (parseInt(cid, 16) !== BURN_VAULT.CHAIN_ID) {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x' + BURN_VAULT.CHAIN_ID.toString(16) }],
    });
  }
}

async function vSendTx(from, to, data, valueHex, gasHex, gasPriceHex) {
  const params = { from, data };
  if (to)            params.to = to;
  if (valueHex)      params.value = valueHex;
  if (gasHex)        params.gas = gasHex;       // override gas-limit estimation
  if (gasPriceHex)   params.gasPrice = gasPriceHex;  // legacy tx — avoids EIP-1559
                                                       // tip-cap rejection on BSC
  return window.ethereum.request({ method: 'eth_sendTransaction', params: [params] });
}

// ─── Reads ──────────────────────────────────────────────────────────

async function vGetVaultCount() {
  if (!BURN_VAULT.FACTORY) return 0;
  try {
    const hex = await vRpcCall(BURN_VAULT.FACTORY, VAULT_SEL.vaultCount);
    return Number(BigInt('0x' + (hex.slice(2) || '0')));
  } catch { return 0; }
}

async function vGetVaultsOf(addr) {
  if (!BURN_VAULT.FACTORY || !addr) return [];
  try {
    const hex = await vRpcCall(BURN_VAULT.FACTORY, VAULT_SEL.vaultsOf + vEncodeAddr(addr));
    // Decode address[] return: 32-byte offset, 32-byte length, then N×32 bytes.
    const data = hex.slice(2);
    if (data.length < 128) return [];
    const len = Number(BigInt('0x' + data.slice(64, 128)));
    const out = [];
    for (let i = 0; i < len; i++) {
      const start = 128 + i * 64;
      out.push('0x' + data.slice(start + 24, start + 64));
    }
    return out;
  } catch { return []; }
}

// Read per-vault stats in parallel: LP balance + seconds until next harvest +
// recipient address (so the UI can label burn vs reward).
async function vGetVaultStats(vaultAddr) {
  try {
    const [lpHex, secsHex, recipHex] = await Promise.all([
      vRpcCall(vaultAddr, VAULT_SEL.lpHeld),
      vRpcCall(vaultAddr, VAULT_SEL.timeUntilHarvest),
      vRpcCall(vaultAddr, VAULT_SEL.recipient),
    ]);
    const lp   = BigInt(lpHex && lpHex !== '0x' ? lpHex : '0x0');
    const secs = Number(BigInt(secsHex && secsHex !== '0x' ? secsHex : '0x0'));
    const recipient = recipHex && recipHex.length >= 42
      ? '0x' + recipHex.slice(-40)
      : '';
    return { lp, secs, recipient };
  } catch { return { lp: 0n, secs: -1, recipient: '' }; }
}

function vFormat18(wei, dp) {
  if (wei === 0n) return '0';
  const s = wei.toString().padStart(19, '0');
  const whole = s.slice(0, -18).replace(/^0+/, '') || '0';
  const frac  = s.slice(-18).slice(0, dp || 6).replace(/0+$/, '');
  return frac ? whole + '.' + frac : whole;
}

function vFormatDuration(secs) {
  if (secs <= 0) return 'Ready now';
  const d = Math.floor(secs / 86400);
  const h = Math.floor((secs % 86400) / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (d > 0) return d + 'd ' + h + 'h';
  if (h > 0) return h + 'h ' + m + 'm';
  return m + 'm';
}

function vBigToFloat(big, decimals) {
  if (!decimals) return Number(big);
  const s = big.toString().padStart(decimals + 1, '0');
  return parseFloat(s.slice(0, -decimals) + '.' + s.slice(-decimals));
}

function vFmtUSD(v) {
  if (!isFinite(v) || v <= 0) return '—';
  if (v >= 1000) return '$' + v.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (v >= 1)    return '$' + v.toFixed(2);
  if (v >= 0.01) return '$' + v.toFixed(3);
  return '$' + v.toFixed(4);
}

// Read PCS RKL/WBNB pair: token0 (to map RKL/BNB sides) + reserves + LP supply.
// Cached for the lifetime of the page since reserves drift slowly and a stale
// estimate is fine for the row preview.
let _pairInfoCache = null;
async function vGetPairInfo() {
  if (_pairInfoCache) return _pairInfoCache;
  try {
    const [t0Hex, resHex, supHex] = await Promise.all([
      vRpcCall(BURN_VAULT.PAIR, '0x0dfe1681'),  // token0()
      vRpcCall(BURN_VAULT.PAIR, '0x0902f1ac'),  // getReserves()
      vRpcCall(BURN_VAULT.PAIR, '0x18160ddd'),  // totalSupply()
    ]);
    const t0 = '0x' + t0Hex.slice(-40);
    const data = resHex.slice(2);
    const r0 = BigInt('0x' + data.slice(0, 64));
    const r1 = BigInt('0x' + data.slice(64, 128));
    const rklIs0 = t0.toLowerCase() === BURN_VAULT.RKL.toLowerCase();
    _pairInfoCache = {
      rklReserve: rklIs0 ? r0 : r1,
      bnbReserve: rklIs0 ? r1 : r0,
      lpSupply:   BigInt(supHex),
    };
    return _pairInfoCache;
  } catch { return null; }
}

// ─── Deploy actions (deployer-only) ─────────────────────────────────

async function vDeployImplementation(statusEl) {
  const from = await vConnect();
  if (from !== BURN_VAULT.DEPLOYER) throw new Error('Only the deployer wallet can deploy.');
  await vEnsureBSC();
  statusEl.textContent = 'Sign the implementation deploy in your wallet…';
  const txHash = await vSendTx(from, null, VAULT_BYTECODE, null);
  statusEl.innerHTML = 'Tx sent: <a href="https://bscscan.com/tx/' + txHash + '" target="_blank">' + txHash.slice(0, 12) + '…</a>. Waiting for receipt…';
  const receipt = await vWaitReceipt(txHash);
  if (receipt.status === '0x0') throw new Error('Implementation deploy reverted.');
  return receipt.contractAddress;
}

async function vDeployFactory(implAddr, statusEl) {
  if (!vIsAddr(implAddr)) throw new Error('Implementation address looks invalid.');
  const from = await vConnect();
  if (from !== BURN_VAULT.DEPLOYER) throw new Error('Only the deployer wallet can deploy.');
  await vEnsureBSC();
  // Append ABI-encoded constructor arg (the impl address) to the creation code.
  const data = FACTORY_BYTECODE + vEncodeAddr(implAddr);
  statusEl.textContent = 'Sign the factory deploy in your wallet…';
  const txHash = await vSendTx(from, null, data, null);
  statusEl.innerHTML = 'Tx sent: <a href="https://bscscan.com/tx/' + txHash + '" target="_blank">' + txHash.slice(0, 12) + '…</a>. Waiting for receipt…';
  const receipt = await vWaitReceipt(txHash);
  if (receipt.status === '0x0') throw new Error('Factory deploy reverted.');
  return receipt.contractAddress;
}

// ─── Public action: harvest a vault (anyone, after 29-day cooldown) ─

async function vHarvest(vaultAddr, statusEl) {
  if (!vIsAddr(vaultAddr)) throw new Error('Vault address looks invalid.');
  const from = await vConnect();
  await vEnsureBSC();
  // Same gas params as createVault — harvest does removeLiquidity + swap +
  // addLiquidity + transfer + bounty call, similar gas profile (~400-500K).
  const gasHex      = '0xC3500';     // 800,000 gas
  const gasPriceHex = '0xB2D05E00';  // 3 gwei (BSC floor)
  statusEl.textContent = 'Sign harvest in your wallet…';
  const txHash = await vSendTx(from, vaultAddr, VAULT_SEL.harvest, null, gasHex, gasPriceHex);
  statusEl.innerHTML = 'Tx sent: <a href="https://bscscan.com/tx/' + txHash + '" target="_blank">' + txHash.slice(0, 12) + '…</a>. Waiting…';
  const receipt = await vWaitReceipt(txHash);
  if (receipt.status === '0x0') throw new Error('Harvest reverted (cooldown? yield too small?)');
  return txHash;
}

// ─── Public action: create a vault ──────────────────────────────────

async function vCreateVault(recipient, bnbWei, statusEl) {
  if (!BURN_VAULT.FACTORY) throw new Error('Factory not deployed yet.');
  if (!vIsAddr(recipient)) throw new Error('Recipient address looks invalid.');
  if (bnbWei <= 0n) throw new Error('Seed amount must be > 0.');

  const from = await vConnect();
  await vEnsureBSC();
  const data = VAULT_SEL.createVault + vEncodeAddr(recipient);
  const valueHex = '0x' + bnbWei.toString(16);
  // Explicit gas limit — MetaMask's simulator can't predict the clone+
  // initialize+swap+addLiquidity chain and falls back to absurd values that
  // exceed wallet caps. Real cost is ~350-400K; 800K leaves comfortable
  // headroom and only the actual gas used gets charged.
  const gasHex = '0xC3500';        // 800,000 gas limit
  // Force legacy tx with 3 gwei gas price. MetaMask's EIP-1559 default tip
  // is too low for BSC validators, which reject with "gas tip cap below
  // minimum." 3 gwei is comfortably above BSC's 1-gwei floor and tx fee
  // remains pennies.
  const gasPriceHex = '0xB2D05E00'; // 3 gwei
  statusEl.textContent = 'Sign the create-vault tx in your wallet (' + (Number(bnbWei) / 1e18).toFixed(4) + ' BNB seed)…';
  const txHash = await vSendTx(from, BURN_VAULT.FACTORY, data, valueHex, gasHex, gasPriceHex);
  statusEl.innerHTML = 'Tx sent: <a href="https://bscscan.com/tx/' + txHash + '" target="_blank">' + txHash.slice(0, 12) + '…</a>. Waiting for receipt…';
  const receipt = await vWaitReceipt(txHash);
  if (receipt.status === '0x0') throw new Error('Tx reverted.');
  // Find the VaultCreated event log (last topic = recipient, last 32 bytes of
  // last log is the new vault address from the indexed `vault` topic).
  let newVault = null;
  for (const log of (receipt.logs || [])) {
    if ((log.address || '').toLowerCase() === BURN_VAULT.FACTORY.toLowerCase() && log.topics && log.topics.length === 4) {
      newVault = '0x' + log.topics[2].slice(-40);
      break;
    }
  }
  return { txHash, vaultAddress: newVault };
}

// ─── Render ──────────────────────────────────────────────────────────

function vEl(tag, attrs, children) {
  const e = document.createElement(tag);
  if (attrs) for (const k in attrs) {
    if (k === 'style') Object.assign(e.style, attrs[k]);
    else if (k === 'onclick') e.onclick = attrs[k];
    else e.setAttribute(k, attrs[k]);
  }
  if (children) for (const c of [].concat(children)) {
    if (c == null) continue;
    e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return e;
}

async function renderVaultDeployPanel(connected) {
  const root = document.getElementById('vault-section');
  if (!root) return;
  root.innerHTML = '';

  const isDeployer = connected && connected.toLowerCase() === BURN_VAULT.DEPLOYER;
  const implMissing = !BURN_VAULT.IMPLEMENTATION;
  const factoryMissing = !BURN_VAULT.FACTORY;

  // Status banner: implementation + factory state
  const status = vEl('div', { class: 'vault-status' });
  status.innerHTML =
    'Implementation: ' + (BURN_VAULT.IMPLEMENTATION
      ? '<a href="https://bscscan.com/address/' + BURN_VAULT.IMPLEMENTATION + '" target="_blank"><code>' + vShortAddr(BURN_VAULT.IMPLEMENTATION) + '</code></a> ✓'
      : '<span style="color:var(--text-dim)">not deployed</span>') +
    ' &nbsp;·&nbsp; Factory: ' + (BURN_VAULT.FACTORY
      ? '<a href="https://bscscan.com/address/' + BURN_VAULT.FACTORY + '" target="_blank"><code>' + vShortAddr(BURN_VAULT.FACTORY) + '</code></a> ✓'
      : '<span style="color:var(--text-dim)">not deployed</span>');
  root.appendChild(status);

  // Deploy panel — only for deployer, only while addresses are missing
  if (isDeployer && (implMissing || factoryMissing)) {
    const panel = vEl('div', { class: 'vault-deploy-panel' });

    if (implMissing) {
      panel.innerHTML =
        '<div class="vault-deploy-headline">Step 1 — Deploy Implementation</div>' +
        '<div class="vault-deploy-sub">No constructor args. ~$1 in gas.</div>' +
        '<div class="vault-deploy-row">' +
          '<button class="cta sm" id="vault-deploy-impl-btn">Deploy Implementation</button>' +
          '<span class="vault-deploy-status" id="vault-deploy-impl-status"></span>' +
        '</div>';
    } else {
      panel.innerHTML =
        '<div class="vault-deploy-headline">Step 2 — Deploy Factory</div>' +
        '<div class="vault-deploy-sub">Constructor takes the implementation address. Pre-filled below.</div>' +
        '<div class="vault-deploy-row" style="flex-wrap:wrap;gap:8px">' +
          '<input type="text" id="vault-impl-input" value="' + BURN_VAULT.IMPLEMENTATION + '" style="flex:1;min-width:280px;padding:6px 10px;background:var(--bg-2);border:1px solid var(--hairline);color:var(--text);font-family:var(--mono);font-size:12px;border-radius:2px">' +
          '<button class="cta sm" id="vault-deploy-factory-btn">Deploy Factory</button>' +
        '</div>' +
        '<div class="vault-deploy-status" id="vault-deploy-factory-status" style="margin-top:8px"></div>';
    }

    root.appendChild(panel);

    if (implMissing) {
      document.getElementById('vault-deploy-impl-btn').onclick = async () => {
        const s = document.getElementById('vault-deploy-impl-status');
        try {
          const addr = await vDeployImplementation(s);
          s.innerHTML =
            '✓ Deployed at <a href="https://bscscan.com/address/' + addr + '" target="_blank"><code>' + addr + '</code></a>.<br>' +
            'Edit <code>build/assets/vault.js</code>: set <code>IMPLEMENTATION: \'' + addr + '\'</code> and push. Then refresh to deploy the factory.';
        } catch (e) { s.style.color = 'var(--red)'; s.textContent = '✗ ' + e.message; }
      };
    } else {
      document.getElementById('vault-deploy-factory-btn').onclick = async () => {
        const s = document.getElementById('vault-deploy-factory-status');
        const impl = document.getElementById('vault-impl-input').value.trim();
        try {
          const addr = await vDeployFactory(impl, s);
          s.innerHTML =
            '✓ Deployed at <a href="https://bscscan.com/address/' + addr + '" target="_blank"><code>' + addr + '</code></a>.<br>' +
            'Edit <code>build/assets/vault.js</code>: set <code>FACTORY: \'' + addr + '\'</code> and push. Then anyone can create their own Commonwealth.';
        } catch (e) { s.style.color = 'var(--red)'; s.textContent = '✗ ' + e.message; }
      };
    }
  }

  // Public Commonwealth panel — visible to ALL once factory exists
  if (BURN_VAULT.FACTORY) {
    const total = await vGetVaultCount();
    const totalLine = vEl('div', { class: 'vault-stats' });
    totalLine.innerHTML = 'Vaults created: <b>' + total.toLocaleString('en-US') + '</b>';
    root.appendChild(totalLine);

    // Pre-fill the seed input with ~$1 worth of BNB based on the price the
    // page already fetched from CoinGecko. Falls back to a sensible static
    // default if the audit hasn't run yet.
    const bnbPrice = await vGetBnbPrice();
    const defaultBnb = bnbPrice ? Math.max(0.0001, 1 / bnbPrice) : 0.002;
    const defaultStr = defaultBnb.toFixed(5);
    const priceNote = bnbPrice
      ? '≈ $1 at $' + bnbPrice.toLocaleString('en-US', { maximumFractionDigits: 0 }) + '/BNB'
      : 'price unavailable — adjust to ~$1';

    const create = vEl('div', { class: 'vault-create-panel' });
    create.innerHTML =
      '<div class="vault-create-headline">Create your Commonwealth</div>' +
      '<div class="vault-create-sub">Seed any amount of BNB (default ≈ $1). Half buys RKL, both sides go to the PCS RKL/WBNB pool. Every 29 days, anyone can call harvest — 40% of harvested RKL flows to your chosen recipient, the rest compounds back into the pool. Forever.</div>' +
      '<div class="vault-create-row" style="margin-top:14px">' +
        '<label class="vault-label" for="vault-bnb-amt">BNB seed amount</label>' +
        '<input type="number" id="vault-bnb-amt" min="0" step="0.0001" value="' + defaultStr + '" placeholder="e.g. ' + defaultStr + '">' +
        '<span class="vault-create-status" id="vault-bnb-note">' + priceNote + '</span>' +
      '</div>' +
      '<div class="vault-create-row">' +
        '<label class="vault-label">RKL recipient (where 40% of every harvest goes)</label>' +
        '<div class="vault-radio-group">' +
          '<label><input type="radio" name="vault-recipient" value="dead" checked> Burn (0x000…dEaD) — shrinks RKL supply</label>' +
          '<label><input type="radio" name="vault-recipient" value="self"> My wallet — gives me a periodic RKL drip</label>' +
          '<label><input type="radio" name="vault-recipient" value="custom"> Custom address: <input type="text" id="vault-recipient-custom" placeholder="0x..." style="margin-left:6px;font-family:var(--mono);font-size:11px;width:280px;padding:4px 8px;background:var(--bg-2);border:1px solid var(--hairline);color:var(--text);border-radius:2px" disabled></label>' +
        '</div>' +
      '</div>' +
      '<div class="vault-create-row" style="margin-top:14px">' +
        '<button class="cta" id="vault-create-btn">Create my Commonwealth</button>' +
        '<span class="vault-create-status" id="vault-create-status" style="margin-left:12px"></span>' +
      '</div>';
    root.appendChild(create);

    // Custom address input: enable only when the radio is selected
    const customRadio = create.querySelector('input[value="custom"]');
    const customInput = document.getElementById('vault-recipient-custom');
    create.querySelectorAll('input[name="vault-recipient"]').forEach(r => {
      r.addEventListener('change', () => { customInput.disabled = !customRadio.checked; });
    });

    document.getElementById('vault-create-btn').onclick = async () => {
      const s = document.getElementById('vault-create-status');
      try {
        s.style.color = '';
        const amtStr = document.getElementById('vault-bnb-amt').value;
        const bnbAmt = Number(amtStr);
        if (!bnbAmt || bnbAmt <= 0) throw new Error('Enter BNB amount > 0');
        const bnbWei = BigInt(Math.floor(bnbAmt * 1e18));

        const choice = create.querySelector('input[name="vault-recipient"]:checked').value;
        let recipient;
        if (choice === 'dead') recipient = BURN_VAULT.DEAD;
        else if (choice === 'self') recipient = await vConnect();
        else recipient = customInput.value.trim();

        const { txHash, vaultAddress } = await vCreateVault(recipient, bnbWei, s);
        s.innerHTML =
          '✓ Vault created' +
          (vaultAddress ? ' at <a href="https://bscscan.com/address/' + vaultAddress + '" target="_blank"><code>' + vShortAddr(vaultAddress) + '</code></a>' : '') +
          '. <a href="https://bscscan.com/tx/' + txHash + '" target="_blank">tx</a>';
        // Refresh "your vaults" panel after a moment
        setTimeout(() => renderVaultMine(), 3000);
      } catch (e) {
        s.style.color = 'var(--red)';
        s.textContent = '✗ ' + e.message;
      }
    };

    // Render "your vaults" if connected
    if (connected) {
      const mine = vEl('div', { id: 'vault-mine-list' });
      root.appendChild(mine);
      renderVaultMine(connected);
    }
  }
}

async function renderVaultMine(connected) {
  const wrap = document.getElementById('vault-mine-list');
  if (!wrap) return;
  if (!connected) connected = (window.ethereum && (await window.ethereum.request({ method: 'eth_accounts' }))[0] || '').toLowerCase();
  if (!connected) { wrap.innerHTML = ''; return; }

  const vaults = await vGetVaultsOf(connected);
  if (!vaults.length) {
    wrap.innerHTML = '<div class="vault-mine-empty">You have not created any Commonwealth vaults yet.</div>';
    return;
  }

  // Fetch per-vault stats + shared pricing context in parallel.
  const [stats, pair, bnbPrice] = await Promise.all([
    Promise.all(vaults.map(v => vGetVaultStats(v))),
    vGetPairInfo(),
    vGetBnbPrice(),
  ]);

  // Derive RKL price from pair reserves: price_rkl = bnb_per_rkl × bnb_usd.
  let rklPrice = null;
  if (pair && bnbPrice && pair.rklReserve > 0n) {
    const rklRes = vBigToFloat(pair.rklReserve, 18);
    const bnbRes = vBigToFloat(pair.bnbReserve, 18);
    rklPrice = rklRes > 0 ? (bnbRes / rklRes) * bnbPrice : null;
  }

  // Per-cycle constants from the contract (basis points, /10000).
  const LP_HARVEST = 0.004;   // 0.4% of LP per cycle
  const BOUNTY     = 0.10;    // 10% of harvested BNB → caller
  const RECIPIENT  = 0.40;    // 40% of harvested RKL → recipient

  let html =
    '<div class="vault-mine-headline">Your vaults · ' + vaults.length + '</div>' +
    '<div class="vault-mine-sub">Harvest is permissionless — anyone can call it after the 29-day cooldown and gets 10% of the harvested BNB as a bounty.</div>' +
    '<div class="vault-mine-list">';
  const deadLower = BURN_VAULT.DEAD.toLowerCase();
  const ownerLower = (connected || '').toLowerCase();

  for (let i = 0; i < vaults.length; i++) {
    const v = vaults[i];
    const { lp, secs, recipient } = stats[i];
    const ready = secs === 0;
    const timeStr = secs < 0 ? 'unknown' : vFormatDuration(secs);

    // Classify the recipient so the UI tells burn from reward at a glance.
    const recipLower = (recipient || '').toLowerCase();
    const isBurn = recipLower === deadLower;
    const isSelf = !!recipLower && recipLower === ownerLower;
    const modeBadge = !recipLower
      ? ''
      : isBurn
        ? '<span class="vault-mode vault-mode-burn">🔥 Burn</span>'
        : isSelf
          ? '<span class="vault-mode vault-mode-earn">💰 Self-reward</span>'
          : '<span class="vault-mode vault-mode-earn">💰 Reward → ' + vShortAddr(recipient) + '</span>';

    // Translate vault's LP balance into underlying RKL+BNB and dollar values.
    let lpUsd = null, bountyUsd = null, recipientUsd = null;
    if (pair && pair.lpSupply > 0n && lp > 0n && bnbPrice) {
      const lpFloat   = vBigToFloat(lp, 18);
      const supFloat  = vBigToFloat(pair.lpSupply, 18);
      const share     = lpFloat / supFloat;
      const rklUnder  = share * vBigToFloat(pair.rklReserve, 18);
      const bnbUnder  = share * vBigToFloat(pair.bnbReserve, 18);
      lpUsd     = bnbUnder * bnbPrice + rklUnder * (rklPrice || 0);
      bountyUsd = bnbUnder * LP_HARVEST * BOUNTY * bnbPrice;
      if (rklPrice != null) recipientUsd = rklUnder * LP_HARVEST * RECIPIENT * rklPrice;
    }
    const lpStr = vFormat18(lp, 4) + ' LP' + (lpUsd != null ? ' (≈ ' + vFmtUSD(lpUsd) + ')' : '');
    const bountyStr = bountyUsd != null ? 'Bounty ≈ ' + vFmtUSD(bountyUsd) : '';
    const recipLabel = isBurn ? 'Burn' : 'Reward';
    const recipStr  = recipientUsd != null ? recipLabel + ' ≈ ' + vFmtUSD(recipientUsd) : '';

    const btn = ready
      ? '<button class="cta sm vault-harvest-btn" data-vault="' + v + '">Harvest →</button>'
      : '<button class="cta sm vault-harvest-btn" data-vault="' + v + '" disabled title="Cooldown active">Harvest</button>';
    html +=
      '<div class="vault-mine-row" id="vault-row-' + v + '">' +
        '<div class="vault-mine-row-main">' +
          '<a href="https://bscscan.com/address/' + v + '" target="_blank"><code>' + vShortAddr(v) + '</code></a>' +
          modeBadge +
          '<span class="vault-mine-stat">' + lpStr + '</span>' +
          '<span class="vault-mine-stat ' + (ready ? 'vault-ready' : '') + '">' +
            (ready ? '⚡ Ready' : 'Next: ' + timeStr) +
          '</span>' +
          (bountyStr ? '<span class="vault-mine-stat">' + bountyStr + '</span>' : '') +
          (recipStr  ? '<span class="vault-mine-stat">' + recipStr  + '</span>' : '') +
        '</div>' +
        '<div class="vault-mine-row-actions">' +
          btn +
          '<span class="vault-harvest-status" id="vault-harvest-status-' + v + '"></span>' +
        '</div>' +
      '</div>';
  }
  html += '</div>';
  wrap.innerHTML = html;

  // Wire harvest buttons.
  wrap.querySelectorAll('.vault-harvest-btn').forEach(btn => {
    btn.onclick = async () => {
      const vaultAddr = btn.getAttribute('data-vault');
      const s = document.getElementById('vault-harvest-status-' + vaultAddr);
      btn.disabled = true;
      try {
        s.style.color = '';
        const txHash = await vHarvest(vaultAddr, s);
        s.innerHTML =
          '✓ Harvested. <a href="https://bscscan.com/tx/' + txHash + '" target="_blank">tx</a>';
        // Refresh row stats after a short delay so chain state catches up.
        setTimeout(() => renderVaultMine(connected), 4000);
      } catch (e) {
        s.style.color = 'var(--red)';
        s.textContent = '✗ ' + e.message;
        btn.disabled = false;
      }
    };
  });
}

async function runVaultUI() {
  let connected = '';
  if (window.ethereum) {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      connected = (accounts[0] || '').toLowerCase();
    } catch {}
  }
  await renderVaultDeployPanel(connected);

  // Re-render when wallet account changes
  if (window.ethereum && !window._vaultListenersWired) {
    window._vaultListenersWired = true;
    window.ethereum.on('accountsChanged', () => runVaultUI().catch(console.warn));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => runVaultUI().catch(console.warn));
} else {
  runVaultUI().catch(console.warn);
}
