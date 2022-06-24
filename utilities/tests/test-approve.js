const fs = require("fs");
const ethers = require("ethers");
const process = require("process");
const { Contract } = require("ethers");
const accountsData = require("../../resources/accounts.js");
const otherVariables = require("../../resources/other-variables.js");
const truffleConfig = require("../../truffle-config.js");

async function main() {
  console.log("Initialising...");

  const programArguments = process.argv;
  if (programArguments.length < 1) {
    console.log("Arguments missing: network");
  }
  const network = programArguments[2];
  const networks = truffleConfig.networks;

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

  erc71ContractData = JSON.parse(
    fs.readFileSync(__dirname + "/../../build_" + network + "/ERC721.json", {
      encoding: "utf8",
      flag: "r",
    })
  );
  proxyContractData = JSON.parse(
    fs.readFileSync(__dirname + "/../../build_" + network + "/Proxy.json", {
      encoding: "utf8",
      flag: "r",
    })
  );
  const ensTokenAddress = otherVariables.ENS_TOKEN_ADDRESS;
  const proxyAddress = proxyContractData.networks[networkChainId].address;

  const ensToken = new Contract(
    ensTokenAddress,
    erc71ContractData.abi,
    deployerAccount
  );

  ensToken.setApprovalForAll(proxyAddress, true).then((r) => {
    console.log(r);
  });
}

main();
