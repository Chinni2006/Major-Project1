const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const dataService = require('../services/dataService');
const { getAllBadgeDefinitions } = require('../services/badgeService');

// GET /api/leaderboard — top students by overall score
router.get('/', asyncHandler(async (req, res) => {
  const students = dataService.getAllStudents();
  const ranked = students
    .filter(s => s.analyzed && s.skillDNA)
    .map(s => ({
      studentId: s.studentId,
      name: s.name,
      course: s.course,
      college: s.college,
      scores: s.skillDNA.scores,
      growthRate: s.skillDNA.growthRate,
      profileLevel: s.skillDNA.profileLevel,
      badges: s.badges || [],
      blockchainVerified: !!s.blockchainHash,
      analyzedAt: s.analyzedAt,
    }))
    .sort((a, b) => (b.scores.overall || 0) - (a.scores.overall || 0))
    .slice(0, 50);

  res.json({ success: true, count: ranked.length, leaderboard: ranked });
}));

// GET /api/leaderboard/badges — all badge definitions
router.get('/badges', asyncHandler(async (req, res) => {
  res.json({ success: true, badges: getAllBadgeDefinitions() });
}));

// GET /api/leaderboard/profile/:studentId — public profile
router.get('/profile/:studentId', asyncHandler(async (req, res) => {
  const student = dataService.getStudentById(req.params.studentId);
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

  res.json({
    success: true,
    profile: {
      studentId: student.studentId,
      name: student.name,
      course: student.course,
      college: student.college,
      registeredAt: student.registeredAt,
      analyzed: student.analyzed,
      skillDNA: student.skillDNA || null,
      badges: student.badges || [],
      blockchainVerified: !!student.blockchainHash,
      blockchainHash: student.blockchainHash || null,
      blockchainTimestamp: student.blockchainTimestamp || null,
      blockNumber: student.blockNumber || null,
      blockchainTxId: student.blockchainTxId || null,
    }
  });
}));

module.exports = router;
