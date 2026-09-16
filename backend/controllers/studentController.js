const { v4: uuidv4 } = require('uuid');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { asyncHandler } = require('../middleware/errorHandler');
const dataService = require('../services/dataService');

const JWT_SECRET  = process.env.JWT_SECRET  || 'skillgenome_jwt_super_secret_2024';
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

function makeToken(student) {
  return jwt.sign(
    { studentId: student.studentId, email: student.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

// Strip password before sending student data to client
function sanitize(student) {
  const { password, ...safe } = student;
  return safe;
}

/**
 * Register a new student
 */
const registerStudent = asyncHandler(async (req, res) => {
  const { name, email, course, college, password, branch, usn, section, rollNo } = req.body;

  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }

  const existing = dataService.findStudentByEmail(email);
  if (existing) {
    return res.status(409).json({ success: false, message: 'An account with this email already exists. Please log in.' });
  }

  const hashed = await bcrypt.hash(password, 10);

  const student = {
    studentId:        'STU-' + uuidv4().substring(0, 8).toUpperCase(),
    name,
    email,
    course,
    college:          college || '',
    branch:           branch  || '',
    usn:              usn     || '',
    section:          section || '',
    rollNo:           rollNo  || '',
    password:         hashed,
    registeredAt:     new Date().toISOString(),
    files:            [],
    analyzed:         false,
    skillDNA:         null,
    badges:           [],
    blockchainHash:   null,
    blockchainTxId:   null,
  };

  dataService.saveStudent(student);

  const token = makeToken(student);

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    token,
    student: sanitize(student),
  });
});

/**
 * Login with email + password
 */
const loginStudent = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  const student = dataService.findStudentByEmail(email.toLowerCase().trim());
  if (!student) {
    return res.status(401).json({ success: false, message: 'No account found with this email' });
  }

  const match = await bcrypt.compare(password, student.password || '');
  if (!match) {
    return res.status(401).json({ success: false, message: 'Incorrect password' });
  }

  const token = makeToken(student);

  res.json({
    success: true,
    message: 'Logged in successfully',
    token,
    student: sanitize(student),
  });
});

/**
 * Get student by ID
 */
const getStudent = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const student = dataService.getStudentById(studentId);
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
  res.json({ success: true, student: sanitize(student) });
});

/**
 * Get all students
 */
const getAllStudents = asyncHandler(async (req, res) => {
  const students = dataService.getAllStudents().map(sanitize);
  res.json({ success: true, count: students.length, students });
});

/**
 * Handle file uploads
 */
const uploadFiles = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const student = dataService.getStudentById(studentId);
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
  if (!req.files || req.files.length === 0)
    return res.status(400).json({ success: false, message: 'No files uploaded' });

  const uploadedFiles = req.files.map(file => ({
    fileId:       uuidv4(),
    originalName: file.originalname,
    storedName:   file.filename,
    path:         file.path,
    size:         file.size,
    mimetype:     file.mimetype,
    uploadedAt:   new Date().toISOString(),
    type:         detectFileType(file.originalname),
  }));

  student.files = [...(student.files || []), ...uploadedFiles];
  student.analyzed = false;
  dataService.updateStudent(studentId, student);

  res.json({
    success: true,
    message: `${uploadedFiles.length} file(s) uploaded successfully`,
    files: uploadedFiles,
    totalFiles: student.files.length,
  });
});

/**
 * Get uploaded files
 */
const getFiles = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const student = dataService.getStudentById(studentId);
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
  res.json({ success: true, files: student.files || [], count: (student.files || []).length });
});

/**
 * Delete a student
 */
const deleteStudent = asyncHandler(async (req, res) => {
  const deleted = dataService.deleteStudent(req.params.studentId);
  if (!deleted) return res.status(404).json({ success: false, message: 'Student not found' });
  res.json({ success: true, message: 'Account deleted' });
});

// ── helpers ────────────────────────────────────────────────────────────────────
function detectFileType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const map = {
    '.py':'python', '.ipynb':'jupyter',
    '.js':'javascript', '.jsx':'javascript',
    '.ts':'typescript', '.tsx':'typescript',
    '.java':'java', '.cpp':'cpp', '.c':'c',
    '.cs':'csharp', '.go':'go', '.rb':'ruby',
    '.php':'php', '.swift':'swift', '.kt':'kotlin',
    '.rs':'rust', '.scala':'scala', '.r':'r',
    '.pdf':'pdf', '.doc':'word', '.docx':'word',
    '.ppt':'powerpoint', '.pptx':'powerpoint',
    '.xls':'excel', '.xlsx':'excel',
    '.txt':'text', '.md':'markdown', '.csv':'csv',
    '.json':'json', '.xml':'xml', '.yaml':'yaml', '.yml':'yaml',
    '.html':'html', '.css':'css',
    '.zip':'archive', '.rar':'archive', '.7z':'archive',
  };
  return map[ext] || 'unknown';
}

module.exports = {
  registerStudent, loginStudent,
  getStudent, getAllStudents,
  uploadFiles, getFiles, deleteStudent,
};
