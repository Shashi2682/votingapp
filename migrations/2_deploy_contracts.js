const Election = artifacts.require("Election");

module.exports = async function (deployer, network, accounts) {
  const adminAddress = "0xEF3F529f5b7474c167336c14f211329174c0Ea04"; // First account provided by Truffle/Ganache
  await deployer.deploy(Election, adminAddress);
};
