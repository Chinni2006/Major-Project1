/**
 * SkillGenome Badge System
 * Awards achievement badges based on AI-analyzed Skill DNA
 */

const BADGE_DEFINITIONS = [
  // ── Python badges ──────────────────────────────────────────────────────────
  { id: 'python_novice',    emoji: '🐍', name: 'Python Novice',     desc: 'Python score ≥ 40',          category: 'python',   condition: (d) => d.scores.python >= 40 },
  { id: 'python_pro',      emoji: '⚡', name: 'Python Pro',         desc: 'Python score ≥ 70',          category: 'python',   condition: (d) => d.scores.python >= 70 },
  { id: 'python_master',   emoji: '🏅', name: 'Python Master',      desc: 'Python score ≥ 90',          category: 'python',   condition: (d) => d.scores.python >= 90 },

  // ── Problem solving badges ─────────────────────────────────────────────────
  { id: 'problem_solver',  emoji: '🧩', name: 'Problem Solver',     desc: 'Problem Solving score ≥ 50', category: 'dsa',      condition: (d) => d.scores.problemSolving >= 50 },
  { id: 'algo_pro',        emoji: '🔥', name: 'Algorithm Pro',      desc: 'Problem Solving score ≥ 75', category: 'dsa',      condition: (d) => d.scores.problemSolving >= 75 },
  { id: 'dsa_wizard',      emoji: '🧙', name: 'DSA Wizard',         desc: 'Problem Solving score ≥ 90', category: 'dsa',      condition: (d) => d.scores.problemSolving >= 90 },

  // ── ML badges ──────────────────────────────────────────────────────────────
  { id: 'ml_beginner',     emoji: '🤖', name: 'ML Beginner',        desc: 'ML score ≥ 30',              category: 'ml',       condition: (d) => d.scores.machineLearning >= 30 },
  { id: 'ml_practitioner', emoji: '🧠', name: 'ML Practitioner',    desc: 'ML score ≥ 60',              category: 'ml',       condition: (d) => d.scores.machineLearning >= 60 },
  { id: 'ml_expert',       emoji: '🚀', name: 'ML Expert',          desc: 'ML score ≥ 85',              category: 'ml',       condition: (d) => d.scores.machineLearning >= 85 },

  // ── Code quality badges ────────────────────────────────────────────────────
  { id: 'clean_coder',     emoji: '✨', name: 'Clean Coder',        desc: 'Code Quality score ≥ 70',    category: 'quality',  condition: (d) => d.scores.codeQuality >= 70 },
  { id: 'code_artisan',    emoji: '🎨', name: 'Code Artisan',       desc: 'Code Quality score ≥ 90',    category: 'quality',  condition: (d) => d.scores.codeQuality >= 90 },

  // ── Specific skill badges ──────────────────────────────────────────────────
  { id: 'dp_master',       emoji: '💡', name: 'DP Master',          desc: 'Dynamic programming detected', category: 'algo',   condition: (d) => d.detectedSkills?.algorithms?.includes('dynamic_programming') },
  { id: 'graph_explorer',  emoji: '🕸️', name: 'Graph Explorer',     desc: 'Graph traversal detected',     category: 'algo',   condition: (d) => d.detectedSkills?.algorithms?.includes('graph_traversal') },
  { id: 'data_structures', emoji: '🗂️', name: 'DS Expert',          desc: '4+ data structures used',       category: 'algo',   condition: (d) => (d.detectedSkills?.dataStructures?.length || 0) >= 4 },
  { id: 'pandas_user',     emoji: '🐼', name: 'Pandas User',        desc: 'pandas detected in code',       category: 'ml',     condition: (d) => d.detectedSkills?.mlLibraries?.includes('pandas') },
  { id: 'tensorflow_dev',  emoji: '🔬', name: 'TF Developer',       desc: 'TensorFlow detected',           category: 'ml',     condition: (d) => d.detectedSkills?.mlLibraries?.some(l => ['tensorflow','keras'].includes(l)) },
  { id: 'pytorch_dev',     emoji: '🔦', name: 'PyTorch Dev',        desc: 'PyTorch detected',              category: 'ml',     condition: (d) => d.detectedSkills?.mlLibraries?.some(l => ['torch','pytorch'].includes(l)) },

  // ── Volume / overall badges ────────────────────────────────────────────────
  { id: 'prolific_coder',  emoji: '📦', name: 'Prolific Coder',     desc: '500+ lines of code',           category: 'volume', condition: (d) => d.totalLinesOfCode >= 500 },
  { id: 'code_warrior',    emoji: '⚔️', name: 'Code Warrior',       desc: '2000+ lines of code',          category: 'volume', condition: (d) => d.totalLinesOfCode >= 2000 },
  { id: 'top_performer',   emoji: '🏆', name: 'Top Performer',      desc: 'Overall score ≥ 75',           category: 'overall', condition: (d) => d.scores.overall >= 75 },
  { id: 'elite_dev',       emoji: '👑', name: 'Elite Developer',    desc: 'All 4 scores ≥ 70',            category: 'overall', condition: (d) => d.scores.python >= 70 && d.scores.problemSolving >= 70 && d.scores.machineLearning >= 70 && d.scores.codeQuality >= 70 },
  { id: 'fast_learner',    emoji: '📈', name: 'Fast Learner',       desc: 'Growth rate ≥ 20%',            category: 'growth', condition: (d) => d.growthRate >= 20 },
  { id: 'blockchain_cert', emoji: '🔗', name: 'Blockchain Certified', desc: 'Skill DNA stored on blockchain', category: 'special', condition: (d, student) => !!student?.blockchainHash },
];

/**
 * Compute which badges a student has earned
 * @param {object} skillDNA  - the student's Skill DNA object
 * @param {object} student   - the full student record (for blockchain check)
 * @returns {Array} earned badge objects
 */
function computeBadges(skillDNA, student = {}) {
  if (!skillDNA) return [];
  return BADGE_DEFINITIONS
    .filter(b => {
      try { return b.condition(skillDNA, student); }
      catch { return false; }
    })
    .map(b => ({ id: b.id, emoji: b.emoji, name: b.name, desc: b.desc, category: b.category }));
}

/**
 * Get all badge definitions (for display purposes)
 */
function getAllBadgeDefinitions() {
  return BADGE_DEFINITIONS.map(b => ({ id: b.id, emoji: b.emoji, name: b.name, desc: b.desc, category: b.category }));
}

module.exports = { computeBadges, getAllBadgeDefinitions };
