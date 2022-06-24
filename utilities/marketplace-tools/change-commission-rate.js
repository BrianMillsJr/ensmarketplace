const fs = require("fs");
const ethers = require("ethers");
const process = require("process");
const { Contract } = require("ethers");
const accountsData = require("../../resources/accounts.js");
const truffleConfig = require("../../truffle-config");

async function main() {
  console.log("Initialising...");

  const programArguments = process.argv;
  if (programArguments.length < 4) {
    console.log(
      "Arguments missing. Required: network(string), commissionRate(int)"
    );
  }
  const network = programArguments[2];
  const networks = truffleConfig.networks;
  const newCommissionRate = programArguments[3];

  let provider;
  let deployerAccount;
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
  const factory = new Contract(
    factoryContractAddress,
    factoryContractData.abi,
    deployerAccount
  );
  const factoryNoSigner = new Contract(
    factoryContractAddress,
    factoryContractData.abi,
    provider
  );

  const upgradeNonce = await factoryNoSigner.getUpgradeNonce();
  factory
    .changeCommissionRate(
      newCommissionRate,
      accountsData.upgradeSignatures.map((sRaw) => {
        const s = ethers.utils.splitSignature(sRaw);
        const sFinalForm = [s.v, s.r, s.s];
        sFinalForm.v = s.v;
        sFinalForm.r = s.r;
        sFinalForm.s = s.s;
        return {
          nonce: upgradeNonce,
          signature: sFinalForm,
        };
      }),
      {
        gasLimit: 2000000,
      }
    )
    .then((r) => {
      console.log(r);
    })
    .catch((e) => {
      console.log(e);
    });
}

main();
