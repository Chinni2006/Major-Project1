const { asyncHandler } = require('../middleware/errorHandler');
const dataService = require('../services/dataService');
const blockchainService = require('../services/blockchainService');
const aiAnalyzer = require('../services/aiAnalyzer');

/**
 * Verify a student's skill profile by student ID
 */
const verifyByStudentId = asyncHandler(async (req, res) => {
  const { studentId, companyName } = req.body;

  const student = dataService.getStudentById(studentId);
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student ID not found in system' });
  }

  if (!student.blockchainHash) {
    return res.status(404).json({
      success: false,
      message: 'No blockchain record found for this student. Skill DNA has not been stored yet.'
    });
  }

  // Regenerate hash from current skill DNA and compare
  const currentHash = aiAnalyzer.generateSkillHash(student.skillDNA, studentId);
  const isValid = currentHash === student.blockchainHash;

  // Log verification attempt
  const verificationRecord = {
    studentId,
    companyName: companyName || 'Anonymous',
    verifiedAt: new Date().toISOString(),
    result: isValid ? 'VERIFIED' : 'MISMATCH',
    storedHash: student.blockchainHash,
    computedHash: currentHash
  };
  dataService.saveVerificationRecord(verificationRecord);

  if (isValid) {
    return res.json({
      success: true,
      verified: true,
      message: '✅ Skill profile verified successfully',
      student: {
        studentId: student.studentId,
        name: student.name,
        course: student.course,
        college: student.college
      },
      skillDNA: student.skillDNA,
      blockchain: {
        hash: student.blockchainHash,
        txId: student.blockchainTxId,
        blockNumber: student.blockNumber,
        timestamp: student.blockchainTimestamp,
        network: 'Ethereum (Simulated)'
      },
      verifiedAt: verificationRecord.verifiedAt
    });
  } else {
    return res.json({
      success: true,
      verified: false,
      message: '❌ Skill profile verification failed — data may have been tampered with',
      storedHash: student.blockchainHash,
      computedHash: currentHash
    });
  }
});

/**
 * Verify by providing a hash directly
 */
const verifyByHash = asyncHandler(async (req, res) => {
  const { studentId, hash, companyName } = req.body;

  const student = dataService.getStudentById(studentId);
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student ID not found in system' });
  }

  const isValid = student.blockchainHash === hash;

  // Log verification attempt
  dataService.saveVerificationRecord({
    studentId,
    companyName: companyName || 'Anonymous',
    verifiedAt: new Date().toISOString(),
    result: isValid ? 'VERIFIED' : 'MISMATCH',
    storedHash: student.blockchainHash,
    providedHash: hash
  });

  res.json({
    success: true,
    verified: isValid,
    message: isValid
      ? '✅ Hash matches blockchain record — profile is authentic'
      : '❌ Hash does not match — profile may be fake or modified',
    studentName: isValid ? student.name : undefined
  });
});

/**
 * Get verification history for a student
 */
const getVerificationHistory = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const history = dataService.getVerificationHistory(studentId);
  res.json({ success: true, count: history.length, history });
});

module.exports = { verifyByStudentId, verifyByHash, getVerificationHistory };
