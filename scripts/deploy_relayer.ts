
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
    console.log("Starting RELAYER-COMPATIBLE deployment...");

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

    // 2. Setup Provider & Wallet
    const rpcUrl = process.env.INFURA_API_URL;
    const privateKey = process.env.METAMASK_PRIVATE_KEY;

    if (!rpcUrl || !privateKey) {
        throw new Error("Missing env vars");
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log(`Deploying from Relayer Wallet: ${wallet.address}`);

    // 3. Deploy
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    const contract = await factory.deploy();
    await contract.waitForDeployment();

    const address = await contract.getAddress();
    console.log("----------------------------------------------------");
    console.log(`✅ RELAYER CONTRACT DEPLOYED AT: ${address}`);
    console.log("----------------------------------------------------");

    // 4. Save Artifact
    const artifactPath = path.resolve(__dirname, "../services/OrgPolicyVoting_Artifact.json");
    fs.writeFileSync(artifactPath, JSON.stringify({ abi, address }, null, 2));

    // 5. AUTO-REGISTER THE RELAYER AS ADMIN ORGANIZATION (Just in case)
    // Note: In Relayer pattern, the Admin calls relayVote, so the Admin itself doesn't strictly need to be an Org to VOTE, 
    // but we register it to be safe for other checks.
    try {
        const tx = await contract.addOrganization(wallet.address, "System Admin", { gasLimit: 500000 });
        await tx.wait();
        console.log("✅ Admin Whitelisted.");
    } catch (e) {
        console.log("Admin whitelist skip/fail (non-critical for Relayer mode).");
    }
}

deploy().catch(console.error);
