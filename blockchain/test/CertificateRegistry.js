import { expect } from 'chai';
import hardhat from 'hardhat';

const { ethers } = hardhat;

describe('CertificateRegistry', function () {
  async function deployRegistry() {
    const [owner, issuer, outsider] = await ethers.getSigners();
    const CertificateRegistry = await ethers.getContractFactory('CertificateRegistry');
    const registry = await CertificateRegistry.deploy();
    await registry.waitForDeployment();
    await registry.setIssuer(issuer.address, true);
    return { registry, owner, issuer, outsider };
  }

  it('issues and verifies a certificate by hash', async function () {
    const { registry, issuer } = await deployRegistry();
    const certificateId = 'CERT-2026-001';
    const certificateHash = ethers.id('sample-certificate');

    await registry.connect(issuer).issueCertificate(certificateHash, certificateId, 'ipfs://cid', 'digest-1');

    const result = await registry.verifyCertificate(certificateHash);
    expect(result.exists).to.equal(true);
    expect(result.revoked).to.equal(false);
    expect(result.certificateId).to.equal(certificateId);
    expect(result.metadataURI).to.equal('ipfs://cid');
  });

  it('gets certificate by ID and supports revocation', async function () {
    const { registry, issuer } = await deployRegistry();
    const certificateId = 'CERT-2026-002';
    const certificateHash = ethers.id('another-certificate');

    await registry.connect(issuer).issueCertificate(certificateHash, certificateId, 'ipfs://cid-2', 'digest-2');
    await registry.revokeCertificate(certificateHash, 'fraud');

    const result = await registry.getCertificateById(certificateId);
    expect(result.exists).to.equal(true);
    expect(result.revoked).to.equal(true);
    expect(result.certificateHash).to.equal(certificateHash);
  });

  it('rejects issuance by non-authorized wallet', async function () {
    const { registry, outsider } = await deployRegistry();
    await expect(
      registry.connect(outsider).issueCertificate(ethers.id('unauthorized'), 'CERT-2026-003', 'ipfs://cid-3', 'digest-3')
    ).to.be.revertedWith('Issuer is not authorized');
  });
});
