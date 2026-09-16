/**
 * Deployment script for SkillGenomeLedger contract
 *
 * Usage:
 *   Start local node:   npx hardhat node
 *   Deploy locally:     npx hardhat run scripts/deploy.js --network localhost
 *   Deploy to Sepolia:  npx hardhat run scripts/deploy.js --network sepolia
 */
const hre = require('hardhat');
const fs  = require('fs');
const path = require('path');

async function main() {
  console.log('\n🚀 Deploying SkillGenomeLedger contract...\n');

  const [deployer] = await hre.ethers.getSigners();
  console.log(`📋 Deployer address : ${deployer.address}`);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`💰 Deployer balance : ${hre.ethers.formatEther(balance)} ETH\n`);

  // Deploy
  const SkillGenomeLedger = await hre.ethers.getContractFactory('SkillGenomeLedger');
  const contract = await SkillGenomeLedger.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log(`✅ Contract deployed to: ${contractAddress}`);
  console.log(`🔗 Network           : ${hre.network.name}`);
  console.log(`📦 Block number      : ${await hre.ethers.provider.getBlockNumber()}\n`);

  // Save contract address to backend .env so it picks it up automatically
  const envPath = path.join(__dirname, '..', 'backend', '.env');
  let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';

  if (envContent.includes('CONTRACT_ADDRESS=')) {
    envContent = envContent.replace(/CONTRACT_ADDRESS=.*/g, `CONTRACT_ADDRESS=${contractAddress}`);
  } else {
    envContent += `\nCONTRACT_ADDRESS=${contractAddress}`;
  }
  fs.writeFileSync(envPath, envContent);
  console.log(`💾 CONTRACT_ADDRESS saved to backend/.env`);

  // Also save ABI to backend for Web3 integration
  const artifactPath = path.join(
    __dirname, '..', 'artifacts', 'contracts',
    'SkillGenomeLedger.sol', 'SkillGenomeLedger.json'
  );

  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf-8'));
    const abiOutput = path.join(__dirname, '..', 'backend', 'data', 'contractABI.json');
    fs.writeFileSync(abiOutput, JSON.stringify({ address: contractAddress, abi: artifact.abi }, null, 2));
    console.log(`📄 ABI saved to backend/data/contractABI.json`);
  }

  console.log('\n🎉 Deployment complete!\n');
}

main().catch((err) => {
  console.error('Deployment failed:', err);
  process.exit(1);
});
