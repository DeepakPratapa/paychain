const hre = require("hardhat");

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS || "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  
  console.log("Checking contract at:", contractAddress);
  
  const PayChainEscrow = await hre.ethers.getContractFactory("PayChainEscrow");
  const contract = PayChainEscrow.attach(contractAddress);
  
  const owner = await contract.owner();
  console.log("Contract owner:", owner);
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Current signer:", deployer.address);
  
  console.log("Owner matches signer:", owner.toLowerCase() === deployer.address.toLowerCase());
  
  // Check platform account
  const platformAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"; // First Ganache account
  console.log("Platform address (from private key):", platformAddress);
  console.log("Owner is platform:", owner.toLowerCase() === platformAddress.toLowerCase());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
