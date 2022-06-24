const contractRegistry = artifacts.require("Registry");
const factory = artifacts.require("Factory");
const accountsData = require("../../../resources/accounts");
const ethers = require("ethers");

module.exports = async function (deployer, network, accounts) {
  let deployerAccount;
  let upgradeSignatures;
  let provider;

  deployerAccount = new ethers.Wallet(accountsData.deployer.privateKey);
  if ("host" in deployer.networks[network] === true) {
    provider = new ethers.providers.JsonRpcProvider(
      deployer.networks[network].host
    );
  } else {
    provider = new ethers.providers.InfuraProvider(
      deployer.networks[network].networkName,
      deployer.networks[network].infuraProjectId
    );
  }
  upgradeSignatures = accountsData.upgradeSignatures;

  if (deployerAccount === undefined) {
    console.log("Deployer or test accounts invalid. Stopping configuration.");
    return;
  }

  const registry = await contractRegistry.at(contractRegistry.address);
  const registryNoSigner = new ethers.Contract(
    contractRegistry.address,
    contractRegistry.abi,
    provider
  );

  console.log("Upgrading factory address in registry...");
  const setFactoryUpgradeNonce = await registryNoSigner.getUpgradeNonce();
  const setFactoryUpgradeSignature = await signRegistryUpgrade(
    "2",
    setFactoryUpgradeNonce.toString(),
    contractRegistry.address,
    factory.address,
    0,
    false,
    deployerAccount
  );
  await registry.setFactory(
    setFactoryUpgradeNonce.toString(),
    factory.address,
    [
      setFactoryUpgradeSignature,
      ...upgradeSignatures.map((sRaw) => {
        const s = ethers.utils.splitSignature(sRaw);
        const sFinalForm = [s.v, s.r, s.s];
        sFinalForm.v = s.v;
        sFinalForm.r = s.r;
        sFinalForm.s = s.s;
        return sFinalForm;
      }),
    ]
  );
  console.log("Operation complete!");
};

/**
 * For list of upgrade types, refer to Registry (registry.sol)
 *
 * @param {*} upgradeType - UpgradeTypes
 * @param {*} nonce - current upgrade nonce of the registry
 * @param {*} registryAddress - address of Registry
 * @param {*} addressBasedUpgradeInput
 * @param {*} intBasedUpgradeInput
 * @param {*} boolUpgradeInput
 * @param {*} wallet
 * @returns
 */
async function signRegistryUpgrade(
  upgradeType,
  nonce,
  registryAddress,
  addressBasedUpgradeInput,
  intBasedUpgradeInput,
  boolUpgradeInput,
  wallet
) {
  const signaturePayload = ethers.utils.solidityKeccak256(
    ["uint256", "address", "uint256", "address", "uint256", "bool"],
    [
      nonce,
      registryAddress,
      upgradeType,
      addressBasedUpgradeInput,
      intBasedUpgradeInput,
      boolUpgradeInput,
    ]
  );
  const signature = await wallet.signMessage(
    ethers.utils.arrayify(signaturePayload)
  );
  const signatureSplit = ethers.utils.splitSignature(signature);
  const multiSigEntry = [signatureSplit.v, signatureSplit.r, signatureSplit.s];
  multiSigEntry.v = signatureSplit.v;
  multiSigEntry.r = signatureSplit.r;
  multiSigEntry.s = signatureSplit.s;
  return multiSigEntry;
}
