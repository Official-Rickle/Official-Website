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
  IMPLEMENTATION: '0x7C5B5b39bF7e5a6922ABb74E08317f6f9fA9540a',
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

const VAULT_BYTECODE = '0x6080604052600160035534801561001557600080fd5b506113bc806100256000396000f3fe6080604052600436106101185760003560e01c8063918f8674116100a0578063bd134ce411610064578063bd134ce4146102e7578063c4d66de8146102fd578063cdb225f414610310578063d75901f414610325578063f1a392da1461033a57600080fd5b8063918f867414610257578063ace3a8a71461026d578063b1aac8f214610295578063b621a237146102aa578063bace6b10146102d257600080fd5b806332fe7b26116100e757806332fe7b26146101a35780634641257d146101e357806366d003ac146101fa57806377f8bb6d1461021a5780638dd950021461022f57600080fd5b8063027678f3146101245780630d9a34a21461014d5780630e176ca014610164578063158ef93e1461017957600080fd5b3661011f57005b600080fd5b34801561013057600080fd5b5061013a6103e881565b6040519081526020015b60405180910390f35b34801561015957600080fd5b5061013a62263b8081565b34801561017057600080fd5b5061013a610350565b34801561018557600080fd5b506002546101939060ff1681565b6040519015158152602001610144565b3480156101af57600080fd5b506101cb7310ed43c718714eb63d5aa57b78b54704e256024e81565b6040516001600160a01b039091168152602001610144565b3480156101ef57600080fd5b506101f8610386565b005b34801561020657600080fd5b506000546101cb906001600160a01b031681565b34801561022657600080fd5b5061013a603281565b34801561023b57600080fd5b506101cb73bb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c81565b34801561026357600080fd5b5061013a61271081565b34801561027957600080fd5b506101cb734dce12240b37879610601eb70685d396faf0641781565b3480156102a157600080fd5b5061013a610bd2565b3480156102b657600080fd5b506101cb73eca15e1bbff172d545dd6325f3bae7b73790673781565b3480156102de57600080fd5b5061013a610c4d565b3480156102f357600080fd5b5061013a610fa081565b6101f861030b366004611191565b610c60565b34801561031c57600080fd5b5061013a611174565b34801561033157600080fd5b5061013a602881565b34801561034657600080fd5b5061013a60015481565b60008062263b8060015461036491906111d7565b90508042101561037d5761037842826111f0565b610380565b60005b91505090565b6003546001146103c95760405162461bcd60e51b81526020600482015260096024820152681c99595b9d1c985b9d60ba1b60448201526064015b60405180910390fd5b600260038190555460ff166104125760405162461bcd60e51b815260206004820152600f60248201526e1b9bdd081a5b9a5d1a585b1a5e9959608a1b60448201526064016103c0565b62263b8060015461042391906111d7565b42101561045d5760405162461bcd60e51b815260206004820152600860248201526731b7b7b63237bbb760c11b60448201526064016103c0565b426001556040516370a0823160e01b8152306004820152600090734dce12240b37879610601eb70685d396faf06417906370a0823190602401602060405180830381865afa1580156104b3573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906104d79190611203565b905060006127106104e960288461121c565b6104f39190611233565b90506000811161052d5760405162461bcd60e51b815260206004820152600560248201526406e6f204c560dc1b60448201526064016103c0565b60405163095ea7b360e01b81527310ed43c718714eb63d5aa57b78b54704e256024e600482015260248101829052734dce12240b37879610601eb70685d396faf064179063095ea7b3906044016020604051808303816000875af1158015610599573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906105bd9190611255565b6105fd5760405162461bcd60e51b8152602060048201526011602482015270185c1c1c9bdd994813140819985a5b1959607a1b60448201526064016103c0565b6000807310ed43c718714eb63d5aa57b78b54704e256024e6302751cec73eca15e1bbff172d545dd6325f3bae7b7379067378584803061063f426102586111d7565b6040518763ffffffff1660e01b815260040161066096959493929190611277565b60408051808303816000875af115801561067e573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906106a291906112b2565b909250905060006127106106b8610fa08561121c565b6106c29190611233565b60005460405163a9059cbb60e01b81526001600160a01b0390911660048201526024810182905290915073eca15e1bbff172d545dd6325f3bae7b7379067379063a9059cbb906044016020604051808303816000875af115801561072a573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061074e9190611255565b61079a5760405162461bcd60e51b815260206004820152601960248201527f7472616e7366657220726563697069656e74206661696c65640000000000000060448201526064016103c0565b60006127106107ab6103e88561121c565b6107b59190611233565b9050600081116107fb5760405162461bcd60e51b81526020600482015260116024820152701a185c9d995cdd081d1bdbc81cdb585b1b607a1b60448201526064016103c0565b600061271060026108106103e8610fa06111f0565b61081a9190611233565b610824908661121c565b61082e9190611233565b9050801561095d5760408051600280825260608201835260009260208301908036833701905050905073bb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c8160008151811061087f5761087f6112d6565b60200260200101906001600160a01b031690816001600160a01b03168152505073eca15e1bbff172d545dd6325f3bae7b737906737816001815181106108c7576108c76112d6565b6001600160a01b03909216602092830291909101909101527310ed43c718714eb63d5aa57b78b54704e256024e63b6f9de95836000843061090a426102586111d7565b6040518663ffffffff1660e01b815260040161092994939291906112ec565b6000604051808303818588803b15801561094257600080fd5b505af1158015610956573d6000803e3d6000fd5b5050505050505b6040516370a0823160e01b815230600482015260009073eca15e1bbff172d545dd6325f3bae7b737906737906370a0823190602401602060405180830381865afa1580156109af573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906109d39190611203565b905060006109e184476111f0565b905060006127106109f36032826111f0565b6109fd908561121c565b610a079190611233565b90506000612710610a196032826111f0565b610a23908561121c565b610a2d9190611233565b905060007310ed43c718714eb63d5aa57b78b54704e256024e63f305d7198573eca15e1bbff172d545dd6325f3bae7b73790673788878730610a71426102586111d7565b6040518863ffffffff1660e01b8152600401610a9296959493929190611277565b60606040518083038185885af1158015610ab0573d6000803e3d6000fd5b50505050506040513d601f19601f82011682018060405250810190610ad59190611358565b6040519093506000925033915089908381818185875af1925050503d8060008114610b1c576040519150601f19603f3d011682016040523d82523d6000602084013e610b21565b606091505b5050905080610b665760405162461bcd60e51b8152602060048201526011602482015270189bdd5b9d1e481c185e4819985a5b1959607a1b60448201526064016103c0565b604080518d8152602081018d90529081018b9052606081018a90526080810189905260a0810183905233907fd3871e10847aba2b6ebf3041d29f0ac7707274f1b12ba764093e1cf187aa00589060c00160405180910390a2505060016003555050505050505050505050565b6040516370a0823160e01b8152306004820152600090734dce12240b37879610601eb70685d396faf06417906370a0823190602401602060405180830381865afa158015610c24573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610c489190611203565b905090565b600062263b80600154610c4891906111d7565b600354600114610c9e5760405162461bcd60e51b81526020600482015260096024820152681c99595b9d1c985b9d60ba1b60448201526064016103c0565b600260038190555460ff1615610cec5760405162461bcd60e51b8152602060048201526013602482015272185b1c9958591e481a5b9a5d1a585b1a5e9959606a1b60448201526064016103c0565b6001600160a01b038116610d325760405162461bcd60e51b815260206004820152600d60248201526c0726563697069656e74203d203609c1b60448201526064016103c0565b60003411610d6c5760405162461bcd60e51b81526020600482015260076024820152661b9bc81cd9595960ca1b60448201526064016103c0565b60028054600160ff199091168117909155600080546001600160a01b0319166001600160a01b03841617905542905560405163095ea7b360e01b81527310ed43c718714eb63d5aa57b78b54704e256024e6004820152600019602482015273eca15e1bbff172d545dd6325f3bae7b7379067379063095ea7b3906044016020604051808303816000875af1158015610e08573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610e2c9190611255565b610e6d5760405162461bcd60e51b8152602060048201526012602482015271185c1c1c9bdd99481492d30819985a5b195960721b60448201526064016103c0565b6000610e7a600234611233565b90506000610e8882346111f0565b604080516002808252606082018352929350600092909160208301908036833701905050905073bb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c81600081518110610ed657610ed66112d6565b60200260200101906001600160a01b031690816001600160a01b03168152505073eca15e1bbff172d545dd6325f3bae7b73790673781600181518110610f1e57610f1e6112d6565b6001600160a01b03909216602092830291909101909101527310ed43c718714eb63d5aa57b78b54704e256024e63b6f9de958460008430610f61426102586111d7565b6040518663ffffffff1660e01b8152600401610f8094939291906112ec565b6000604051808303818588803b158015610f9957600080fd5b505af1158015610fad573d6000803e3d6000fd5b50506040516370a0823160e01b81523060048201526000935073eca15e1bbff172d545dd6325f3bae7b73790673792506370a082319150602401602060405180830381865afa158015611004573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906110289190611203565b9050600061271061103a6032826111f0565b611044908461121c565b61104e9190611233565b905060006127106110606032826111f0565b61106a908761121c565b6110749190611233565b905060007310ed43c718714eb63d5aa57b78b54704e256024e63f305d7198773eca15e1bbff172d545dd6325f3bae7b737906737878787306110b8426102586111d7565b6040518863ffffffff1660e01b81526004016110d996959493929190611277565b60606040518083038185885af11580156110f7573d6000803e3d6000fd5b50505050506040513d601f19601f8201168201806040525081019061111c9190611358565b60408051348152602081018390529194506001600160a01b038c1693507f0f91882b50d9330af0b1d4998e6af7f2eaee90ce7e77ea54fea089af166d021d92500160405180910390a250506001600355505050505050565b60026111846103e8610fa06111f0565b61118e9190611233565b81565b6000602082840312156111a357600080fd5b81356001600160a01b03811681146111ba57600080fd5b9392505050565b634e487b7160e01b600052601160045260246000fd5b808201808211156111ea576111ea6111c1565b92915050565b818103818111156111ea576111ea6111c1565b60006020828403121561121557600080fd5b5051919050565b80820281158282048414176111ea576111ea6111c1565b60008261125057634e487b7160e01b600052601260045260246000fd5b500490565b60006020828403121561126757600080fd5b815180151581146111ba57600080fd5b6001600160a01b039687168152602081019590955260408501939093526060840191909152909216608082015260a081019190915260c00190565b600080604083850312156112c557600080fd5b505080516020909101519092909150565b634e487b7160e01b600052603260045260246000fd5b60006080820186835260206080602085015281875180845260a08601915060208901935060005b818110156113385784516001600160a01b031683529383019391830191600101611313565b50506001600160a01b039690961660408501525050506060015292915050565b60008060006060848603121561136d57600080fd5b835192506020840151915060408401519050925092509256fea26469706673582212202ffdc793aa82750939dd54e08465e8a6a51c5cf5affce66bd12f6047c449209d64736f6c63430008180033';

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

async function vSendTx(from, to, data, valueHex) {
  const params = { from, data };
  if (to)        params.to = to;
  if (valueHex)  params.value = valueHex;
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

// ─── Public action: create a vault ──────────────────────────────────

async function vCreateVault(recipient, bnbWei, statusEl) {
  if (!BURN_VAULT.FACTORY) throw new Error('Factory not deployed yet.');
  if (!vIsAddr(recipient)) throw new Error('Recipient address looks invalid.');
  if (bnbWei <= 0n) throw new Error('Seed amount must be > 0.');

  const from = await vConnect();
  await vEnsureBSC();
  const data = VAULT_SEL.createVault + vEncodeAddr(recipient);
  const valueHex = '0x' + bnbWei.toString(16);
  statusEl.textContent = 'Sign the create-vault tx in your wallet (' + (Number(bnbWei) / 1e18).toFixed(4) + ' BNB seed)…';
  const txHash = await vSendTx(from, BURN_VAULT.FACTORY, data, valueHex);
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
  let html = '<div class="vault-mine-headline">Your vaults · ' + vaults.length + '</div><div class="vault-mine-list">';
  for (const v of vaults) {
    html +=
      '<div class="vault-mine-row">' +
        '<a href="https://bscscan.com/address/' + v + '" target="_blank"><code>' + vShortAddr(v) + '</code></a>' +
      '</div>';
  }
  html += '</div>';
  wrap.innerHTML = html;
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
