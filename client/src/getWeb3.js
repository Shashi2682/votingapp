import Web3 from "web3";

const switchToSepoliaNetwork = async () => {
  try {
    console.log("Attempting to switch to Sepolia network...");
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0xaa36a7" }], // Sepolia chain ID in hex (0xaa36a7)
    });
    // Optional: Wait a moment for MetaMask to apply the network switch
    await new Promise(resolve => setTimeout(resolve, 1000));  // 1 second delay
    console.log("Switched to Sepolia network");
  } catch (switchError) {
    // If the Sepolia network is not added, we add it.
    if (switchError.code === 4902) {
      console.log("Sepolia network not found. Adding it...");
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "0xAA36A7", // Sepolia chain ID in hex
            chainName: "Sepolia",
            rpcUrls: ["https://eth-sepolia.g.alchemy.com/v2/-rSGr7xmfDNdHIclLYbVGEUC6GhdATnA"], // Replace with your Alchemy RPC URL
            blockExplorerUrls: ["https://sepolia.etherscan.io"], // Etherscan for Sepolia
            nativeCurrency: {
              name: "Sepolia ETH",
              symbol: "ETH",
              decimals: 18,
            },
          },
        ],
      });
    } else {
      console.error("Error switching network:", switchError);
    }
  }
};

const getWeb3 = async () => {
  try {
    if (window.ethereum) {
      const web3 = new Web3(window.ethereum);
      // Request the user accounts
      await window.ethereum.request({ method: "eth_requestAccounts" });
      
      // Check the current network
      let networkId = await web3.eth.net.getId();
      networkId = parseInt(networkId, 10);  // Ensure it's an integer
      console.log("Current network ID:", networkId);  // Log current network ID
      
      const requiredNetworkId = 11155111;  // Sepolia network ID
      console.log("Required network ID: 11155111 (Sepolia)");  // Log the required network ID

      if (networkId !== requiredNetworkId) {  // 11155111 is the Sepolia network ID
        console.log("Not connected to Sepolia. Attempting to switch...");
        await switchToSepoliaNetwork(); // Try to switch the network

        // Check network again after switch attempt
        const newNetworkId = await web3.eth.net.getId();
        console.log("Network after switch attempt:", newNetworkId); // Log new network ID

        if (newNetworkId !== requiredNetworkId) {
          console.error("Failed to switch to Sepolia network.");
          return null;  // Return null if we still cannot switch
        }
      } else {
        console.log("Already connected to Sepolia network.");
      }
      
      return web3;
    } else if (window.web3) {
      const web3 = new Web3(window.web3.currentProvider);
      console.log("Injected web3 detected.");
      return web3;
    } else {
      console.log("No MetaMask detected. Using local provider.");
      const provider = new Web3.providers.HttpProvider("http://127.0.0.1:8545");
      const web3 = new Web3(provider);
      return web3;
    }
  } catch (error) {
    console.error("Error initializing web3:", error);
    return null;
  }
};

export default getWeb3;
