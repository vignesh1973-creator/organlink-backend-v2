import { ethers } from "ethers";
import { pool } from "../config/database";

// OrganPolicyManager_Lite contract ABI
const ORG_POLICY_VOTING_ABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "address", name: "orgAddress", type: "address" },
      { indexed: false, internalType: "string", name: "name", type: "string" }
    ],
    name: "OrganizationRegistered",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint256", name: "policyId", type: "uint256" },
      { indexed: false, internalType: "string", name: "title", type: "string" },
      { indexed: false, internalType: "address", name: "proposer", type: "address" }
    ],
    name: "PolicyProposed",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint256", name: "policyId", type: "uint256" },
      { indexed: false, internalType: "address", name: "voter", type: "address" },
      { indexed: false, internalType: "bool", name: "support", type: "bool" }
    ],
    name: "Voted",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint256", name: "policyId", type: "uint256" },
      { indexed: false, internalType: "bool", name: "approved", type: "bool" }
    ],
    name: "PolicyFinalized",
    type: "event"
  },
  {
    inputs: [
      { internalType: "address", name: "_orgAddress", type: "address" },
      { internalType: "string", name: "_name", type: "string" },
      { internalType: "string", name: "_orgType", type: "string" }
    ],
    name: "registerOrganization",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "string", name: "_title", type: "string" },
      { internalType: "string", name: "_organType", type: "string" },
      { internalType: "string", name: "_description", type: "string" },
      { internalType: "string", name: "_detailsJSON", type: "string" },
      { internalType: "uint256", name: "_votingDays", type: "uint256" }
    ],
    name: "proposePolicy",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "_policyId", type: "uint256" },
      { internalType: "bool", name: "_support", type: "bool" }
    ],
    name: "votePolicy",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "_policyId", type: "uint256" }],
    name: "finalizePolicy",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "_policyId", type: "uint256" }],
    name: "getPolicy",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "string", name: "", type: "string" },
      { internalType: "string", name: "", type: "string" },
      { internalType: "string", name: "", type: "string" },
      { internalType: "string", name: "", type: "string" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "bool", name: "", type: "bool" },
      { internalType: "bool", name: "", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "_policyId", type: "uint256" },
      { internalType: "address", name: "_voter", type: "address" }
    ],
    name: "hasVoted",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "admin",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "policyCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "organizations",
    outputs: [
      { internalType: "string", name: "name", type: "string" },
      { internalType: "string", name: "orgType", type: "string" },
      { internalType: "bool", name: "isRegistered", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  }
];

export class OrgPolicyVotingService {
  private provider: ethers.JsonRpcProvider;
  private adminWallet: ethers.Wallet;
  private contract: ethers.Contract;
  private contractAddress: string;

  // Map database org IDs to blockchain addresses
  private orgAddresses: Map<number, string> = new Map();

  constructor() {
    const rpcUrl = process.env.INFURA_API_URL || "https://sepolia.infura.io/v3/6587311a93fe4c34adcef72bd583ea46";
    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    const privateKey = process.env.METAMASK_PRIVATE_KEY || "";
    this.adminWallet = new ethers.Wallet(privateKey, this.provider);

    this.contractAddress = process.env.POLICY_CONTRACT_ADDRESS || "0x48c49012e7e2a4f3da63eb45dd8bea7a6819ec1b";

    this.contract = new ethers.Contract(
      this.contractAddress,
      ORG_POLICY_VOTING_ABI,
      this.adminWallet
    );

    console.log(`OrgPolicyVoting contract initialized at ${this.contractAddress}`);
    console.log(`Admin wallet: ${this.adminWallet.address}`);
  }

  // Generate deterministic address for an organization from its name
  private generateOrgAddress(orgName: string): string {
    const hash = ethers.keccak256(ethers.toUtf8Bytes(orgName));
    return ethers.getAddress("0x" + hash.substring(26)); // Take last 20 bytes as address
  }

  // Register organization on blockchain
  async registerOrganization(orgId: number, orgName: string): Promise<{ success: boolean; txHash?: string; orgAddress?: string; error?: string }> {
    try {
      // Generate or get organization address
      let orgAddress = this.orgAddresses.get(orgId);
      if (!orgAddress) {
        orgAddress = this.generateOrgAddress(orgName);
        this.orgAddresses.set(orgId, orgAddress);
      }

      // Check if already registered on blockchain
      try {
        const existingOrg = await this.contract.organizations(orgAddress);
        if (existingOrg && existingOrg.isRegistered) {
          console.log(`✅ Organization ${orgName} already registered (verified on-chain)`);
          return {
            success: true,
            txHash: "already_registered",
            orgAddress
          };
        }
      } catch (checkError) {
        console.warn("Failed to check organization status, proceeding to register:", checkError);
      }

      console.log(`Registering organization: ${orgName} with address ${orgAddress}`);

      // Try to register on blockchain
      // Manually set gas limit
      const tx = await this.contract.registerOrganization(orgAddress, orgName, "Policy Organization", { gasLimit: 1000000 });
      const receipt = await tx.wait();

      console.log(`✅ Organization registered: ${receipt.hash}`);

      return {
        success: true,
        txHash: receipt.hash,
        orgAddress
      };
    } catch (error: any) {
      // Fallback: If already registered (race condition or check failed), that's okay
      if (error.message?.includes('Already registered') ||
        error.message?.includes('already exists') ||
        error.message?.includes('execution reverted')) {
        console.log(`✅ Organization ${orgName} already registered (caught error)`);
        const orgAddress = this.generateOrgAddress(orgName);
        return {
          success: true,
          txHash: "already_registered",
          orgAddress
        };
      }

      console.error("Error registering organization:", error);
      return {
        success: false,
        error: error.message || "Failed to register organization"
      };
    }
  }

  // Propose a policy (called by organization)
  async proposePolicy(orgName: string, title: string, description: string, detailsJSON?: string, votingDays?: number): Promise<{ success: boolean; policyId?: number; txHash?: string; error?: string }> {
    try {
      // Check Admin Balance
      const balance = await this.provider.getBalance(this.adminWallet.address);
      console.log(`Admin Wallet Balance: ${ethers.formatEther(balance)} ETH`);

      // Ensure admin is registered as an organization first
      try {
        const adminAddress = this.adminWallet.address;
        const orgCheck = await this.contract.organizations(adminAddress);
        console.log(`Admin registration check: ${orgCheck.isRegistered}`);

        if (!orgCheck.isRegistered) {
          console.log(`Registering admin wallet as organization...`);
          // Manually set gas limit to avoid estimation errors
          const regTx = await this.contract.registerOrganization(adminAddress, "Admin Organization", "System", { gasLimit: 1000000 });
          const regReceipt = await regTx.wait();
          console.log(`✅ Admin registered as organization (Block: ${regReceipt.blockNumber})`);
        }
      } catch (e: any) {
        console.warn(`Admin registration check/setup failed: ${e.message}`);
        // We continue, but if admin isn't registered, proposePolicy will likely fail
      }

      console.log(`Proposing policy "${title}" from admin wallet`);

      // Prepare details JSON
      const details = detailsJSON || JSON.stringify({});
      const days = votingDays || 7;

      // Call contract with admin wallet
      // Manually set gas limit to avoid estimation errors if the node is strict
      // Increased to 5,000,000 to prevent Out of Gas errors with large IPFS strings
      const tx = await this.contract.proposePolicy(title, "Kidney", description, details, days, { gasLimit: 5000000 });
      const receipt = await tx.wait();

      // Extract policy ID from event
      let policyId;
      for (const log of receipt.logs) {
        try {
          const parsed = this.contract.interface.parseLog({
            topics: [...log.topics],
            data: log.data
          });

          if (parsed && parsed.name === "PolicyProposed") {
            policyId = Number(parsed.args.policyId);
            console.log(`✅ Policy proposed with ID: ${policyId}`);
            break;
          }
        } catch (e) {
          continue;
        }
      }

      // If no policy ID from events, query contract
      if (!policyId) {
        policyId = Number(await this.contract.getTotalPolicies());
      }

      // Log to database
      try {
        const gasUsed = receipt.gasUsed ? Number(receipt.gasUsed) : 0;
        const gasPrice = receipt.gasPrice ? Number(receipt.gasPrice) : 0;
        const gasFee = ethers.formatEther(BigInt(gasUsed) * BigInt(gasPrice));

        await pool.query(
          `INSERT INTO blockchain_events (event_type, transaction_hash, block_number, gas_used, gas_fee, status)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            'PolicyProposed',
            receipt.hash,
            receipt.blockNumber,
            gasUsed,
            Number(gasFee),
            'confirmed'
          ]
        );
      } catch (dbError) {
        console.error('Failed to log event to database:', dbError);
      }

      return {
        success: true,
        policyId,
        txHash: receipt.hash
      };
    } catch (error: any) {
      console.error("Error proposing policy:", error);
      return {
        success: false,
        error: error.message || "Failed to propose policy"
      };
    }
  }

  // Vote on a policy
  async voteOnPolicy(orgName: string, policyId: number, vote: boolean): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      console.log(`Voting on policy ${policyId}: ${vote ? "YES" : "NO"} from ${orgName}`);

      const tx = await this.contract.votePolicy(policyId, vote);
      const receipt = await tx.wait();

      console.log(`✅ Vote submitted: ${receipt.hash}`);

      // Log to database
      try {
        const gasUsed = receipt.gasUsed ? Number(receipt.gasUsed) : 0;
        const gasPrice = receipt.gasPrice ? Number(receipt.gasPrice) : 0;
        const gasFee = ethers.formatEther(BigInt(gasUsed) * BigInt(gasPrice));

        await pool.query(
          `INSERT INTO blockchain_events (event_type, transaction_hash, block_number, gas_used, gas_fee, status)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            'Voted',
            receipt.hash,
            receipt.blockNumber,
            gasUsed,
            Number(gasFee),
            'confirmed'
          ]
        );
      } catch (dbError) {
        console.error('Failed to log event to database:', dbError);
      }

      return {
        success: true,
        txHash: receipt.hash
      };
    } catch (error: any) {
      console.error("Error voting:", error);
      return {
        success: false,
        error: error.message || "Failed to vote"
      };
    }
  }

  // Get policy details
  async getPolicy(policyId: number): Promise<any> {
    try {
      const policy = await this.contract.getPolicy(policyId);
      // policy returns: id, title, organType, description, details, yesVotes, noVotes, finalized, approved

      return {
        success: true,
        policy: {
          id: Number(policy[0]),
          title: policy[1],
          organType: policy[2],
          description: policy[3],
          details: policy[4],
          yesVotes: Number(policy[5]),
          noVotes: Number(policy[6]),
          isActive: !policy[7], // finalized = true means not active
          isApproved: policy[8],
          totalVotes: Number(policy[5]) + Number(policy[6])
        }
      };
    } catch (error: any) {
      console.error("Error getting policy:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get all policies
  async getAllPolicies(): Promise<any> {
    try {
      const totalPolicies = await this.contract.getTotalPolicies();
      const policies = [];

      for (let i = 1; i <= Number(totalPolicies); i++) {
        const policyResult = await this.getPolicy(i);
        if (policyResult.success) {
          policies.push(policyResult.policy);
        }
      }

      return {
        success: true,
        policies,
        totalCount: Number(totalPolicies)
      };
    } catch (error: any) {
      console.error("Error getting all policies:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get approved policies
  async getApprovedPolicies(): Promise<any> {
    try {
      const allPoliciesResult = await this.getAllPolicies();
      if (!allPoliciesResult.success) return allPoliciesResult;

      const approvedPolicies = allPoliciesResult.policies.filter((p: any) => p.isApproved);

      return {
        success: true,
        approvedPolicies,
        count: approvedPolicies.length
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Check if a policy is active
  async isPolicyActive(policyTitle: string): Promise<boolean> {
    try {
      const allPoliciesResult = await this.getAllPolicies();
      if (!allPoliciesResult.success) return false;

      const policy = allPoliciesResult.policies.find((p: any) =>
        p.title.toLowerCase().includes(policyTitle.toLowerCase()) && p.isApproved
      );

      return !!policy;
    } catch (error) {
      console.error("Error checking policy active:", error);
      return false;
    }
  }
}

export const orgPolicyVotingService = new OrgPolicyVotingService();
