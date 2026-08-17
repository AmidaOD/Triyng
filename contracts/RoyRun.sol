// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * PROJECT ROY — Off the Grid
 * Reference contract for the on-chain run lifecycle.
 *
 * The browser client (src/chain.js) talks to a MockChainAdapter with exactly
 * this surface, so wiring a real deployment is a matter of swapping the adapter
 * for an ethers/viem implementation of the functions below. Designed for a
 * cheap L2 (Base / Arbitrum / Optimism) where a commit per chapter is viable.
 *
 * NOT AUDITED. Reference material for the prototype.
 */

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

contract RoyRun {
    /* ─────────────── types ─────────────── */

    enum Path { MORTY, RICK }      // Safe Yield vs Degen Risk
    enum Mode { SOLO, HIVE }       // solo run vs Roy 2: Dave hive-mind

    struct Run {
        address player;
        bytes32 seed;              // commit-reveal seed, drives every roll
        Path path;
        Mode mode;
        uint8 pace;                // chapters resolved per player decision (1-3)
        uint16 age;
        uint16 chapter;
        bool alive;
        bool finalized;
    }

    struct Legacy {                // soulbound: no transfer function exists
        uint256 runId;
        address player;
        uint32 score;
        uint16 age;
        Path path;
        uint8 passdownTrait;       // 0 resilience · 1 charisma · 2 luck · 3 madness
        uint64 endedAt;
    }

    /* ─────────────── storage ─────────────── */

    IERC20 public immutable ticket;          // $TICKET, the arcade token
    uint256 public immutable entryFee;       // burned into the season pool
    address public immutable oracle;         // resolves outcomes off-chain, posts roots

    uint256 public nextRunId = 1;
    uint256 public seasonId = 1;
    uint256 public prizePool;

    mapping(uint256 => Run) public runs;
    mapping(address => uint256) public activeRun;
    mapping(address => Legacy[]) public legacies;      // permanent, non-transferable
    mapping(uint256 => mapping(address => uint32)) public seasonScore;

    /* ─────────────── events ─────────────── */

    event RunMinted(uint256 indexed runId, address indexed player, Path path, Mode mode, bytes32 seed);
    event ChapterCommitted(uint256 indexed runId, uint16 chapter, uint8 choice, bytes32 roll);
    event FastForwarded(uint256 indexed runId, uint16 fromChapter, uint8 chapters);
    event RunFinalized(uint256 indexed runId, uint32 score, uint16 age, uint8 endReason);
    event LegacyMinted(address indexed player, uint256 indexed runId, uint32 score, uint8 passdownTrait);
    event RewardClaimed(uint256 indexed seasonId, address indexed player, uint256 amount);

    error RunNotActive();
    error AlreadyRunning();
    error NotOracle();
    error NotPlayer();

    modifier onlyOracle() {
        if (msg.sender != oracle) revert NotOracle();
        _;
    }

    constructor(IERC20 _ticket, uint256 _entryFee, address _oracle) {
        ticket = _ticket;
        entryFee = _entryFee;
        oracle = _oracle;
    }

    /* ─────────────── lifecycle ─────────────── */

    /// Pay the entry fee and mint a Roy ID. Traits are derived from `seed` client-side
    /// and are verifiable by anyone who replays the run against it.
    function mint(bytes32 seed, Path path, Mode mode, uint8 pace) external returns (uint256 runId) {
        if (activeRun[msg.sender] != 0) revert AlreadyRunning();
        ticket.transferFrom(msg.sender, address(this), entryFee);
        prizePool += entryFee;

        runId = nextRunId++;
        runs[runId] = Run({
            player: msg.sender,
            seed: seed,
            path: path,
            mode: mode,
            pace: pace,
            age: 0,
            chapter: 0,
            alive: true,
            finalized: false
        });
        activeRun[msg.sender] = runId;

        emit RunMinted(runId, msg.sender, path, mode, seed);
    }

    /// One player decision. The roll is `keccak256(seed, chapter, salt)` — the same
    /// derivation the client uses, so the outcome is reproducible and auditable.
    function commit(uint256 runId, uint8 choice, uint16 age) external {
        Run storage r = runs[runId];
        if (r.player != msg.sender) revert NotPlayer();
        if (!r.alive || r.finalized) revert RunNotActive();

        bytes32 roll = keccak256(abi.encodePacked(r.seed, r.chapter, choice));
        r.chapter += 1;
        r.age = age;

        emit ChapterCommitted(runId, r.chapter, choice, roll);
    }

    /// Chapters the player chose not to see (pace 2 or 3) are resolved by the engine
    /// and recorded in one transaction to keep the gas cost of a run flat.
    function fastForward(uint256 runId, uint8 chapters, uint16 age) external {
        Run storage r = runs[runId];
        if (r.player != msg.sender) revert NotPlayer();
        if (!r.alive || r.finalized) revert RunNotActive();

        uint16 from = r.chapter;
        r.chapter += chapters;
        r.age = age;

        emit FastForwarded(runId, from, chapters);
    }

    /// Permadeath. Burns the Roy ID, writes the soulbound record, credits the season
    /// score. `endReason` mirrors the ENDINGS keys in the client.
    function finalize(uint256 runId, uint32 score, uint16 age, uint8 endReason, uint8 passdownTrait)
        external
        onlyOracle
    {
        Run storage r = runs[runId];
        if (r.finalized) revert RunNotActive();

        r.alive = false;
        r.finalized = true;
        activeRun[r.player] = 0;

        legacies[r.player].push(Legacy({
            runId: runId,
            player: r.player,
            score: score,
            age: age,
            path: r.path,
            passdownTrait: passdownTrait,
            endedAt: uint64(block.timestamp)
        }));

        if (score > seasonScore[seasonId][r.player]) {
            seasonScore[seasonId][r.player] = score;
        }

        emit RunFinalized(runId, score, age, endReason);
        emit LegacyMinted(r.player, runId, score, passdownTrait);
    }

    /* ─────────────── season ─────────────── */

    /// Season payouts are settled against a merkle root posted by the oracle at
    /// season close; kept as a stub here since the prototype pays out locally.
    function claimReward(uint256 amount, bytes32[] calldata /* proof */) external {
        require(amount <= prizePool, "pool");
        prizePool -= amount;
        ticket.transfer(msg.sender, amount);
        emit RewardClaimed(seasonId, msg.sender, amount);
    }

    /* ─────────────── views ─────────────── */

    function legacyCount(address player) external view returns (uint256) {
        return legacies[player].length;
    }

    /// The inherited trait bonus for the next generation: the best trait of the
    /// most recent legacy, +1 at mint time.
    function passdownOf(address player) external view returns (uint8 trait, bool exists) {
        uint256 n = legacies[player].length;
        if (n == 0) return (0, false);
        return (legacies[player][n - 1].passdownTrait, true);
    }
}
