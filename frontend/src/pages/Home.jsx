import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, BadgeCheck, Building2, FileLock2, Globe2, QrCode, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const features = [
  { icon: FileLock2, title: 'On-chain proof', text: 'Only the SHA-256 fingerprint is anchored on Ethereum or Polygon, keeping certificates tamper-proof and lightweight.' },
  { icon: QrCode, title: 'Instant verification', text: 'Employers can validate by ID, QR scan, or certificate upload without needing a privileged account.' },
  { icon: Building2, title: 'Issuer workspace', text: 'Institutions manage issuers, batch workflows, revocation, analytics, and audit trails from one console.' },
];

const Home = () => {
  return (
    <div className="pb-24">
      <section className="shell grid gap-10 pb-16 pt-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm text-[color:var(--muted)]" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <Shield size={16} /> Production-ready credential verification
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mt-6 max-w-3xl text-5xl font-bold leading-tight md:text-6xl">
            Issue certificates once. Prove trust forever.
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="mt-6 max-w-2xl text-lg text-[color:var(--muted)]">
            CertiBlock combines secure storage, IPFS-backed documents, blockchain notarization, and a modern verification portal so institutions can publish credentials with zero ambiguity.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }} className="mt-8 flex flex-wrap gap-4">
            <Link to="/login" className="btn-primary">Open Dashboard <ArrowRight size={16} /></Link>
            <Link to="/verify" className="btn-secondary">Public Verification</Link>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="panel-strong overflow-hidden p-8">
          <div className="rounded-[28px] bg-[linear-gradient(145deg,rgba(20,184,166,0.18),transparent_35%),linear-gradient(180deg,rgba(15,23,42,0.08),rgba(15,23,42,0.02))] p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--muted)]">Trust Snapshot</p>
                <h2 className="mt-2 text-2xl font-semibold">Credential lifecycle</h2>
              </div>
              <span className="status-pill bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"><BadgeCheck size={14} /> Live</span>
            </div>
            <div className="mt-8 space-y-4">
              {[
                ['1', 'Upload signed PDF or image'],
                ['2', 'Push evidence to IPFS'],
                ['3', 'Anchor fingerprint on-chain'],
                ['4', 'Verify instantly from anywhere'],
              ].map(([index, label]) => (
                <div key={index} className="flex items-center gap-4 rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--accent)] text-[color:var(--accent-foreground)]">{index}</div>
                  <p className="font-medium">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      <section className="shell grid gap-6 md:grid-cols-3">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.div key={feature.title} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * index }} className="panel p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--accent)]/10 text-[color:var(--accent)]"><Icon size={22} /></div>
              <h3 className="mt-5 text-xl font-semibold">{feature.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">{feature.text}</p>
            </motion.div>
          );
        })}
      </section>

      <section className="shell mt-12 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="panel p-8">
          <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--muted)]">Use Cases</p>
          <h3 className="mt-3 text-3xl font-semibold">Built for institutions, recruiters, and compliance teams</h3>
          <div className="mt-8 grid gap-4">
            {['University graduation certificates', 'Professional training records', 'Corporate learning credentials', 'Government and NGO skill verification'].map((item) => (
              <div key={item} className="rounded-2xl border px-4 py-4" style={{ borderColor: 'var(--border)' }}>{item}</div>
            ))}
          </div>
        </div>
        <div className="panel p-8">
          <div className="grid gap-4 md:grid-cols-2">
            <Metric label="Chains" value="Ethereum + Polygon" />
            <Metric label="Proof model" value="SHA-256 fingerprint" />
            <Metric label="Storage" value="IPFS + DB metadata" />
            <Metric label="Verification" value="ID, file, QR" />
          </div>
          <div className="mt-6 rounded-[28px] border p-6" style={{ borderColor: 'var(--border)', background: 'linear-gradient(135deg, rgba(20,184,166,0.12), transparent 60%)' }}>
            <div className="flex items-center gap-3 text-[color:var(--accent)]"><Globe2 size={18} /><span className="text-sm font-semibold">Public trust portal</span></div>
            <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">Every issued certificate gets a unique verification URL and QR code so third parties can validate authenticity without contacting the issuing institution.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

const Metric = ({ label, value }) => (
  <div className="rounded-[24px] border p-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
    <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">{label}</p>
    <p className="mt-3 text-lg font-semibold">{value}</p>
  </div>
);

export default Home;
