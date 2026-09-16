// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SkillGenomeLedger
 * @author SkillGenome Team
 * @notice Stores tamper-proof AI-generated Skill DNA hashes for students.
 *         Companies can verify a student's skills on-chain without trusting a resume.
 *
 * Flow:
 *   1. Backend AI engine analyses a student's code → produces a skill hash.
 *   2. Backend calls storeSkillHash() → hash is permanently recorded on-chain.
 *   3. Company calls verifySkillHash() → returns true/false with full metadata.
 */
contract SkillGenomeLedger {

    // ─── Data Structures ─────────────────────────────────────────────────────

    struct SkillProfile {
        string  studentId;       // e.g. "STU-A1B2C3D4"
        string  studentName;
        bytes32 skillHash;       // HMAC-SHA256 of Skill DNA (hex → bytes32)
        uint256 pythonScore;     // 0-100
        uint256 problemSolving;  // 0-100
        uint256 mlScore;         // 0-100
        uint256 codeQuality;     // 0-100
        uint256 growthRate;      // e.g. 15 = 15% per 6 months
        uint256 timestamp;       // block.timestamp when stored
        address storedBy;        // who called storeSkillHash
        bool    exists;
    }

    struct VerificationLog {
        string  studentId;
        address verifier;
        uint256 timestamp;
        bool    result;
    }

    // ─── State ────────────────────────────────────────────────────────────────

    address public owner;

    // studentId string → SkillProfile
    mapping(string => SkillProfile) private profiles;

    // All student IDs (for enumeration)
    string[] public studentIds;

    // Verification audit trail
    VerificationLog[] public verificationLogs;

    // Authorised addresses that can store hashes (owner + approved backends)
    mapping(address => bool) public authorised;

    // ─── Events ───────────────────────────────────────────────────────────────

    event SkillHashStored(
        string indexed studentId,
        bytes32 skillHash,
        uint256 timestamp,
        address storedBy
    );

    event SkillHashVerified(
        string indexed studentId,
        address indexed verifier,
        bool result,
        uint256 timestamp
    );

    event AuthorisationChanged(address indexed account, bool status);

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "SkillGenome: caller is not the owner");
        _;
    }

    modifier onlyAuthorised() {
        require(
            authorised[msg.sender] || msg.sender == owner,
            "SkillGenome: caller is not authorised"
        );
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
        authorised[msg.sender] = true;
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    /**
     * @notice Grant or revoke authorisation for a backend address.
     */
    function setAuthorisation(address account, bool status) external onlyOwner {
        authorised[account] = status;
        emit AuthorisationChanged(account, status);
    }

    // ─── Core Functions ───────────────────────────────────────────────────────

    /**
     * @notice Store a student's AI-generated skill hash on-chain.
     * @dev    Can only be called by an authorised backend address.
     *         Once stored, a profile cannot be overwritten — immutable by design.
     * @param studentId      Unique student identifier (e.g. "STU-A1B2C3D4")
     * @param studentName    Student's full name
     * @param skillHash      HMAC-SHA256 hash of the Skill DNA (as bytes32)
     * @param pythonScore    Python skill score (0-100)
     * @param problemSolving Problem solving score (0-100)
     * @param mlScore        Machine Learning score (0-100)
     * @param codeQuality    Code quality score (0-100)
     * @param growthRate     Estimated growth rate percentage per 6 months
     */
    function storeSkillHash(
        string  calldata studentId,
        string  calldata studentName,
        bytes32 skillHash,
        uint256 pythonScore,
        uint256 problemSolving,
        uint256 mlScore,
        uint256 codeQuality,
        uint256 growthRate
    ) external onlyAuthorised {
        require(bytes(studentId).length > 0,    "SkillGenome: empty studentId");
        require(!profiles[studentId].exists,     "SkillGenome: profile already exists");
        require(pythonScore    <= 100, "SkillGenome: pythonScore out of range");
        require(problemSolving <= 100, "SkillGenome: problemSolving out of range");
        require(mlScore        <= 100, "SkillGenome: mlScore out of range");
        require(codeQuality    <= 100, "SkillGenome: codeQuality out of range");

        profiles[studentId] = SkillProfile({
            studentId:      studentId,
            studentName:    studentName,
            skillHash:      skillHash,
            pythonScore:    pythonScore,
            problemSolving: problemSolving,
            mlScore:        mlScore,
            codeQuality:    codeQuality,
            growthRate:     growthRate,
            timestamp:      block.timestamp,
            storedBy:       msg.sender,
            exists:         true
        });

        studentIds.push(studentId);

        emit SkillHashStored(studentId, skillHash, block.timestamp, msg.sender);
    }

    /**
     * @notice Verify a student's skill hash. Logs every verification attempt.
     * @param studentId  The student's unique ID
     * @param hashToCheck The hash to compare against the stored one
     * @return result    true if the hash matches the stored record
     */
    function verifySkillHash(
        string  calldata studentId,
        bytes32 hashToCheck
    ) external returns (bool result) {
        require(profiles[studentId].exists, "SkillGenome: no profile found for this student");

        result = profiles[studentId].skillHash == hashToCheck;

        verificationLogs.push(VerificationLog({
            studentId: studentId,
            verifier:  msg.sender,
            timestamp: block.timestamp,
            result:    result
        }));

        emit SkillHashVerified(studentId, msg.sender, result, block.timestamp);
    }

    // ─── View Functions ───────────────────────────────────────────────────────

    /**
     * @notice Retrieve a student's full skill profile.
     */
    function getProfile(string calldata studentId)
        external
        view
        returns (
            string  memory sName,
            bytes32 skillHash,
            uint256 pythonScore,
            uint256 problemSolving,
            uint256 mlScore,
            uint256 codeQuality,
            uint256 growthRate,
            uint256 timestamp,
            address storedBy
        )
    {
        require(profiles[studentId].exists, "SkillGenome: profile not found");
        SkillProfile storage p = profiles[studentId];
        return (
            p.studentName,
            p.skillHash,
            p.pythonScore,
            p.problemSolving,
            p.mlScore,
            p.codeQuality,
            p.growthRate,
            p.timestamp,
            p.storedBy
        );
    }

    /**
     * @notice Check if a profile exists for a student.
     */
    function profileExists(string calldata studentId) external view returns (bool) {
        return profiles[studentId].exists;
    }

    /**
     * @notice Total number of stored profiles.
     */
    function totalProfiles() external view returns (uint256) {
        return studentIds.length;
    }

    /**
     * @notice Total verification attempts logged.
     */
    function totalVerifications() external view returns (uint256) {
        return verificationLogs.length;
    }

    /**
     * @notice Get a verification log entry by index.
     */
    function getVerificationLog(uint256 index)
        external
        view
        returns (
            string  memory studentId,
            address verifier,
            uint256 timestamp,
            bool    result
        )
    {
        require(index < verificationLogs.length, "SkillGenome: index out of bounds");
        VerificationLog storage log = verificationLogs[index];
        return (log.studentId, log.verifier, log.timestamp, log.result);
    }
}
