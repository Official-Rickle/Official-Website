// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IERC20 {
    function balanceOf(address) external view returns (uint256);
    function transferFrom(address, address, uint256) external returns (bool);
    function transfer(address, uint256) external returns (bool);
}
interface ISafe {
    function isOwner(address) external view returns (bool);
}

/// @title  AhwaGovernance
/// @notice Persistent-stake on-chain governance for AHWA. Voters stake AHWA
///         once and gain ongoing voting power equal to their staked balance.
///         Stake stays locked until the voter explicitly unstakes — at which
///         point any votes on still-open proposals are nullified. Votes on
///         closed proposals are frozen and survive unstake.
///
///         Multisig (4-of-5 caretakers) can veto any open proposal —
///         identity-checked on-chain via Safe.isOwner().
///
///         No archive RPC needed: tally is maintained live in storage as
///         totalYesWeight / totalNoWeight per proposal. Two eth_call reads
///         get the full state of a proposal.
///
///         msg.sender is irrelevant for proposal/vote/veto submission —
///         anyone can relay a signed message on behalf of a holder. Only
///         stake/unstake use msg.sender directly (token custody).
contract AhwaGovernance {
    string  public constant NAME          = "AhwaGovernance";
    string  public constant VERSION       = "1";
    uint256 public constant VOTING_WINDOW = 72 hours;
    uint256 public constant MIN_AHWA      = 1 ether;
    uint256 public constant TITLE_MAX     = 200;
    uint256 public constant BODY_MAX      = 90_000;

    // Hardcoded for THIS deployment (BSC). If either ever changes, redeploy.
    IERC20 public constant AHWA     = IERC20(0x3A81caafeeDCF2D743Be893858cDa5AcDBF88c11);
    ISafe  public constant MULTISIG = ISafe(0x40e4Da770530E960AE671634d14625F29e3dDb12);

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

    struct Proposal {
        address proposer;          // 20 bytes — first slot, packed with createdAt
        uint64  createdAt;         //  8 bytes
        uint128 totalYesWeight;    // 16 bytes — second slot
        uint128 totalNoWeight;     // 16 bytes — second slot continues
    }

    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;

    /// @notice Voter's staked AHWA. This is their voting power on every
    ///         proposal they vote on, until they unstake.
    mapping(address => uint128) public stakedBalance;
    /// @notice Per-voter list of proposalIds the voter has voted on. Used by
    ///         _nullifyOpenVotes() during unstake; stale (closed) entries get
    ///         pruned lazily.
    mapping(address => uint256[]) public voterOpenProposals;

    mapping(uint256 => mapping(address => uint128)) public voteWeight;
    mapping(uint256 => mapping(address => bool))    public voteYes;
    mapping(uint256 => mapping(address => uint256)) public voteNonce;
    mapping(uint256 => mapping(address => bool))    public hasVetoed;

    event Staked          (address indexed voter, uint128 amount, uint128 newBalance);
    event Unstaked        (address indexed voter, uint128 amount, uint128 newBalance);
    event ProposalSubmitted(uint256 indexed id, address indexed proposer, string title, string body, uint256 timestamp);
    event VoteSubmitted   (address indexed voter, uint256 indexed proposalId, bool yes, uint128 weight, uint256 nonce, uint256 timestamp);
    event VoteNullified   (address indexed voter, uint256 indexed proposalId, uint128 weight);
    event VetoSubmitted   (address indexed signer, uint256 indexed proposalId, uint256 timestamp);

    constructor() {
        DOMAIN_SEPARATOR = keccak256(abi.encode(
            EIP712_DOMAIN_TYPEHASH,
            keccak256(bytes(NAME)),
            keccak256(bytes(VERSION)),
            block.chainid,
            address(this)
        ));
    }

    // ─── Stake / Unstake ────────────────────────────────────────────────

    function stake(uint128 amount) external {
        require(amount >= MIN_AHWA, "stake >= 1 AHWA");
        require(AHWA.transferFrom(msg.sender, address(this), amount), "transferFrom failed");
        stakedBalance[msg.sender] += amount;
        emit Staked(msg.sender, amount, stakedBalance[msg.sender]);
    }

    function unstake(uint128 amount) external {
        require(amount > 0,                          "amount = 0");
        require(amount <= stakedBalance[msg.sender], "exceeds stake");

        // Withdrawal nullifies open-window votes; closed-proposal tallies stay frozen.
        _nullifyOpenVotes(msg.sender);

        stakedBalance[msg.sender] -= amount;
        require(AHWA.transfer(msg.sender, amount), "transfer failed");
        emit Unstaked(msg.sender, amount, stakedBalance[msg.sender]);
    }

    /// @dev Walks voter's recorded proposal list. For each open proposal,
    ///      removes the voter's weight from the live tally. Closed entries
    ///      are pruned without touching their tallies.
    function _nullifyOpenVotes(address voter) internal {
        uint256[] storage list = voterOpenProposals[voter];
        uint256 i = 0;
        while (i < list.length) {
            uint256 pid = list[i];
            Proposal storage p = proposals[pid];
            if (block.timestamp <= uint256(p.createdAt) + VOTING_WINDOW) {
                uint128 w = voteWeight[pid][voter];
                if (w > 0) {
                    if (voteYes[pid][voter]) p.totalYesWeight -= w;
                    else                     p.totalNoWeight  -= w;
                    voteWeight[pid][voter] = 0;
                    emit VoteNullified(voter, pid, w);
                }
            }
            // Closed entries: tally is frozen; just clean up the list.
            list[i] = list[list.length - 1];
            list.pop();
        }
    }

    // ─── Submit Proposal ────────────────────────────────────────────────

    function submitProposal(
        address proposer,
        string calldata title,
        string calldata body,
        bytes calldata signature
    ) external returns (uint256 id) {
        require(stakedBalance[proposer] >= MIN_AHWA, "proposer must stake to propose");

        uint256 tlen = bytes(title).length;
        uint256 blen = bytes(body).length;
        require(tlen > 0 && tlen <= TITLE_MAX, "bad title length");
        require(blen > 0 && blen <= BODY_MAX,  "bad body length");

        bytes32 structHash = keccak256(abi.encode(
            PROPOSAL_TYPEHASH, proposer, keccak256(bytes(title)), keccak256(bytes(body))
        ));
        require(_recover(_typedHash(structHash), signature) == proposer, "bad signer");

        unchecked { ++proposalCount; }
        id = proposalCount;
        proposals[id] = Proposal({
            proposer: proposer,
            createdAt: uint64(block.timestamp),
            totalYesWeight: 0,
            totalNoWeight: 0
        });
        emit ProposalSubmitted(id, proposer, title, body, block.timestamp);
    }

    // ─── Submit Vote ────────────────────────────────────────────────────

    function submitVote(
        address voter,
        bool yes,
        uint256 proposalId,
        uint256 nonce,
        bytes calldata signature
    ) external {
        Proposal storage p = proposals[proposalId];
        require(p.createdAt != 0,                                        "no proposal");
        require(block.timestamp <= uint256(p.createdAt) + VOTING_WINDOW, "voting closed");
        require(nonce == voteNonce[proposalId][voter],                   "bad nonce");

        uint128 weight = stakedBalance[voter];
        require(weight >= MIN_AHWA, "must stake to vote");

        bytes32 structHash = keccak256(abi.encode(VOTE_TYPEHASH, voter, yes, proposalId, nonce));
        require(_recover(_typedHash(structHash), signature) == voter, "bad signer");

        // Live tally: subtract any previous vote weight, add the new one.
        uint128 prev = voteWeight[proposalId][voter];
        if (prev > 0) {
            if (voteYes[proposalId][voter]) p.totalYesWeight -= prev;
            else                            p.totalNoWeight  -= prev;
        } else {
            voterOpenProposals[voter].push(proposalId);
        }
        if (yes) p.totalYesWeight += weight;
        else     p.totalNoWeight  += weight;

        voteWeight[proposalId][voter] = weight;
        voteYes[proposalId][voter]    = yes;
        unchecked { voteNonce[proposalId][voter] = nonce + 1; }
        emit VoteSubmitted(voter, proposalId, yes, weight, nonce, block.timestamp);
    }

    // ─── Submit Veto ────────────────────────────────────────────────────

    function submitVeto(
        address signer,
        uint256 proposalId,
        bytes calldata signature
    ) external {
        Proposal storage p = proposals[proposalId];
        require(p.createdAt != 0,                                        "no proposal");
        require(block.timestamp <= uint256(p.createdAt) + VOTING_WINDOW, "voting closed");
        require(!hasVetoed[proposalId][signer],                          "already vetoed");
        require(MULTISIG.isOwner(signer),                                "not a multisig signer");

        bytes32 structHash = keccak256(abi.encode(VETO_TYPEHASH, signer, proposalId));
        require(_recover(_typedHash(structHash), signature) == signer, "bad signer");

        hasVetoed[proposalId][signer] = true;
        emit VetoSubmitted(signer, proposalId, block.timestamp);
    }

    // ─── View helpers ───────────────────────────────────────────────────

    function deadlineOf(uint256 proposalId) external view returns (uint256) {
        Proposal memory p = proposals[proposalId];
        return p.createdAt == 0 ? 0 : uint256(p.createdAt) + VOTING_WINDOW;
    }
    function isVotingOpen(uint256 proposalId) external view returns (bool) {
        Proposal memory p = proposals[proposalId];
        return p.createdAt != 0 && block.timestamp <= uint256(p.createdAt) + VOTING_WINDOW;
    }

    /// @notice AHWA currently staked by `voter`. This is their voting weight
    ///         on every proposal they vote on, until they unstake.
    function stakedOf(address voter) external view returns (uint128) {
        return stakedBalance[voter];
    }

    /// @notice One-shot view for everything a wallet UI needs to render its
    ///         governance state: staked AHWA, count of proposals the voter
    ///         has voted on (including any closed but uncleaned), and whether
    ///         this address is a multisig signer (can submit vetoes).
    function walletStatus(address voter) external view returns (
        uint128 staked,
        uint256 trackedVotes,
        bool    isMultisigSigner
    ) {
        return (
            stakedBalance[voter],
            voterOpenProposals[voter].length,
            MULTISIG.isOwner(voter)
        );
    }

    // ─── internal: EIP-712 + ecrecover ──────────────────────────────────

    function _typedHash(bytes32 structHash) private view returns (bytes32) {
        return keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));
    }

    function _recover(bytes32 hash, bytes calldata sig) private pure returns (address) {
        require(sig.length == 65, "bad sig length");
        bytes32 r; bytes32 s; uint8 v;
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
