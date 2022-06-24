const fs = require("fs");
const ethers = require("ethers");
const process = require("process");
const { Contract } = require("ethers");
const accountsData = require("../resources/accounts.js");
const truffleConfig = require("../truffle-config");

async function main() {
  console.log("Initialising...");

  const programArguments = process.argv;
  if (programArguments.length < 4) {
    console.log(
      "Arguments missing. Please invoke the manage-timelock.sh tool again."
    );
  }
  const network = programArguments[2];
  const networks = truffleConfig.networks;
  const newTimelock = programArguments[3];

  let provider;
  let deployerAccount;
  let registryContractData;
  let registryContractAddress;
  let networkChainId;

  if ("host" in networks[network] === true) {
    provider = new ethers.providers.JsonRpcProvider(networks[network].host);
  } else {
    provider = new ethers.providers.InfuraProvider(
      network,
      networks[network].infuraProjectId
    );
  }
  networkChainId = networks[network].network_id;
  deployerAccount = new ethers.Wallet(
    accountsData.deployer.privateKey,
    provider
  );

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
  const registryWithSigner = new Contract(
    registryContractAddress,
    registryContractData.abi,
    deployerAccount
  );

  registryNoSigner
    .getUpgradeNonce()
    .then((nonce) => {
      return registryWithSigner.setTimelockDuration(
        nonce,
        newTimelock,
        accountsData.upgradeSignatures.map((sRaw) => {
          const s = ethers.utils.splitSignature(sRaw);
          const sFinalForm = [s.v, s.r, s.s];
          sFinalForm.v = s.v;
          sFinalForm.r = s.r;
          sFinalForm.s = s.s;
          return sFinalForm;
        })
      );
    })
    .then((r) => {
      console.log(r);
    })
    .catch((e) => {
      console.log(e);
    });
}

main();
