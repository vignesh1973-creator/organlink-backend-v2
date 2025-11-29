import fs from 'fs';
import path from 'path';
import solc from 'solc';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const CONTRACT_SOURCE = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract OrganPolicyManager_Lite {
    struct Organization {
        string name;
        string orgType;
        bool isRegistered;
    }

    struct Policy {
        uint id;
        string title;
        string organType;
        string description;
        string details; // JSON string containing all other fields
        uint votingDeadline;
        uint yesVotes;
        uint noVotes;
        bool finalized;
        bool approved;
        mapping(address => bool) hasVoted;
    }

    address public admin;
    uint public policyCount;
    mapping(address => Organization) public organizations;
    mapping(uint => Policy) public policies;
    address[] public orgAddresses;

    event OrganizationRegistered(address orgAddress, string name);
    event PolicyProposed(uint policyId, string title, address proposer);
    event Voted(uint policyId, address voter, bool support);
    event PolicyFinalized(uint policyId, bool approved);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    modifier onlyRegisteredOrg() {
        require(organizations[msg.sender].isRegistered, "Not registered org");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function registerOrganization(address _orgAddress, string memory _name, string memory _orgType)
        external
        onlyAdmin
    {
        require(!organizations[_orgAddress].isRegistered, "Already registered");
        organizations[_orgAddress] = Organization(_name, _orgType, true);
        orgAddresses.push(_orgAddress);
        emit OrganizationRegistered(_orgAddress, _name);
    }

    function proposePolicy(
        string memory _title,
        string memory _organType,
        string memory _description,
        string memory _detailsJSON, // all other fields merged into JSON
        uint _votingDays
    ) external onlyRegisteredOrg {
        policyCount++;
        Policy storage p = policies[policyCount];
        p.id = policyCount;
        p.title = _title;
        p.organType = _organType;
        p.description = _description;
        p.details = _detailsJSON;
        p.votingDeadline = block.timestamp + (_votingDays * 1 days);
        emit PolicyProposed(policyCount, _title, msg.sender);
    }

    function votePolicy(uint _policyId, bool _support) external onlyRegisteredOrg {
        Policy storage p = policies[_policyId];
        require(!p.finalized, "Finalized");
        require(block.timestamp <= p.votingDeadline, "Voting ended");
        require(!p.hasVoted[msg.sender], "Already voted");

        if (_support) p.yesVotes++;
        else p.noVotes++;

        p.hasVoted[msg.sender] = true;
        emit Voted(_policyId, msg.sender, _support);

        if ((p.yesVotes + p.noVotes) == orgAddresses.length) {
            finalizePolicy(_policyId);
        }
    }

    function finalizePolicy(uint _policyId) public {
        Policy storage p = policies[_policyId];
        require(!p.finalized, "Already finalized");
        require(
            block.timestamp > p.votingDeadline || (p.yesVotes + p.noVotes) == orgAddresses.length,
            "Voting not complete"
        );

        uint totalVotes = p.yesVotes + p.noVotes;
        if (totalVotes > 0 && (p.yesVotes * 100) / totalVotes >= 50) {
            p.approved = true;
        }
        p.finalized = true;
        emit PolicyFinalized(_policyId, p.approved);
    }

    function getPolicy(uint _policyId)
        external
        view
        returns (
            uint,
            string memory,
            string memory,
            string memory,
            string memory,
            uint,
            uint,
            bool,
            bool
        )
    {
        Policy storage p = policies[_policyId];
        return (
            p.id,
            p.title,
            p.organType,
            p.description,
            p.details,
            p.yesVotes,
            p.noVotes,
            p.finalized,
            p.approved
        );
    }

    function hasVoted(uint _policyId, address _voter) external view returns (bool) {
        return policies[_policyId].hasVoted[_voter];
    }
}
`;

async function main() {
    console.log('Compiling contract...');

    const input = {
        language: 'Solidity',
        sources: {
            'OrganPolicyManager_Lite.sol': {
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

    const contractFile = output.contracts['OrganPolicyManager_Lite.sol']['OrganPolicyManager_Lite'];
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
    console.log('Deploying contract...');

    const contract = await factory.deploy();
    await contract.waitForDeployment();

    const address = await contract.getAddress();
    console.log(`\n✅ Contract deployed to: ${address}`);
    console.log('\nPlease update your POLICY_CONTRACT_ADDRESS in .env with this new address.');
}

main().catch(console.error);
