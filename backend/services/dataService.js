const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const STUDENTS_FILE = path.join(DATA_DIR, 'students.json');
const BLOCKCHAIN_FILE = path.join(DATA_DIR, 'blockchain.json');
const VERIFICATIONS_FILE = path.join(DATA_DIR, 'verifications.json');

// Ensure data directory and files exist
function ensureFile(filePath, defaultValue = []) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
  }
}

function readJSON(filePath, defaultValue = []) {
  ensureFile(filePath, defaultValue);
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return defaultValue;
  }
}

function writeJSON(filePath, data) {
  ensureFile(filePath);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// ─── Students ────────────────────────────────────────────────────────────────

function getAllStudents() {
  return readJSON(STUDENTS_FILE, []);
}

function getStudentById(studentId) {
  return getAllStudents().find((s) => s.studentId === studentId) || null;
}

function findStudentByEmail(email) {
  return getAllStudents().find((s) => s.email === email) || null;
}

function saveStudent(student) {
  const students = getAllStudents();
  students.push(student);
  writeJSON(STUDENTS_FILE, students);
}

function updateStudent(studentId, updatedData) {
  const students = getAllStudents();
  const idx = students.findIndex((s) => s.studentId === studentId);
  if (idx !== -1) {
    students[idx] = { ...students[idx], ...updatedData };
    writeJSON(STUDENTS_FILE, students);
    return students[idx];
  }
  return null;
}

function deleteStudent(studentId) {
  const students = getAllStudents();
  const idx = students.findIndex((s) => s.studentId === studentId);
  if (idx === -1) return false;
  students.splice(idx, 1);
  writeJSON(STUDENTS_FILE, students);
  return true;
}

// ─── Blockchain Records ───────────────────────────────────────────────────────

function getAllBlockchainRecords() {
  return readJSON(BLOCKCHAIN_FILE, []);
}

function getBlockchainRecord(studentId) {
  return getAllBlockchainRecords().find((r) => r.studentId === studentId) || null;
}

function saveBlockchainRecord(record) {
  const records = getAllBlockchainRecords();
  const existing = records.findIndex((r) => r.studentId === record.studentId);
  if (existing !== -1) {
    records[existing] = record;
  } else {
    records.push(record);
  }
  writeJSON(BLOCKCHAIN_FILE, records);
}

// ─── Verification Records ─────────────────────────────────────────────────────

function getAllVerifications() {
  return readJSON(VERIFICATIONS_FILE, []);
}

function getVerificationHistory(studentId) {
  return getAllVerifications().filter((v) => v.studentId === studentId);
}

function saveVerificationRecord(record) {
  const verifications = getAllVerifications();
  verifications.push(record);
  writeJSON(VERIFICATIONS_FILE, verifications);
}

module.exports = {
  getAllStudents,
  getStudentById,
  findStudentByEmail,
  saveStudent,
  updateStudent,
  deleteStudent,
  getAllBlockchainRecords,
  getBlockchainRecord,
  saveBlockchainRecord,
  getAllVerifications,
  getVerificationHistory,
  saveVerificationRecord
};
