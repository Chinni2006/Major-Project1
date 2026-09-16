const { asyncHandler } = require('../middleware/errorHandler');
const dataService = require('../services/dataService');
const aiAnalyzer = require('../services/aiAnalyzer');
const { computeBadges } = require('../services/badgeService');

/**
 * Analyze all uploaded files for a student and generate Skill DNA
 */
const analyzeStudent = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const student = dataService.getStudentById(studentId);

  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found' });
  }

  if (!student.files || student.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No files uploaded. Please upload project files before analyzing.'
    });
  }

  // Run AI analysis on each file
  const fileAnalyses = [];
  for (const file of student.files) {
    try {
      const analysis = await aiAnalyzer.analyzeFile(file);
      fileAnalyses.push(analysis);
    } catch (err) {
      console.warn(`Could not analyze file ${file.originalName}:`, err.message);
    }
  }

  // Aggregate scores across all files
  const skillDNA = aiAnalyzer.aggregateSkillDNA(fileAnalyses, student);

  // Update student record
  student.analyzed = true;
  student.skillDNA = skillDNA;
  student.analyzedAt = new Date().toISOString();
  // Compute badges
  student.badges = computeBadges(skillDNA, student);
  dataService.updateStudent(studentId, student);

  res.json({
    success: true,
    message: 'Skill DNA generated successfully',
    skillDNA,
    filesAnalyzed: fileAnalyses.length
  });
});

/**
 * Get existing analysis result for a student
 */
const getAnalysis = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const student = dataService.getStudentById(studentId);

  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found' });
  }

  if (!student.analyzed || !student.skillDNA) {
    return res.status(404).json({
      success: false,
      message: 'No analysis found. Please run analysis first.'
    });
  }

  res.json({ success: true, skillDNA: student.skillDNA, analyzedAt: student.analyzedAt });
});

/**
 * Analyze a single code snippet (demo mode)
 */
const analyzeSnippet = asyncHandler(async (req, res) => {
  const { code, language, problemType } = req.body;

  const result = aiAnalyzer.analyzeCodeSnippet(code, language, problemType);

  res.json({
    success: true,
    message: 'Snippet analyzed',
    result
  });
});

module.exports = { analyzeStudent, getAnalysis, analyzeSnippet };
