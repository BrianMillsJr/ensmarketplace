# ENS Domains Marketplace

This is a smart contract for a domains marketplace that allows buyers to purchase domains from sellers. The smart contract features off-chain listing and on-chain settlement. See below for usage and instructions.

The contract is upgradeable with a proxy and registry implementations to handle upgrade migrations. And it also features timelock and multi-signature support.

For support, join the Discord channel at: https://discord.gg/XEcbnfZg9G

### Pre-requisites

Please make sure that the following dependencies are installed:

- nodejs 10.x
- Ethereum wallet with Rinkeby Ether for testing

### Installation

To install the package, simply clone the repository and execute:

`npm install`

Next, make sure that any sensitive data added to the package (signer key in accounts, &c.) are not included in future commits, execute:

`bash reinstate-git-ignore.sh`

### Configuration

To get started with your contract deployment, configure truffle by editing **truffle-config.js** Please make sure that the following variables are correctly configured:

- **gasPrice** (of each network)
- **netword_id** (of each network)

Additional network may be added in this configuration. Please see the supported networks list of ENS domains at: https://docs.ens.domains/ens-deployments

If you're using Infura for your deployments, you must set your infura **project id** (and or secret) within **/resources/accounts.js**

### Contract Deployment

To deploy your contracts, execute the commands in the following order:

**NOTE:** make sure to take notes of the deployment result to record the contract addresses of the deployed components.

```
bash deploy-setup.sh <network>
Copy and paste the registry contract address to MAIN_REGISTRY in resources/value_swappable.js
bash deploy-proxies.sh <network>
bash deploy-factory.sh <network>
bash deploy-upgrade-factory.sh <network>
bash deploy-upgrade-execute <network>
```

For example:

```
bash deploy-setup.sh rinkeby
...step 2 here.
bash deploy-proxies.sh rinkeby
bash deploy-factory.sh rinkeby
bash deploy-upgrade-factory.sh rinkeby
bash deploy-upgrade-execute rinkeby
```

Now your contracts are deployd on your selected network.

### Contract Upgrade

To deploy an upgrade, when ready execute the following command in order:

```
bash deploy-factory.sh <network>
bash deploy-upgrade-factory.sh <network>
bash deploy-upgrade-execute.sh <network>
```

**Note:** The Registry and Proxy cannot be upgraded. Changes can only be applied to other components (Factory). **Therefore, do not change those contracts.**

### Reading the Upgrade Logs

After executing **deploy-upgrade-execute.sh** the contract will emit an event, the event can be read as below.

![https://i.ibb.co/HGVm9KV/upgrade.jpg](https://i.ibb.co/HGVm9KV/upgrade.jpg "https://i.ibb.co/HGVm9KV/upgrade.jpg")

- the last key in the log is a string that indicates the type of upgrade performed. Simply convert the log to string to see the update note. The key also indicates whether the upgrade suceeded or failed.
- Depending on the upgrade type, the rest of the keys will be null addresses with 1 key where the upgrade parameter is specified i.e. if the upgrade changes commits a new address (for factory contract), the first key will display the new factory address.

### Multi-signature Contract Upgrade

If you are working in a multi-signature deployment setting, follow the instructions:

- The third-party signers must clone and configure the repository.
- Please follow **Installation** and **Cofiguration** instructions above.
- There is no need to deploy the contract.
- The third-party signer must then include their signing key (**private key**) to **resources/signer.js**
- The third-party signer can then create an **upgrade signature** by executing: **bash manage-upgrade.sh** and following the instructions.
- The result provides the **upgrade signature** that must be copied and shared to the deployer (upgrade executor).
- The deployer must add the upgrade signatures to **resources/accounts.js** (upradeSignatures).
- Before deploying the upgrade, the deployes can verifiy all the signatures by using **verify-upgrade-signatures.sh** script.
- The deployer can now then perform the upgrade - refer to **Contract Upgrade** section above.

### Adding New Upgrade Signers

- To add a new, use the **manage-signer.sh** script and follow the instructions.
- If multi-signature parties exist alongside deployer, the signatures of those third-party signers must be collected and added to **resources/accounts.js** (upgradeSignatures) as a sign of approval to the adding of the new signer.
- The signature of the deployer must also be included.

### Configure Timelock

- By default, the Timelock is set to null. This can be changed using manage-timelock.sh
- If multi-signature parties exist alongside deployer, the signatures of those third-party signers must be collected and added to **resources/accounts.js** (upgradeSignatures) as a sign of approval to the changing of the timelock.
- The signature of the deployer must also be included.
- The changes to the timelock can be executed using **bash deploy-upgrade-execute.sh**
- The upgrade execution can only be done when the time in timelock is surpassed.
- The timelock is based on blocks **NOT** timestamp i.e. changes to the timelock must be expressed in **number of blocks since an upgrade has been commited** (using **bash deploy-upgrade-factory.sh** for example)

# The Markerplace Contract

The marketplace smart contract features off-chain listing and on-chain settlement. In this design, the seller creates a signature of their listing information (sale price, which domain, sale expiry). The signature is then handed to interested buyers who will use it to invoke the buyDomain method in the smart contract which will perform sanity checks to ensure a secure transaction - in this event, the domain is transfered to the buyer and the msg.value (sale total minus commission) is given to the seller.

### TODO:

The following features must be implemented:

```
Allow transfer of owner to an address.
Create a getter to show the current timelock setting.
```

### Usage

Check the **utilities/tools** folder to understand the technnical processes. See **Perform Testing** below for instructions.

### Listing cancellations & price updates

The sales receipt for domain listings are secured by nonce on-chain. To void the current receipt and prevent any sales with it, the nonce must be chance (incremented). Therefore, to cancel any domain listing, the seller must call the method below - this action would be aided by the marketplace's front-end.

To change the listing price, the same method can be used. The nonce must be changed and a new sales receipt must be created with the new nonce signed.

`voidReceipt(string memory domainNameStr)`

### Changing Commission Rate

The commission rate can be changed using single account (if multisig is not active) or multisig party using th tools found at **utilities/marketplace-tools**

To invoke rate change, execute the following command:
`node change-commission-rate.js <network> <new_commission_rate (uint)>`

**Note:** commission rates are percentages deducted from the sales total. The commission rate is divisible up to a thousand meaning a new comission rate of 100 = 1%. This implementation allows for fractional percentages i.e. 0.25%, 1.25%, &c.

To invoke a rate change with a multisig party, advice the entire party (including the deployer) to sign an upgrade signature using:
`node sign-marketplace-upgrade.js <network>`

# Testing

Unit test are not available in the package. Smart conract tests can be found in **utilities/tests**, see below on how to perform your tests.

### Pre-requisites

You will need the following:

- A seller account private key.
- A buyer account private key.
- An ENS domain to sell.

### Register A New Domain

To create a new domain for the test, head to the ENS domain app at https://app.ens.domains.

**NOTE:** Make sure that you are in the **Rinkeby Test Network**

### Configure Seller & Buyer Accounts

Edit the **test-accounts.js** in **utilities/tests** folder and specify he buyer and seller private keys.

### Perform Testing

```
Approve the contract  (seller) by executing "node test-approve.js rinkeby"
Creat a listing (seller) by executing "node test-create-listing.js rinkeby <domain_name> <sale price>"
Buy the domain (buyer) by executing "node test-buy-domain.js rinkeby <domain_name>"
```
