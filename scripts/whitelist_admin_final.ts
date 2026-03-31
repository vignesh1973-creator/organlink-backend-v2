
import { ethers } from "ethers";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import path from "path";
import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function registerAdmin() {
    console.log("Starting FINAL Admin Registration...");

    const rpcUrl = process.env.INFURA_API_URL;
    const privateKey = process.env.METAMASK_PRIVATE_KEY;
    const contractAddress = process.env.POLICY_CONTRACT_ADDRESS || "0x49E61aB11316cD9E16BA7155Fd218E6DF85434C7";

    if (!rpcUrl || !privateKey) {
        throw new Error("Missing env vars");
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    // Load Artifact for ABI - BUT we know the Artifact is correct now, 
    // we just need to confirm we use the right method name.
    const artifactPath = path.resolve(__dirname, "../services/OrgPolicyVoting_Artifact.json");
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

    const contract = new ethers.Contract(contractAddress, artifact.abi, wallet);

    console.log(`Contract: ${contractAddress}`);
    console.log(`Caller: ${wallet.address}`);

    try {
        console.log("Sending addOrganization tx...");
        // Use addOrganization (Address, Name)
        const tx = await contract.addOrganization(wallet.address, "System Admin", { gasLimit: 500000 });
        console.log(`Tx hash: ${tx.hash}`);
        await tx.wait();
        console.log("✅ Admin Registered Successfully!");
    } catch (e: any) {
        if (e.message.includes('Organization already registered')) {
            console.log("✅ Admin is ALREADY registered!");
        } else {
            console.error("❌ Registration Failed:", e);
        }
    }
}

registerAdmin().catch(console.error);
