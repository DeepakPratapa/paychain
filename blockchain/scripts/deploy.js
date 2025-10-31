const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying PayChainEscrow contract...");
  
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("📝 Deploying with account:", deployer.address);
  console.log("💰 Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());
  
  // Deploy contract
  const PayChainEscrow = await hre.ethers.getContractFactory("PayChainEscrow");
  const escrow = await PayChainEscrow.deploy();
  
  await escrow.waitForDeployment();
  
  const contractAddress = await escrow.getAddress();
  
  console.log("✅ PayChainEscrow deployed to:", contractAddress);
  
  // Save contract address to .env file
  const envPath = path.join(__dirname, "../../.env");
  let envContent = "";
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf8");
    
    // Check if CONTRACT_ADDRESS already exists
    if (envContent.includes("CONTRACT_ADDRESS=")) {
      // Replace existing CONTRACT_ADDRESS
      envContent = envContent.replace(
        /CONTRACT_ADDRESS=.*/,
        `CONTRACT_ADDRESS=${contractAddress}`
      );
    } else {
      // Append CONTRACT_ADDRESS
      envContent += `\nCONTRACT_ADDRESS=${contractAddress}\n`;
    }
  } else {
    envContent = `CONTRACT_ADDRESS=${contractAddress}\n`;
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log("💾 Contract address saved to .env");
  
  // Save contract ABI
  const artifactPath = path.join(__dirname, "../artifacts/contracts/PayChainEscrow.sol/PayChainEscrow.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  
  const abiOutputPath = path.join(__dirname, "../../backend/payment_service/contract_abi.json");
  fs.writeFileSync(abiOutputPath, JSON.stringify(artifact.abi, null, 2));
  console.log("💾 Contract ABI saved to backend/payment_service/contract_abi.json");
  
  // Verify contract stats
  const stats = await escrow.getContractStats();
  console.log("\n📊 Contract Stats:");
  console.log("   Total Escrow Locked:", stats[0].toString());
  console.log("   Total Fees Collected:", stats[1].toString());
  console.log("   Contract Balance:", stats[2].toString());
  
  console.log("\n🎉 Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
