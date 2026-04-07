const { ethers } = require('ethers');
const { env } = require('../config/env');
const { createHttpError } = require('../utils/httpError');

const contractJson = {
  abi: [
    'function issueCertificate(bytes32 certificateHash,string certificateId,string metadataURI,string metadataDigest) returns (bool)',
    'function verifyCertificate(bytes32 certificateHash) view returns (bool exists,bool revoked,string certificateId,string metadataURI,string metadataDigest,address issuer,uint256 issuedAt,uint256 revokedAt)',
    'function getCertificateById(string certificateId) view returns (bool exists,bool revoked,bytes32 certificateHash,string metadataURI,string metadataDigest,address issuer,uint256 issuedAt,uint256 revokedAt)',
    'function revokeCertificate(bytes32 certificateHash,string reason) returns (bool)',
  ],
};

const getExplorerBaseUrl = (chain) => (chain === 'polygon-amoy' ? env.polygonExplorerBaseUrl : env.explorerBaseUrl);
const getContractAddress = (chain) => (chain === 'polygon-amoy' ? env.polygonContractAddress || env.contractAddress : env.contractAddress);

const getProvider = () => {
  if (!env.rpcUrl) {
    throw createHttpError(500, 'RPC_URL is not configured');
  }

  return new ethers.JsonRpcProvider(env.rpcUrl);
};

const getContract = (chain, writable = false) => {
  const contractAddress = getContractAddress(chain);
  if (!contractAddress) {
    throw createHttpError(500, `Contract address is not configured for ${chain}`);
  }

  const provider = getProvider();
  if (!writable) {
    return new ethers.Contract(contractAddress, contractJson.abi, provider);
  }

  if (!env.privateKey) {
    throw createHttpError(500, 'PRIVATE_KEY is not configured');
  }

  const wallet = new ethers.Wallet(env.privateKey, provider);
  return new ethers.Contract(contractAddress, contractJson.abi, wallet);
};

const normalizeByHashResult = (result) => ({
  exists: result[0],
  revoked: result[1],
  certificateId: result[2],
  metadataURI: result[3],
  metadataDigest: result[4],
  issuer: result[5],
  issuedAt: Number(result[6]),
  revokedAt: Number(result[7]),
});

const normalizeByIdResult = (result) => ({
  exists: result[0],
  revoked: result[1],
  certificateHash: result[2],
  metadataURI: result[3],
  metadataDigest: result[4],
  issuer: result[5],
  issuedAt: Number(result[6]),
  revokedAt: Number(result[7]),
});

const issueCertificateOnChain = async ({ chain, certificateHash, certificateId, metadataURI, metadataDigest }) => {
  const contract = getContract(chain, true);
  const tx = await contract.issueCertificate(certificateHash, certificateId, metadataURI, metadataDigest);
  await tx.wait();
  return { hash: tx.hash, contractAddress: getContractAddress(chain), explorerUrl: `${getExplorerBaseUrl(chain)}/tx/${tx.hash}` };
};

const verifyCertificateOnChain = async ({ chain, certificateHash }) => {
  const contract = getContract(chain);
  return normalizeByHashResult(await contract.verifyCertificate(certificateHash));
};

const fetchCertificateByIdOnChain = async ({ chain, certificateId }) => {
  const contract = getContract(chain);
  return normalizeByIdResult(await contract.getCertificateById(certificateId));
};

const revokeCertificateOnChain = async ({ chain, certificateHash, reason }) => {
  const contract = getContract(chain, true);
  const tx = await contract.revokeCertificate(certificateHash, reason);
  await tx.wait();
  return { hash: tx.hash, contractAddress: getContractAddress(chain), explorerUrl: `${getExplorerBaseUrl(chain)}/tx/${tx.hash}` };
};

module.exports = {
  fetchCertificateByIdOnChain,
  getExplorerBaseUrl,
  issueCertificateOnChain,
  revokeCertificateOnChain,
  verifyCertificateOnChain,
};
