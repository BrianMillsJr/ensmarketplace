const factory = artifacts.require("Factory");

module.exports = function (deployer, network, accounts) {
  deployer.deploy(factory);
};
