// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title OrgPolicyVoting
 * @dev Governance contract for OrganLink organizations to propose and vote on allocation policies.
 *      Policies with >50% approval become active and influence the AI matching engine.
 */
contract OrgPolicyVoting {
    // Admin address (deployer/system controller)
    address public admin;

    // Organization Structure
    struct Organization {
        string name;
        address orgAddress;
        bool isRegistered;
    }

    // Policy Structure
    struct Policy {
        uint256 id;
        string title;
        string description;
        address proposer;
        uint256 yesVotes;
        uint256 noVotes;
        bool isActive;   // Currently being voted on
        bool isApproved; // Passed (>50% votes)
        bool isWithdrawn;
        bool isSuspended;
    }

    // State Variables
    uint256 public orgCount;
    uint256 public policyCount;

    // Mappings
    mapping(address => Organization) public organizations;
    mapping(uint256 => Policy) public policies;
    // policyId => (voterAddress => hasVoted)
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    // Events
    event OrganizationAdded(address indexed orgAddress, string name);
    event PolicyProposed(uint256 indexed policyId, string title, address proposer);
    event Voted(uint256 indexed policyId, address voter, bool vote);
    event PolicyApproved(uint256 indexed policyId, string title);
    
    // Modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier onlyOrganization() {
        require(organizations[msg.sender].isRegistered, "Only registered organizations can perform this action");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    /**
     * @dev Add a new organization to the system (Admin only)
     * @param _orgAddress Wallet address of the organization
     * @param _name Name of the organization
     */
    function addOrganization(address _orgAddress, string memory _name) external onlyAdmin {
        require(_orgAddress != address(0), "Invalid address");
        require(!organizations[_orgAddress].isRegistered, "Organization already registered");

        organizations[_orgAddress] = Organization({
            name: _name,
            orgAddress: _orgAddress,
            isRegistered: true
        });

        orgCount++;
        emit OrganizationAdded(_orgAddress, _name);
    }

    /**
     * @dev Propose a new policy for voting
     * @param _title Short title of the policy
     * @param _description Detailed explanation of the policy changes
     */
    function proposePolicy(string memory _title, string memory _description) external onlyOrganization {
        policyCount++;
        
        policies[policyCount] = Policy({
            id: policyCount,
            title: _title,
            description: _description,
            proposer: msg.sender,
            yesVotes: 0,
            noVotes: 0,
            isActive: true,
            isApproved: false,
            isWithdrawn: false,
            isSuspended: false
        });

        emit PolicyProposed(policyCount, _title, msg.sender);
    }

    /**
     * @dev Vote on an active policy
     * @param _policyId ID of the policy
     * @param _vote True for YES, False for NO
     */
    function votePolicy(uint256 _policyId, bool _vote) external onlyOrganization {
        Policy storage policy = policies[_policyId];
        
        require(policy.isActive, "Policy is not active for voting");
        require(!hasVoted[_policyId][msg.sender], "You have already voted on this policy");

        hasVoted[_policyId][msg.sender] = true;

        if (_vote) {
            policy.yesVotes++;
        } else {
            policy.noVotes++;
        }

        emit Voted(_policyId, msg.sender, _vote);

        // Check if policy has passed (>50% of total organizations)
        // Note: Using a simple majority of total registered orgs
        if (policy.yesVotes * 2 > orgCount) {
            policy.isApproved = true;
            policy.isActive = false; // Voting closed
            emit PolicyApproved(_policyId, policy.title);
        }
    }

    /**
     * @dev Relayer function: Admin submits vote on behalf of an organization (Gasless user experience)
     * @param _policyId ID of the policy
     * @param _vote True for YES, False for NO
     * @param _voter The actual organization address voting
     */
    function relayVote(uint256 _policyId, bool _vote, address _voter) external onlyAdmin {
        Policy storage policy = policies[_policyId];
        
        require(policy.isActive, "Policy is not active for voting");
        require(organizations[_voter].isRegistered, "Voter is not a registered organization");
        require(!hasVoted[_policyId][_voter], "Organization has already voted on this policy");

        hasVoted[_policyId][_voter] = true;

        if (_vote) {
            policy.yesVotes++;
        } else {
            policy.noVotes++;
        }

        emit Voted(_policyId, _voter, _vote);

        // Check for threshold (Simple Majority > 50%)
        if (policy.yesVotes * 2 > orgCount) {
            policy.isApproved = true;
            policy.isActive = false;
            emit PolicyApproved(_policyId, policy.title);
        }
    }

    /**
     * @dev Get details of a specific policy
     * @param _policyId ID of the policy
     */
    function getPolicy(uint256 _policyId) external view returns (
        uint256 id,
        string memory title,
        string memory description,
        address proposer,
        uint256 yesVotes,
        uint256 noVotes,
        bool isActive,
        bool isApproved
    ) {
        Policy memory policy = policies[_policyId];
        return (
            policy.id,
            policy.title,
            policy.description,
            policy.proposer,
            policy.yesVotes,
            policy.noVotes,
            policy.isActive,
            policy.isApproved
        );
    }

    /**
     * @dev Get total number of policies proposed
     */
    function getTotalPolicies() external view returns (uint256) {
        return policyCount;
    }
}
