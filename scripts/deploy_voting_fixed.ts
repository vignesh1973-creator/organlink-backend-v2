
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import solc from "solc";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function deploy() {
    console.log("Starting FIXED deployment of OrgPolicyVoting...");

    // 1. Compile Contract
    const contractPath = path.resolve(__dirname, "../contracts/OrgPolicyVoting.sol");
    const source = fs.readFileSync(contractPath, "utf8");

    const input = {
        language: "Solidity",
        sources: {
            "OrgPolicyVoting.sol": {
                content: source,
            },
        },
        settings: {
            outputSelection: {
                "*": {
                    "*": ["*"],
                },
            },
        },
    };

    console.log("Compiling...");
    const output = JSON.parse(solc.compile(JSON.stringify(input)));

    if (output.errors) {
        let hasError = false;
        output.errors.forEach((err: any) => {
            console.error(err.formattedMessage);
            if (err.severity === 'error') hasError = true;
        });
        if (hasError) throw new Error("Compilation failed");
    }

    const contractFile = output.contracts["OrgPolicyVoting.sol"]["OrgPolicyVoting"];
    const bytecode = contractFile.evm.bytecode.object;
    const abi = contractFile.abi;

    console.log("Compilation successful!");

    // 2. Setup Provider & Wallet
    const rpcUrl = process.env.INFURA_API_URL;
    const privateKey = process.env.METAMASK_PRIVATE_KEY;

    if (!rpcUrl || !privateKey) {
        throw new Error("Missing INFURA_API_URL or METAMASK_PRIVATE_KEY in .env");
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log(`Deploying with account: ${wallet.address}`);

    const balance = await provider.getBalance(wallet.address);
    console.log(`Account balance: ${ethers.formatEther(balance)} ETH`);

    // 3. Deploy
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    const contract = await factory.deploy();

    console.log("Deploy transaction sent, waiting for confirmation...");
    await contract.waitForDeployment();

    const address = await contract.getAddress();
    console.log("----------------------------------------------------");
    console.log(`✅ OrgPolicyVoting Deployed at: ${address}`);
    console.log("----------------------------------------------------");

    // 4. WHITELIST ADMIN IMMEDIATELY
    console.log("Whitelisting Admin Wallet as Organization...");
    try {
        const tx = await contract.registerOrganization(wallet.address, "System Admin", "Admin", { gasLimit: 500000 });
        console.log(`Tx sent: ${tx.hash}`);
        await tx.wait();
        console.log("✅ Admin Whitelisted successfully!");
    } catch (e) {
        console.error("❌ Failed to whitelist admin:", e);
    }

    // 5. Save Artifact (optional, for frontend/service usage)
    const artifactPath = path.resolve(__dirname, "../services/OrgPolicyVoting_Artifact.json");
    fs.writeFileSync(artifactPath, JSON.stringify({ abi, address }, null, 2));
    console.log(`Artifact saved to ${artifactPath}`);
}

deploy().catch(console.error);
