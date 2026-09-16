const { asyncHandler } = require('../middleware/errorHandler');
const dataService = require('../services/dataService');
const blockchainService = require('../services/blockchainService');
const { computeBadges } = require('../services/badgeService');

/**
 * Store a student's Skill DNA hash on the blockchain
 */
const storeSkillHash = asyncHandler(async (req, res) => {
  const { studentId } = req.body;
  const student = dataService.getStudentById(studentId);

  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found' });
  }

  if (!student.analyzed || !student.skillDNA) {
    return res.status(400).json({
      success: false,
      message: 'Student has no Skill DNA yet. Please run analysis first.'
    });
  }

  if (student.blockchainHash) {
    return res.status(409).json({
      success: false,
      message: 'Skill DNA already stored on blockchain',
      txId: student.blockchainTxId,
      hash: student.blockchainHash
    });
  }

  // Store on blockchain (simulated)
  const result = await blockchainService.storeHash(student);

  // Update student with blockchain info
  student.blockchainHash = result.hash;
  student.blockchainTxId = result.txId;
  student.blockchainTimestamp = result.timestamp;
  student.blockNumber = result.blockNumber;
  // Re-compute badges so blockchain_cert badge is awarded
  student.badges = computeBadges(student.skillDNA, student);
  dataService.updateStudent(studentId, student);

  res.json({
    success: true,
    message: 'Skill DNA hash stored on blockchain successfully',
    txId: result.txId,
    hash: result.hash,
    blockNumber: result.blockNumber,
    timestamp: result.timestamp,
    network: result.network
  });
});

/**
 * Get all blockchain records
 */
const getAllRecords = asyncHandler(async (req, res) => {
  const records = blockchainService.getAllRecords();
  res.json({ success: true, count: records.length, records });
});

/**
 * Get a specific student's blockchain record
 */
const getRecord = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const record = blockchainService.getRecord(studentId);

  if (!record) {
    return res.status(404).json({
      success: false,
      message: 'No blockchain record found for this student'
    });
  }

  res.json({ success: true, record });
});

/**
 * Get blockchain network status
 */
const getNetworkStatus = asyncHandler(async (req, res) => {
  const status = blockchainService.getNetworkStatus();
  res.json({ success: true, ...status });
});

module.exports = { storeSkillHash, getAllRecords, getRecord, getNetworkStatus };
