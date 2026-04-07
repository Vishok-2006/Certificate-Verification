import React, { useEffect, useState } from 'react';
import { ExternalLink, QrCode } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { apiClient, buildExplorerTxUrl, buildFileUrl } from '../api/client';

const CertificateDetails = () => {
  const { id } = useParams();
  const [certificate, setCertificate] = useState(null);

  useEffect(() => {
    apiClient.get(`/api/certificates/verify/${id}`).then((response) => setCertificate(response.data.certificate)).catch(console.error);
  }, [id]);

  if (!certificate) {
    return <div className="shell py-12 text-sm text-[color:var(--muted)]">Loading certificate details...</div>;
  }

  return (
    <div className="shell py-10">
      <div className="panel-strong p-8">
        <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--muted)]">Certificate details</p>
        <h1 className="mt-2 text-4xl font-bold">{certificate.recipientName}</h1>
        <p className="mt-2 text-[color:var(--muted)]">{certificate.course}</p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Detail label="Certificate ID" value={certificate.certificateId} mono />
          <Detail label="Recipient ID" value={certificate.recipientIdentifier} mono />
          <Detail label="Institution" value={certificate.institutionName} />
          <Detail label="Issuer" value={certificate.issuerName} />
          <Detail label="Chain" value={certificate.chain} />
          <Detail label="Verification count" value={certificate.verificationCount} />
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {certificate.fileUrl ? <button type="button" onClick={() => window.open(buildFileUrl(certificate.fileUrl), '_blank')} className="btn-secondary">Open uploaded file</button> : null}
          {certificate.txHash ? <button type="button" onClick={() => window.open(buildExplorerTxUrl(certificate.txHash, certificate.chain), '_blank')} className="btn-primary"><ExternalLink size={16} /> View transaction</button> : null}
          {certificate.qrCode ? <button type="button" onClick={() => window.open(certificate.qrCode, '_blank')} className="btn-secondary"><QrCode size={16} /> View QR</button> : null}
        </div>
      </div>
    </div>
  );
};

const Detail = ({ label, value, mono = false }) => <div className="rounded-2xl border px-4 py-4" style={{ borderColor: 'var(--border)' }}><p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">{label}</p><p className={`mt-2 ${mono ? 'break-all font-mono text-sm' : 'font-medium'}`}>{value}</p></div>;

export default CertificateDetails;
