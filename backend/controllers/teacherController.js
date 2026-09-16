const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { asyncHandler } = require('../middleware/errorHandler');
const qds = require('../services/quizDataService');
const dataService = require('../services/dataService');

const JWT_SECRET  = process.env.JWT_SECRET  || 'skillgenome_jwt_super_secret_2024';
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

const sanitize = ({ password, ...t }) => t;

function makeToken(teacher) {
  return jwt.sign(
    { teacherId: teacher.teacherId, email: teacher.email, role: 'teacher' },
    JWT_SECRET, { expiresIn: JWT_EXPIRES }
  );
}

// ── Register ──────────────────────────────────────────────────────────────────
const registerTeacher = asyncHandler(async (req, res) => {
  const { name, email, password, department, employeeId } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ success: false, message: 'Name, email and password are required' });
  if (!department || !department.trim())
    return res.status(400).json({ success: false, message: 'Department is required' });
  if (password.length < 6)
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });

  if (qds.findTeacherByEmail(email))
    return res.status(409).json({ success: false, message: 'Email already registered' });

  const teacher = {
    teacherId:   'TCH-' + uuidv4().substring(0, 8).toUpperCase(),
    name, email,
    department:  department  || '',
    employeeId:  employeeId  || '',
    password:    await bcrypt.hash(password, 10),
    registeredAt: new Date().toISOString(),
  };
  qds.saveTeacher(teacher);

  res.status(201).json({
    success: true, message: 'Teacher account created',
    token: makeToken(teacher), teacher: sanitize(teacher),
  });
});

// ── Login ─────────────────────────────────────────────────────────────────────
const loginTeacher = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: 'Email and password required' });

  const teacher = qds.findTeacherByEmail(email.toLowerCase().trim());
  if (!teacher)
    return res.status(401).json({ success: false, message: 'No account found with this email' });

  const match = await bcrypt.compare(password, teacher.password || '');
  if (!match)
    return res.status(401).json({ success: false, message: 'Incorrect password' });

  res.json({
    success: true, message: 'Logged in',
    token: makeToken(teacher), teacher: sanitize(teacher),
  });
});

// ── Teacher dashboard summary ──────────────────────────────────────────────────
const getDashboard = asyncHandler(async (req, res) => {
  const teacherId = req.teacher.teacherId;
  const quizzes   = qds.getQuizzesByTeacher(teacherId);
  const allAttempts = quizzes.flatMap(q => qds.getAttemptsByQuiz(q.quizId));
  const students  = dataService.getAllStudents();

  const summary = quizzes.map(q => {
    const attempts = qds.getAttemptsByQuiz(q.quizId).filter(a => a.status === 'submitted');
    const avg = attempts.length
      ? Math.round(attempts.reduce((s, a) => s + (a.scorePercent || 0), 0) / attempts.length)
      : 0;
    return { quizId: q.quizId, title: q.title, totalAttempts: attempts.length, avgScore: avg, isPublished: q.isPublished };
  });

  res.json({
    success: true,
    stats: {
      totalQuizzes:   quizzes.length,
      totalAttempts:  allAttempts.filter(a => a.status === 'submitted').length,
      totalStudents:  students.length,
      publishedQuizzes: quizzes.filter(q => q.isPublished).length,
    },
    quizSummary: summary,
  });
});

// ── Get all students (for teacher view) ───────────────────────────────────────
const getStudents = asyncHandler(async (req, res) => {
  const { branch, section } = req.query;
  let students = dataService.getAllStudents().map(({ password, ...s }) => s);
  if (branch)  students = students.filter(s => s.branch === branch);
  if (section) students = students.filter(s => s.section === section);
  res.json({ success: true, count: students.length, students });
});

// ── Get results for a specific quiz ───────────────────────────────────────────
const getQuizResults = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  const quiz = qds.getQuizById(quizId);
  if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

  const attempts = qds.getAttemptsByQuiz(quizId).filter(a => a.status === 'submitted');
  const enriched = attempts.map(a => {
    const student = dataService.getStudentById(a.studentId);
    return {
      ...a,
      studentName:   student?.name    || 'Unknown',
      branch:        student?.branch  || '',
      section:       student?.section || '',
      usn:           student?.usn     || '',
      rollNo:        student?.rollNo  || '',
    };
  });

  res.json({ success: true, quiz: { quizId: quiz.quizId, title: quiz.title }, results: enriched });
});

module.exports = { registerTeacher, loginTeacher, getDashboard, getStudents, getQuizResults };
