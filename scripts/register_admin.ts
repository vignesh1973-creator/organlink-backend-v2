
import { ethers } from "ethers";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import path from "path";
import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function registerAdmin() {
    console.log("Starting Manual Admin Registration...");

    const rpcUrl = process.env.INFURA_API_URL;
    const privateKey = process.env.METAMASK_PRIVATE_KEY;
    // USE THE NEW CONTRACT ADDRESS
    const contractAddress = "0x49E61aB11316cD9E16BA7155Fd218E6DF85434C7";

    if (!rpcUrl || !privateKey) {
        throw new Error("Missing env vars");
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log(`Wallet: ${wallet.address}`);

    // Load Artifact for ABI
    const artifactPath = path.resolve(__dirname, "../services/OrgPolicyVoting_Artifact.json");
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

    const contract = new ethers.Contract(contractAddress, artifact.abi, wallet);

    console.log(`Contract: ${contractAddress}`);

    // Check if already registered
    try {
        const org = await contract.organizations(wallet.address);
        if (org.isRegistered) {
            console.log("✅ Admin is ALREADY registered!");
            return;
        }
    } catch (e) {
        console.log("Check failed, trying to register anyway...");
    }

    console.log("Sending registration tx...");
    try {
        const tx = await contract.registerOrganization(wallet.address, "System Admin", "Admin", { gasLimit: 500000 });
        console.log(`Tx hash: ${tx.hash}`);
        await tx.wait();
        console.log("✅ Admin Registered Successfully!");
    } catch (e) {
        console.error("❌ Registration Failed:", e);
    }
}

registerAdmin().catch(console.error);
