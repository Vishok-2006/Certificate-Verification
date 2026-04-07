import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, ExternalLink, FileDown, Loader2, QrCode, Search, ShieldAlert, UploadCloud } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { jsPDF } from 'jspdf';
import { useParams } from 'react-router-dom';
import { apiClient, buildExplorerTxUrl } from '../api/client';

const VerifyCertificate = () => {
  const { id } = useParams();
  const [mode, setMode] = useState('id');
  const [certificateId, setCertificateId] = useState(id || '');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const scannerMount = useRef(null);

  const verifyById = async (value) => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const response = await apiClient.get(`/api/certificates/verify/${value}`);
      setResult(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to verify certificate');
    } finally {
      setLoading(false);
    }
  };

  const verifyByFile = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const payload = new FormData();
      payload.append('file', file);
      const response = await apiClient.post('/api/certificates/verify-file', payload);
      setResult(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to verify uploaded file');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      setCertificateId(id);
      verifyById(id);
    }
  }, [id]);

  useEffect(() => {
    if (mode !== 'qr' || !scannerMount.current) {
      return undefined;
    }

    const scanner = new Html5QrcodeScanner(scannerMount.current.id, { fps: 10, qrbox: 220 }, false);
    scanner.render((decodedText) => {
      const match = decodedText.match(/\/verify\/([A-Za-z0-9-_]+)/);
      const parsedId = match?.[1] || decodedText.trim();
      setCertificateId(parsedId);
      setMode('id');
      scanner.clear().catch(() => {});
      verifyById(parsedId);
    }, () => {});

    return () => scanner.clear().catch(() => {});
  }, [mode]);

  const statusTone = useMemo(() => (result?.valid ? 'valid' : 'invalid'), [result]);

  const downloadReport = async () => {
    if (!result?.certificate?.certificateId) return;
    const report = await apiClient.get(`/api/certificates/${result.certificate.certificateId}/report`);
    const pdf = new jsPDF();
    pdf.setFontSize(18);
    pdf.text('Certificate Verification Report', 14, 20);
    pdf.setFontSize(11);
    const lines = [
      `Generated: ${new Date(report.data.generatedAt).toLocaleString()}`,
      `Certificate ID: ${result.certificate.certificateId}`,
      `Recipient: ${result.certificate.recipientName}`,
      `Course: ${result.certificate.course}`,
      `Status: ${result.status}`,
      `Chain: ${result.certificate.chain}`,
      `Transaction: ${result.certificate.txHash || 'N/A'}`,
    ];
    lines.forEach((line, index) => pdf.text(line, 14, 34 + index * 8));
    pdf.save(`${result.certificate.certificateId}-verification-report.pdf`);
  };

  return (
    <div className="shell py-10">
      <div className="panel-strong p-8">
        <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--muted)]">Public verification</p>
        <h1 className="mt-2 text-4xl font-bold">Verify certificate authenticity</h1>
        <p className="mt-3 max-w-2xl text-[color:var(--muted)]">Use a certificate ID, upload the original document, or scan its QR code to compare the proof against blockchain evidence.</p>

        <div className="mt-8 flex flex-wrap gap-3">
          {[
            ['id', 'Certificate ID'],
            ['file', 'File upload'],
            ['qr', 'QR scan'],
          ].map(([value, label]) => (
            <button key={value} type="button" onClick={() => setMode(value)} className={`rounded-full px-4 py-2 text-sm ${mode === value ? 'bg-[color:var(--accent)] text-[color:var(--accent-foreground)]' : 'btn-secondary'}`}>{label}</button>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="panel p-6">
            {mode === 'id' ? (
              <form onSubmit={(event) => { event.preventDefault(); verifyById(certificateId); }} className="space-y-4">
                <label className="block text-sm font-medium text-[color:var(--muted)]">Certificate ID</label>
                <div className="flex gap-3">
                  <input className="input-field" value={certificateId} onChange={(event) => setCertificateId(event.target.value)} placeholder="CERT-2026-ABC123" />
                  <button className="btn-primary" type="submit"><Search size={16} /> Verify</button>
                </div>
              </form>
            ) : null}

            {mode === 'file' ? (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-[color:var(--muted)]">Upload original certificate</label>
                <input type="file" accept="application/pdf,image/png,image/jpeg" className="input-field" onChange={(event) => setFile(event.target.files?.[0] || null)} />
                <button type="button" className="btn-primary" onClick={verifyByFile} disabled={!file || loading}><UploadCloud size={16} /> Verify file</button>
              </div>
            ) : null}

            {mode === 'qr' ? (
              <div>
                <div id="qr-reader" ref={scannerMount} className="overflow-hidden rounded-[24px]" />
                <p className="mt-3 text-sm text-[color:var(--muted)]">Grant camera permission, then point at the certificate QR code.</p>
              </div>
            ) : null}

            {loading ? <div className="mt-6 inline-flex items-center gap-2 text-sm text-[color:var(--muted)]"><Loader2 size={16} className="animate-spin" /> Checking proof...</div> : null}
            {error ? <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div> : null}
          </div>

          <div className="panel p-6">
            {result ? (
              <div>
                <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${statusTone === 'valid' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300' : 'bg-red-500/10 text-red-500'}`}>
                  {statusTone === 'valid' ? <CheckCircle2 size={14} /> : <ShieldAlert size={14} />} {result.status}
                </div>
                <h2 className="mt-4 text-3xl font-semibold">{result.certificate?.recipientName}</h2>
                <p className="mt-2 text-[color:var(--muted)]">{result.certificate?.course}</p>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <Info label="Certificate ID" value={result.certificate?.certificateId} mono />
                  <Info label="Recipient ID" value={result.certificate?.recipientIdentifier} mono />
                  <Info label="Issuer" value={result.certificate?.issuerName} />
                  <Info label="Institution" value={result.certificate?.institutionName} />
                  <Info label="Chain" value={result.certificate?.chain} />
                  <Info label="IPFS CID" value={result.certificate?.ipfsCid || 'Not attached'} mono />
                </div>
                <div className="mt-6 rounded-2xl border px-4 py-4" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">On-chain fingerprint</p>
                  <p className="mt-3 break-all font-mono text-sm">{result.certificate?.certificateHash}</p>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button type="button" onClick={downloadReport} className="btn-primary"><FileDown size={16} /> Download report</button>
                  {result.certificate?.txHash ? <button type="button" onClick={() => window.open(buildExplorerTxUrl(result.certificate.txHash, result.certificate.chain), '_blank')} className="btn-secondary"><ExternalLink size={16} /> Blockchain tx</button> : null}
                  {result.certificate?.qrCode ? <button type="button" className="btn-secondary" onClick={() => window.open(result.certificate.qrCode, '_blank')}><QrCode size={16} /> QR code</button> : null}
                </div>
              </div>
            ) : <div className="rounded-2xl border border-dashed px-4 py-10 text-center text-sm text-[color:var(--muted)]" style={{ borderColor: 'var(--border)' }}>Verification details will appear here after a successful lookup.</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

const Info = ({ label, value, mono = false }) => (
  <div className="rounded-2xl border px-4 py-4" style={{ borderColor: 'var(--border)' }}>
    <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">{label}</p>
    <p className={`mt-2 ${mono ? 'break-all font-mono text-sm' : 'font-medium'}`}>{value}</p>
  </div>
);

export default VerifyCertificate;
