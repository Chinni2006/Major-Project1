const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * SkillGenome AI Analyzer
 * Analyzes code files and generates a Skill DNA profile with scores
 */

// ─── File Analysis ────────────────────────────────────────────────────────────

/**
 * Read and analyze a single uploaded file
 */
async function analyzeFile(file) {
  let code = '';
  try {
    code = fs.readFileSync(file.path, 'utf-8');
  } catch {
    return { file: file.originalName, error: 'Could not read file', scores: null };
  }

  const language = file.type || detectLanguage(file.originalName);
  const metrics = extractCodeMetrics(code, language);
  const scores = scoreMetrics(metrics, language);

  return {
    file: file.originalName,
    language,
    metrics,
    scores,
    linesOfCode: metrics.linesOfCode,
    complexity: metrics.complexity
  };
}

/**
 * Detect programming language from filename
 */
function detectLanguage(filename) {
  const ext = path.extname(filename).toLowerCase();
  const map = {
    '.py': 'python',
    '.js': 'javascript',
    '.ts': 'typescript',
    '.java': 'java',
    '.cpp': 'cpp',
    '.c': 'c',
    '.ipynb': 'jupyter',
    '.txt': 'text',
    '.md': 'markdown'
  };
  return map[ext] || 'unknown';
}

// ─── Code Metrics Extraction ──────────────────────────────────────────────────

function extractCodeMetrics(code, language) {
  const lines = code.split('\n');
  const nonEmptyLines = lines.filter((l) => l.trim().length > 0);
  const commentLines = countCommentLines(lines, language);
  const functions = countFunctions(code, language);
  const classes = countClasses(code, language);
  const imports = countImports(code, language);
  const errorHandling = detectErrorHandling(code, language);
  const dataStructures = detectDataStructures(code, language);
  const algorithms = detectAlgorithms(code, language);
  const mlKeywords = detectMLKeywords(code);
  const complexity = estimateComplexity(code, language);
  const nestingDepth = estimateNestingDepth(code);
  const hasDocstrings = detectDocstrings(code, language);
  const variableNaming = scoreVariableNaming(code);

  return {
    linesOfCode: nonEmptyLines.length,
    totalLines: lines.length,
    commentLines,
    commentRatio: nonEmptyLines.length > 0 ? (commentLines / nonEmptyLines.length) : 0,
    functions,
    classes,
    imports,
    errorHandling,
    dataStructures,
    algorithms,
    mlKeywords,
    complexity,
    nestingDepth,
    hasDocstrings,
    variableNaming
  };
}

function countCommentLines(lines, language) {
  let count = 0;
  let inBlock = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (language === 'python') {
      if (trimmed.startsWith('#')) count++;
      if (trimmed.startsWith('"""') || trimmed.startsWith("'''")) count++;
    } else if (['javascript', 'typescript', 'java', 'cpp', 'c'].includes(language)) {
      if (trimmed.startsWith('//')) count++;
      if (trimmed.startsWith('/*')) { inBlock = true; count++; }
      else if (inBlock) { count++; if (trimmed.includes('*/')) inBlock = false; }
    }
  }
  return count;
}

function countFunctions(code, language) {
  const patterns = {
    python: /\bdef\s+\w+\s*\(/g,
    javascript: /\bfunction\s+\w+\s*\(|const\s+\w+\s*=\s*(async\s*)?\(|=>\s*{/g,
    typescript: /\bfunction\s+\w+\s*\(|const\s+\w+\s*=\s*(async\s*)?\(|=>\s*{/g,
    java: /\b(public|private|protected|static)\s+[\w<>[\]]+\s+\w+\s*\(/g,
    cpp: /\b\w+\s+\w+\s*\([^)]*\)\s*{/g,
    c: /\b\w+\s+\w+\s*\([^)]*\)\s*{/g
  };
  const pattern = patterns[language];
  if (!pattern) return 0;
  const matches = code.match(pattern);
  return matches ? matches.length : 0;
}

function countClasses(code, language) {
  const patterns = {
    python: /\bclass\s+\w+/g,
    javascript: /\bclass\s+\w+/g,
    typescript: /\bclass\s+\w+/g,
    java: /\b(class|interface|enum)\s+\w+/g,
    cpp: /\b(class|struct)\s+\w+/g
  };
  const pattern = patterns[language];
  if (!pattern) return 0;
  const matches = code.match(pattern);
  return matches ? matches.length : 0;
}

function countImports(code, language) {
  const patterns = {
    python: /^\s*(import|from)\s+\w+/gm,
    javascript: /^\s*(import|require\s*\()/gm,
    typescript: /^\s*(import|require\s*\()/gm,
    java: /^\s*import\s+[\w.]+/gm,
    cpp: /^\s*#include\s+[<"]/gm
  };
  const pattern = patterns[language];
  if (!pattern) return 0;
  const matches = code.match(pattern);
  return matches ? matches.length : 0;
}

function detectErrorHandling(code, language) {
  const keywords = {
    python: ['try:', 'except', 'finally:', 'raise ', 'assert '],
    javascript: ['try {', 'catch (', 'catch(', 'finally {', 'throw new', '.catch('],
    typescript: ['try {', 'catch (', 'catch(', 'finally {', 'throw new', '.catch('],
    java: ['try {', 'catch (', 'finally {', 'throws ', 'throw new'],
    cpp: ['try {', 'catch (', 'throw ']
  };
  const kws = keywords[language] || [];
  return kws.some((kw) => code.includes(kw));
}

function detectDataStructures(code, language) {
  const found = [];
  const checks = [
    { name: 'list/array', patterns: ['[]', 'List(', 'ArrayList', 'list(', 'Array(', 'vector<'] },
    { name: 'dictionary/map', patterns: ['{}', 'dict(', 'HashMap', 'Map(', 'map<', 'unordered_map'] },
    { name: 'set', patterns: ['set(', 'HashSet', 'Set(', 'unordered_set'] },
    { name: 'stack/queue', patterns: ['stack', 'queue', 'deque', 'Stack(', 'Queue('] },
    { name: 'tree/graph', patterns: ['TreeNode', 'graph', 'BinaryTree', 'adjacency', 'DFS', 'BFS'] },
    { name: 'tuple', patterns: ['tuple(', '(a, b)', 'Tuple'] }
  ];
  for (const check of checks) {
    if (check.patterns.some((p) => code.includes(p))) found.push(check.name);
  }
  return found;
}

function detectAlgorithms(code, language) {
  const found = [];
  const checks = [
    { name: 'sorting', keywords: ['sort(', 'sorted(', 'bubble_sort', 'merge_sort', 'quicksort', 'heapq'] },
    { name: 'searching', keywords: ['binary_search', 'bsearch', 'bisect', 'indexOf', 'find('] },
    { name: 'recursion', keywords: ['return ', 'def '] }, // heuristic
    { name: 'dynamic_programming', keywords: ['dp[', 'memo', 'memoize', 'cache', '@lru_cache'] },
    { name: 'graph_traversal', keywords: ['dfs(', 'bfs(', 'visited', 'queue.append', 'stack.append'] },
    { name: 'math', keywords: ['math.', 'np.', 'factorial', 'fibonacci', 'prime', 'gcd', 'lcm'] }
  ];
  for (const check of checks) {
    if (check.keywords.some((kw) => code.toLowerCase().includes(kw.toLowerCase()))) {
      found.push(check.name);
    }
  }
  return found;
}

function detectMLKeywords(code) {
  const mlLibs = [
    'sklearn', 'tensorflow', 'keras', 'torch', 'pytorch', 'pandas', 'numpy', 'matplotlib',
    'seaborn', 'scipy', 'xgboost', 'lightgbm', 'cv2', 'PIL', 'transformers', 'nltk', 'spacy'
  ];
  const mlConcepts = [
    'fit(', 'predict(', 'train_test_split', 'accuracy_score', 'model.compile', 'model.fit',
    'forward(', 'loss', 'optimizer', 'epoch', 'batch_size', 'learning_rate',
    'DataFrame', 'Series', 'groupby', 'neural', 'regression', 'classification', 'clustering'
  ];
  const foundLibs = mlLibs.filter((l) => code.toLowerCase().includes(l.toLowerCase()));
  const foundConcepts = mlConcepts.filter((c) => code.includes(c));
  return { libraries: foundLibs, concepts: foundConcepts, score: foundLibs.length * 5 + foundConcepts.length * 3 };
}

function estimateComplexity(code, language) {
  // Count branching/looping keywords as proxy for cyclomatic complexity
  const branchKeywords = ['if ', 'elif ', 'else:', 'else {', 'for ', 'while ', 'switch ', 'case ', 'catch '];
  let count = 0;
  for (const kw of branchKeywords) {
    const regex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const matches = code.match(regex);
    if (matches) count += matches.length;
  }
  if (count <= 5) return 'low';
  if (count <= 15) return 'medium';
  if (count <= 30) return 'high';
  return 'very_high';
}

function estimateNestingDepth(code) {
  let maxDepth = 0;
  let depth = 0;
  for (const char of code) {
    if (char === '{') { depth++; maxDepth = Math.max(maxDepth, depth); }
    else if (char === '}') depth = Math.max(0, depth - 1);
  }
  // Also count Python-style indentation blocks
  const lines = code.split('\n');
  for (const line of lines) {
    const indent = line.search(/\S/);
    if (indent > 0) maxDepth = Math.max(maxDepth, Math.floor(indent / 4));
  }
  return maxDepth;
}

function detectDocstrings(code, language) {
  if (language === 'python') return code.includes('"""') || code.includes("'''");
  if (['javascript', 'typescript'].includes(language)) return code.includes('/**') || code.includes('* @');
  if (language === 'java') return code.includes('/**') || code.includes('* @param');
  return false;
}

function scoreVariableNaming(code) {
  // Check for meaningful variable names (length > 2 heuristic)
  const varPattern = /\b([a-zA-Z_][a-zA-Z0-9_]{2,})\b/g;
  const matches = code.match(varPattern) || [];
  const meaningfulRatio = matches.length > 0
    ? matches.filter((v) => v.length > 3 && !/^(true|false|null|undefined|return|const|let|var|def|class|import|from)$/.test(v)).length / matches.length
    : 0;
  return Math.round(meaningfulRatio * 100);
}

// ─── Score Calculation ────────────────────────────────────────────────────────

function scoreMetrics(metrics, language) {
  // Python Score
  let pythonScore = 0;
  if (['python', 'jupyter'].includes(language)) {
    pythonScore += Math.min(metrics.functions * 8, 30);
    pythonScore += Math.min(metrics.classes * 10, 20);
    pythonScore += metrics.errorHandling ? 15 : 0;
    pythonScore += metrics.hasDocstrings ? 10 : 0;
    pythonScore += Math.min(metrics.imports * 3, 10);
    pythonScore += Math.min(metrics.commentRatio * 50, 10);
    pythonScore += Math.min(metrics.variableNaming / 10, 5);
    pythonScore = Math.min(100, Math.round(pythonScore));
  }

  // Problem Solving Score
  let problemSolvingScore = 0;
  problemSolvingScore += metrics.algorithms.length * 10;
  problemSolvingScore += metrics.dataStructures.length * 8;
  problemSolvingScore += metrics.complexity === 'high' || metrics.complexity === 'very_high' ? 15 : 5;
  problemSolvingScore += Math.min(metrics.functions * 5, 20);
  problemSolvingScore += metrics.errorHandling ? 10 : 0;
  problemSolvingScore = Math.min(100, Math.round(problemSolvingScore));

  // ML Score
  let mlScore = 0;
  if (metrics.mlKeywords) {
    mlScore += Math.min(metrics.mlKeywords.libraries.length * 12, 50);
    mlScore += Math.min(metrics.mlKeywords.concepts.length * 8, 40);
    mlScore += metrics.hasDocstrings ? 10 : 0;
    mlScore = Math.min(100, Math.round(mlScore));
  }

  // Code Quality Score
  let codeQualityScore = 0;
  codeQualityScore += metrics.hasDocstrings ? 20 : 0;
  codeQualityScore += Math.min(metrics.commentRatio * 100, 20);
  codeQualityScore += metrics.variableNaming >= 70 ? 20 : Math.round(metrics.variableNaming / 5);
  codeQualityScore += metrics.errorHandling ? 20 : 0;
  codeQualityScore += metrics.nestingDepth <= 4 ? 20 : Math.max(0, 20 - metrics.nestingDepth * 2);
  codeQualityScore = Math.min(100, Math.round(codeQualityScore));

  return { pythonScore, problemSolvingScore, mlScore, codeQualityScore };
}

// ─── Skill DNA Aggregation ────────────────────────────────────────────────────

function aggregateSkillDNA(fileAnalyses, student) {
  const validAnalyses = fileAnalyses.filter((a) => a.scores);
  if (validAnalyses.length === 0) {
    return buildDefaultSkillDNA(student);
  }

  const totalFiles = validAnalyses.length;

  // Average scores across files, weighted by lines of code
  const totalLOC = validAnalyses.reduce((sum, a) => sum + (a.metrics?.linesOfCode || 1), 0);

  let pythonScore = 0, problemSolvingScore = 0, mlScore = 0, codeQualityScore = 0;
  for (const analysis of validAnalyses) {
    const weight = (analysis.metrics?.linesOfCode || 1) / totalLOC;
    pythonScore += analysis.scores.pythonScore * weight;
    problemSolvingScore += analysis.scores.problemSolvingScore * weight;
    mlScore += analysis.scores.mlScore * weight;
    codeQualityScore += analysis.scores.codeQualityScore * weight;
  }

  // Round scores
  pythonScore = Math.round(pythonScore);
  problemSolvingScore = Math.round(problemSolvingScore);
  mlScore = Math.round(mlScore);
  codeQualityScore = Math.round(codeQualityScore);

  // Overall score
  const overallScore = Math.round((pythonScore + problemSolvingScore + mlScore + codeQualityScore) / 4);

  // Growth rate: estimated based on complexity and code quality
  const avgComplexity = validAnalyses.filter((a) => a.metrics?.complexity === 'high' || a.metrics?.complexity === 'very_high').length / totalFiles;
  const growthRate = Math.round(10 + avgComplexity * 10 + (overallScore / 100) * 10);

  // Collect all data structures and algorithms detected
  const allDataStructures = [...new Set(validAnalyses.flatMap((a) => a.metrics?.dataStructures || []))];
  const allAlgorithms = [...new Set(validAnalyses.flatMap((a) => a.metrics?.algorithms || []))];
  const allMLLibs = [...new Set(validAnalyses.flatMap((a) => a.metrics?.mlKeywords?.libraries || []))];

  // Total lines of code across all files
  const totalLinesOfCode = validAnalyses.reduce((sum, a) => sum + (a.metrics?.linesOfCode || 0), 0);

  // Language breakdown
  const languageBreakdown = {};
  for (const analysis of validAnalyses) {
    languageBreakdown[analysis.language] = (languageBreakdown[analysis.language] || 0) + 1;
  }

  // Build skill profile string (used for hashing)
  const skillString = `${student.name}_${pythonScore}_${problemSolvingScore}_${mlScore}_${growthRate}%`;

  // Strengths and weaknesses
  const skillMap = { Python: pythonScore, 'Problem Solving': problemSolvingScore, 'Machine Learning': mlScore, 'Code Quality': codeQualityScore };
  const sorted = Object.entries(skillMap).sort((a, b) => b[1] - a[1]);
  const strengths = sorted.slice(0, 2).filter((s) => s[1] >= 50).map((s) => s[0]);
  const weaknesses = sorted.slice(-2).filter((s) => s[1] < 60).map((s) => s[0]);

  // Recommendations
  const recommendations = generateRecommendations(skillMap, allMLLibs, allAlgorithms);

  return {
    studentId: student.studentId,
    studentName: student.name,
    skillString,
    scores: {
      python: pythonScore,
      problemSolving: problemSolvingScore,
      machineLearning: mlScore,
      codeQuality: codeQualityScore,
      overall: overallScore
    },
    growthRate,
    growthPrediction: `${growthRate}% per 6 months`,
    totalFilesAnalyzed: totalFiles,
    totalLinesOfCode,
    languageBreakdown,
    detectedSkills: {
      dataStructures: allDataStructures,
      algorithms: allAlgorithms,
      mlLibraries: allMLLibs
    },
    strengths,
    weaknesses,
    recommendations,
    generatedAt: new Date().toISOString(),
    profileLevel: getProfileLevel(overallScore)
  };
}

function buildDefaultSkillDNA(student) {
  return {
    studentId: student.studentId,
    studentName: student.name,
    skillString: `${student.name}_0_0_0_0%`,
    scores: { python: 0, problemSolving: 0, machineLearning: 0, codeQuality: 0, overall: 0 },
    growthRate: 0,
    growthPrediction: '0% per 6 months',
    totalFilesAnalyzed: 0,
    totalLinesOfCode: 0,
    languageBreakdown: {},
    detectedSkills: { dataStructures: [], algorithms: [], mlLibraries: [] },
    strengths: [],
    weaknesses: ['No analyzable files found'],
    recommendations: ['Upload Python/JavaScript/Java code files for analysis'],
    generatedAt: new Date().toISOString(),
    profileLevel: 'Beginner'
  };
}

function getProfileLevel(overallScore) {
  if (overallScore >= 80) return 'Expert';
  if (overallScore >= 65) return 'Advanced';
  if (overallScore >= 45) return 'Intermediate';
  if (overallScore >= 25) return 'Beginner';
  return 'Novice';
}

function generateRecommendations(skillMap, mlLibs, algorithms) {
  const recs = [];
  if (skillMap['Python'] < 60) recs.push('Practice writing more Pythonic code with proper docstrings and error handling');
  if (skillMap['Problem Solving'] < 60) recs.push('Solve more DSA problems — focus on sorting, searching, and dynamic programming');
  if (skillMap['Machine Learning'] < 40) recs.push('Start with scikit-learn for ML basics: regression, classification, clustering');
  if (skillMap['Code Quality'] < 60) recs.push('Improve code quality: add comments, reduce nesting depth, use meaningful variable names');
  if (!mlLibs.includes('pandas')) recs.push('Learn pandas for data manipulation');
  if (!algorithms.includes('dynamic_programming')) recs.push('Study dynamic programming — it is a key interview topic');
  if (recs.length === 0) recs.push('Keep building projects to maintain your strong skill profile');
  return recs.slice(0, 4);
}

// ─── Skill Hash Generation ────────────────────────────────────────────────────

/**
 * Generate a deterministic hash from a student's skill DNA
 */
function generateSkillHash(skillDNA, studentId) {
  const secret = process.env.APP_SECRET || 'skillgenome_secret_2024';
  const payload = JSON.stringify({
    studentId,
    scores: skillDNA.scores,
    growthRate: skillDNA.growthRate,
    generatedAt: skillDNA.generatedAt
  });
  return crypto.createHmac('sha256', secret).update(payload).digest('hex').toUpperCase();
}

// ─── Snippet Analysis ─────────────────────────────────────────────────────────

function analyzeCodeSnippet(code, language, problemType) {
  const metrics = extractCodeMetrics(code, language);
  const scores = scoreMetrics(metrics, language);
  return {
    language,
    problemType: problemType || 'general',
    metrics: {
      linesOfCode: metrics.linesOfCode,
      functions: metrics.functions,
      complexity: metrics.complexity,
      hasErrorHandling: metrics.errorHandling,
      algorithms: metrics.algorithms,
      dataStructures: metrics.dataStructures
    },
    scores,
    feedback: generateSnippetFeedback(metrics, scores, language)
  };
}

function generateSnippetFeedback(metrics, scores, language) {
  const fb = [];
  if (!metrics.errorHandling) fb.push('Add try/except error handling for robustness');
  if (!metrics.hasDocstrings) fb.push('Add docstrings/comments to explain your logic');
  if (metrics.nestingDepth > 5) fb.push('Reduce nesting depth — consider extracting helper functions');
  if (metrics.functions === 0) fb.push('Wrap logic in functions for reusability');
  if (scores.codeQualityScore >= 70) fb.push('Good code quality!');
  if (metrics.algorithms.length > 0) fb.push(`Detected algorithms: ${metrics.algorithms.join(', ')}`);
  return fb;
}

module.exports = {
  analyzeFile,
  aggregateSkillDNA,
  generateSkillHash,
  analyzeCodeSnippet,
  detectLanguage
};
