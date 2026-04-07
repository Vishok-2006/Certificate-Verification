import React from 'react';
import { FileSearch, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const StudentDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="shell py-12">
      <div className="panel-strong grid gap-8 p-8 lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">Verifier workspace</p>
          <h1 className="mt-3 text-4xl font-bold">Welcome, {user?.name?.split(' ')[0] || 'Verifier'}.</h1>
          <p className="mt-4 max-w-2xl text-[color:var(--muted)]">Your account is scoped for secure public verification. Use the portal to validate certificate IDs, inspect blockchain provenance, and export formal verification reports.</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link to="/verify" className="btn-primary"><FileSearch size={16} /> Open verification portal</Link>
          </div>
        </div>
        <div className="grid gap-4">
          <Card icon={<ShieldCheck size={18} />} title="Trusted evidence" text="Every successful match compares off-chain metadata with immutable on-chain proof." />
          <Card icon={<Sparkles size={18} />} title="Faster reviews" text="Scan QR codes or upload the original certificate file to validate in seconds." />
        </div>
      </div>
    </div>
  );
};

const Card = ({ icon, title, text }) => <div className="panel p-6"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--accent)]/10 text-[color:var(--accent)]">{icon}</div><h3 className="mt-4 text-xl font-semibold">{title}</h3><p className="mt-2 text-sm text-[color:var(--muted)]">{text}</p></div>;

export default StudentDashboard;
