// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @title  AhwaGovernance
/// @notice Append-only event log for AHWA proposals, votes, and vetoes,
///         with on-chain dedup, on-chain 72h voting window, and EIP-712
///         signature binding (chainId + contract address pinned). Voters
///         may flip their vote during the window by re-signing with the
///         next nonce. Vetoes are final and cannot be rescinded — a new
///         proposal would be required.
///
///         All counting policy (>=1 AHWA balance, multisig exclusion, LP
///         exclusion, 51% threshold, 1h finalization, 4/5 veto rule) is
///         enforced off-chain by rickletoken.com reading these events.
///         The contract proves: "this address signed this typed data for
///         THIS contract on THIS chain, and hasn't done so before for
///         this proposal."
///
///         msg.sender is irrelevant — anyone can relay a signed message
///         on behalf of a holder.
contract AhwaGovernance {
    string  public constant NAME          = "AhwaGovernance";
    string  public constant VERSION       = "1";
    uint256 public constant VOTING_WINDOW = 72 hours;

    bytes32 private constant EIP712_DOMAIN_TYPEHASH = keccak256(
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
    );
    bytes32 private constant PROPOSAL_TYPEHASH = keccak256(
        "Proposal(address proposer,string ipfsHash)"
    );
    bytes32 private constant VOTE_TYPEHASH = keccak256(
        "Vote(address voter,bool yes,string ipfsHash,uint256 nonce)"
    );
    bytes32 private constant VETO_TYPEHASH = keccak256(
        "Veto(address signer,string ipfsHash)"
    );

    bytes32 public immutable DOMAIN_SEPARATOR;

    enum Vote { None, Yes, No }

    struct Proposal {
        address proposer;
        uint64  createdAt;
    }

    /// @notice Proposal record by keccak256(bytes(ipfsHash)). createdAt==0 means none.
    mapping(bytes32 => Proposal) public proposals;

    /// @notice Current vote per voter per proposal: None / Yes / No.
    mapping(bytes32 => mapping(address => Vote)) public voteOf;

    /// @notice Per-voter nonce for replay protection on vote changes.
    mapping(bytes32 => mapping(address => uint256)) public voteNonce;

    /// @notice Set once a multisig signer vetoes; vetoes cannot be rescinded.
    mapping(bytes32 => mapping(address => bool)) public hasVetoed;

    event ProposalSubmitted(
        address indexed proposer,
        string  indexed ipfsHashTopic,
        string          ipfsHash,
        uint256         timestamp
    );
    event VoteSubmitted(
        address indexed voter,
        string  indexed ipfsHashTopic,
        string          ipfsHash,
        bool            yes,
        uint256         nonce,
        uint256         timestamp
    );
    event VetoSubmitted(
        address indexed signer,
        string  indexed ipfsHashTopic,
        string          ipfsHash,
        uint256         timestamp
    );

    constructor() {
        DOMAIN_SEPARATOR = keccak256(abi.encode(
            EIP712_DOMAIN_TYPEHASH,
            keccak256(bytes(NAME)),
            keccak256(bytes(VERSION)),
            block.chainid,
            address(this)
        ));
    }

    function submitProposal(
        address proposer,
        string calldata ipfsHash,
        bytes calldata signature
    ) external {
        bytes32 key = keccak256(bytes(ipfsHash));
        require(proposals[key].createdAt == 0, "proposal exists");
        bytes32 structHash = keccak256(abi.encode(PROPOSAL_TYPEHASH, proposer, key));
        require(_recover(_typedHash(structHash), signature) == proposer, "bad signer");
        proposals[key] = Proposal({ proposer: proposer, createdAt: uint64(block.timestamp) });
        emit ProposalSubmitted(proposer, ipfsHash, ipfsHash, block.timestamp);
    }

    function submitVote(
        address voter,
        bool yes,
        string calldata ipfsHash,
        uint256 nonce,
        bytes calldata signature
    ) external {
        bytes32 key = keccak256(bytes(ipfsHash));
        Proposal memory p = proposals[key];
        require(p.createdAt != 0, "no proposal");
        require(block.timestamp <= uint256(p.createdAt) + VOTING_WINDOW, "voting closed");
        require(nonce == voteNonce[key][voter], "bad nonce");

        bytes32 structHash = keccak256(abi.encode(VOTE_TYPEHASH, voter, yes, key, nonce));
        require(_recover(_typedHash(structHash), signature) == voter, "bad signer");

        voteOf[key][voter] = yes ? Vote.Yes : Vote.No;
        unchecked { voteNonce[key][voter] = nonce + 1; }
        emit VoteSubmitted(voter, ipfsHash, ipfsHash, yes, nonce, block.timestamp);
    }

    function submitVeto(
        address signer,
        string calldata ipfsHash,
        bytes calldata signature
    ) external {
        bytes32 key = keccak256(bytes(ipfsHash));
        Proposal memory p = proposals[key];
        require(p.createdAt != 0, "no proposal");
        require(block.timestamp <= uint256(p.createdAt) + VOTING_WINDOW, "voting closed");
        require(!hasVetoed[key][signer], "already vetoed");

        bytes32 structHash = keccak256(abi.encode(VETO_TYPEHASH, signer, key));
        require(_recover(_typedHash(structHash), signature) == signer, "bad signer");

        hasVetoed[key][signer] = true;
        emit VetoSubmitted(signer, ipfsHash, ipfsHash, block.timestamp);
    }

    /// @notice Voting deadline (UNIX seconds). Returns 0 if no proposal exists.
    function deadlineOf(string calldata ipfsHash) external view returns (uint256) {
        Proposal memory p = proposals[keccak256(bytes(ipfsHash))];
        return p.createdAt == 0 ? 0 : uint256(p.createdAt) + VOTING_WINDOW;
    }

    /// @notice True if a proposal exists and the voting window is still open.
    function isVotingOpen(string calldata ipfsHash) external view returns (bool) {
        Proposal memory p = proposals[keccak256(bytes(ipfsHash))];
        return p.createdAt != 0 && block.timestamp <= uint256(p.createdAt) + VOTING_WINDOW;
    }

    // ─── internals ───────────────────────────────────────────────────────

    function _typedHash(bytes32 structHash) private view returns (bytes32) {
        return keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));
    }

    function _recover(bytes32 hash, bytes calldata sig) private pure returns (address) {
        require(sig.length == 65, "bad sig length");
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := calldataload(sig.offset)
            s := calldataload(add(sig.offset, 32))
            v := byte(0, calldataload(add(sig.offset, 64)))
        }
        if (v < 27) v += 27;
        require(v == 27 || v == 28, "bad v");
        // EIP-2 low-s malleability guard.
        require(
            uint256(s) <= 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0,
            "bad s"
        );
        address signer = ecrecover(hash, v, r, s);
        require(signer != address(0), "bad sig");
        return signer;
    }
}
