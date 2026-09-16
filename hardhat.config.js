require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config({ path: './backend/.env' });

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: { enabled: true, runs: 200 }
    }
  },
  networks: {
    // Local Hardhat node (run: npx hardhat node)
    localhost: {
      url: process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545',
      chainId: 1337
    },
    // Sepolia testnet (set SEPOLIA_RPC_URL + DEPLOYER_PRIVATE_KEY in .env to use)
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || '',
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : []
    }
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts'
  }
};
