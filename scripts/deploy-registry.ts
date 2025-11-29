import fs from 'fs';
import path from 'path';
import solc from 'solc';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const CONTRACT_SOURCE = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/*
 OrganLink Final-Year Project – Transparent Registration Contract (Enhanced)
*/

contract OrganLinkRegistry {
    address public admin; // Admin MetaMask account (hospital or authorized verifier)

    struct Record {
        bytes32 patientHash;    // Hash of patient/donor details (computed off-chain)
        string hospitalName;    // Hospital/organization that verified
        string verificationType; // "signature" or "aadhaar"
        bool ocrVerified;       // true if OCR matched (for Aadhaar flow)
        string ipfsCID;         // IPFS CID from Pinata
        uint256 timestamp;      // When record was stored
    }

    uint256 public recordCount;
    mapping(uint256 => Record) public records;

    // Event logs (for frontend or block explorer)
    event RecordAdded(
        uint256 indexed recordId,
        bytes32 indexed patientHash,
        string hospitalName,
        string verificationType,
        bool ocrVerified,
        string ipfsCID,
        uint256 timestamp
    );

    // Only admin (hospital verifier) can call restricted functions
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this");
        _;
    }

    constructor() {
        admin = msg.sender; // deployer = admin
    }

    /*
     🧾 addVerifiedRecord()
     -----------------------
     Adds a new patient/donor verification record.
     Called by admin after successful verification (signature or Aadhaar).
    */
    function addVerifiedRecord(
        bytes32 _patientHash,
        string calldata _hospitalName,
        string calldata _verificationType,
        bool _ocrVerified,
        string calldata _ipfsCID
    ) external onlyAdmin {
        require(bytes(_hospitalName).length > 0, "Hospital name required");
        require(bytes(_ipfsCID).length > 0, "CID required");
        require(
            keccak256(abi.encodePacked(_verificationType)) == keccak256("signature") ||
            keccak256(abi.encodePacked(_verificationType)) == keccak256("aadhaar"),
            "Invalid verification type"
        );

        recordCount++;
        records[recordCount] = Record({
            patientHash: _patientHash,
            hospitalName: _hospitalName,
            verificationType: _verificationType,
            ocrVerified: _ocrVerified,
            ipfsCID: _ipfsCID,
            timestamp: block.timestamp
        });

        emit RecordAdded(
            recordCount,
            _patientHash,
            _hospitalName,
            _verificationType,
            _ocrVerified,
            _ipfsCID,
            block.timestamp
        );
    }

    /*
     🔍 getRecord()
     ----------------
     View details of a specific record using its ID.
    */
    function getRecord(uint256 _id)
        external
        view
        returns (
            bytes32 patientHash,
            string memory hospitalName,
            string memory verificationType,
            bool ocrVerified,
            string memory ipfsCID,
            uint256 timestamp
        )
    {
        Record memory r = records[_id];
        return (
            r.patientHash,
            r.hospitalName,
            r.verificationType,
            r.ocrVerified,
            r.ipfsCID,
            r.timestamp
        );
    }

    /*
     🔑 changeAdmin()
     -----------------
     Allows admin transfer (e.g., new MetaMask wallet for hospital).
    */
    function changeAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Invalid new admin");
        admin = newAdmin;
    }
}
`;

async function main() {
    console.log('Compiling OrganLinkRegistry...');

    const input = {
        language: 'Solidity',
        sources: {
            'OrganLinkRegistry.sol': {
                content: CONTRACT_SOURCE
            }
        },
        settings: {
            outputSelection: {
                '*': {
                    '*': ['*']
                }
            }
        }
    };

    const output = JSON.parse(solc.compile(JSON.stringify(input)));

    if (output.errors) {
        const errors = output.errors.filter((e: any) => e.severity === 'error');
        if (errors.length > 0) {
            console.error('Compilation errors:', errors);
            process.exit(1);
        }
    }

    const contractFile = output.contracts['OrganLinkRegistry.sol']['OrganLinkRegistry'];
    const bytecode = contractFile.evm.bytecode.object;
    const abi = contractFile.abi;

    console.log('Contract compiled successfully.');

    // Setup provider and wallet
    const rpcUrl = process.env.INFURA_API_URL || "https://sepolia.infura.io/v3/6587311a93fe4c34adcef72bd583ea46";
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const privateKey = process.env.METAMASK_PRIVATE_KEY;

    if (!privateKey) {
        console.error('METAMASK_PRIVATE_KEY not found in .env');
        process.exit(1);
    }

    const wallet = new ethers.Wallet(privateKey, provider);
    console.log(`Deploying from address: ${wallet.address}`);

    const balance = await provider.getBalance(wallet.address);
    console.log(`Balance: ${ethers.formatEther(balance)} ETH`);

    // Deploy
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    console.log('Deploying OrganLinkRegistry...');

    const contract = await factory.deploy();
    await contract.waitForDeployment();

    const address = await contract.getAddress();
    console.log(`\n✅ OrganLinkRegistry deployed to: ${address}`);
    console.log('\nPlease update your ORGANLINK_REGISTRY_ADDRESS in .env with this new address.');
}

main().catch(console.error);
