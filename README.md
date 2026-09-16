# 🧬 SkillGenome Ledger

> AI-powered skill analysis + Ethereum blockchain verification for students.

---

## What It Does

1. **Student registers** → gets a unique `STU-XXXXXXXX` ID
2. **Uploads code files** → Python projects, solved problems, ML notebooks
3. **AI analyzes** → scores Python, Problem Solving, ML, Code Quality; detects algorithms/data structures
4. **Skill DNA generated** → hash stored on blockchain (simulated Ethereum)
5. **Company verifies** → enter Student ID → system checks blockchain → ✅ or ❌

---

## Project Structure

```
skillgenome-ledger/
├── backend/                  # Node.js + Express API
│   ├── server.js
│   ├── routes/               # student, analyze, blockchain, verify
│   ├── controllers/          # business logic per route
│   ├── services/
│   │   ├── aiAnalyzer.js     # AI code analysis engine
│   │   ├── blockchainService.js  # Simulated blockchain
│   │   └── dataService.js    # JSON file persistence
│   ├── middleware/           # upload, error handling
│   └── data/                 # students.json, blockchain.json, verifications.json
│
├── frontend/                 # React + Vite
│   └── src/
│       ├── pages/            # Home, Register, Dashboard, Upload, SkillDNA, Verify, Explorer
│       ├── components/       # Navbar, ScoreCard, Spinner, HashBadge, StepIndicator
│       ├── api/api.js        # All API calls (axios)
│       └── context/          # AppContext (global student state)
│
├── contracts/
│   └── SkillGenomeLedger.sol # Solidity smart contract
├── scripts/deploy.js         # Hardhat deployment script
├── test/                     # Contract unit tests
└── hardhat.config.js
```

---

## Quick Start

### 1. Start the Backend

```bash
cd backend
npm install
npm run dev
# → http://localhost:5000
```

### 2. Start the Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### 3. (Optional) Deploy Smart Contract

```bash
# Terminal 1 — start local Ethereum node
npx hardhat node

# Terminal 2 — deploy contract
npx hardhat run scripts/deploy.js --network localhost

# Run contract tests
npx hardhat test
```

---

## API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/students/register` | Register student |
| GET  | `/api/students/:id` | Get student by ID |
| POST | `/api/students/:id/upload` | Upload code files |
| POST | `/api/analyze/student/:id` | Run AI analysis |
| GET  | `/api/analyze/student/:id` | Get existing analysis |
| POST | `/api/blockchain/store` | Store hash on blockchain |
| GET  | `/api/blockchain/records` | All blockchain records |
| GET  | `/api/blockchain/status` | Network status |
| POST | `/api/verify/student` | Verify by student ID |
| POST | `/api/verify/hash` | Verify by hash |
| GET  | `/api/verify/history/:id` | Verification audit trail |

---

## Skill DNA Scores

| Skill | What's Measured |
|-------|-----------------|
| Python | Functions, classes, docstrings, error handling, imports, comment ratio |
| Problem Solving | Algorithms detected, data structures, complexity, error handling |
| Machine Learning | ML libraries (sklearn, tensorflow, pandas...), ML concepts |
| Code Quality | Docstrings, comments, variable naming, nesting depth, error handling |

---

## Smart Contract

`SkillGenomeLedger.sol` on Ethereum:
- `storeSkillHash()` — stores immutable skill profile (authorised backends only)
- `verifySkillHash()` — returns true/false + logs every verification
- `getProfile()` — retrieve full skill data for a student
- Chain integrity verification with `previousHash` linking

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router, Recharts, react-dropzone |
| Backend | Node.js, Express, Multer, crypto (HMAC-SHA256) |
| Blockchain | Solidity 0.8.20, Hardhat, ethers.js (simulation + live node support) |
| Persistence | JSON files (no DB required to run) |
| Styling | Custom CSS (dark theme, responsive) |
