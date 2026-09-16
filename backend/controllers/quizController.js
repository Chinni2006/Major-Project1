const { v4: uuidv4 } = require('uuid');
const { asyncHandler } = require('../middleware/errorHandler');
const qds         = require('../services/quizDataService');
const dataService = require('../services/dataService');

const BRANCHES = ['AIML','CSE','CSE-AI','CSE-DS','ECE','EEE','Civil','Mechanical','ALL'];
const SECTIONS = ['A','B','C','ALL'];

// ── Create quiz ───────────────────────────────────────────────────────────────
const createQuiz = asyncHandler(async (req, res) => {
  const { title, description, subject, durationMinutes,
          targetBranches, targetSections, skillCategory } = req.body;
  if (!title || !durationMinutes)
    return res.status(400).json({ success:false, message:'title and durationMinutes are required' });

  const quiz = {
    quizId:          'QUIZ-' + uuidv4().substring(0,8).toUpperCase(),
    teacherId:       req.teacher.teacherId,
    teacherName:     req.teacher.name,
    title,
    description:     description || '',
    subject:         subject     || '',
    skillCategory:   skillCategory || 'general',   // python | dsa | ml | general
    durationMinutes: Number(durationMinutes),
    targetBranches:  targetBranches || ['ALL'],
    targetSections:  targetSections || ['ALL'],
    questions:       [],
    isPublished:     false,
    createdAt:       new Date().toISOString(),
    updatedAt:       new Date().toISOString(),
  };
  qds.saveQuiz(quiz);
  res.status(201).json({ success:true, message:'Quiz created', quiz });
});

// ── Get quizzes by teacher ────────────────────────────────────────────────────
const getTeacherQuizzes = asyncHandler(async (req, res) => {
  const quizzes = qds.getQuizzesByTeacher(req.teacher.teacherId);
  res.json({ success:true, count:quizzes.length, quizzes });
});

// ── Get single quiz (teacher) ─────────────────────────────────────────────────
const getQuiz = asyncHandler(async (req, res) => {
  const quiz = qds.getQuizById(req.params.quizId);
  if (!quiz) return res.status(404).json({ success:false, message:'Quiz not found' });
  res.json({ success:true, quiz });
});

// ── Update quiz metadata ──────────────────────────────────────────────────────
const updateQuiz = asyncHandler(async (req, res) => {
  const quiz = qds.getQuizById(req.params.quizId);
  if (!quiz) return res.status(404).json({ success:false, message:'Quiz not found' });
  if (quiz.teacherId !== req.teacher.teacherId)
    return res.status(403).json({ success:false, message:'Not your quiz' });

  const updated = qds.updateQuiz(quiz.quizId, { ...req.body, updatedAt: new Date().toISOString() });
  res.json({ success:true, quiz:updated });
});

// ── Add question ──────────────────────────────────────────────────────────────
const addQuestion = asyncHandler(async (req, res) => {
  const quiz = qds.getQuizById(req.params.quizId);
  if (!quiz) return res.status(404).json({ success:false, message:'Quiz not found' });
  if (quiz.teacherId !== req.teacher.teacherId)
    return res.status(403).json({ success:false, message:'Not your quiz' });

  const { type, text, options, correctAnswer, marks, explanation } = req.body;
  // type: mcq | truefalse | short
  if (!type || !text || correctAnswer === undefined)
    return res.status(400).json({ success:false, message:'type, text, correctAnswer required' });

  const question = {
    questionId:  'Q-' + uuidv4().substring(0,6).toUpperCase(),
    type,                           // mcq | truefalse | short
    text,
    options:     options || [],     // [{id:'A',text:'...'}, ...]
    correctAnswer,                  // 'A' | 'True' | 'keyword string'
    marks:       Number(marks) || 1,
    explanation: explanation || '',
  };

  quiz.questions.push(question);
  quiz.updatedAt = new Date().toISOString();
  qds.updateQuiz(quiz.quizId, { questions: quiz.questions, updatedAt: quiz.updatedAt });
  res.status(201).json({ success:true, question });
});

// ── Update question ───────────────────────────────────────────────────────────
const updateQuestion = asyncHandler(async (req, res) => {
  const quiz = qds.getQuizById(req.params.quizId);
  if (!quiz) return res.status(404).json({ success:false, message:'Quiz not found' });

  const idx = quiz.questions.findIndex(q => q.questionId === req.params.questionId);
  if (idx === -1) return res.status(404).json({ success:false, message:'Question not found' });

  quiz.questions[idx] = { ...quiz.questions[idx], ...req.body };
  qds.updateQuiz(quiz.quizId, { questions: quiz.questions, updatedAt: new Date().toISOString() });
  res.json({ success:true, question: quiz.questions[idx] });
});

// ── Delete question ───────────────────────────────────────────────────────────
const deleteQuestion = asyncHandler(async (req, res) => {
  const quiz = qds.getQuizById(req.params.quizId);
  if (!quiz) return res.status(404).json({ success:false, message:'Quiz not found' });

  quiz.questions = quiz.questions.filter(q => q.questionId !== req.params.questionId);
  qds.updateQuiz(quiz.quizId, { questions: quiz.questions, updatedAt: new Date().toISOString() });
  res.json({ success:true, message:'Question deleted' });
});

// ── Publish / unpublish ───────────────────────────────────────────────────────
const togglePublish = asyncHandler(async (req, res) => {
  const quiz = qds.getQuizById(req.params.quizId);
  if (!quiz) return res.status(404).json({ success:false, message:'Quiz not found' });
  if (quiz.teacherId !== req.teacher.teacherId)
    return res.status(403).json({ success:false, message:'Not your quiz' });
  if (!quiz.isPublished && quiz.questions.length === 0)
    return res.status(400).json({ success:false, message:'Add at least one question before publishing' });

  const updated = qds.updateQuiz(quiz.quizId, { isPublished: !quiz.isPublished });
  res.json({ success:true, isPublished: updated.isPublished,
    message: updated.isPublished ? 'Quiz published' : 'Quiz unpublished' });
});

// ── Delete quiz ───────────────────────────────────────────────────────────────
const deleteQuiz = asyncHandler(async (req, res) => {
  const quiz = qds.getQuizById(req.params.quizId);
  if (!quiz) return res.status(404).json({ success:false, message:'Quiz not found' });
  if (quiz.teacherId !== req.teacher.teacherId)
    return res.status(403).json({ success:false, message:'Not your quiz' });
  qds.deleteQuiz(quiz.quizId);
  res.json({ success:true, message:'Quiz deleted' });
});

// ── Student: get available quizzes ────────────────────────────────────────────
const getAvailableQuizzes = asyncHandler(async (req, res) => {
  const student = req.student;
  const quizzes = qds.getQuizzesForStudent(student.branch || 'ALL', student.section || 'ALL');

  // Attach attempt status per quiz
  const enriched = quizzes.map(q => {
    const attempt = qds.getAttemptByStudentQuiz(student.studentId, q.quizId);
    // Strip correct answers from questions for student view
    const safeQuestions = q.questions.map(({ correctAnswer, explanation, ...safe }) => safe);
    return {
      quizId:          q.quizId,
      title:           q.title,
      description:     q.description,
      subject:         q.subject,
      skillCategory:   q.skillCategory,
      durationMinutes: q.durationMinutes,
      questionCount:   q.questions.length,
      totalMarks:      q.questions.reduce((s, qq) => s + (qq.marks||1), 0),
      teacherName:     q.teacherName,
      attemptStatus:   attempt ? attempt.status : 'not_started',
      scorePercent:    attempt?.scorePercent ?? null,
    };
  });

  res.json({ success:true, count:enriched.length, quizzes:enriched });
});

module.exports = {
  createQuiz, getTeacherQuizzes, getQuiz, updateQuiz,
  addQuestion, updateQuestion, deleteQuestion,
  togglePublish, deleteQuiz, getAvailableQuizzes,
};
