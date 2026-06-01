'use client';
import { useState } from 'react';

export default function SignupPage() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) { setSuccess(true); }
      else { setError(data.message || 'Signup failed'); }
    } catch { setError('Network error'); }
    setLoading(false);
  };

  if (success) return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="glass-card p-10 text-center max-w-md">
        <p className="text-5xl mb-4">✨</p>
        <h2 className="text-2xl font-bold text-gold-gradient mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>Account Created!</h2>
        <p className="text-zinc-400 mb-6">Please check your email to verify your account.</p>
        <a href="/auth/login" className="btn-gold">Go to Login</a>
      </div>
    </div>
  );

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="glass-card p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gold-gradient" style={{ fontFamily: 'Playfair Display, serif' }}>Create Account</h1>
          <p className="text-zinc-500 mt-2">Join the AuraPerfume family</p>
        </div>
        {error && <div className="bg-red-500/10 text-red-400 p-3 rounded-lg mb-6 text-sm">{error}</div>}
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs uppercase tracking-wider text-zinc-400 mb-1 block">First Name</label><input type="text" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} className="input-luxury" required id="signup-first-name" /></div>
            <div><label className="text-xs uppercase tracking-wider text-zinc-400 mb-1 block">Last Name</label><input type="text" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} className="input-luxury" required id="signup-last-name" /></div>
          </div>
          <div><label className="text-xs uppercase tracking-wider text-zinc-400 mb-1 block">Email</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="input-luxury" required id="signup-email" /></div>
          <div><label className="text-xs uppercase tracking-wider text-zinc-400 mb-1 block">Phone</label><input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="input-luxury" id="signup-phone" /></div>
          <div><label className="text-xs uppercase tracking-wider text-zinc-400 mb-1 block">Password</label><input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="input-luxury" placeholder="Min 8 chars, uppercase, number, special" required id="signup-password" /></div>
          <button type="submit" className="btn-gold w-full text-center justify-center" disabled={loading} id="signup-btn">{loading ? 'Creating...' : 'Create Account'}</button>
        </form>
        <p className="text-center text-sm text-zinc-500 mt-6">Already have an account? <a href="/auth/login" className="text-[#d4af37] hover:underline">Sign in</a></p>
      </div>
    </div>
  );
}
