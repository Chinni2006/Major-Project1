const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const dataService = require('./dataService');
const aiAnalyzer = require('./aiAnalyzer');

/**
 * SkillGenome Blockchain Service
 *
 * Simulates an Ethereum blockchain locally. Each "block" holds:
 *   - studentId
 *   - skillHash (HMAC-SHA256 of Skill DNA)
 *   - timestamp
 *   - previousHash  (chain integrity)
 *   - blockHash     (SHA-256 of entire block contents)
 *   - txId          (simulated transaction ID)
 *   - blockNumber
 *
 * This faithfully models how an on-chain SkillGenome contract would work,
 * without requiring a live Ethereum node for the demo.
 *
 * When a real Hardhat/Ganache node is running at BLOCKCHAIN_RPC_URL the service
 * will attempt to connect; otherwise it falls back to the local simulation.
 */

const NETWORK = {
  name: 'SkillGenome Simulated Network',
  chainId: 1337,
  rpcUrl: process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545',
  contractAddress: process.env.CONTRACT_ADDRESS || '0x' + '0'.repeat(40),
  explorerUrl: 'http://localhost:4000'
};

// In-memory chain (also persisted to data/blockchain.json via dataService)
let chain = [];
let isConnectedToNode = false;

// ─── Chain Initialisation ─────────────────────────────────────────────────────

function loadChain() {
  const records = dataService.getAllBlockchainRecords();
  chain = records.length > 0 ? records : [createGenesisBlock()];
}

function createGenesisBlock() {
  const genesis = {
    blockNumber: 0,
    type: 'GENESIS',
    studentId: null,
    skillHash: '0'.repeat(64),
    previousHash: '0'.repeat(64),
    timestamp: new Date('2024-01-01T00:00:00.000Z').toISOString(),
    txId: '0x' + '0'.repeat(64),
    nonce: 0,
    blockHash: ''
  };
  genesis.blockHash = computeBlockHash(genesis);
  return genesis;
}

function getLatestBlock() {
  if (chain.length === 0) loadChain();
  return chain[chain.length - 1];
}

// ─── Hashing Utilities ────────────────────────────────────────────────────────

function computeBlockHash(block) {
  const content = `${block.blockNumber}${block.studentId}${block.skillHash}${block.previousHash}${block.timestamp}${block.nonce}`;
  return crypto.createHash('sha256').update(content).digest('hex');
}

function mineBlock(block) {
  // Simple proof-of-work: find nonce so hash starts with '00'
  const difficulty = '00';
  let nonce = 0;
  let hash;
  do {
    block.nonce = nonce++;
    hash = computeBlockHash(block);
  } while (!hash.startsWith(difficulty));
  return { hash, nonce: block.nonce };
}

function generateTxId() {
  return '0x' + crypto.randomBytes(32).toString('hex');
}

// ─── Core Operations ──────────────────────────────────────────────────────────

/**
 * Store a student's Skill DNA hash on the (simulated) blockchain
 */
async function storeHash(student) {
  if (chain.length === 0) loadChain();

  // Generate the skill hash
  const skillHash = aiAnalyzer.generateSkillHash(student.skillDNA, student.studentId);

  const previousBlock = getLatestBlock();
  const blockNumber = previousBlock.blockNumber + 1;

  const block = {
    blockNumber,
    type: 'SKILL_HASH',
    studentId: student.studentId,
    studentName: student.name,
    skillHash,
    previousHash: previousBlock.blockHash,
    timestamp: new Date().toISOString(),
    txId: generateTxId(),
    nonce: 0,
    blockHash: ''
  };

  // Mine the block
  const { hash, nonce } = mineBlock(block);
  block.blockHash = hash;
  block.nonce = nonce;

  // Persist to chain and data store
  chain.push(block);
  dataService.saveBlockchainRecord(block);

  return {
    hash: skillHash,
    blockHash: block.blockHash,
    txId: block.txId,
    blockNumber: block.blockNumber,
    timestamp: block.timestamp,
    previousHash: block.previousHash,
    network: NETWORK.name,
    chainId: NETWORK.chainId,
    contractAddress: NETWORK.contractAddress
  };
}

/**
 * Get all blockchain records (excluding genesis)
 */
function getAllRecords() {
  if (chain.length === 0) loadChain();
  return chain.filter((b) => b.type !== 'GENESIS');
}

/**
 * Get a specific student's record
 */
function getRecord(studentId) {
  if (chain.length === 0) loadChain();
  return chain.find((b) => b.studentId === studentId) || null;
}

/**
 * Verify the integrity of the entire chain
 */
function verifyChainIntegrity() {
  if (chain.length === 0) loadChain();
  const issues = [];

  for (let i = 1; i < chain.length; i++) {
    const current = chain[i];
    const previous = chain[i - 1];

    // Check previous hash link
    if (current.previousHash !== previous.blockHash) {
      issues.push(`Block ${current.blockNumber}: previousHash mismatch`);
    }

    // Recompute block hash
    const recomputed = computeBlockHash(current);
    if (recomputed !== current.blockHash) {
      issues.push(`Block ${current.blockNumber}: blockHash tampered`);
    }
  }

  return {
    valid: issues.length === 0,
    totalBlocks: chain.length,
    issues
  };
}

/**
 * Network / node status
 */
function getNetworkStatus() {
  if (chain.length === 0) loadChain();
  const integrity = verifyChainIntegrity();

  return {
    network: NETWORK.name,
    chainId: NETWORK.chainId,
    rpcUrl: NETWORK.rpcUrl,
    contractAddress: NETWORK.contractAddress,
    connected: isConnectedToNode,
    mode: isConnectedToNode ? 'live' : 'simulation',
    totalBlocks: chain.length,
    latestBlock: getLatestBlock()?.blockNumber ?? 0,
    chainIntegrity: integrity.valid ? 'VALID' : 'COMPROMISED',
    integrityIssues: integrity.issues
  };
}

// Try connecting to live node on startup using a plain HTTP request (no ethers retry loop)
;(async () => {
  try {
    const http = require('http');
    const url = new URL(NETWORK.rpcUrl);
    await new Promise((resolve, reject) => {
      const req = http.request(
        { hostname: url.hostname, port: url.port || 8545, path: '/', method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          timeout: 2000 },
        (res) => { resolve(res.statusCode); }
      );
      req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
      req.on('error', reject);
      req.write(JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 }));
      req.end();
    });
    isConnectedToNode = true;
    console.log(`⛓  Connected to live Ethereum node at ${NETWORK.rpcUrl}`);
  } catch {
    isConnectedToNode = false;
    console.log('⛓  Blockchain simulation mode active (no live Ethereum node needed)');
  }
})();

// Initialise chain from persisted storage
loadChain();

module.exports = {
  storeHash,
  getAllRecords,
  getRecord,
  verifyChainIntegrity,
  getNetworkStatus
};
