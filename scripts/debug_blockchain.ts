
import { ethers } from "ethers";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

// Minimal ABI for testing
const ABI = [
    "function organizations(address) view returns (bool isRegistered, string name, address wallet, bool isAuthorized)",
    "function addOrganization(address _wallet, string memory _name) external",
    "function proposePolicy(string memory _title, string memory _organType, string memory _description, string memory _details, uint256 _votingPeriod) external returns (uint256)",
    "event PolicyProposed(uint256 indexed policyId, address indexed proposer, string title)"
];

async function debugBlockchain() {
    try {
        console.log("🔍 Starting Blockchain Debug...");

        const rpcUrl = process.env.INFURA_API_URL;
        const privateKey = process.env.METAMASK_PRIVATE_KEY;
        const contractAddress = process.env.POLICY_CONTRACT_ADDRESS;

        if (!rpcUrl || !privateKey || !contractAddress) {
            throw new Error("Missing env vars");
        }

        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const wallet = new ethers.Wallet(privateKey, provider);
        const contract = new ethers.Contract(contractAddress, ABI, wallet);

        console.log(`👤 Wallet: ${wallet.address}`);

        // 1. Check Balance
        const balance = await provider.getBalance(wallet.address);
        console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);

        // 2. Check Registration
        console.log("Checking Organization Registration...");
        const org = await contract.organizations(wallet.address);
        console.log(`📋 Is Registered: ${org.isRegistered}`);
        console.log(`   Name: ${org.name}`);

        // 3. Register if needed
        if (!org.isRegistered) {
            console.log("⚠️ Not registered. Attempting registration...");
            const tx = await contract.addOrganization(wallet.address, "Debug Admin", { gasLimit: 500000 });
            console.log(`⏳ Msg sent: ${tx.hash}`);
            await tx.wait();
            console.log("✅ Registered!");
        }

        // 4. Try Propose
        console.log("🚀 Attempting to Propose Policy...");
        const tx = await contract.proposePolicy(
            "Debug Policy",
            "Kidney",
            "This is a debug policy",
            "{}",
            7,
            { gasLimit: 2000000 }
        );
        console.log(`⏳ Propose TX: ${tx.hash}`);

        const receipt = await tx.wait();
        console.log(`✅ Proposal Successful! Receipt: ${receipt.hash}`);

        // Parse Logs
        receipt.logs.forEach((log: any) => {
            try {
                const parsed = contract.interface.parseLog(log);
                if (parsed?.name === 'PolicyProposed') {
                    console.log(`🆔 New Policy ID: ${parsed.args[0]}`);
                }
            } catch (e) { }
        });

    } catch (error: any) {
        console.error("❌ Debug Failed:", error);
        if (error.reason) console.error("   Reason:", error.reason);
        if (error.data) console.error("   Data:", error.data);
    }
}

debugBlockchain();
