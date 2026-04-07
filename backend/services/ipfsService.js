const fs = require('fs');
const path = require('path');
const { env } = require('../config/env');
const { sha256Hex } = require('./cryptoService');

const localIpfsDir = path.join(__dirname, '..', 'uploads', 'ipfs-cache');
fs.mkdirSync(localIpfsDir, { recursive: true });

const uploadFileToIpfs = async ({ filePath, fileName, contentType }) => {
  const buffer = fs.readFileSync(filePath);
  const fallbackCid = sha256Hex(buffer).slice(0, 46);

  if (env.pinataJwt) {
    const formData = new FormData();
    formData.append('file', new Blob([buffer], { type: contentType || 'application/octet-stream' }), fileName);
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.pinataJwt}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Unable to upload certificate to Pinata');
    }

    const payload = await response.json();
    return {
      cid: payload.IpfsHash,
      url: `${env.pinataGateway.replace(/\/$/, '')}/${payload.IpfsHash}`,
      provider: 'pinata',
    };
  }

  const fallbackPath = path.join(localIpfsDir, `${fallbackCid}-${fileName}`);
  fs.copyFileSync(filePath, fallbackPath);
  return {
    cid: fallbackCid,
    url: `${env.appUrl.replace(/\/$/, '')}/uploads/ipfs-cache/${path.basename(fallbackPath)}`,
    provider: 'local-cache',
  };
};

module.exports = { uploadFileToIpfs };
