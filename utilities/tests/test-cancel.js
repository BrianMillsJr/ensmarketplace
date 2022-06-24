const fs = require("fs");
const ethers = require("ethers");
const process = require("process");
const { Contract } = require("ethers");
const accountsData = require("./test-accounts.js");
const truffleConfig = require("../../truffle-config.js");

async function main() {
  console.log("Initialising...");

  const programArguments = process.argv;
  if (programArguments.length < 2) {
    console.log("Arguments missing: network or ens domain name.");
  }
  const network = programArguments[2];
  const networks = truffleConfig.networks;
  const ensDomainToSell = programArguments[3];

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
  deployerAccount = new ethers.Wallet(accountsData.sellerKey, provider);

  if (deployerAccount === undefined) {
    console.log("Deployer or test accounts invalid. Stopping configuration.");
    return;
  }

  const factoryContractData = JSON.parse(
    fs.readFileSync(__dirname + "/../../build_" + network + "/Factory.json", {
      encoding: "utf8",
      flag: "r",
    })
  );
  const proxyContractData = JSON.parse(
    fs.readFileSync(__dirname + "/../../build_" + network + "/Proxy.json", {
      encoding: "utf8",
      flag: "r",
    })
  );

  const proxyAddress = proxyContractData.networks[networkChainId].address;
  const proxyContract = new Contract(
    proxyAddress,
    factoryContractData.abi,
    deployerAccount
  );

  proxyContract
    .voidReceipt(ensDomainToSell, {
      gasLimit: 2000000,
    })
    .then((r) => {
      console.log(r);
    });
}

main();
