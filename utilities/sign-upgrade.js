const fs = require("fs");
const ethers = require("ethers");
const process = require("process");
const { Contract } = require("ethers");
const signerAccountData = require("../resources/signer.js");
const truffleConfig = require("../truffle-config.js");

async function main() {
  const programArguments = process.argv;
  const network = programArguments[2];
  const upgradeType = programArguments[3];
  const inputA = programArguments[4];
  const inputB = programArguments.length >= 6 ? programArguments[5] : undefined;
  const networks = truffleConfig.networks;

  console.log("Initialising upgrade signing...");

  let provider;
  let signerAccount;
  let registryContractData;
  let registryContractAddress;

  signerAccount = new ethers.Wallet(signerAccountData);
  if ("host" in networks[network] === true) {
    provider = new ethers.providers.JsonRpcProvider(networks[network].host);
  } else {
    provider = new ethers.providers.InfuraProvider(
      network,
      networks[network].infuraProjectId
    );
  }
  networkChainId = networks[network].network_id;

  if (signerAccount === undefined) {
    console.log("Deployer or test accounts invalid. Stopping configuration.");
    return;
  }

  if (signerAccount === undefined) {
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
    const upgradeSignature = await signRegistryUpgrade(
      "0",
      upgradeNonce.toString(),
      registryContractAddress,
      "0x0000000000000000000000000000000000000000",
      inputA,
      false,
      signerAccount
    );
    console.log(upgradeSignature);
  }

  // SWITCH_SIGNER
  if (upgradeType === "2") {
    const upgradeNonce = await registryNoSigner.getUpgradeNonce();
    const upgradeSignature = await signRegistryUpgrade(
      "1",
      upgradeNonce.toString(),
      registryContractAddress,
      inputA,
      0,
      inputB,
      signerAccount
    );
    console.log(upgradeSignature);
  }

  // SET_FACTORY
  if (upgradeType === "3") {
    const upgradeNonce = await registryNoSigner.getUpgradeNonce();
    const upgradeSignature = await signRegistryUpgrade(
      "2",
      upgradeNonce.toString(),
      registryContractAddress,
      inputA,
      0,
      false,
      signerAccount
    );
    console.log(upgradeSignature);
  }

  // CANCEL_QUEUED_UPGRADE
  if (upgradeType === "4") {
    const upgradeNonce = await registryNoSigner.getUpgradeNonce();
    const upgradeSignature = await signRegistryUpgrade(
      "3",
      upgradeNonce.toString(),
      registryContractAddress,
      "0x0000000000000000000000000000000000000000",
      0,
      false,
      signerAccount
    );
    console.log(upgradeSignature);
  }
}

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
  return signature;
}

main();
