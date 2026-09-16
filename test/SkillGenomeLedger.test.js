const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('SkillGenomeLedger', function () {
  let contract;
  let owner, backend, company, stranger;

  const STUDENT_ID   = 'STU-TEST0001';
  const STUDENT_NAME = 'Test Student';
  const SKILL_HASH   = ethers.keccak256(ethers.toUtf8Bytes('TestStudent_80_75_60_15%'));

  beforeEach(async () => {
    [owner, backend, company, stranger] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory('SkillGenomeLedger');
    contract = await Factory.deploy();
    await contract.waitForDeployment();
  });

  // ─── Deployment ────────────────────────────────────────────────────────────

  it('should set deployer as owner', async () => {
    expect(await contract.owner()).to.equal(owner.address);
  });

  it('should start with zero profiles', async () => {
    expect(await contract.totalProfiles()).to.equal(0);
  });

  // ─── Authorisation ─────────────────────────────────────────────────────────

  it('owner can authorise a backend address', async () => {
    await contract.setAuthorisation(backend.address, true);
    expect(await contract.authorised(backend.address)).to.be.true;
  });

  it('non-owner cannot authorise addresses', async () => {
    await expect(
      contract.connect(stranger).setAuthorisation(backend.address, true)
    ).to.be.revertedWith('SkillGenome: caller is not the owner');
  });

  // ─── Store Hash ────────────────────────────────────────────────────────────

  it('owner can store a skill hash', async () => {
    await expect(
      contract.storeSkillHash(STUDENT_ID, STUDENT_NAME, SKILL_HASH, 80, 75, 60, 85, 15)
    ).to.emit(contract, 'SkillHashStored').withArgs(STUDENT_ID, SKILL_HASH, await getTimestamp(), owner.address);

    expect(await contract.totalProfiles()).to.equal(1);
    expect(await contract.profileExists(STUDENT_ID)).to.be.true;
  });

  it('authorised backend can store a skill hash', async () => {
    await contract.setAuthorisation(backend.address, true);
    await contract.connect(backend).storeSkillHash(STUDENT_ID, STUDENT_NAME, SKILL_HASH, 80, 75, 60, 85, 15);
    expect(await contract.profileExists(STUDENT_ID)).to.be.true;
  });

  it('unauthorised address cannot store a hash', async () => {
    await expect(
      contract.connect(stranger).storeSkillHash(STUDENT_ID, STUDENT_NAME, SKILL_HASH, 80, 75, 60, 85, 15)
    ).to.be.revertedWith('SkillGenome: caller is not authorised');
  });

  it('cannot store the same student ID twice', async () => {
    await contract.storeSkillHash(STUDENT_ID, STUDENT_NAME, SKILL_HASH, 80, 75, 60, 85, 15);
    await expect(
      contract.storeSkillHash(STUDENT_ID, STUDENT_NAME, SKILL_HASH, 80, 75, 60, 85, 15)
    ).to.be.revertedWith('SkillGenome: profile already exists');
  });

  it('rejects scores > 100', async () => {
    await expect(
      contract.storeSkillHash(STUDENT_ID, STUDENT_NAME, SKILL_HASH, 101, 75, 60, 85, 15)
    ).to.be.revertedWith('SkillGenome: pythonScore out of range');
  });

  // ─── Verify Hash ───────────────────────────────────────────────────────────

  it('returns true when hash matches', async () => {
    await contract.storeSkillHash(STUDENT_ID, STUDENT_NAME, SKILL_HASH, 80, 75, 60, 85, 15);
    const result = await contract.connect(company).verifySkillHash.staticCall(STUDENT_ID, SKILL_HASH);
    expect(result).to.be.true;
  });

  it('returns false when hash does not match', async () => {
    await contract.storeSkillHash(STUDENT_ID, STUDENT_NAME, SKILL_HASH, 80, 75, 60, 85, 15);
    const fakeHash = ethers.keccak256(ethers.toUtf8Bytes('FAKE_DATA'));
    const result = await contract.connect(company).verifySkillHash.staticCall(STUDENT_ID, fakeHash);
    expect(result).to.be.false;
  });

  it('logs each verification attempt', async () => {
    await contract.storeSkillHash(STUDENT_ID, STUDENT_NAME, SKILL_HASH, 80, 75, 60, 85, 15);
    await contract.connect(company).verifySkillHash(STUDENT_ID, SKILL_HASH);
    expect(await contract.totalVerifications()).to.equal(1);
  });

  it('reverts verify when profile does not exist', async () => {
    await expect(
      contract.verifySkillHash('STU-UNKNOWN', SKILL_HASH)
    ).to.be.revertedWith('SkillGenome: no profile found for this student');
  });

  // ─── Get Profile ───────────────────────────────────────────────────────────

  it('returns correct profile data', async () => {
    await contract.storeSkillHash(STUDENT_ID, STUDENT_NAME, SKILL_HASH, 80, 75, 60, 85, 15);
    const [name, hash, python, ps, ml, cq, gr] = await contract.getProfile(STUDENT_ID);
    expect(name).to.equal(STUDENT_NAME);
    expect(hash).to.equal(SKILL_HASH);
    expect(python).to.equal(80);
    expect(ps).to.equal(75);
    expect(ml).to.equal(60);
    expect(cq).to.equal(85);
    expect(gr).to.equal(15);
  });

  it('reverts getProfile for unknown student', async () => {
    await expect(contract.getProfile('STU-UNKNOWN')).to.be.revertedWith('SkillGenome: profile not found');
  });
});

async function getTimestamp() {
  // Just a placeholder — 'withArgs' on timestamp is tricky; used structurally
  return ethers.toBigInt(Math.floor(Date.now() / 1000));
}
