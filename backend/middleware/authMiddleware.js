const jwt = require('jsonwebtoken');
const dataService     = require('../services/dataService');
const quizDataService = require('../services/quizDataService');

const JWT_SECRET = process.env.JWT_SECRET || 'skillgenome_jwt_super_secret_2024';

/**
 * Verify student JWT
 */
const requireStudent = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer '))
    return res.status(401).json({ success: false, message: 'No token provided' });

  try {
    const payload = jwt.verify(header.split(' ')[1], JWT_SECRET);
    const student = dataService.getStudentById(payload.studentId);
    if (!student) return res.status(401).json({ success: false, message: 'Student not found' });
    req.student = student;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

/**
 * Verify teacher JWT
 */
const requireTeacher = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer '))
    return res.status(401).json({ success: false, message: 'No token provided' });

  try {
    const payload = jwt.verify(header.split(' ')[1], JWT_SECRET);
    if (payload.role !== 'teacher')
      return res.status(403).json({ success: false, message: 'Teacher access required' });
    const teacher = quizDataService.getTeacherById(payload.teacherId);
    if (!teacher) return res.status(401).json({ success: false, message: 'Teacher not found' });
    req.teacher = teacher;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

/**
 * Allow either student or teacher (for shared routes)
 */
const requireAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer '))
    return res.status(401).json({ success: false, message: 'No token provided' });
  try {
    req.authPayload = jwt.verify(header.split(' ')[1], JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

module.exports = { requireStudent, requireTeacher, requireAuth };
