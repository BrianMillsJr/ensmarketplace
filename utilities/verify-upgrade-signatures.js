const fs = require("fs");
const ethers = require("ethers");
const process = require("process");
const { Contract } = require("ethers");
const accountsData = require("../resources/accounts.js");
const valueSwappable = require("../resources/value-swappable.js");
const truffleConfig = require("../truffle-config.js");

async function main() {
  const programArguments = process.argv;
  const network = programArguments[2];
  const upgradeType = programArguments[3];
  const inputA = programArguments[4];
  const inputB = programArguments.length >= 6 ? programArguments[5] : undefined;
  const networks = truffleConfig.networks;
  const networkChainId = networks[network].network_id;

  console.log("Initialising upgrade signature verification...");

  let provider,
    deployerAccount,
    registryContractData,
    registryContractAddress,
    signaturesToVerify,
    signaturePayload,
    validSigners;

  signaturesToVerify = accountsData.upgradeSignatures;
  deployerAccount = new ethers.Wallet(accountsData.deployer.privateKey);
  validSigners = accountsData.validUpgradeSigners;
  validSigners.push(deployerAccount.address);
  if ("host" in networks[network] === true) {
    provider = new ethers.providers.JsonRpcProvider(networks[network].host);
  } else {
    provider = new ethers.providers.InfuraProvider(
      network,
      networks[network].infuraProjectId
    );
  }

  if (deployerAccount === undefined) {
    console.log("Deployer or test accounts invalid. Stopping configuration.");
    return;
  }

  if (deployerAccount === undefined) {
    console.log("Deployer or test accounts invalid. Stopping configuration.");
    return;
  }

  registryContractData = JSON.parse(
    fs.readFileSync(__dirname + "/../build_" + network + "/Registry.json", {
      encoding: "utf8",
      flag: "r",
    })
  );
  registryContractAddress =
    registryContractData.networks[networkChainId].address;

  const registryNoSigner = new Contract(
    registryContractAddress,
    registryContractData.abi,
    provider
  );

  // SWITCH_TIMELOCK
  if (upgradeType === "1") {
    const upgradeNonce = await registryNoSigner.getUpgradeNonce();
    signaturePayload = await getSignaturePayload(
      "0",
      upgradeNonce.toString(),
      registryContractAddress,
      "0x0000000000000000000000000000000000000000",
      inputA,
      false
    );
  }

  // SWITCH_SIGNER
  if (upgradeType === "2") {
    const upgradeNonce = await registryNoSigner.getUpgradeNonce();
    signaturePayload = await getSignaturePayload(
      "1",
      upgradeNonce.toString(),
      registryContractAddress,
      inputA,
      0,
      inputB
    );
  }

  // SET_FACTORY
  if (upgradeType === "3") {
    const upgradeNonce = await registryNoSigner.getUpgradeNonce();
    signaturePayload = await getSignaturePayload(
      "2",
      upgradeNonce.toString(),
      registryContractAddress,
      inputA,
      0,
      false
    );
  }

  // CANCEL_QUEUED_UPGRADE
  if (upgradeType === "4") {
    const upgradeNonce = await registryNoSigner.getUpgradeNonce();
    signaturePayload = await getSignaturePayload(
      "3",
      upgradeNonce.toString(),
      registryContractAddress,
      "0x0000000000000000000000000000000000000000",
      0,
      false
    );
  }

  console.log(
    "Verify the addresses below, confirm that these are your signers:"
  );
  console.log(
    "NOTE: if an address does not match with any of your signers, that means the payload is incorrect..."
  );
  for (const s of signaturesToVerify) {
    console.log(s);
    const signerAddress = await getSignatureSigner(s, signaturePayload);
    console.log(
      "Signer:",
      signerAddress,
      "Is a valid signer:",
      validSigners.indexOf(signerAddress) > -1
    );
  }
}

async function getSignatureSigner(signature, payload) {
  const signerAddress = ethers.utils.verifyMessage(
    ethers.utils.arrayify(payload),
    signature
  );
  return signerAddress;
}

async function getSignaturePayload(
  upgradeType,
  nonce,
  registryAddress,
  addressBasedUpgradeInput,
  intBasedUpgradeInput,
  boolUpgradeInput
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
  return signaturePayload;
}

main();
