// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  const Contract = await hre.ethers.getContractFactory("Contract");
  const contract = await Contract.deploy();
  await contract.deployed();
  console.log("Base address", contract.address);

  const ContractCaller = await hre.ethers.getContractFactory("ContractCaller");
  const contractCaller = await ContractCaller.deploy(contract.address);
  console.log("Caller", contractCaller);
  await contractCaller.deployed();
  console.log("Caller", contractCaller);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
