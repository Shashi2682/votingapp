const HDWalletProvider = require('@truffle/hdwallet-provider');

module.exports = {
  networks: {
    sepolia: {
      provider: () =>
        new HDWalletProvider(
          'inflict boy water jelly any miracle spoil mother easily render virus purity', // ⚠️ Keep this private!
          'https://eth-sepolia.g.alchemy.com/v2/-rSGr7xmfDNdHIclLYbVGEUC6GhdATnA'
        ),
      network_id: 11155111,     // Sepolia network ID
      gas: 5500000,             // Gas limit
      confirmations: 2,         // # of confs to wait between deployments
      timeoutBlocks: 200,       // # of blocks before timeout
      skipDryRun: true          // Skip dry run before migrations
    }
  },

  // Compiler configuration
  compilers: {
    solc: {
      version: "0.8.21",        // Match with your Voting.sol version
    }
  }
};
