import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, ArrowRightLeft, Ban, ExternalLink, FileCheck2, Plus, Search, ShieldCheck, Users, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient, buildExplorerTxUrl } from '../api/client';
import { useAuth } from '../context/AuthContext';

const defaultStats = { totalIssued: 0, totalRevoked: 0, totalVerifications: 0, recentCertificates: [], chainBreakdown: [], activeUsers: {}, auditTrail: [] };

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(defaultStats);
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [certificates, setCertificates] = useState([]);

  const isAdmin = user?.role === 'admin';

  const load = useCallback(async () => {
    const [statsResponse, certificatesResponse, usersResponse] = await Promise.all([
      apiClient.get('/api/certificates/stats'),
      apiClient.get('/api/certificates'),
      isAdmin ? apiClient.get('/api/users') : Promise.resolve({ data: [] }),
    ]);
    setStats({ ...defaultStats, ...statsResponse.data });
    setCertificates(certificatesResponse.data);
    setUsers(usersResponse.data);
  }, [isAdmin]);

  useEffect(() => {
    load().catch(console.error);
  }, [load]);

  const filteredCertificates = useMemo(() => certificates.filter((item) => {
    const term = query.toLowerCase();
    return !term || [item.certificateId, item.recipientName, item.course, item.recipientIdentifier].some((value) => String(value || '').toLowerCase().includes(term));
  }), [certificates, query]);

  const handleRevoke = async (certificateId) => {
    const reason = window.prompt('Revocation reason', 'Revoked by administrator');
    if (!reason) return;
    await apiClient.post(`/api/certificates/${certificateId}/revoke`, { reason });
    await load();
  };

  return (
    <div className="shell py-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--muted)]">{isAdmin ? 'Admin hub' : 'Issuer hub'}</p>
          <h1 className="mt-2 text-4xl font-bold">{isAdmin ? 'Govern credential operations' : 'Run issuance with confidence'}</h1>
          <p className="mt-3 max-w-2xl text-[color:var(--muted)]">Track issuance volume, verification demand, chain coverage, and audit activity from a single command surface.</p>
        </div>
        <Link to="/issue" className="btn-primary"><Plus size={16} /> Issue certificate</Link>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={<FileCheck2 size={18} />} label="Issued" value={stats.totalIssued} />
        <Kpi icon={<Ban size={18} />} label="Revoked" value={stats.totalRevoked} />
        <Kpi icon={<Activity size={18} />} label="Verifications" value={stats.totalVerifications} />
        <Kpi icon={<ArrowRightLeft size={18} />} label="Chains" value={stats.chainBreakdown.map((item) => item.chain).join(', ') || 'Not yet used'} />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="panel p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold">Certificate inventory</h2>
              <p className="mt-1 text-sm text-[color:var(--muted)]">Search, review, and revoke published credentials.</p>
            </div>
            <div className="relative w-full max-w-xs">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--muted)]" />
              <input className="input-field pl-11" placeholder="Search certificates" value={query} onChange={(event) => setQuery(event.target.value)} />
            </div>
          </div>
          <div className="mt-6 overflow-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-[color:var(--muted)]">
                <tr>
                  <th className="pb-3">ID</th>
                  <th className="pb-3">Recipient</th>
                  <th className="pb-3">Course</th>
                  <th className="pb-3">Chain</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCertificates.map((certificate) => (
                  <tr key={certificate.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                    <td className="py-4 font-mono">{certificate.certificateId}</td>
                    <td className="py-4">
                      <p className="font-medium">{certificate.recipientName}</p>
                      <p className="text-xs text-[color:var(--muted)]">{certificate.recipientIdentifier}</p>
                    </td>
                    <td className="py-4">{certificate.course}</td>
                    <td className="py-4 capitalize">{certificate.chain}</td>
                    <td className="py-4"><Status status={certificate.status} /></td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <Link to={`/certificates/${certificate.certificateId}`} className="btn-secondary px-3 py-2">Details</Link>
                        {certificate.txHash ? <button type="button" onClick={() => window.open(buildExplorerTxUrl(certificate.txHash, certificate.chain), '_blank')} className="btn-secondary px-3 py-2"><ExternalLink size={14} /></button> : null}
                        {isAdmin && certificate.status !== 'revoked' ? <button type="button" onClick={() => handleRevoke(certificate.certificateId)} className="btn-secondary px-3 py-2 text-red-400">Revoke</button> : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="panel p-6">
            <div className="flex items-center gap-3"><Wallet size={18} className="text-[color:var(--accent)]" /><h2 className="text-2xl font-semibold">Chain breakdown</h2></div>
            <div className="mt-6 space-y-3">
              {stats.chainBreakdown.length ? stats.chainBreakdown.map((item) => (
                <div key={item.chain} className="flex items-center justify-between rounded-2xl border px-4 py-3" style={{ borderColor: 'var(--border)' }}>
                  <span className="capitalize">{item.chain}</span><span className="font-semibold">{item.count}</span>
                </div>
              )) : <Empty text="Issue certificates to populate chain analytics." />}
            </div>
          </div>

          {isAdmin ? (
            <div className="panel p-6">
              <div className="flex items-center gap-3"><Users size={18} className="text-[color:var(--accent)]" /><h2 className="text-2xl font-semibold">User directory</h2></div>
              <div className="mt-6 space-y-3">
                {users.slice(0, 6).map((account) => (
                  <div key={account.id} className="rounded-2xl border px-4 py-4" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{account.name}</p>
                        <p className="text-xs text-[color:var(--muted)]">{account.email}</p>
                      </div>
                      <span className="status-pill bg-[color:var(--accent)]/10 text-[color:var(--accent)] capitalize">{account.role}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="panel p-6">
            <div className="flex items-center gap-3"><ShieldCheck size={18} className="text-[color:var(--accent)]" /><h2 className="text-2xl font-semibold">Audit pulse</h2></div>
            <div className="mt-6 space-y-3">
              {stats.auditTrail.length ? stats.auditTrail.slice(0, 6).map((event) => (
                <div key={event.id} className="rounded-2xl border px-4 py-3" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-sm font-medium">{event.action.replaceAll('_', ' ')}</p>
                  <p className="mt-1 text-xs text-[color:var(--muted)]">{new Date(event.createdAt).toLocaleString()}</p>
                </div>
              )) : <Empty text="Audit events will appear as users issue and verify records." />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Kpi = ({ icon, label, value }) => <div className="kpi"><div className="flex items-center justify-between"><span className="text-[color:var(--muted)]">{label}</span>{icon}</div><p className="mt-4 text-3xl font-semibold">{value}</p></div>;
const Status = ({ status }) => <span className={`status-pill ${status === 'revoked' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-300' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'}`}>{status}</span>;
const Empty = ({ text }) => <div className="rounded-2xl border border-dashed px-4 py-5 text-sm text-[color:var(--muted)]" style={{ borderColor: 'var(--border)' }}>{text}</div>;

export default AdminDashboard;
