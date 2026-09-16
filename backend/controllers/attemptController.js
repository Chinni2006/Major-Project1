const { v4: uuidv4 } = require('uuid');
const { asyncHandler } = require('../middleware/errorHandler');
const qds         = require('../services/quizDataService');
const dataService = require('../services/dataService');
const { computeBadges } = require('../services/badgeService');

// ── Start attempt ─────────────────────────────────────────────────────────────
const startAttempt = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  const student    = req.student;

  const quiz = qds.getQuizById(quizId);
  if (!quiz)            return res.status(404).json({ success:false, message:'Quiz not found' });
  if (!quiz.isPublished)return res.status(400).json({ success:false, message:'Quiz is not published yet' });

  const existing = qds.getAttemptByStudentQuiz(student.studentId, quizId);
  if (existing && existing.status === 'submitted')
    return res.status(409).json({ success:false, message:'You have already submitted this quiz', attempt:existing });

  // Resume in-progress attempt
  if (existing && existing.status === 'in_progress')
    return res.json({ success:true, message:'Resuming attempt', attempt:existing,
      questions: sanitizeQuestions(quiz.questions) });

  const attempt = {
    attemptId:   'ATT-' + uuidv4().substring(0,8).toUpperCase(),
    studentId:   student.studentId,
    quizId,
    status:      'in_progress',
    startedAt:   new Date().toISOString(),
    submittedAt: null,
    answers:     {},       // { questionId: studentAnswer }
    score:       0,
    totalMarks:  quiz.questions.reduce((s,q) => s+(q.marks||1), 0),
    scorePercent:0,
    violations:  [],       // proctoring violations log
    proctoringData: { tabSwitches:0, faceNotDetected:0, multiplefaces:0, soundViolations:0, lookAwayCount:0 },
  };

  qds.saveAttempt(attempt);
  res.status(201).json({ success:true, attempt, questions: sanitizeQuestions(quiz.questions) });
});

// ── Save answer (auto-save while quiz is running) ─────────────────────────────
const saveAnswer = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const { questionId, answer } = req.body;

  const attempt = qds.getAttemptById(attemptId);
  if (!attempt) return res.status(404).json({ success:false, message:'Attempt not found' });
  if (attempt.studentId !== req.student.studentId)
    return res.status(403).json({ success:false, message:'Not your attempt' });
  if (attempt.status === 'submitted')
    return res.status(400).json({ success:false, message:'Attempt already submitted' });

  attempt.answers[questionId] = answer;
  qds.updateAttempt(attemptId, { answers: attempt.answers });
  res.json({ success:true, message:'Answer saved' });
});

// ── Log proctoring violation ──────────────────────────────────────────────────
const logViolation = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const { type, detail, timestamp } = req.body;
  // types: tab_switch | face_not_detected | multiple_faces | sound_detected | look_away | fullscreen_exit

  const attempt = qds.getAttemptById(attemptId);
  if (!attempt) return res.status(404).json({ success:false, message:'Attempt not found' });
  if (attempt.studentId !== req.student.studentId)
    return res.status(403).json({ success:false, message:'Not your attempt' });

  const violation = { type, detail:detail||'', timestamp: timestamp || new Date().toISOString() };
  attempt.violations.push(violation);

  // Increment counters
  const pd = attempt.proctoringData || {};
  if (type === 'tab_switch')         pd.tabSwitches        = (pd.tabSwitches||0)+1;
  if (type === 'face_not_detected')  pd.faceNotDetected    = (pd.faceNotDetected||0)+1;
  if (type === 'multiple_faces')     pd.multiplefaces      = (pd.multiplefaces||0)+1;
  if (type === 'sound_detected')     pd.soundViolations    = (pd.soundViolations||0)+1;
  if (type === 'look_away')          pd.lookAwayCount      = (pd.lookAwayCount||0)+1;

  qds.updateAttempt(attemptId, { violations: attempt.violations, proctoringData: pd });
  res.json({ success:true });
});

// ── Submit attempt ────────────────────────────────────────────────────────────
const submitAttempt = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const { answers }   = req.body;  // final answers map from client

  const attempt = qds.getAttemptById(attemptId);
  if (!attempt) return res.status(404).json({ success:false, message:'Attempt not found' });
  if (attempt.studentId !== req.student.studentId)
    return res.status(403).json({ success:false, message:'Not your attempt' });
  if (attempt.status === 'submitted')
    return res.status(400).json({ success:false, message:'Already submitted' });

  const quiz = qds.getQuizById(attempt.quizId);
  if (!quiz) return res.status(404).json({ success:false, message:'Quiz not found' });

  // Merge any last-minute answers
  const finalAnswers = { ...attempt.answers, ...(answers||{}) };

  // ── Auto-grade ─────────────────────────────────────────────────────────────
  let score = 0;
  const breakdown = quiz.questions.map(q => {
    const student_ans = (finalAnswers[q.questionId] || '').toString().trim().toLowerCase();
    let correct = false;

    if (q.type === 'mcq' || q.type === 'truefalse') {
      correct = student_ans === q.correctAnswer.toString().toLowerCase();
    } else if (q.type === 'short') {
      // keyword matching — correct if answer contains the keyword
      const keyword = q.correctAnswer.toString().toLowerCase();
      correct = student_ans.includes(keyword);
    }

    if (correct) score += (q.marks || 1);

    return {
      questionId:     q.questionId,
      questionText:   q.text,
      studentAnswer:  finalAnswers[q.questionId] || '',
      correctAnswer:  q.correctAnswer,
      isCorrect:      correct,
      marks:          q.marks || 1,
      marksEarned:    correct ? (q.marks||1) : 0,
      explanation:    q.explanation || '',
    };
  });

  const totalMarks   = quiz.questions.reduce((s,q) => s+(q.marks||1), 0);
  const scorePercent = totalMarks > 0 ? Math.round((score/totalMarks)*100) : 0;

  // ── Update attempt ─────────────────────────────────────────────────────────
  const updatedAttempt = qds.updateAttempt(attemptId, {
    status:      'submitted',
    submittedAt: new Date().toISOString(),
    answers:     finalAnswers,
    score,
    totalMarks,
    scorePercent,
    breakdown,
  });

  // ── Update student Skill DNA with quiz score ───────────────────────────────
  const student = dataService.getStudentById(attempt.studentId);
  if (student && student.skillDNA) {
    const dna = student.skillDNA;
    const cat = quiz.skillCategory || 'general';
    const boost = Math.round(scorePercent * 0.1); // max +10 points from quiz

    if (cat === 'python'  && dna.scores.python       < 100) dna.scores.python       = Math.min(100, dna.scores.python       + boost);
    if (cat === 'dsa'     && dna.scores.problemSolving< 100) dna.scores.problemSolving= Math.min(100, dna.scores.problemSolving+ boost);
    if (cat === 'ml'      && dna.scores.machineLearning<100) dna.scores.machineLearning=Math.min(100, dna.scores.machineLearning+boost);
    if (cat === 'general' ) {
      dna.scores.python         = Math.min(100, dna.scores.python         + Math.round(boost*0.5));
      dna.scores.problemSolving = Math.min(100, dna.scores.problemSolving + Math.round(boost*0.5));
    }
    dna.scores.overall = Math.round(
      (dna.scores.python + dna.scores.problemSolving + dna.scores.machineLearning + dna.scores.codeQuality) / 4
    );
    // Re-compute badges
    student.skillDNA = dna;
    student.badges   = computeBadges(dna, student);
    dataService.updateStudent(student.studentId, student);
  }

  res.json({
    success:true,
    message:'Quiz submitted successfully',
    result: {
      attemptId,
      score,
      totalMarks,
      scorePercent,
      breakdown,
      proctoringData: updatedAttempt.proctoringData,
      violations:     updatedAttempt.violations,
      submittedAt:    updatedAttempt.submittedAt,
    },
  });
});

// ── Get attempt result (for student to review) ────────────────────────────────
const getAttemptResult = asyncHandler(async (req, res) => {
  const attempt = qds.getAttemptById(req.params.attemptId);
  if (!attempt) return res.status(404).json({ success:false, message:'Attempt not found' });
  if (attempt.studentId !== req.student.studentId)
    return res.status(403).json({ success:false, message:'Not your attempt' });

  const quiz = qds.getQuizById(attempt.quizId);
  res.json({ success:true, attempt, quizTitle: quiz?.title || '' });
});

// ── Get all attempts for student ──────────────────────────────────────────────
const getMyAttempts = asyncHandler(async (req, res) => {
  const attempts = qds.getAttemptsByStudent(req.student.studentId)
    .filter(a => a.status === 'submitted')
    .map(a => {
      const quiz = qds.getQuizById(a.quizId);
      return { ...a, quizTitle: quiz?.title||'', subject: quiz?.subject||'' };
    });
  res.json({ success:true, count:attempts.length, attempts });
});

// ── helpers ───────────────────────────────────────────────────────────────────
function sanitizeQuestions(questions) {
  return questions.map(({ correctAnswer, explanation, ...safe }) => safe);
}

module.exports = { startAttempt, saveAnswer, logViolation, submitAttempt, getAttemptResult, getMyAttempts };
