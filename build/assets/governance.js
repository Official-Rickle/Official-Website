
// ============================================================
//  AHWA Governance — proposals/votes/vetoes via on-chain logs
//  v2: proposal title/body live in event data; no IPFS, no
//  off-chain dependencies, no third-party services.
// ============================================================

const GOV = {
  // Populated post-deploy. The Deploy panel writes here + localStorage.
  // Hardcode after first deploy by editing this constant.
  CONTRACT: '',
  CHAIN_ID: 56,
  RPC: RPC.BSC,
  AHWA: '0x3A81caafeeDCF2D743Be893858cDa5AcDBF88c11',
  AHWA_DEC: 18,
  SAFE: SAFE,
  // dreamingrainbow's primary disclosed address. Lower-cased for compare.
  DEPLOYER: '0xf9b9ee3b0301b511cd5aa4b8d039f63df19c615a',
  // AHWA holders to subtract from the eligible-voter denominator: every
  // LP/staking pool that holds AHWA. Page reads each one's balance at the
  // proposal block to drop them from the count if they hold. Lower-cased.
  EXCLUDE_LP: [
    '0x6745ffb470378acde8330735f841f6746da1fe77', // CryptoSwap AHWA→RKL Pool A
    '0xa0ec264b63915596855d5e1cd7db58614d437c17', // CryptoSwap AHWA→RKL Pool B
    '0x89d958a02ba82c55202af0cd6555bdd954de5595', // PancakeSwap v2 AHWA/WIN
    '0x86e9dccaee2f069fc6e3935e48e54cca05d52775', // MasterChief AHWA/WIN
    '0xca89bfb1267dacc407abc29981de5616fafe2bcd', // CryptoSwap AHWA/WIN
    '0x0c89c0407775dd89b12918b9c0aa42bf96518820', // Locked Team Finance
    '0x407993575c91ce7643a4d4ccacc9a98c36ee1bbe', // Locked PinkLock02
  ],
  TOPICS: {
    ProposalSubmitted: '0x833ebfc4caa57bc0c26f186ae298f99d5ea1e8bb78cff902ab65c5a5183ad520',
    VoteSubmitted:     '0x07361804863bf71cc6ac93889f56c096b888fc3c48955b528c721a44d35b8b56',
    VetoSubmitted:     '0x1eb63fe99de0e8342699883f79e9b01483f8041f0debc62b3d2825b80a8a0348',
  },
  // Total AHWA holders per BSCscan. Update when new holders join. The page
  // subtracts multisig safe + LPs (per their balance at the proposal block)
  // to get the eligible-voter denominator for the 51% threshold.
  HOLDER_COUNT: 40,
  // EIP-712 domain — must match what the contract derives in its constructor.
  DOMAIN: { name: 'AhwaGovernance', version: '1', chainId: 56 },
  // On-chain limits enforced by the contract.
  TITLE_MAX: 200,
  BODY_MAX: 90000,
};

const GOV_BYTECODE          = '0x60a060405234801561001057600080fd5b50604080518082018252600e81526d41687761476f7665726e616e636560901b6020918201528151808301835260018152603160f81b9082015281517f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f918101919091527fbdc0cc27a32387b6a2d732acb1549cf2460c3d42e0aecb8baa8b61f8fb98d34d918101919091527fc89efdaa54c0f20c7adf612882df0950f5a951637e0307cdcb4c672f298b8bc660608201524660808201523060a082015260c00160408051601f19818403018152919052805160209091012060805260805161115661010e600039600081816101ac0152610b8601526111566000f3fe608060405234801561001057600080fd5b50600436106101005760003560e01c8063579baff611610097578063df439eb711610066578063df439eb7146102ca578063f951e067146102df578063fdbd1d99146102f2578063ffa1ad741461030557600080fd5b8063579baff61461024f578063a3f4df7e1461027d578063c3264950146102b7578063da35c664146102c157600080fd5b80633a7ed8a0116100d35780633a7ed8a0146101ce5780633ed38daf146101f957806345ddc85d1461020c578063484f35901461024757600080fd5b8063013cf08b14610105578063074dbaa61461016c5780633173cd261461018f5780633644e515146101a7575b600080fd5b610140610113366004610d8a565b6001602052600090815260409020546001600160a01b03811690600160a01b90046001600160401b031682565b604080516001600160a01b0390931683526001600160401b039091166020830152015b60405180910390f35b61017f61017a366004610d8a565b610325565b6040519015158152602001610163565b6101996203f48081565b604051908152602001610163565b6101997f000000000000000000000000000000000000000000000000000000000000000081565b6101996101dc366004610dbf565b600360209081526000928352604080842090915290825290205481565b610199610207366004610d8a565b610392565b61023a61021a366004610dbf565b600260209081526000928352604080842090915290825290205460ff1681565b6040516101639190610e01565b61019960c881565b61017f61025d366004610dbf565b600460209081526000928352604080842090915290825290205460ff1681565b6102aa6040518060400160405280600e81526020016d41687761476f7665726e616e636560901b81525081565b6040516101639190610e29565b61019962015f9081565b61019960005481565b6102dd6102d8366004610ec0565b6103fe565b005b6101996102ed366004610f3e565b6106b2565b6102dd610300366004610fe8565b610939565b6102aa604051806040016040528060018152602001603160f81b81525081565b60008181526001602090815260408083208151808301909252546001600160a01b0381168252600160a01b90046001600160401b0316918101829052901580159061038b57506203f48081602001516001600160401b03166103879190611057565b4211155b9392505050565b60008181526001602090815260408083208151808301909252546001600160a01b0381168252600160a01b90046001600160401b031691810182905290156103f5576203f48081602001516001600160401b03166103f09190611057565b61038b565b60009392505050565b60008481526001602090815260408083208151808301909252546001600160a01b0381168252600160a01b90046001600160401b0316918101829052910361047b5760405162461bcd60e51b815260206004820152600b60248201526a1b9bc81c1c9bdc1bdcd85b60aa1b60448201526064015b60405180910390fd5b6203f48081602001516001600160401b03166104979190611057565b4211156104d65760405162461bcd60e51b815260206004820152600d60248201526c1d9bdd1a5b99c818db1bdcd959609a1b6044820152606401610472565b60008581526003602090815260408083206001600160a01b038b16845290915290205484146105335760405162461bcd60e51b8152602060048201526009602482015268626164206e6f6e636560b81b6044820152606401610472565b604080517f76f00c34814dcdf8ad76ca36404bc0e9c282258e4bfb0732f600dd298436925e60208201526001600160a01b0389169181019190915286151560608201526080810186905260a0810185905260009060c001604051602081830303815290604052805190602001209050876001600160a01b03166105bf6105b883610b76565b8686610bd4565b6001600160a01b0316146105e55760405162461bcd60e51b815260040161047290611070565b866105f15760026105f4565b60015b60008781526002602081815260408084206001600160a01b038e1685529091529091208054909160ff1990911690600190849081111561063657610636610deb565b021790555060008681526003602090815260408083206001600160a01b038c168085529083529281902060018901905580518a1515815291820188905242908201528791907f07361804863bf71cc6ac93889f56c096b888fc3c48955b528c721a44d35b8b569060600160405180910390a35050505050505050565b6000858481158015906106c6575060c88211155b6107055760405162461bcd60e51b815260206004820152601060248201526f0c4c2c840e8d2e8d8ca40d8cadccee8d60831b6044820152606401610472565b600081118015610718575062015f908111155b6107565760405162461bcd60e51b815260206004820152600f60248201526e0c4c2c840c4dec8f240d8cadccee8d608b1b6044820152606401610472565b60007f961208a5c428f6bc781e33ba2c03a755d198f4d7a02ea68fd9bd8a97b95c98de8b8b8b60405161078a929190611094565b60405180910390208a8a6040516107a2929190611094565b6040519081900381206107d9949392916020019384526001600160a01b039290921660208401526040830152606082015260800190565b6040516020818303038152906040528051906020012090508a6001600160a01b031661080e61080783610b76565b8888610bd4565b6001600160a01b0316146108345760405162461bcd60e51b815260040161047290611070565b60008081546001019190508190555060008054905060405180604001604052808d6001600160a01b03168152602001426001600160401b03168152506001600083815260200190815260200160002060008201518160000160006101000a8154816001600160a01b0302191690836001600160a01b0316021790555060208201518160000160146101000a8154816001600160401b0302191690836001600160401b031602179055509050508b6001600160a01b0316817f833ebfc4caa57bc0c26f186ae298f99d5ea1e8bb78cff902ab65c5a5183ad5208d8d8d8d426040516109229594939291906110cd565b60405180910390a39b9a5050505050505050505050565b60008381526001602090815260408083208151808301909252546001600160a01b0381168252600160a01b90046001600160401b031691810182905291036109b15760405162461bcd60e51b815260206004820152600b60248201526a1b9bc81c1c9bdc1bdcd85b60aa1b6044820152606401610472565b6203f48081602001516001600160401b03166109cd9190611057565b421115610a0c5760405162461bcd60e51b815260206004820152600d60248201526c1d9bdd1a5b99c818db1bdcd959609a1b6044820152606401610472565b60008481526004602090815260408083206001600160a01b038916845290915290205460ff1615610a705760405162461bcd60e51b815260206004820152600e60248201526d185b1c9958591e481d995d1bd95960921b6044820152606401610472565b604080517f0dbc148f2983dfa2e4efbfb65ddd8fa1c7ac784026c2450b2da6c4e777fe2d3260208201526001600160a01b0387169181019190915260608101859052600090608001604051602081830303815290604052805190602001209050856001600160a01b0316610ae66105b883610b76565b6001600160a01b031614610b0c5760405162461bcd60e51b815260040161047290611070565b60008581526004602090815260408083206001600160a01b038a1680855290835292819020805460ff19166001179055514281528792917f1eb63fe99de0e8342699883f79e9b01483f8041f0debc62b3d2825b80a8a0348910160405180910390a3505050505050565b60405161190160f01b60208201527f0000000000000000000000000000000000000000000000000000000000000000602282015260428101829052600090606201604051602081830303815290604052805190602001209050919050565b600060418214610c175760405162461bcd60e51b815260206004820152600e60248201526d0c4c2c840e6d2ce40d8cadccee8d60931b6044820152606401610472565b82356020840135604085013560001a601b811015610c3d57610c3a601b82611107565b90505b8060ff16601b1480610c5257508060ff16601c145b610c865760405162461bcd60e51b81526020600482015260056024820152643130b2103b60d91b6044820152606401610472565b7f7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0821115610cde5760405162461bcd60e51b8152602060048201526005602482015264626164207360d81b6044820152606401610472565b604080516000808252602082018084528a905260ff841692820192909252606081018590526080810184905260019060a0016020604051602081039080840390855afa158015610d32573d6000803e3d6000fd5b5050604051601f1901519150506001600160a01b038116610d7f5760405162461bcd60e51b81526020600482015260076024820152666261642073696760c81b6044820152606401610472565b979650505050505050565b600060208284031215610d9c57600080fd5b5035919050565b80356001600160a01b0381168114610dba57600080fd5b919050565b60008060408385031215610dd257600080fd5b82359150610de260208401610da3565b90509250929050565b634e487b7160e01b600052602160045260246000fd5b6020810160038310610e2357634e487b7160e01b600052602160045260246000fd5b91905290565b60006020808352835180602085015260005b81811015610e5757858101830151858201604001528201610e3b565b506000604082860101526040601f19601f8301168501019250505092915050565b60008083601f840112610e8a57600080fd5b5081356001600160401b03811115610ea157600080fd5b602083019150836020828501011115610eb957600080fd5b9250929050565b60008060008060008060a08789031215610ed957600080fd5b610ee287610da3565b955060208701358015158114610ef757600080fd5b9450604087013593506060870135925060808701356001600160401b03811115610f2057600080fd5b610f2c89828a01610e78565b979a9699509497509295939492505050565b60008060008060008060006080888a031215610f5957600080fd5b610f6288610da3565b965060208801356001600160401b0380821115610f7e57600080fd5b610f8a8b838c01610e78565b909850965060408a0135915080821115610fa357600080fd5b610faf8b838c01610e78565b909650945060608a0135915080821115610fc857600080fd5b50610fd58a828b01610e78565b989b979a50959850939692959293505050565b60008060008060608587031215610ffe57600080fd5b61100785610da3565b93506020850135925060408501356001600160401b0381111561102957600080fd5b61103587828801610e78565b95989497509550505050565b634e487b7160e01b600052601160045260246000fd5b8082018082111561106a5761106a611041565b92915050565b6020808252600a90820152693130b21039b4b3b732b960b11b604082015260600190565b8183823760009101908152919050565b81835281816020850137506000828201602090810191909152601f909101601f19169091010190565b6060815260006110e16060830187896110a4565b82810360208401526110f48186886110a4565b9150508260408301529695505050505050565b60ff818116838216019081111561106a5761106a61104156fea26469706673582212204c4b9bda24982367400a680a617a3569daee6be68cb09863bc5389ca2662e55f64736f6c63430008180033';
const GOV_DEPLOYED_BYTECODE = '0x608060405234801561001057600080fd5b50600436106101005760003560e01c8063579baff611610097578063df439eb711610066578063df439eb7146102ca578063f951e067146102df578063fdbd1d99146102f2578063ffa1ad741461030557600080fd5b8063579baff61461024f578063a3f4df7e1461027d578063c3264950146102b7578063da35c664146102c157600080fd5b80633a7ed8a0116100d35780633a7ed8a0146101ce5780633ed38daf146101f957806345ddc85d1461020c578063484f35901461024757600080fd5b8063013cf08b14610105578063074dbaa61461016c5780633173cd261461018f5780633644e515146101a7575b600080fd5b610140610113366004610d8a565b6001602052600090815260409020546001600160a01b03811690600160a01b90046001600160401b031682565b604080516001600160a01b0390931683526001600160401b039091166020830152015b60405180910390f35b61017f61017a366004610d8a565b610325565b6040519015158152602001610163565b6101996203f48081565b604051908152602001610163565b6101997f000000000000000000000000000000000000000000000000000000000000000081565b6101996101dc366004610dbf565b600360209081526000928352604080842090915290825290205481565b610199610207366004610d8a565b610392565b61023a61021a366004610dbf565b600260209081526000928352604080842090915290825290205460ff1681565b6040516101639190610e01565b61019960c881565b61017f61025d366004610dbf565b600460209081526000928352604080842090915290825290205460ff1681565b6102aa6040518060400160405280600e81526020016d41687761476f7665726e616e636560901b81525081565b6040516101639190610e29565b61019962015f9081565b61019960005481565b6102dd6102d8366004610ec0565b6103fe565b005b6101996102ed366004610f3e565b6106b2565b6102dd610300366004610fe8565b610939565b6102aa604051806040016040528060018152602001603160f81b81525081565b60008181526001602090815260408083208151808301909252546001600160a01b0381168252600160a01b90046001600160401b0316918101829052901580159061038b57506203f48081602001516001600160401b03166103879190611057565b4211155b9392505050565b60008181526001602090815260408083208151808301909252546001600160a01b0381168252600160a01b90046001600160401b031691810182905290156103f5576203f48081602001516001600160401b03166103f09190611057565b61038b565b60009392505050565b60008481526001602090815260408083208151808301909252546001600160a01b0381168252600160a01b90046001600160401b0316918101829052910361047b5760405162461bcd60e51b815260206004820152600b60248201526a1b9bc81c1c9bdc1bdcd85b60aa1b60448201526064015b60405180910390fd5b6203f48081602001516001600160401b03166104979190611057565b4211156104d65760405162461bcd60e51b815260206004820152600d60248201526c1d9bdd1a5b99c818db1bdcd959609a1b6044820152606401610472565b60008581526003602090815260408083206001600160a01b038b16845290915290205484146105335760405162461bcd60e51b8152602060048201526009602482015268626164206e6f6e636560b81b6044820152606401610472565b604080517f76f00c34814dcdf8ad76ca36404bc0e9c282258e4bfb0732f600dd298436925e60208201526001600160a01b0389169181019190915286151560608201526080810186905260a0810185905260009060c001604051602081830303815290604052805190602001209050876001600160a01b03166105bf6105b883610b76565b8686610bd4565b6001600160a01b0316146105e55760405162461bcd60e51b815260040161047290611070565b866105f15760026105f4565b60015b60008781526002602081815260408084206001600160a01b038e1685529091529091208054909160ff1990911690600190849081111561063657610636610deb565b021790555060008681526003602090815260408083206001600160a01b038c168085529083529281902060018901905580518a1515815291820188905242908201528791907f07361804863bf71cc6ac93889f56c096b888fc3c48955b528c721a44d35b8b569060600160405180910390a35050505050505050565b6000858481158015906106c6575060c88211155b6107055760405162461bcd60e51b815260206004820152601060248201526f0c4c2c840e8d2e8d8ca40d8cadccee8d60831b6044820152606401610472565b600081118015610718575062015f908111155b6107565760405162461bcd60e51b815260206004820152600f60248201526e0c4c2c840c4dec8f240d8cadccee8d608b1b6044820152606401610472565b60007f961208a5c428f6bc781e33ba2c03a755d198f4d7a02ea68fd9bd8a97b95c98de8b8b8b60405161078a929190611094565b60405180910390208a8a6040516107a2929190611094565b6040519081900381206107d9949392916020019384526001600160a01b039290921660208401526040830152606082015260800190565b6040516020818303038152906040528051906020012090508a6001600160a01b031661080e61080783610b76565b8888610bd4565b6001600160a01b0316146108345760405162461bcd60e51b815260040161047290611070565b60008081546001019190508190555060008054905060405180604001604052808d6001600160a01b03168152602001426001600160401b03168152506001600083815260200190815260200160002060008201518160000160006101000a8154816001600160a01b0302191690836001600160a01b0316021790555060208201518160000160146101000a8154816001600160401b0302191690836001600160401b031602179055509050508b6001600160a01b0316817f833ebfc4caa57bc0c26f186ae298f99d5ea1e8bb78cff902ab65c5a5183ad5208d8d8d8d426040516109229594939291906110cd565b60405180910390a39b9a5050505050505050505050565b60008381526001602090815260408083208151808301909252546001600160a01b0381168252600160a01b90046001600160401b031691810182905291036109b15760405162461bcd60e51b815260206004820152600b60248201526a1b9bc81c1c9bdc1bdcd85b60aa1b6044820152606401610472565b6203f48081602001516001600160401b03166109cd9190611057565b421115610a0c5760405162461bcd60e51b815260206004820152600d60248201526c1d9bdd1a5b99c818db1bdcd959609a1b6044820152606401610472565b60008481526004602090815260408083206001600160a01b038916845290915290205460ff1615610a705760405162461bcd60e51b815260206004820152600e60248201526d185b1c9958591e481d995d1bd95960921b6044820152606401610472565b604080517f0dbc148f2983dfa2e4efbfb65ddd8fa1c7ac784026c2450b2da6c4e777fe2d3260208201526001600160a01b0387169181019190915260608101859052600090608001604051602081830303815290604052805190602001209050856001600160a01b0316610ae66105b883610b76565b6001600160a01b031614610b0c5760405162461bcd60e51b815260040161047290611070565b60008581526004602090815260408083206001600160a01b038a1680855290835292819020805460ff19166001179055514281528792917f1eb63fe99de0e8342699883f79e9b01483f8041f0debc62b3d2825b80a8a0348910160405180910390a3505050505050565b60405161190160f01b60208201527f0000000000000000000000000000000000000000000000000000000000000000602282015260428101829052600090606201604051602081830303815290604052805190602001209050919050565b600060418214610c175760405162461bcd60e51b815260206004820152600e60248201526d0c4c2c840e6d2ce40d8cadccee8d60931b6044820152606401610472565b82356020840135604085013560001a601b811015610c3d57610c3a601b82611107565b90505b8060ff16601b1480610c5257508060ff16601c145b610c865760405162461bcd60e51b81526020600482015260056024820152643130b2103b60d91b6044820152606401610472565b7f7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0821115610cde5760405162461bcd60e51b8152602060048201526005602482015264626164207360d81b6044820152606401610472565b604080516000808252602082018084528a905260ff841692820192909252606081018590526080810184905260019060a0016020604051602081039080840390855afa158015610d32573d6000803e3d6000fd5b5050604051601f1901519150506001600160a01b038116610d7f5760405162461bcd60e51b81526020600482015260076024820152666261642073696760c81b6044820152606401610472565b979650505050505050565b600060208284031215610d9c57600080fd5b5035919050565b80356001600160a01b0381168114610dba57600080fd5b919050565b60008060408385031215610dd257600080fd5b82359150610de260208401610da3565b90509250929050565b634e487b7160e01b600052602160045260246000fd5b6020810160038310610e2357634e487b7160e01b600052602160045260246000fd5b91905290565b60006020808352835180602085015260005b81811015610e5757858101830151858201604001528201610e3b565b506000604082860101526040601f19601f8301168501019250505092915050565b60008083601f840112610e8a57600080fd5b5081356001600160401b03811115610ea157600080fd5b602083019150836020828501011115610eb957600080fd5b9250929050565b60008060008060008060a08789031215610ed957600080fd5b610ee287610da3565b955060208701358015158114610ef757600080fd5b9450604087013593506060870135925060808701356001600160401b03811115610f2057600080fd5b610f2c89828a01610e78565b979a9699509497509295939492505050565b60008060008060008060006080888a031215610f5957600080fd5b610f6288610da3565b965060208801356001600160401b0380821115610f7e57600080fd5b610f8a8b838c01610e78565b909850965060408a0135915080821115610fa357600080fd5b610faf8b838c01610e78565b909650945060608a0135915080821115610fc857600080fd5b50610fd58a828b01610e78565b989b979a50959850939692959293505050565b60008060008060608587031215610ffe57600080fd5b61100785610da3565b93506020850135925060408501356001600160401b0381111561102957600080fd5b61103587828801610e78565b95989497509550505050565b634e487b7160e01b600052601160045260246000fd5b8082018082111561106a5761106a611041565b92915050565b6020808252600a90820152693130b21039b4b3b732b960b11b604082015260600190565b8183823760009101908152919050565b81835281816020850137506000828201602090810191909152601f909101601f19169091010190565b6060815260006110e16060830187896110a4565b82810360208401526110f48186886110a4565b9150508260408301529695505050505050565b60ff818116838216019081111561106a5761106a61104156fea26469706673582212204c4b9bda24982367400a680a617a3569daee6be68cb09863bc5389ca2662e55f64736f6c63430008180033';
const GOV_COMPILER = { version: '0.8.24+commit.e11b9ed9', optimizer: { enabled: true, runs: 200 }, evmVersion: 'paris' };

// Lazy-loaded ABI + source from /assets/.
let _govAbi = null, _govSource = null;
async function loadGovAbi() {
  if (_govAbi) return _govAbi;
  const r = await fetch('/assets/AhwaGovernance.abi.json');
  _govAbi = await r.json();
  return _govAbi;
}
async function loadGovSource() {
  if (_govSource) return _govSource;
  const r = await fetch('/assets/AhwaGovernance.sol');
  _govSource = await r.text();
  return _govSource;
}

// ─── low-level RPC ─────────────────────────────────────────────────

async function rpcGetLogs(rpc, params) {
  const r = await fetch(rpc, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_getLogs', params: [params], id: 1 }),
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error.message || JSON.stringify(j.error));
  return j.result || [];
}
async function rpcGetCode(rpc, addr) {
  const r = await fetch(rpc, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_getCode', params: [addr, 'latest'], id: 1 }),
  });
  const j = await r.json();
  return j.result || '0x';
}
async function rpcCallAtBlock(rpc, to, data, blockTag) {
  const r = await fetch(rpc, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_call', params: [{ to, data }, blockTag], id: 1 }),
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error.message || JSON.stringify(j.error));
  return j.result || '0x';
}

function encodeAddress(a) { return '000000000000000000000000' + a.slice(2).toLowerCase(); }
function encodeUint(n)    { return BigInt(n).toString(16).padStart(64, '0'); }

// balanceOf(address) at a given block — used to verify per-voter eligibility
// at the proposal's creation block. Public BSC RPC retains state for ~6 months.
async function balanceOfAtBlock(rpc, token, holder, blockNumber) {
  const data = '0x70a08231' + encodeAddress(holder);
  const blockTag = '0x' + blockNumber.toString(16);
  const hex = await rpcCallAtBlock(rpc, token, data, blockTag);
  return BigInt(hex || '0x0');
}

// voteNonce(uint256, address) — read current nonce before signing a vote.
async function readVoteNonce(rpc, contract, proposalId, voter) {
  const data = '0x3a7ed8a0' + encodeUint(proposalId) + encodeAddress(voter);
  const hex = await rpcCallAtBlock(rpc, contract, data, 'latest');
  return BigInt(hex || '0x0');
}

// hasVetoed(uint256, address)
async function readHasVetoed(rpc, contract, proposalId, signer) {
  const data = '0x579baff6' + encodeUint(proposalId) + encodeAddress(signer);
  const hex = await rpcCallAtBlock(rpc, contract, data, 'latest');
  return parseInt(hex, 16) !== 0;
}

// Resolve the multisig safe's owners (the 5 caretaker EOAs).
async function fetchMultisigOwners(rpc, safeAddr) {
  const result = await rpcCallAtBlock(rpc, safeAddr, '0xa0e67e2b', 'latest');
  const data = result.slice(2);
  const count = parseInt(data.slice(64, 128), 16);
  const owners = [];
  for (let i = 0; i < count; i++) {
    owners.push('0x' + data.slice(128 + i * 64 + 24, 128 + (i + 1) * 64).toLowerCase());
  }
  return owners;
}

// ─── ABI decoding for events ───────────────────────────────────────

function topicToAddress(topic) { return '0x' + topic.slice(-40).toLowerCase(); }
function topicToBigInt(topic)  { return BigInt(topic); }

// Read a dynamic string from a head pointer at `headWordIndex` of an
// ABI-encoded data blob.
function decodeStringAtHead(data, headWordIndex) {
  const off = parseInt(data.slice(headWordIndex * 64, (headWordIndex + 1) * 64), 16) * 2;
  const len = parseInt(data.slice(off, off + 64), 16);
  const hex = data.slice(off + 64, off + 64 + len * 2);
  // Decode UTF-8 hex → string
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return new TextDecoder().decode(bytes);
}
function decodeUintAtHead(data, headWordIndex) {
  return BigInt('0x' + data.slice(headWordIndex * 64, (headWordIndex + 1) * 64));
}
function decodeBoolAtHead(data, headWordIndex) {
  return parseInt(data.slice(headWordIndex * 64, (headWordIndex + 1) * 64), 16) !== 0;
}

function parseEventLog(log) {
  const t0 = log.topics[0].toLowerCase();
  const data = log.data.slice(2);
  if (t0 === GOV.TOPICS.ProposalSubmitted) {
    return {
      type: 'proposal',
      id:           Number(topicToBigInt(log.topics[1])),
      proposer:     topicToAddress(log.topics[2]),
      title:        decodeStringAtHead(data, 0),
      body:         decodeStringAtHead(data, 1),
      timestamp:    Number(decodeUintAtHead(data, 2)),
      blockNumber:  parseInt(log.blockNumber, 16),
      txHash:       log.transactionHash,
    };
  }
  if (t0 === GOV.TOPICS.VoteSubmitted) {
    return {
      type: 'vote',
      voter:        topicToAddress(log.topics[1]),
      proposalId:   Number(topicToBigInt(log.topics[2])),
      yes:          decodeBoolAtHead(data, 0),
      nonce:        Number(decodeUintAtHead(data, 1)),
      timestamp:    Number(decodeUintAtHead(data, 2)),
      blockNumber:  parseInt(log.blockNumber, 16),
      txHash:       log.transactionHash,
    };
  }
  if (t0 === GOV.TOPICS.VetoSubmitted) {
    return {
      type: 'veto',
      signer:       topicToAddress(log.topics[1]),
      proposalId:   Number(topicToBigInt(log.topics[2])),
      timestamp:    Number(decodeUintAtHead(data, 0)),
      blockNumber:  parseInt(log.blockNumber, 16),
      txHash:       log.transactionHash,
    };
  }
  return null;
}

// ─── small UI helpers ──────────────────────────────────────────────

function shortAddr(a) { return a.slice(0, 6) + '…' + a.slice(-4); }
function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}
function fmtCountdown(seconds) {
  if (seconds <= 0) return 'closed';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return h + 'h ' + String(m).padStart(2, '0') + 'm ' + String(s).padStart(2, '0') + 's';
}

// ─── wallet helpers ────────────────────────────────────────────────

async function getConnectedAddress() {
  if (!window.ethereum) return null;
  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    return accounts && accounts[0] ? accounts[0].toLowerCase() : null;
  } catch { return null; }
}
async function requestConnect() {
  if (!window.ethereum) throw new Error('No EVM wallet detected. Install MetaMask, Rabby, or similar.');
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  return accounts[0].toLowerCase();
}
async function ensureBSC() {
  const cid = await window.ethereum.request({ method: 'eth_chainId' });
  if (parseInt(cid, 16) !== GOV.CHAIN_ID) {
    try {
      await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x38' }] });
    } catch {
      throw new Error('Please switch wallet to BNB Smart Chain (chain 56).');
    }
  }
}

// EIP-712 typed-data signing via wallet's eth_signTypedData_v4.
// `types` is the message-type fields object; the domain + EIP712Domain are
// added automatically. Returns 0x-prefixed 65-byte signature.
async function signTypedData(account, primaryType, types, message) {
  await ensureBSC();
  if (!GOV.CONTRACT) throw new Error('Governance contract not deployed yet.');
  const payload = {
    types: {
      EIP712Domain: [
        { name: 'name',              type: 'string'  },
        { name: 'version',           type: 'string'  },
        { name: 'chainId',           type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      [primaryType]: types,
    },
    primaryType,
    domain: { ...GOV.DOMAIN, verifyingContract: GOV.CONTRACT },
    message,
  };
  return window.ethereum.request({
    method: 'eth_signTypedData_v4',
    params: [account, JSON.stringify(payload)],
  });
}

async function sendTx(from, to, data) {
  const txHash = await window.ethereum.request({
    method: 'eth_sendTransaction',
    params: [{ from, to, data }],
  });
  // Poll for receipt.
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 2500));
    const res = await fetch(GOV.RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_getTransactionReceipt', params: [txHash], id: 1 }),
    });
    const j = await res.json();
    if (j.result) return { txHash, receipt: j.result };
  }
  throw new Error('Receipt never arrived (>2.5 min). Check the tx on BSCscan: ' + txHash);
}

// ABI-encode the calldata for submitProposal/submitVote/submitVeto.
function encStr(s) {
  // utf-8 encode
  const utf8 = new TextEncoder().encode(s);
  const len = utf8.length;
  let hex = '';
  for (let i = 0; i < len; i++) hex += utf8[i].toString(16).padStart(2, '0');
  // Pad to 32-byte multiple.
  const pad = ((64 - (hex.length % 64)) % 64);
  return { len, hex: hex + '0'.repeat(pad) };
}

function encodeSubmitProposal(proposer, title, body, signature) {
  // submitProposal(address, string, string, bytes) — selector 0xf951e067
  // Layout: head[4 words] = proposer | title-ptr | body-ptr | sig-ptr,
  // then tails for each dynamic.
  const sig = signature.slice(2);
  const t = encStr(title);
  const b = encStr(body);
  const sigBytes = sig.length / 2;
  const sigPad = (64 - (sig.length % 64)) % 64;

  // Compute offsets (in bytes from start of ARG region, ie after selector).
  // Head = 4 * 32 = 128 bytes.
  const titleOff = 128;
  const bodyOff  = titleOff + 32 + Math.ceil(t.hex.length / 64) * 32;
  const sigOff   = bodyOff  + 32 + Math.ceil(b.hex.length / 64) * 32;

  return '0xf951e067'
    + encodeAddress(proposer)
    + encodeUint(titleOff)
    + encodeUint(bodyOff)
    + encodeUint(sigOff)
    + encodeUint(t.len) + t.hex
    + encodeUint(b.len) + b.hex
    + encodeUint(sigBytes) + sig + '0'.repeat(sigPad);
}

function encodeSubmitVote(voter, yes, proposalId, nonce, signature) {
  // submitVote(address, bool, uint256, uint256, bytes) — selector 0xdf439eb7
  // Layout: voter | yes | proposalId | nonce | sig-ptr | sig-len | sig...
  const sig = signature.slice(2);
  const sigBytes = sig.length / 2;
  const sigPad = (64 - (sig.length % 64)) % 64;
  const sigOff = 5 * 32; // five head words
  return '0xdf439eb7'
    + encodeAddress(voter)
    + encodeUint(yes ? 1 : 0)
    + encodeUint(proposalId)
    + encodeUint(nonce)
    + encodeUint(sigOff)
    + encodeUint(sigBytes) + sig + '0'.repeat(sigPad);
}

function encodeSubmitVeto(signer, proposalId, signature) {
  // submitVeto(address, uint256, bytes) — selector 0xfdbd1d99
  const sig = signature.slice(2);
  const sigBytes = sig.length / 2;
  const sigPad = (64 - (sig.length % 64)) % 64;
  const sigOff = 3 * 32;
  return '0xfdbd1d99'
    + encodeAddress(signer)
    + encodeUint(proposalId)
    + encodeUint(sigOff)
    + encodeUint(sigBytes) + sig + '0'.repeat(sigPad);
}

// ─── propose / vote / veto flows ───────────────────────────────────

async function doPropose(title, body, statusEl) {
  if (!title || title.length === 0)            throw new Error('Title required.');
  if (title.length > GOV.TITLE_MAX)            throw new Error('Title too long (max ' + GOV.TITLE_MAX + ' chars).');
  if (!body || body.length === 0)              throw new Error('Body required.');
  // body length here is char count; rough check. Contract enforces byte limit.
  if (new TextEncoder().encode(body).length > GOV.BODY_MAX)
    throw new Error('Body too long (max ' + GOV.BODY_MAX + ' bytes).');

  const from = await requestConnect();
  statusEl.textContent = 'Verifying AHWA balance…';
  const bal = await balanceOfAtBlock(GOV.RPC, GOV.AHWA, from, await currentBlock());
  if (bal < (10n ** BigInt(GOV.AHWA_DEC))) {
    throw new Error('You need to hold at least 1 AHWA to propose. Your balance: ' + bal.toString());
  }

  statusEl.textContent = 'Sign typed data in your wallet…';
  const signature = await signTypedData(from, 'Proposal',
    [
      { name: 'proposer', type: 'address' },
      { name: 'title',    type: 'string'  },
      { name: 'body',     type: 'string'  },
    ],
    { proposer: from, title, body }
  );

  statusEl.textContent = 'Submitting proposal tx…';
  const data = encodeSubmitProposal(from, title, body, signature);
  const { txHash, receipt } = await sendTx(from, GOV.CONTRACT, data);
  if (receipt.status === '0x0') throw new Error('Tx reverted. See ' + txHash);
  statusEl.innerHTML = '✓ Proposal submitted. <a href="https://bscscan.com/tx/' + txHash + '" target="_blank">View tx</a>';
  // Refresh proposals after a short delay so the new event indexes.
  setTimeout(() => runGovernance().catch(console.warn), 3000);
}

async function doVote(proposalId, yes, btnEl) {
  const from = await requestConnect();
  await ensureBSC();
  btnEl.disabled = true;
  const original = btnEl.textContent;
  btnEl.textContent = 'Reading nonce…';
  const nonce = await readVoteNonce(GOV.RPC, GOV.CONTRACT, proposalId, from);
  btnEl.textContent = 'Sign in wallet…';
  const signature = await signTypedData(from, 'Vote',
    [
      { name: 'voter',      type: 'address' },
      { name: 'yes',        type: 'bool'    },
      { name: 'proposalId', type: 'uint256' },
      { name: 'nonce',      type: 'uint256' },
    ],
    { voter: from, yes, proposalId: String(proposalId), nonce: nonce.toString() }
  );
  btnEl.textContent = 'Submitting…';
  const data = encodeSubmitVote(from, yes, proposalId, Number(nonce), signature);
  const { txHash } = await sendTx(from, GOV.CONTRACT, data);
  btnEl.textContent = '✓ Voted ' + (yes ? 'YES' : 'NO');
  setTimeout(() => runGovernance().catch(console.warn), 3000);
}

async function doVeto(proposalId, btnEl) {
  const from = await requestConnect();
  await ensureBSC();
  if (!confirm('VETO proposal ' + proposalId + '?\n\nThis cannot be rescinded. 4 of 5 multisig signers will kill the proposal. Continue?')) return;
  btnEl.disabled = true;
  btnEl.textContent = 'Sign in wallet…';
  const signature = await signTypedData(from, 'Veto',
    [
      { name: 'signer',     type: 'address' },
      { name: 'proposalId', type: 'uint256' },
    ],
    { signer: from, proposalId: String(proposalId) }
  );
  btnEl.textContent = 'Submitting…';
  const data = encodeSubmitVeto(from, proposalId, signature);
  await sendTx(from, GOV.CONTRACT, data);
  btnEl.textContent = '✓ Vetoed';
  setTimeout(() => runGovernance().catch(console.warn), 3000);
}

async function currentBlock() {
  const r = await fetch(GOV.RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 }),
  });
  const j = await r.json();
  return parseInt(j.result, 16);
}

// ─── deploy panel ──────────────────────────────────────────────────

async function deployContract(statusEl) {
  await ensureBSC();
  const from = await requestConnect();
  if (from !== GOV.DEPLOYER) {
    throw new Error('Deploy is gated to dreamingrainbow (' + shortAddr(GOV.DEPLOYER) + '). Connected: ' + shortAddr(from));
  }
  statusEl.textContent = 'Sending deploy transaction…';
  const txHash = await window.ethereum.request({
    method: 'eth_sendTransaction',
    params: [{ from, data: GOV_BYTECODE }],
  });
  statusEl.innerHTML = 'Tx sent: <a href="https://bscscan.com/tx/' + txHash + '" target="_blank">' + txHash.slice(0, 10) + '…</a><br>Waiting for receipt…';
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 2500));
    const res = await fetch(GOV.RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_getTransactionReceipt', params: [txHash], id: 1 }),
    });
    const j = await res.json();
    if (j.result && j.result.contractAddress) return j.result.contractAddress;
  }
  throw new Error('Receipt never arrived (>2.5 min). Check the tx on BSCscan.');
}

async function renderDeployPanel() {
  const panel  = document.getElementById('gov-deploy');
  const status = document.getElementById('gov-status');
  if (!panel || !status) return null;

  const stored = localStorage.getItem('GOV_CONTRACT');
  if (GOV.CONTRACT) {
    status.innerHTML = 'Contract: <a href="https://bscscan.com/address/' + GOV.CONTRACT + '" target="_blank"><code>' + GOV.CONTRACT + '</code></a> (committed)';
    status.className = 'gov-status deployed';
    panel.hidden = true;
    return GOV.CONTRACT;
  }
  if (stored) {
    GOV.CONTRACT = stored;
    status.innerHTML = '⚠ Contract deployed at <a href="https://bscscan.com/address/' + stored + '" target="_blank"><code>' + stored + '</code></a> but address not yet committed. Edit <code>build/assets/governance.js</code> → set <code>CONTRACT: "' + stored + '"</code>, then push.';
    status.className = 'gov-status deployed warn';
    panel.hidden = true;
    return stored;
  }

  const connected = await getConnectedAddress();
  status.innerHTML = 'Governance contract not yet deployed.';
  status.className = 'gov-status not-deployed';
  panel.hidden = false;
  panel.innerHTML =
    '<div class="gov-deploy-inner">' +
      '<div class="gov-deploy-headline">Deploy AhwaGovernance</div>' +
      '<div class="gov-deploy-sub">Restricted to <code>' + shortAddr(GOV.DEPLOYER) + '</code> (dreamingrainbow). Connected: <code id="gov-connected">' + (connected ? shortAddr(connected) : 'not connected') + '</code></div>' +
      '<div class="gov-deploy-row">' +
        '<button class="gov-cta" id="gov-connect-btn">' + (connected ? 'Connected' : 'Connect Wallet') + '</button>' +
        '<button class="gov-cta danger" id="gov-deploy-btn"' + (connected === GOV.DEPLOYER ? '' : ' disabled') + '>Deploy</button>' +
      '</div>' +
      '<div class="gov-deploy-status" id="gov-deploy-status"></div>' +
      '<div class="gov-deploy-note">After deploy, run locally: <code>BSCSCAN_API_KEY=… npx hardhat verify --network bsc &lt;ADDR&gt;</code></div>' +
    '</div>';

  document.getElementById('gov-connect-btn').onclick = async () => {
    try {
      const addr = await requestConnect();
      document.getElementById('gov-connected').textContent = shortAddr(addr);
      document.getElementById('gov-deploy-btn').disabled = (addr !== GOV.DEPLOYER);
    } catch (e) { alert(e.message); }
  };
  document.getElementById('gov-deploy-btn').onclick = async () => {
    const s = document.getElementById('gov-deploy-status');
    try {
      const addr = await deployContract(s);
      localStorage.setItem('GOV_CONTRACT', addr);
      GOV.CONTRACT = addr;
      s.innerHTML = '✓ Deployed at <a href="https://bscscan.com/address/' + addr + '" target="_blank"><code>' + addr + '</code></a>.<br>Now locally: edit <code>build/assets/governance.js</code>, set <code>CONTRACT: "' + addr + '"</code>, then <code>npx hardhat verify --network bsc ' + addr + '</code>, commit, push.';
      setTimeout(() => runGovernance().catch(console.warn), 2000);
    } catch (e) { s.textContent = '✗ ' + e.message; }
  };
  return null;
}

// ─── audit panel ───────────────────────────────────────────────────

async function renderAuditPanel() {
  const panel = document.getElementById('gov-audit');
  if (!panel) return;
  const v = GOV_COMPILER;
  panel.innerHTML =
    '<div class="gov-audit-head">Audit · Contract Source</div>' +
    '<div class="gov-audit-meta">' +
      'solc <b>' + v.version + '</b> · optimizer ' + (v.optimizer.enabled ? 'on (' + v.optimizer.runs + ' runs)' : 'off') +
      ' · evmVersion <b>' + v.evmVersion + '</b>' +
      ' · bytecode <b>' + ((GOV_BYTECODE.length - 2) / 2) + '</b> bytes' +
    '</div>' +
    '<div class="gov-audit-actions">' +
      '<button class="gov-cta sm" id="gov-verify-btn">Verify on chain</button>' +
      '<span class="gov-verify-status" id="gov-verify-status"></span>' +
    '</div>' +
    '<details class="gov-audit-block" id="gov-src-detail"><summary>Solidity source · <a href="/assets/AhwaGovernance.sol" target="_blank">raw file</a></summary><pre id="gov-src-pre">…loading…</pre></details>' +
    '<details class="gov-audit-block" id="gov-abi-detail"><summary>ABI · <a href="/assets/AhwaGovernance.abi.json" target="_blank">raw json</a></summary><pre id="gov-abi-pre">…loading…</pre></details>' +
    '<details class="gov-audit-block"><summary>Creation bytecode (' + ((GOV_BYTECODE.length - 2) / 2) + ' bytes)</summary><pre class="hex">' + GOV_BYTECODE + '</pre></details>' +
    '<details class="gov-audit-block"><summary>Deployed bytecode (' + ((GOV_DEPLOYED_BYTECODE.length - 2) / 2) + ' bytes — what the chain runs)</summary><pre class="hex">' + GOV_DEPLOYED_BYTECODE + '</pre></details>';

  document.getElementById('gov-src-detail').addEventListener('toggle', async (e) => {
    if (!e.target.open) return;
    const pre = document.getElementById('gov-src-pre');
    if (pre.dataset.loaded) return;
    try { pre.textContent = await loadGovSource(); pre.dataset.loaded = '1'; }
    catch (err) { pre.textContent = '✗ failed to load source: ' + err.message; }
  });
  document.getElementById('gov-abi-detail').addEventListener('toggle', async (e) => {
    if (!e.target.open) return;
    const pre = document.getElementById('gov-abi-pre');
    if (pre.dataset.loaded) return;
    try { pre.textContent = JSON.stringify(await loadGovAbi(), null, 2); pre.dataset.loaded = '1'; }
    catch (err) { pre.textContent = '✗ failed to load ABI: ' + err.message; }
  });
  document.getElementById('gov-verify-btn').onclick = async () => {
    const s = document.getElementById('gov-verify-status');
    if (!GOV.CONTRACT) { s.textContent = 'No contract deployed yet'; return; }
    s.textContent = 'Fetching deployed bytecode…';
    try {
      const onchain = (await rpcGetCode(GOV.RPC, GOV.CONTRACT)).toLowerCase();
      const expected = GOV_DEPLOYED_BYTECODE.toLowerCase();
      const trim = (s) => s.slice(0, s.length - 106);
      if (onchain === expected) {
        s.innerHTML = '<span style="color:#4caf50">✓ Exact match — runtime bytecode is identical to compiled source.</span>';
      } else if (trim(onchain) === trim(expected)) {
        s.innerHTML = '<span style="color:#c9a227">~ Runtime code matches; metadata hash differs (cosmetic).</span>';
      } else {
        s.innerHTML = '<span style="color:#e94545">✗ Mismatch! Deployed bytecode differs from this source.</span>';
      }
    } catch (e) { s.textContent = '✗ ' + e.message; }
  };
}

// ─── wallet status row + propose form ──────────────────────────────

async function renderWalletStatus() {
  const row = document.getElementById('gov-wallet');
  if (!row) return;
  const connected = await getConnectedAddress();
  if (!connected) {
    row.innerHTML =
      '<span class="ws-label">Wallet:</span> ' +
      '<button class="gov-cta sm" id="gov-wallet-connect">Connect</button>' +
      '<span class="ws-meta">connect to vote or propose</span>';
    document.getElementById('gov-wallet-connect').onclick = async () => {
      try { await requestConnect(); renderWalletStatus(); runGovernance().catch(console.warn); }
      catch (e) { alert(e.message); }
    };
    return;
  }
  const blk = await currentBlock().catch(() => 0);
  const bal = await balanceOfAtBlock(GOV.RPC, GOV.AHWA, connected, blk).catch(() => 0n);
  const ahwa = bal / (10n ** BigInt(GOV.AHWA_DEC));
  row.innerHTML =
    '<span class="ws-label">Wallet:</span> ' +
    '<a href="https://bscscan.com/address/' + connected + '" target="_blank"><code>' + shortAddr(connected) + '</code></a>' +
    '<span class="ws-meta">' + ahwa.toString() + ' AHWA · ' + (ahwa > 0n ? 'eligible to vote/propose' : 'no AHWA — view-only') + '</span>';
}

async function renderProposeForm(canPropose) {
  const wrap = document.getElementById('gov-propose');
  if (!wrap) return;
  if (!canPropose) {
    wrap.innerHTML = '';
    return;
  }
  if (wrap.dataset.rendered === '1') return; // don't clobber the form on tally refresh
  wrap.dataset.rendered = '1';
  wrap.innerHTML =
    '<details class="gov-propose-card">' +
      '<summary>Create a proposal</summary>' +
      '<div class="gov-propose-body">' +
        '<label class="ws-label">Title <span class="ws-meta" id="gov-title-count">0 / ' + GOV.TITLE_MAX + '</span></label>' +
        '<input type="text" id="gov-title" maxlength="' + GOV.TITLE_MAX + '" placeholder="Short headline (e.g. \'Reduce LP fee to 0.2%\')">' +
        '<label class="ws-label">Body <span class="ws-meta" id="gov-body-count">0 / ' + GOV.BODY_MAX + ' bytes</span></label>' +
        '<textarea id="gov-body" placeholder="Full proposal text. Goes on-chain as event data — markdown is welcome but rendered as plain text on the page."></textarea>' +
        '<div class="gov-propose-actions">' +
          '<button class="gov-cta" id="gov-propose-btn">Sign &amp; submit on-chain</button>' +
          '<span id="gov-propose-status" class="ws-meta"></span>' +
        '</div>' +
        '<div class="gov-propose-note">Gas is paid by you. ~$0.05 for a small proposal, up to ~$1 at the 90 KB cap.</div>' +
      '</div>' +
    '</details>';
  const titleEl = document.getElementById('gov-title');
  const bodyEl  = document.getElementById('gov-body');
  const tCount  = document.getElementById('gov-title-count');
  const bCount  = document.getElementById('gov-body-count');
  titleEl.oninput = () => { tCount.textContent = titleEl.value.length + ' / ' + GOV.TITLE_MAX; };
  bodyEl.oninput  = () => {
    const bytes = new TextEncoder().encode(bodyEl.value).length;
    bCount.textContent = bytes + ' / ' + GOV.BODY_MAX + ' bytes';
    bCount.style.color = bytes > GOV.BODY_MAX ? 'var(--red)' : '';
  };
  document.getElementById('gov-propose-btn').onclick = async () => {
    const s = document.getElementById('gov-propose-status');
    try {
      s.style.color = '';
      await doPropose(titleEl.value.trim(), bodyEl.value, s);
    } catch (e) { s.style.color = 'var(--red)'; s.textContent = '✗ ' + e.message; }
  };
}

// ─── proposal cards ────────────────────────────────────────────────

async function tallyAndRender(proposalsLogs, votesLogs, vetoesLogs, ownerSet, connected, connectedBalance) {
  const wrap = document.getElementById('gov-proposals');
  wrap.innerHTML = '';

  if (proposalsLogs.length === 0) {
    wrap.innerHTML = '<div class="gov-empty">No proposals yet. Connect your wallet, expand <b>Create a proposal</b>, fill in title and body, sign and submit.</div>';
    return;
  }

  const lpSet = new Set(GOV.EXCLUDE_LP.map(a => a.toLowerCase()));
  const safeAddr = GOV.SAFE.toLowerCase();
  const ONE_AHWA = 10n ** BigInt(GOV.AHWA_DEC);

  proposalsLogs.sort((a, b) => b.blockNumber - a.blockNumber);
  for (const p of proposalsLogs) {
    const card = document.createElement('div');
    card.className = 'proposal-card';
    card.innerHTML = '<div class="ph-loading">Loading proposal #' + p.id + '…</div>';
    wrap.appendChild(card);

    (async () => {
      const myVotes  = votesLogs.filter(v => v.proposalId === p.id);
      const myVetoes = vetoesLogs.filter(v => v.proposalId === p.id);

      const voteByVoter = new Map();
      for (const v of myVotes) {
        const prev = voteByVoter.get(v.voter);
        if (!prev || v.nonce > prev.nonce) voteByVoter.set(v.voter, v);
      }

      const yesSet = new Set(), noSet = new Set();
      const ineligible = [];
      const voters = [...voteByVoter.keys()];
      const balances = await Promise.all(voters.map(v =>
        (v === safeAddr || lpSet.has(v))
          ? Promise.resolve(0n)
          : balanceOfAtBlock(GOV.RPC, GOV.AHWA, v, p.blockNumber).catch(() => 0n)
      ));
      for (let i = 0; i < voters.length; i++) {
        const voter = voters[i];
        const vote  = voteByVoter.get(voter);
        if (voter === safeAddr || lpSet.has(voter) || balances[i] < ONE_AHWA) {
          ineligible.push(voter); continue;
        }
        (vote.yes ? yesSet : noSet).add(voter);
      }

      const safeBal = await balanceOfAtBlock(GOV.RPC, GOV.AHWA, GOV.SAFE, p.blockNumber).catch(() => 0n);
      let exclusions = safeBal > 0n ? 1 : 0;
      const lpBalances = await Promise.all(GOV.EXCLUDE_LP.map(lp =>
        balanceOfAtBlock(GOV.RPC, GOV.AHWA, lp, p.blockNumber).catch(() => 0n)
      ));
      for (const b of lpBalances) if (b > 0n) exclusions++;
      const denom = Math.max(0, GOV.HOLDER_COUNT - exclusions);
      const passThreshold = Math.ceil(denom * 0.51);

      const vetoSigners = new Set(myVetoes.map(v => v.signer).filter(s => ownerSet.has(s)));
      const vetoFired   = vetoSigners.size >= 4;

      const now = Math.floor(Date.now() / 1000);
      const closesAt = p.timestamp + 72 * 3600;
      const finalAt  = closesAt + 3600;
      let status, statusClass, statusHelp;
      if      (now < closesAt) { status = 'OPEN';              statusClass = 'open';     statusHelp = 'Voting is open — proposal is within its 72-hour window.'; }
      else if (now < finalAt)  { status = 'TALLYING';          statusClass = 'tallying'; statusHelp = 'Voting closed; finalizing tally (1-hour buffer for late events).'; }
      else if (vetoFired)      { status = 'VETOED · REJECTED'; statusClass = 'vetoed';   statusHelp = '4 of 5 multisig signers posted Veto signatures — proposal is killed regardless of community tally.'; }
      else if (yesSet.size >= passThreshold) { status = 'PASSED'; statusClass = 'passed'; statusHelp = '≥51% of eligible holders voted YES. Proposal passed.'; }
      else                     { status = 'REJECTED';          statusClass = 'rejected'; statusHelp = 'Did not reach 51% YES from eligible holders. Proposal rejected.'; }

      const yesPct = denom ? (yesSet.size / denom) * 100 : 0;
      const noPct  = denom ? (noSet.size  / denom) * 100 : 0;

      const myCurrentVote = connected ? voteByVoter.get(connected) : null;
      const isOpen = now < closesAt;
      const canVote = isOpen && connected && (connectedBalance >= ONE_AHWA) && connected !== safeAddr && !lpSet.has(connected);
      const isMultisigOwner = connected && ownerSet.has(connected);
      const canVeto = isOpen && isMultisigOwner;
      const alreadyVetoed = isMultisigOwner && [...vetoSigners].includes(connected);

      let actionHtml = '';
      if (canVote || canVeto) {
        const yesBtnLabel = myCurrentVote ? (myCurrentVote.yes ? '✓ Voted YES' : 'Change to YES') : 'Vote YES';
        const noBtnLabel  = myCurrentVote ? (!myCurrentVote.yes ? '✓ Voted NO' : 'Change to NO') : 'Vote NO';
        actionHtml = '<div class="ph-actions">';
        if (canVote) {
          actionHtml +=
            '<button class="gov-cta vote-yes ' + (myCurrentVote && myCurrentVote.yes ? 'active' : '') + '" data-pid="' + p.id + '" data-yes="1">' + yesBtnLabel + '</button>' +
            '<button class="gov-cta vote-no '  + (myCurrentVote && !myCurrentVote.yes ? 'active' : '') + '" data-pid="' + p.id + '" data-yes="0">' + noBtnLabel  + '</button>';
        }
        if (canVeto) {
          actionHtml += '<button class="gov-cta danger veto-btn" data-pid="' + p.id + '"' + (alreadyVetoed ? ' disabled' : '') + '>' + (alreadyVetoed ? '✓ You vetoed' : 'VETO (multisig)') + '</button>';
        }
        actionHtml += '</div>';
      }

      card.innerHTML =
        '<div class="ph-head">' +
          '<div class="ph-title">#' + p.id + ' — ' + escapeHTML(p.title) + '</div>' +
          '<span class="ph-status ' + statusClass + '" title="' + escapeHTML(statusHelp) + '">' + status + '</span>' +
        '</div>' +
        '<div class="ph-meta">' +
          'by <a href="https://bscscan.com/address/' + p.proposer + '" target="_blank"><code>' + shortAddr(p.proposer) + '</code></a>' +
          ' · <a href="https://bscscan.com/tx/' + p.txHash + '" target="_blank">tx</a>' +
          ' · snapshot block <code>' + p.blockNumber + '</code>' +
          ' · <span class="ph-countdown" data-closes="' + closesAt + '">' + fmtCountdown(closesAt - now) + ' left</span>' +
        '</div>' +
        '<details class="ph-body" open><summary>Proposal text</summary><pre>' + escapeHTML(p.body) + '</pre></details>' +
        '<div class="tally-grid">' +
          '<div class="tally-col" title="Distinct addresses that voted YES (each verified to hold ≥1 AHWA at the proposal block).">' +
            '<div class="l">YES</div><div class="v">' + yesSet.size + '</div></div>' +
          '<div class="tally-col" title="Distinct addresses that voted NO (each verified to hold ≥1 AHWA at the proposal block).">' +
            '<div class="l">NO</div><div class="v">' + noSet.size + '</div></div>' +
          '<div class="tally-col" title="Total AHWA holders minus the multisig safe and LP/staking pools holding AHWA at the proposal block.">' +
            '<div class="l">ELIGIBLE</div><div class="v">' + denom + '</div></div>' +
          '<div class="tally-col" title="ceil(eligible × 0.51) — yes votes required for the proposal to pass.">' +
            '<div class="l">NEEDED (51%)</div><div class="v">' + passThreshold + '</div></div>' +
        '</div>' +
        '<div class="tally-bar">' +
          '<div class="yes-fill" style="width:' + yesPct.toFixed(1) + '%"></div>' +
          '<div class="no-fill" style="width:' + noPct.toFixed(1) + '%"></div>' +
        '</div>' +
        (myVetoes.length
          ? '<div class="veto-row">VETO signatures: <b>' + vetoSigners.size + '</b> of 5 multisig owners' +
              (vetoFired ? ' <span class="veto-pill">VETO FIRED (≥4/5)</span>' : '') + '</div>'
          : '') +
        (ineligible.length
          ? '<div class="veto-row" style="color:var(--text-dim)">Ignored ' + ineligible.length + ' vote' + (ineligible.length === 1 ? '' : 's') + ' from ineligible address' + (ineligible.length === 1 ? '' : 'es') + ' (no AHWA at proposal block, multisig safe, or LP).</div>'
          : '') +
        actionHtml;

      // Wire vote/veto buttons.
      card.querySelectorAll('.vote-yes, .vote-no').forEach(btn => {
        btn.onclick = () => doVote(p.id, btn.dataset.yes === '1', btn).catch(e => {
          btn.disabled = false; btn.textContent = '✗ ' + e.message.slice(0, 60);
        });
      });
      const vetoBtn = card.querySelector('.veto-btn');
      if (vetoBtn) vetoBtn.onclick = () => doVeto(p.id, vetoBtn).catch(e => {
        vetoBtn.disabled = false; vetoBtn.textContent = '✗ ' + e.message.slice(0, 60);
      });
    })().catch(e => { card.innerHTML = '<div class="ph-error">Failed to load proposal: ' + escapeHTML(e.message) + '</div>'; });
  }
}

// ─── main ──────────────────────────────────────────────────────────

async function runGovernance() {
  await renderAuditPanel();
  await renderWalletStatus();

  if (!GOV.CONTRACT) GOV.CONTRACT = localStorage.getItem('GOV_CONTRACT') || '';
  const contract = await renderDeployPanel();
  if (!contract) {
    document.getElementById('gov-proposals').innerHTML = '<div class="gov-empty">Awaiting contract deploy.</div>';
    await renderProposeForm(false);
    return;
  }

  const all = await rpcGetLogs(GOV.RPC, {
    fromBlock: '0x0', toBlock: 'latest', address: contract,
    topics: [[GOV.TOPICS.ProposalSubmitted, GOV.TOPICS.VoteSubmitted, GOV.TOPICS.VetoSubmitted]],
  });
  const proposals = [], votes = [], vetoes = [];
  for (const log of all) {
    const e = parseEventLog(log);
    if (!e) continue;
    if (e.type === 'proposal') proposals.push(e);
    else if (e.type === 'vote') votes.push(e);
    else if (e.type === 'veto') vetoes.push(e);
  }

  const owners = await fetchMultisigOwners(GOV.RPC, GOV.SAFE).catch(() => []);
  const ownerSet = new Set(owners.map(a => a.toLowerCase()));
  const connected = await getConnectedAddress();
  const connectedBalance = connected
    ? await balanceOfAtBlock(GOV.RPC, GOV.AHWA, connected, await currentBlock()).catch(() => 0n)
    : 0n;

  await renderProposeForm(connected !== null && connectedBalance >= (10n ** BigInt(GOV.AHWA_DEC)));
  await tallyAndRender(proposals, votes, vetoes, ownerSet, connected, connectedBalance);

  setInterval(() => {
    const now = Math.floor(Date.now() / 1000);
    document.querySelectorAll('.ph-countdown').forEach(el => {
      const closes = parseInt(el.dataset.closes, 10);
      el.textContent = fmtCountdown(closes - now) + ' left';
    });
  }, 1000);
}

// Auto-run on page load. `defer` ensures DOM is parsed and the inline main
// script (which defines RPC, SAFE, balanceOf, etc.) has already executed.
// Also re-render wallet status on accountsChanged / chainChanged events.
if (window.ethereum) {
  window.ethereum.on?.('accountsChanged', () => runGovernance().catch(console.warn));
  window.ethereum.on?.('chainChanged',    () => runGovernance().catch(console.warn));
}
runGovernance().catch(e => console.error('governance failed:', e));
