import React, { useState } from 'react';
import { ArrowRight, Lock, Mail, User2, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', institutionName: '', walletAddress: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const routeByRole = (role) => {
    if (role === 'admin') return '/dashboard/admin';
    if (role === 'issuer') return '/dashboard/issuer';
    return '/dashboard/verifier';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = isRegister ? await register(form) : await login(form.email, form.password);
      navigate(routeByRole(user.role));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to continue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shell grid min-h-[calc(100vh-96px)] items-center py-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
      <div className="hidden lg:block">
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">Secure access</p>
        <h1 className="mt-4 max-w-xl text-5xl font-bold">Operate issuance, governance, and verification from one workspace.</h1>
        <p className="mt-6 max-w-lg text-lg text-[color:var(--muted)]">Admins manage issuers, issuers mint credentials, and public verifiers can register for saved workflows without exposing privileged actions.</p>
      </div>

      <div className="panel-strong mx-auto w-full max-w-xl p-8 md:p-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">{isRegister ? 'Create verifier account' : 'Welcome back'}</p>
            <h2 className="mt-2 text-3xl font-semibold">{isRegister ? 'Get started' : 'Sign in'}</h2>
          </div>
          <button type="button" onClick={() => setIsRegister((value) => !value)} className="btn-secondary px-4 py-2">
            {isRegister ? 'Have account?' : 'Need account?'}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {isRegister && (
            <>
              <Field icon={<User2 size={16} />} label="Full name">
                <input className="input-field" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
              </Field>
              <Field icon={<User2 size={16} />} label="Institution name">
                <input className="input-field" value={form.institutionName} onChange={(event) => setForm({ ...form, institutionName: event.target.value })} placeholder="Optional for verifiers" />
              </Field>
              <Field icon={<Wallet size={16} />} label="Wallet address">
                <input className="input-field" value={form.walletAddress} onChange={(event) => setForm({ ...form, walletAddress: event.target.value })} placeholder="Optional" />
              </Field>
            </>
          )}
          <Field icon={<Mail size={16} />} label="Email address">
            <input type="email" className="input-field" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
          </Field>
          <Field icon={<Lock size={16} />} label="Password">
            <input type="password" className="input-field" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
          </Field>
          {error ? <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div> : null}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Working...' : isRegister ? 'Create account' : 'Sign in'} <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};

const Field = ({ icon, label, children }) => (
  <label className="block">
    <span className="mb-2 flex items-center gap-2 text-sm font-medium text-[color:var(--muted)]">{icon}{label}</span>
    {children}
  </label>
);

export default Login;
