const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const studentDir = path.join(uploadDir, req.body.studentId || 'unknown');
    if (!fs.existsSync(studentDir)) fs.mkdirSync(studentDir, { recursive: true });
    cb(null, studentDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const ALLOWED_TYPES = [
  // Code files
  '.py', '.js', '.ts', '.jsx', '.tsx', '.java', '.cpp', '.c', '.cs', '.go',
  '.rb', '.php', '.swift', '.kt', '.rs', '.scala', '.r', '.m', '.ipynb',
  // Documents
  '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx',
  // Text / Markup
  '.txt', '.md', '.csv', '.json', '.xml', '.yaml', '.yml', '.html', '.css',
  // Archives (project zips)
  '.zip', '.rar', '.7z',
];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_TYPES.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type "${ext}" is not supported. Allowed: ${ALLOWED_TYPES.join(', ')}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB per file
});

module.exports = upload;
