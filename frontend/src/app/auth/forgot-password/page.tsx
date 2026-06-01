'use client';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch { /* still show success for security */ setSent(true); }
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="glass-card p-10 w-full max-w-md text-center">
        {sent ? (
          <>
            <p className="text-5xl mb-4">📧</p>
            <h2 className="text-2xl font-bold text-gold-gradient mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>Check Your Email</h2>
            <p className="text-zinc-400 mb-6">If an account exists with that email, we&apos;ve sent a password reset link.</p>
            <a href="/auth/login" className="btn-gold">Back to Login</a>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-gold-gradient mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>Forgot Password</h1>
            <p className="text-zinc-500 mb-8">Enter your email and we&apos;ll send you a reset link</p>
            <form onSubmit={handleSubmit} className="space-y-5">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-luxury" placeholder="you@example.com" required id="forgot-email" />
              <button type="submit" className="btn-gold w-full justify-center" disabled={loading}>{loading ? 'Sending...' : 'Send Reset Link'}</button>
            </form>
            <a href="/auth/login" className="text-sm text-zinc-500 hover:text-[#d4af37] mt-4 block">← Back to Login</a>
          </>
        )}
      </div>
    </div>
  );
}
