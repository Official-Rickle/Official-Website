// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @title  AhwaGovernance
/// @notice On-chain proposal/vote/veto log for AHWA governance. Proposal
///         text (title + body) lives entirely in event data — no IPFS,
///         no off-chain dependencies, no third-party services. Voters
///         see exactly what they signed.
///
///         All counting policy (>=1 AHWA balance at proposal block,
///         multisig safe exclusion, LP exclusion, 51% threshold, 1h
///         finalization, 4/5 veto rule) is enforced off-chain by
///         rickletoken.com reading these events. The contract proves:
///         "this address signed this typed data for THIS contract on
///         THIS chain, and hasn't done so before for this proposal."
///
///         msg.sender is irrelevant — anyone can relay a signed message
///         on behalf of a holder. Practically the proposer pays gas to
///         submit their own ~90KB proposal.
contract AhwaGovernance {
    string  public constant NAME          = "AhwaGovernance";
    string  public constant VERSION       = "1";
    uint256 public constant VOTING_WINDOW = 72 hours;
    uint256 public constant TITLE_MAX     = 200;
    uint256 public constant BODY_MAX      = 90_000;

    bytes32 private constant EIP712_DOMAIN_TYPEHASH = keccak256(
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
    );
    bytes32 private constant PROPOSAL_TYPEHASH = keccak256(
        "Proposal(address proposer,string title,string body)"
    );
    bytes32 private constant VOTE_TYPEHASH = keccak256(
        "Vote(address voter,bool yes,uint256 proposalId,uint256 nonce)"
    );
    bytes32 private constant VETO_TYPEHASH = keccak256(
        "Veto(address signer,uint256 proposalId)"
    );

    bytes32 public immutable DOMAIN_SEPARATOR;

    enum VoteChoice { None, Yes, No }

    struct Proposal {
        address proposer;
        uint64  createdAt;
    }

    /// @notice Number of proposals submitted; the next id will be proposalCount + 1.
    uint256 public proposalCount;

    /// @notice Proposal record by id (1-indexed). createdAt==0 means none.
    ///         Title and body live in event data only — too large to store on-chain.
    mapping(uint256 => Proposal) public proposals;

    /// @notice Current vote per voter per proposal: None / Yes / No.
    mapping(uint256 => mapping(address => VoteChoice)) public voteOf;

    /// @notice Per-voter nonce for replay protection on vote changes.
    mapping(uint256 => mapping(address => uint256)) public voteNonce;

    /// @notice Set once a multisig signer vetoes; vetoes cannot be rescinded.
    mapping(uint256 => mapping(address => bool)) public hasVetoed;

    event ProposalSubmitted(
        uint256 indexed id,
        address indexed proposer,
        string          title,
        string          body,
        uint256         timestamp
    );
    event VoteSubmitted(
        address indexed voter,
        uint256 indexed proposalId,
        bool            yes,
        uint256         nonce,
        uint256         timestamp
    );
    event VetoSubmitted(
        address indexed signer,
        uint256 indexed proposalId,
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
        string calldata title,
        string calldata body,
        bytes calldata signature
    ) external returns (uint256) {
        uint256 tlen = bytes(title).length;
        uint256 blen = bytes(body).length;
        require(tlen > 0 && tlen <= TITLE_MAX, "bad title length");
        require(blen > 0 && blen <= BODY_MAX,  "bad body length");

        bytes32 structHash = keccak256(abi.encode(
            PROPOSAL_TYPEHASH,
            proposer,
            keccak256(bytes(title)),
            keccak256(bytes(body))
        ));
        require(_recover(_typedHash(structHash), signature) == proposer, "bad signer");

        unchecked { ++proposalCount; }
        uint256 id = proposalCount;
        proposals[id] = Proposal({ proposer: proposer, createdAt: uint64(block.timestamp) });
        emit ProposalSubmitted(id, proposer, title, body, block.timestamp);
        return id;
    }

    function submitVote(
        address voter,
        bool yes,
        uint256 proposalId,
        uint256 nonce,
        bytes calldata signature
    ) external {
        Proposal memory p = proposals[proposalId];
        require(p.createdAt != 0, "no proposal");
        require(block.timestamp <= uint256(p.createdAt) + VOTING_WINDOW, "voting closed");
        require(nonce == voteNonce[proposalId][voter], "bad nonce");

        bytes32 structHash = keccak256(abi.encode(VOTE_TYPEHASH, voter, yes, proposalId, nonce));
        require(_recover(_typedHash(structHash), signature) == voter, "bad signer");

        voteOf[proposalId][voter] = yes ? VoteChoice.Yes : VoteChoice.No;
        unchecked { voteNonce[proposalId][voter] = nonce + 1; }
        emit VoteSubmitted(voter, proposalId, yes, nonce, block.timestamp);
    }

    function submitVeto(
        address signer,
        uint256 proposalId,
        bytes calldata signature
    ) external {
        Proposal memory p = proposals[proposalId];
        require(p.createdAt != 0, "no proposal");
        require(block.timestamp <= uint256(p.createdAt) + VOTING_WINDOW, "voting closed");
        require(!hasVetoed[proposalId][signer], "already vetoed");

        bytes32 structHash = keccak256(abi.encode(VETO_TYPEHASH, signer, proposalId));
        require(_recover(_typedHash(structHash), signature) == signer, "bad signer");

        hasVetoed[proposalId][signer] = true;
        emit VetoSubmitted(signer, proposalId, block.timestamp);
    }

    /// @notice Voting deadline (UNIX seconds). Returns 0 if no proposal exists.
    function deadlineOf(uint256 proposalId) external view returns (uint256) {
        Proposal memory p = proposals[proposalId];
        return p.createdAt == 0 ? 0 : uint256(p.createdAt) + VOTING_WINDOW;
    }

    /// @notice True if a proposal exists and the voting window is still open.
    function isVotingOpen(uint256 proposalId) external view returns (bool) {
        Proposal memory p = proposals[proposalId];
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
