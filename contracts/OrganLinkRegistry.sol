// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/*
 OrganLink Final-Year Project – Transparent Registration Contract (Enhanced)
 --------------------------------------------------------------------------
 🔹 Purpose:
   - Enables transparent registration for both Signature-based and Aadhaar-based verifications.
   - Each verification entry links an off-chain document (on IPFS) with hashed identity info.
   - Only admin (hospital / authorized verifier) can add verified records.

 🔹 What's New:
   - verificationType ("signature" or "aadhaar")
   - ocrVerified (true if OCR name matched during Aadhaar check)
   - Backward compatibility with previous records maintained.

 🔹 Data Stored (on-chain):
   - Patient/Donor hash (bytes32)
   - Verification type
   - OCR verification flag (for Aadhaar)
   - IPFS CID (document uploaded to Pinata)
   - Hospital/Org name
   - Timestamp

 🔹 Data Off-chain:
   - Actual document (signature or Aadhaar image)
   - Full identity details (for privacy & gas optimization)
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
