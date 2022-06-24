const fs = require("fs");
const ethers = require("ethers");
const process = require("process");
const { Contract } = require("ethers");
const accountsData = require("./test-accounts.js");
const otherValues = require("../../resources/other-variables.js");
const truffleConfig = require("../../truffle-config.js");

async function main() {
  console.log("Initialising...");

  const programArguments = process.argv;
  if (programArguments.length < 4) {
    console.log("Arguments missing: network or ens domain name or price.");
  }
  const network = programArguments[2];
  const networks = truffleConfig.networks;
  const ensDomainToSell = programArguments[3];
  const salePrice = programArguments[4];

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

  let receiptNonce, receiptExpiry;
  proxyContract
    .getReceiptNonce(deployerAccount.address, ensDomainToSell)
    .then((nonce) => {
      receiptNonce = nonce;
      return provider.getBlockNumber();
    })
    .then((blockNumber) => {
      receiptExpiry = blockNumber + 10000;
      return createReceipt(
        proxyAddress,
        receiptNonce,
        deployerAccount.address,
        ensDomainToSell,
        salePrice,
        receiptExpiry,
        otherValues.COMMISSION_RATE,
        deployerAccount
      );
    })
    .then((r) => {
      console.log("Receipt created: receipt.log");
      const receipt = ethers.utils.splitSignature(r);
      fs.writeFileSync(
        "./receipt.log",
        JSON.stringify({
          price: salePrice,
          commission: otherValues.COMMISSION_RATE,
          receiptNonce: receiptNonce,
          expiry: receiptExpiry,
          domain: ensDomainToSell,
          seller: deployerAccount.address,
          v: receipt.v,
          r: receipt.r,
          s: receipt.s,
        })
      );
    });
}

async function createReceipt(
  proxyAddress,
  nonce,
  seller,
  domain,
  price,
  expiry,
  commissionRate,
  wallet
) {
  const signaturePayload = ethers.utils.solidityKeccak256(
    [
      "address",
      "address",
      "uint256",
      "string",
      "uint256",
      "uint256",
      "uint256",
    ],
    [proxyAddress, seller, nonce, domain, price, expiry, commissionRate]
  );
  const signature = await wallet.signMessage(
    ethers.utils.arrayify(signaturePayload)
  );
  return signature;
}

main();
