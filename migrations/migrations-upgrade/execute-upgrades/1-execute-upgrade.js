const ethers = require("ethers");
const contractRegistry = artifacts.require("Registry");
const accountsData = require("../../../resources/accounts");

module.exports = async function (deployer, network, accounts) {
  let deployerAccount;
  deployerAccount = new ethers.Wallet(accountsData.deployer.privateKey);
  if (deployerAccount === undefined) {
    console.log("Deployer or test accounts invalid. Stopping configuration.");
    return;
  }
  const registry = await contractRegistry.at(contractRegistry.address);
  console.log("Performing upgrades...");
  await registry.executeUpgrades();
  console.log("Operation complete!");
};
