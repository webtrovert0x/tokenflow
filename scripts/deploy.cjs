const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying BOTTokenFlow contract to Botchain Testnet (Chain ID 968)...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", hre.ethers.formatEther(balance), "BOT");

  const BOTTokenFlow = await hre.ethers.getContractFactory("BOTTokenFlow");
  const contract = await BOTTokenFlow.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("BOTTokenFlow deployed successfully at:", contractAddress);
  console.log("View on Explorer: https://scan.bohr.life/address/" + contractAddress);

  // Update .env file with the deployed contract address
  const envPath = path.resolve(__dirname, "../.env");
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, "utf-8");
    if (envContent.includes("BOT_TOKEN_FLOW_ADDRESS=")) {
      envContent = envContent.replace(
        /BOT_TOKEN_FLOW_ADDRESS=.*/,
        `BOT_TOKEN_FLOW_ADDRESS=${contractAddress}`
      );
    } else {
      envContent += `\nBOT_TOKEN_FLOW_ADDRESS=${contractAddress}`;
    }
    fs.writeFileSync(envPath, envContent, "utf-8");
    console.log("Updated .env with BOT_TOKEN_FLOW_ADDRESS");
  }

  // Also write deployed address to a frontend-accessible json file
  const deployedConfigPath = path.resolve(__dirname, "../src/config/deployedContract.json");
  fs.mkdirSync(path.dirname(deployedConfigPath), { recursive: true });
  fs.writeFileSync(
    deployedConfigPath,
    JSON.stringify(
      {
        address: contractAddress,
        network: "Botchain Testnet",
        chainId: 968,
        deployedAt: new Date().toISOString(),
      },
      null,
      2
    )
  );
  console.log("Saved deployed contract config to src/config/deployedContract.json");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});

