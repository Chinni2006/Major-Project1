const fs   = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'data');
const FILES = {
  teachers: path.join(DATA, 'teachers.json'),
  quizzes:  path.join(DATA, 'quizzes.json'),
  attempts: path.join(DATA, 'attempts.json'),
};

function read(key)       { try { return JSON.parse(fs.readFileSync(FILES[key], 'utf8')); } catch { return []; } }
function write(key, data){ fs.writeFileSync(FILES[key], JSON.stringify(data, null, 2)); }

// ── Teachers ─────────────────────────────────────────────────────────────────
const getTeachers       = ()    => read('teachers');
const getTeacherById    = (id)  => read('teachers').find(t => t.teacherId === id) || null;
const findTeacherByEmail= (em)  => read('teachers').find(t => t.email === em)     || null;
const saveTeacher       = (t)   => { const arr = read('teachers'); arr.push(t); write('teachers', arr); };
const updateTeacher     = (id, data) => {
  const arr = read('teachers');
  const i   = arr.findIndex(t => t.teacherId === id);
  if (i !== -1) { arr[i] = { ...arr[i], ...data }; write('teachers', arr); return arr[i]; }
  return null;
};

// ── Quizzes ──────────────────────────────────────────────────────────────────
const getQuizzes        = ()    => read('quizzes');
const getQuizById       = (id)  => read('quizzes').find(q => q.quizId === id) || null;
const getQuizzesByTeacher=(tid) => read('quizzes').filter(q => q.teacherId === tid);
const getQuizzesForStudent = (branch, section) =>
  read('quizzes').filter(q => q.isPublished &&
    (q.targetBranches.includes('ALL') || q.targetBranches.includes(branch)) &&
    (q.targetSections.includes('ALL') || q.targetSections.includes(section))
  );
const saveQuiz          = (q)   => { const arr = read('quizzes'); arr.push(q); write('quizzes', arr); };
const updateQuiz        = (id, data) => {
  const arr = read('quizzes');
  const i   = arr.findIndex(q => q.quizId === id);
  if (i !== -1) { arr[i] = { ...arr[i], ...data }; write('quizzes', arr); return arr[i]; }
  return null;
};
const deleteQuiz        = (id)  => {
  const arr = read('quizzes').filter(q => q.quizId !== id);
  write('quizzes', arr); return true;
};

// ── Attempts ─────────────────────────────────────────────────────────────────
const getAttempts          = ()    => read('attempts');
const getAttemptById       = (id)  => read('attempts').find(a => a.attemptId === id) || null;
const getAttemptsByStudent = (sid) => read('attempts').filter(a => a.studentId === sid);
const getAttemptsByQuiz    = (qid) => read('attempts').filter(a => a.quizId   === qid);
const getAttemptByStudentQuiz = (sid, qid) =>
  read('attempts').find(a => a.studentId === sid && a.quizId === qid) || null;
const saveAttempt   = (a)   => { const arr = read('attempts'); arr.push(a); write('attempts', arr); };
const updateAttempt = (id, data) => {
  const arr = read('attempts');
  const i   = arr.findIndex(a => a.attemptId === id);
  if (i !== -1) { arr[i] = { ...arr[i], ...data }; write('attempts', arr); return arr[i]; }
  return null;
};

module.exports = {
  getTeachers, getTeacherById, findTeacherByEmail, saveTeacher, updateTeacher,
  getQuizzes, getQuizById, getQuizzesByTeacher, getQuizzesForStudent,
  saveQuiz, updateQuiz, deleteQuiz,
  getAttempts, getAttemptById, getAttemptsByStudent, getAttemptsByQuiz,
  getAttemptByStudentQuiz, saveAttempt, updateAttempt,
};
