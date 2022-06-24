const factoryProxy = artifacts.require("Proxy");
const registry = artifacts.require("Registry");
const otherVars = require("../../resources/other-variables.js");

module.exports = function (deployer, network, accounts) {
  deployer.deploy(
    factoryProxy,
    registry.address,
    otherVars.ENS_REGISTRY_ADDRESS,
    otherVars.ENS_TOKEN_ADDRESS,
    otherVars.COMMISSION_RATE
  );
};
