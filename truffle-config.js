const PrivateKeyProvider = require("@truffle/hdwallet-provider");
const accounts = require("./resources/accounts");

function resolveProviderKey() {
  return accounts.deployer.privateKey;
}

function resolveBuildFolder(networkName) {
  return "./build_" + networkName;
}

function resolveMigrationFolder() {
  if (process.argv[3] === "setup") {
    return "./migrations/migrations-setup";
  } else if (process.argv[3] === "initialise_proxies") {
    return "./migrations/migrations-initialise-proxies";
  } else if (process.argv[3] === "configure_registry") {
    return "./migrations/migrations-configure-registry";
  } else if (process.argv[3] === "upgrade_execute") {
    return "./migrations/migrations-upgrade/execute-upgrades";
  } else if (process.argv[3] === "upgrade_factory") {
    return "./migrations/migrations-upgrade/factory";
  } else if (process.argv[3] === "deploy_factory") {
    return "./migrations/migrations-deploy/factory";
  }
}

module.exports = {
  contracts_build_directory: resolveBuildFolder(process.argv[7]),
  migrations_directory: resolveMigrationFolder(),
  /**
   * A note on networks: the "host" attribute must be used only if Ethers API is not available for the network i.e.
   * "Arbitrum" is not supported by ethers therefore Arbitrum host must be used instead of "networkName".
   * If "host" is available, it will be prioritised.
   */
  networks: {
    homestead: {
      provider: function () {
        return new PrivateKeyProvider(
          resolveProviderKey(),
          "wss://mainnet.infura.io/ws/v3/" + accounts.infura.id
        );
      },
      network_id: 1,
      gasPrice: 20000000000,
      gasLimit: 2000000,
      infuraProjectId: accounts.infura.id,
      networkName: "homestead",
    },
    rinkeby: {
      provider: function () {
        return new PrivateKeyProvider(
          resolveProviderKey(),
          "wss://rinkeby.infura.io/ws/v3/" + accounts.infura.id
        );
      },
      network_id: 4,
      gasPrice: 20000000000,
      gasLimit: 2000000,
      infuraProjectId: accounts.infura.id,
      networkName: "rinkeby",
    },
  },
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
  },
  compilers: {
    solc: {
      version: "0.7.5",
    },
  },
};
