'use client';
import { useState } from 'react';
export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const form = e.currentTarget;
    const formData = {
      name: (form.querySelector('#contact-name') as HTMLInputElement).value,
      email: (form.querySelector('#contact-email') as HTMLInputElement).value,
      subject: (form.querySelector('#contact-subject') as HTMLInputElement).value,
      message: (form.querySelector('#contact-message') as HTMLTextAreaElement).value,
    };
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setSent(true);
      } else {
        setError(data.message || 'Failed to send message');
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };
  
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gold-gradient mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>Contact Us</h1>
        <p className="text-zinc-500">We&apos;d love to hear from you</p>
      </div>
      <div className="grid md:grid-cols-2 gap-10">
        <div className="glass-card p-8">
          {sent ? (
            <div className="text-center py-10"><p className="text-5xl mb-4">✉️</p><h2 className="text-2xl font-bold text-gold-gradient mb-3">Message Sent!</h2><p className="text-zinc-400">We&apos;ll get back to you within 24 hours.</p></div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && <div className="bg-red-500/10 text-red-400 p-3 rounded-lg text-sm text-center">{error}</div>}
              <div><label className="text-xs uppercase tracking-wider text-zinc-400 mb-1 block">Name</label><input className="input-luxury" required id="contact-name" /></div>
              <div><label className="text-xs uppercase tracking-wider text-zinc-400 mb-1 block">Email</label><input type="email" className="input-luxury" required id="contact-email" /></div>
              <div><label className="text-xs uppercase tracking-wider text-zinc-400 mb-1 block">Subject</label><input className="input-luxury" required id="contact-subject" /></div>
              <div><label className="text-xs uppercase tracking-wider text-zinc-400 mb-1 block">Message</label><textarea className="input-luxury !h-32 resize-none" required id="contact-message" /></div>
              <button type="submit" className="btn-gold w-full text-center justify-center" id="contact-submit" disabled={loading}>{loading ? 'Sending...' : 'Send Message'}</button>
            </form>
          )}
        </div>
        <div className="space-y-6">
          <div className="glass-card p-6"><p className="text-2xl mb-2">📍</p><h3 className="font-bold mb-1">Address</h3><p className="text-sm text-zinc-400">42 Marine Drive, Mumbai, Maharashtra 400020, India</p></div>
          <div className="glass-card p-6"><p className="text-2xl mb-2">📧</p><h3 className="font-bold mb-1">Email</h3><p className="text-sm text-zinc-400">support@auraperfume.com</p></div>
          <div className="glass-card p-6"><p className="text-2xl mb-2">📞</p><h3 className="font-bold mb-1">Phone</h3><p className="text-sm text-zinc-400">+91 98765 43210</p></div>
          <div className="glass-card p-6"><p className="text-2xl mb-2">🕐</p><h3 className="font-bold mb-1">Business Hours</h3><p className="text-sm text-zinc-400">Mon-Sat: 10am - 8pm IST</p></div>
        </div>
      </div>
    </div>
  );
}
