const registry = artifacts.require("Registry");

module.exports = function (deployer, network, accounts) {
  deployer.deploy(registry, 0);
};
