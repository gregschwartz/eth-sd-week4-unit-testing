const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { expect } = require('chai');
const { ethers } = require('hardhat');
const { MockProvider } = require('ethereum-waffle');

describe('Faucet', function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployContractAndSetVariables() {
    const Faucet = await ethers.getContractFactory('Faucet');
    const faucet = await Faucet.deploy({ value: ethers.utils.parseEther("1") });

    const [owner, otherUser] = await ethers.getSigners();

    let amountTooLarge = ethers.utils.parseUnits("0.11", "ether");
    let amountOk = ethers.utils.parseUnits("0.1", "ether");

    return { faucet, owner, otherUser, amountTooLarge, amountOk };
  }

  it('should deploy and set the owner correctly', async function () {
    const { faucet, owner } = await loadFixture(deployContractAndSetVariables);

    expect(await faucet.owner()).to.equal(owner.address);
  });

  it('should not allow withdrawals > 0.1 eth', async function () {
    const { faucet, amountTooLarge } = await loadFixture(deployContractAndSetVariables);

    await expect(faucet.withdraw(amountTooLarge)).to.be.reverted;
  });

  it('only owner can call withdrawAll', async function () {
    const { faucet, owner, otherUser } = await loadFixture(deployContractAndSetVariables);

    await expect(faucet.connect(otherUser).withdrawAll()).to.be.reverted;

    await expect(faucet.connect(owner).withdrawAll());
  });

  it('everything is returned by withdrawAll', async function () {
    const { faucet, owner } = await loadFixture(deployContractAndSetVariables);

    const oldOwnerBalance = await owner.getBalance();
    const oldFaucetBalance = await faucet.balance();
    expect(oldFaucetBalance).to.greaterThanOrEqual(0, "Faucet balance is 0");

    await faucet.connect(owner).withdrawAll();

    const newOwnerBalance = await owner.getBalance();
    const newFaucetBalance = await faucet.balance();
    expect(newFaucetBalance).to.equal(0, "Faucet balance was not fully withdrawn");
    expect(newOwnerBalance).to.greaterThan(oldOwnerBalance, "Owner's balance was not increased");
    
    //needs to take into account gas
    expect(newOwnerBalance).to.lessThanOrEqual(oldFaucetBalance + oldOwnerBalance, "Owner's balance is way off");
  });

  it('should allow withdrawals <= 0.1 eth', async function () {
    const { faucet, owner, amountOk } = await loadFixture(deployContractAndSetVariables);
    const oldOwnerBalance = await owner.getBalance();

    await faucet.withdraw(amountOk);

    const newOwnerBalance = await owner.getBalance();
    expect(newOwnerBalance).to.greaterThan(oldOwnerBalance, "Owner's balance was not increased");
  });
  
  it('only owner can call destroyFaucet', async function () {
    const { faucet, owner, otherUser } = await loadFixture(deployContractAndSetVariables);

    await expect(faucet.connect(otherUser).destroyFaucet()).to.be.reverted;
    await expect(faucet.connect(owner).destroyFaucet());
  });

  it('destroyFaucet does destroy it', async function () {
    const { faucet, owner } = await loadFixture(deployContractAndSetVariables);
    const faucetAddress = faucet.address;

    expect(await owner.provider.getCode(faucetAddress)).to.not.equal("0x");

    expect(await faucet.destroyFaucet());
    expect(await owner.provider.getCode(faucetAddress)).to.equal("0x");
  });
});
