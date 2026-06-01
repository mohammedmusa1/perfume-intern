'use client';
import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await fetch('/api/auth/login/otp/request', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
        if (data.data?.otp) {
           setSuccess(`Gmail is blocking the email, but for testing purposes, your OTP is: ${data.data.otp}`);
        } else {
           setSuccess(`Verification code sent successfully to ${email}. Please check your Gmail inbox.`);
        }
      } else {
        setError(data.message || 'Failed to send OTP code.');
      }
    } catch {
      setError('Connection to auth service failed. Please try again.');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/login/otp/verify', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('aura_token', data.data.accessToken);
        localStorage.setItem('aura_user', JSON.stringify(data.data.user));
        setSuccess('Verification successful! Access authorized.');
        setTimeout(() => { window.location.href = '/'; }, 1000);
      } else {
        setError(data.message || 'Invalid or expired OTP code.');
      }
    } catch {
      setError('Verification request failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="glass-card p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gold-gradient" style={{ fontFamily: 'Playfair Display, serif' }}>
            OTP Login
          </h1>
          <p className="text-zinc-500 mt-2">
            Sign in securely using a passwordless verification code
          </p>
        </div>

        {error && <div className="bg-red-500/10 text-red-400 p-3 rounded-lg mb-6 text-sm text-center">{error}</div>}
        {success && <div className="bg-green-500/10 text-green-400 p-3 rounded-lg mb-6 text-sm text-center">{success}</div>}

        {/* OTP Request Form */}
        {!otpSent && (
          <form onSubmit={handleRequestOtp} className="space-y-5">
            <div>
              <label className="text-xs uppercase tracking-wider text-zinc-400 mb-2 block">Email Address</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="input-luxury" 
                placeholder="you@gmail.com" 
                required 
                id="otp-request-email" 
              />
            </div>
            <button 
              type="submit" 
              className="btn-gold w-full text-center justify-center font-bold tracking-wider" 
              disabled={loading} 
              id="request-otp-btn"
            >
              {loading ? 'Sending code...' : 'Send Verification Code'}
            </button>
          </form>
        )}

        {/* OTP Verification Form */}
        {otpSent && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <label className="text-xs uppercase tracking-wider text-zinc-400 mb-2 block">OTP Verification Code</label>
              <input 
                type="text" 
                value={otp} 
                onChange={e => setOtp(e.target.value)} 
                className="input-luxury text-center font-mono tracking-widest text-lg" 
                placeholder="••••••" 
                maxLength={6} 
                required 
                id="otp-verify-code" 
              />
              <p className="text-xs text-zinc-500 mt-3 text-center">Enter the 6-digit verification code sent to your email.</p>
            </div>
            <button 
              type="submit" 
              className="btn-gold w-full text-center justify-center font-bold tracking-wider" 
              disabled={loading} 
              id="verify-otp-btn"
            >
              {loading ? 'Verifying...' : 'Verify & Log In'}
            </button>
            <button 
              type="button" 
              onClick={() => setOtpSent(false)} 
              className="text-zinc-500 hover:text-zinc-400 text-xs w-full text-center mt-4 transition-all"
            >
              ← Change Email
            </button>
          </form>
        )}

        <p className="text-center text-sm text-zinc-500 mt-6">
          Don&apos;t have an account? <a href="/auth/signup" className="text-[#d4af37] hover:underline">Create one</a>
        </p>
      </div>
    </div>
  );
}
