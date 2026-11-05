const hre = require("hardhat");
const deployed = require("../src/config/deployedContract.json");

async function main() {
  console.log("Interacting with BOTTokenFlow at:", deployed.address);
  const [signer] = await hre.ethers.getSigners();
  console.log("Signer address:", signer.address);

  const BOTTokenFlow = await hre.ethers.getContractAt("BOTTokenFlow", deployed.address, signer);

  const targetWallet = "0x1234567890abcdef1234567890abcdef1234abcd";
  const tokenAddress = "0x0000000000000000000000000000000000000000"; // Native BOT
  const fromBlock = 1000;
  const toBlock = 1200;

  console.log("Submitting requestFlowAnalysis on Botchain Testnet (gas fee only, no platform fee)...");
  const tx = await BOTTokenFlow.requestFlowAnalysis(
    targetWallet,
    tokenAddress,
    fromBlock,
    toBlock
  );
  console.log("Transaction sent! Hash:", tx.hash);
  console.log("View on Explorer: https://scan.bohr.life/tx/" + tx.hash);

  const receipt = await tx.wait();
  console.log("Transaction confirmed in block:", receipt.blockNumber);

  // Parse requestId from event
  let requestId = null;
  for (const log of receipt.logs) {
    try {
      const parsed = BOTTokenFlow.interface.parseLog(log);
      if (parsed && parsed.name === "FlowAnalysisRequested") {
        requestId = parsed.args.requestId;
        break;
      }
    } catch (e) {}
  }

  console.log("Recorded on-chain Request ID:", requestId);

  if (requestId) {
    console.log("Publishing mock reportHash on-chain...");
    const reportHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("Demo Report Verified on Botchain"));
    const pubTx = await BOTTokenFlow.publishResult(requestId, reportHash);
    console.log("Publish Tx sent! Hash:", pubTx.hash);
    console.log("View on Explorer: https://scan.bohr.life/tx/" + pubTx.hash);
    await pubTx.wait();
    console.log("Report hash published successfully!");

    const reqData = await BOTTokenFlow.getRequest(requestId);
    console.log("Verified On-Chain Request Data:");
    console.log("Requester:", reqData.requester);
    console.log("Wallet:", reqData.wallet);
    console.log("Report Hash:", reqData.reportHash);
    console.log("Is Published:", reqData.isPublished);
  }
}

main().catch((err) => {
  console.error("Interaction failed:", err);
  process.exit(1);
});

