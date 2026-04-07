import React, { useMemo, useState } from 'react';
import { CheckCircle2, FileUp, Loader2, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';

const emptyForm = { certificateId: '', recipientName: '', recipientIdentifier: '', recipientEmail: '', course: '', institutionName: '', chain: 'sepolia' };

const IssueCertificate = () => {
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  const preview = useMemo(() => ({
    recipientName: form.recipientName || 'Ada Lovelace',
    course: form.course || 'Advanced Distributed Systems',
    certificateId: form.certificateId || 'Auto-generated',
    chain: form.chain,
  }), [form]);

  const connectWallet = async () => {
    if (!window.ethereum) {
      window.alert('MetaMask is not available in this browser.');
      return;
    }
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    setWalletAddress(accounts[0] || '');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => value && payload.append(key, value));
      if (file) payload.append('file', file);
      const response = await apiClient.post('/api/certificates/issue', payload);
      setResult(response.data);
      setTimeout(() => navigate(`/certificates/${response.data.certificateId}`), 1200);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Certificate issuance failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shell py-10">
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="panel-strong p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--muted)]">Credential issuance</p>
              <h1 className="mt-2 text-4xl font-bold">Mint a new certificate</h1>
            </div>
            <button type="button" onClick={connectWallet} className="btn-secondary"><Wallet size={16} /> {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Connect wallet'}</button>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
            <GridField label="Certificate ID (optional)"><input className="input-field" value={form.certificateId} onChange={(event) => setForm({ ...form, certificateId: event.target.value })} placeholder="Auto-generated if empty" /></GridField>
            <GridField label="Recipient name"><input className="input-field" required value={form.recipientName} onChange={(event) => setForm({ ...form, recipientName: event.target.value })} /></GridField>
            <GridField label="Recipient identifier"><input className="input-field" required value={form.recipientIdentifier} onChange={(event) => setForm({ ...form, recipientIdentifier: event.target.value })} placeholder="Student / employee ID" /></GridField>
            <GridField label="Recipient email"><input type="email" className="input-field" value={form.recipientEmail} onChange={(event) => setForm({ ...form, recipientEmail: event.target.value })} /></GridField>
            <GridField label="Course / program"><input className="input-field" required value={form.course} onChange={(event) => setForm({ ...form, course: event.target.value })} /></GridField>
            <GridField label="Institution"><input className="input-field" value={form.institutionName} onChange={(event) => setForm({ ...form, institutionName: event.target.value })} placeholder={user?.institutionName || 'Optional override'} /></GridField>
            <GridField label="Chain"><select className="input-field" value={form.chain} onChange={(event) => setForm({ ...form, chain: event.target.value })}><option value="sepolia">Ethereum Sepolia</option><option value="polygon-amoy">Polygon Amoy</option></select></GridField>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[color:var(--muted)]">Certificate file</span>
              <div className="rounded-[24px] border border-dashed p-6 text-center" style={{ borderColor: 'var(--border)' }}>
                <input type="file" accept="application/pdf,image/png,image/jpeg" onChange={(event) => setFile(event.target.files?.[0] || null)} className="input-field" />
                <p className="mt-3 text-sm text-[color:var(--muted)]">Upload PDF, PNG, or JPEG. The file is pinned to IPFS and only its fingerprint goes on-chain.</p>
              </div>
            </label>
            {error ? <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div> : null}
            {result ? <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-500"><CheckCircle2 className="mr-2 inline-block" size={16} /> Certificate issued successfully.</div> : null}
            <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? <><Loader2 size={16} className="animate-spin" /> Processing...</> : <><FileUp size={16} /> Issue certificate</>}</button>
          </form>
        </div>

        <div className="panel p-8">
          <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--muted)]">Live preview</p>
          <div className="mt-5 rounded-[30px] border p-7" style={{ borderColor: 'var(--border)', background: 'linear-gradient(135deg, rgba(20,184,166,0.16), transparent 50%)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--muted)]">Blockchain certificate</p>
                <h2 className="mt-2 text-2xl font-semibold">Certificate of Achievement</h2>
              </div>
              <span className="status-pill bg-[color:var(--accent)]/10 text-[color:var(--accent)] capitalize">{preview.chain}</span>
            </div>
            <div className="mt-8 space-y-4">
              <PreviewRow label="Recipient" value={preview.recipientName} />
              <PreviewRow label="Program" value={preview.course} />
              <PreviewRow label="Certificate ID" value={preview.certificateId} />
            </div>
            <div className="mt-8 rounded-2xl border px-4 py-4 text-sm text-[color:var(--muted)]" style={{ borderColor: 'var(--border)' }}>
              Uploading a certificate file adds IPFS-backed evidence and improves fraud review heuristics.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const GridField = ({ label, children }) => <label className="block"><span className="mb-2 block text-sm font-medium text-[color:var(--muted)]">{label}</span>{children}</label>;
const PreviewRow = ({ label, value }) => <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border)' }}><span className="text-xs uppercase tracking-[0.25em] text-[color:var(--muted)]">{label}</span><span className="font-medium">{value}</span></div>;

export default IssueCertificate;
