require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('dev'));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Routes
const studentRoutes     = require('./routes/studentRoutes');
const analyzeRoutes     = require('./routes/analyzeRoutes');
const blockchainRoutes  = require('./routes/blockchainRoutes');
const verifyRoutes      = require('./routes/verifyRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const teacherRoutes     = require('./routes/teacherRoutes');
const quizRoutes        = require('./routes/quizRoutes');

app.use('/api/students',     studentRoutes);
app.use('/api/analyze',      analyzeRoutes);
app.use('/api/blockchain',   blockchainRoutes);
app.use('/api/verify',       verifyRoutes);
app.use('/api/leaderboard',  leaderboardRoutes);
app.use('/api/teacher',      teacherRoutes);
app.use('/api/quiz',         quizRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'SkillGenome Ledger API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 SkillGenome Ledger Backend running on http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
