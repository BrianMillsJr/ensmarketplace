const fs = require("fs");
const ethers = require("ethers");
const process = require("process");
const signerAccountData = require("../../resources/signer.js");
const truffleConfig = require("../../truffle-config.js");

async function main() {
  const programArguments = process.argv;
  const network = programArguments[2];
  const networks = truffleConfig.networks;

  console.log("Initialising upgrade signing...");

  let provider;
  let signerAccount;

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
  const factoryProxyContractData = JSON.parse(
    fs.readFileSync(__dirname + "/../../build_" + network + "/Proxy.json", {
      encoding: "utf8",
      flag: "r",
    })
  );
  const factoryContractData = JSON.parse(
    fs.readFileSync(__dirname + "/../../build_" + network + "/Factory.json", {
      encoding: "utf8",
      flag: "r",
    })
  );
  const factoryContractAddress =
    factoryProxyContractData.networks[networkChainId].address;
  const factoryNoSigner = new ethers.Contract(
    factoryContractAddress,
    factoryContractData.abi,
    provider
  );
  const upgradeNonce = await factoryNoSigner.getUpgradeNonce();
  const upgradeSignature = await signMarketplaceUpgrade(
    factoryContractAddress,
    upgradeNonce.toString(),
    signerAccount
  );
  console.log(upgradeSignature);
}

async function signMarketplaceUpgrade(proxyAddres, nonce, wallet) {
  const signaturePayload = ethers.utils.solidityKeccak256(
    ["address", "uint256"],
    [proxyAddres, nonce]
  );
  const signature = await wallet.signMessage(
    ethers.utils.arrayify(signaturePayload)
  );
  return signature;
}

main();
