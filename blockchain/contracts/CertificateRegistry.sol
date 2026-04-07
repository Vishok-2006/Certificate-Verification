// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CertificateRegistry {
    address public owner;

    struct CertificateRecord {
        bool exists;
        bool revoked;
        bytes32 certificateHash;
        string certificateId;
        string metadataURI;
        string metadataDigest;
        address issuer;
        uint256 issuedAt;
        uint256 revokedAt;
    }

    mapping(address => bool) public authorizedIssuers;
    mapping(bytes32 => CertificateRecord) private recordsByHash;
    mapping(string => bytes32) private hashByCertificateId;

    event IssuerAuthorized(address indexed issuer, bool enabled);
    event CertificateIssued(bytes32 indexed certificateHash, string indexed certificateId, address indexed issuer, string metadataURI);
    event CertificateRevoked(bytes32 indexed certificateHash, string indexed certificateId, address indexed revokedBy, string reason);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    modifier onlyAuthorizedIssuer() {
        require(msg.sender == owner || authorizedIssuers[msg.sender], "Issuer is not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedIssuers[msg.sender] = true;
    }

    function setIssuer(address issuer, bool enabled) external onlyOwner {
        authorizedIssuers[issuer] = enabled;
        emit IssuerAuthorized(issuer, enabled);
    }

    function issueCertificate(
        bytes32 certificateHash,
        string calldata certificateId,
        string calldata metadataURI,
        string calldata metadataDigest
    ) external onlyAuthorizedIssuer returns (bool) {
        require(certificateHash != bytes32(0), "Certificate hash is required");
        require(bytes(certificateId).length > 0, "Certificate ID is required");
        require(!recordsByHash[certificateHash].exists, "Certificate hash already exists");
        require(hashByCertificateId[certificateId] == bytes32(0), "Certificate ID already exists");

        recordsByHash[certificateHash] = CertificateRecord({
            exists: true,
            revoked: false,
            certificateHash: certificateHash,
            certificateId: certificateId,
            metadataURI: metadataURI,
            metadataDigest: metadataDigest,
            issuer: msg.sender,
            issuedAt: block.timestamp,
            revokedAt: 0
        });
        hashByCertificateId[certificateId] = certificateHash;

        emit CertificateIssued(certificateHash, certificateId, msg.sender, metadataURI);
        return true;
    }

    function verifyCertificate(bytes32 certificateHash)
        external
        view
        returns (
            bool exists,
            bool revoked,
            string memory certificateId,
            string memory metadataURI,
            string memory metadataDigest,
            address issuer,
            uint256 issuedAt,
            uint256 revokedAt
        )
    {
        CertificateRecord memory record = recordsByHash[certificateHash];
        return (
            record.exists,
            record.revoked,
            record.certificateId,
            record.metadataURI,
            record.metadataDigest,
            record.issuer,
            record.issuedAt,
            record.revokedAt
        );
    }

    function getCertificateById(string calldata certificateId)
        external
        view
        returns (
            bool exists,
            bool revoked,
            bytes32 certificateHash,
            string memory metadataURI,
            string memory metadataDigest,
            address issuer,
            uint256 issuedAt,
            uint256 revokedAt
        )
    {
        bytes32 certificateHashValue = hashByCertificateId[certificateId];
        CertificateRecord memory record = recordsByHash[certificateHashValue];
        return (
            record.exists,
            record.revoked,
            record.certificateHash,
            record.metadataURI,
            record.metadataDigest,
            record.issuer,
            record.issuedAt,
            record.revokedAt
        );
    }

    function revokeCertificate(bytes32 certificateHash, string calldata reason) external onlyOwner returns (bool) {
        require(recordsByHash[certificateHash].exists, "Certificate does not exist");
        require(!recordsByHash[certificateHash].revoked, "Certificate already revoked");

        CertificateRecord storage record = recordsByHash[certificateHash];
        record.revoked = true;
        record.revokedAt = block.timestamp;

        emit CertificateRevoked(certificateHash, record.certificateId, msg.sender, reason);
        return true;
    }
}
