'use client';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const [user, setUser] = useState<{firstName: string, role: string} | null>(null);
  
  useEffect(() => {
    const stored = localStorage.getItem('aura_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {}
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('aura_token');
    localStorage.removeItem('aura_user');
    setUser(null);
    window.location.href = '/';
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50" style={{ background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(212,175,55,0.1)' }}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #d4af37, #b8860b)' }}>
            <span className="text-black font-bold text-lg">A</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gold-gradient" style={{ fontFamily: 'Playfair Display, serif' }}>AuraPerfume</h1>
            <p className="text-[10px] tracking-[4px] uppercase" style={{ color: '#71717a' }}>Luxury Fragrances</p>
          </div>
        </a>

        <div className="hidden md:flex items-center gap-8">
          <a href="/" className="text-sm font-medium hover:text-[#d4af37] transition-colors">Home</a>
          <a href="/products" className="text-sm font-medium hover:text-[#d4af37] transition-colors">Shop</a>
          <a href="/products?category=men" className="text-sm font-medium hover:text-[#d4af37] transition-colors">Men</a>
          <a href="/products?category=women" className="text-sm font-medium hover:text-[#d4af37] transition-colors">Women</a>
          <a href="/contact" className="text-sm font-medium hover:text-[#d4af37] transition-colors">Contact</a>
        </div>

        <div className="flex items-center gap-4">
          <a href="/wishlist" className="text-sm hover:text-[#d4af37] transition-colors">♡</a>
          <a href="/cart" className="text-sm hover:text-[#d4af37] transition-colors">🛒</a>
          {user ? (
            <div className="flex items-center gap-3 ml-2 border-l border-zinc-800 pl-4">
              {user.role === 'admin' && (
                <a href="/admin" className="text-xs text-[#d4af37] hover:text-white transition uppercase tracking-wider mr-2">Admin</a>
              )}
              <a href="/profile" className="flex items-center gap-2 text-sm text-[#d4af37] font-medium border border-[#d4af37]/30 px-3 py-1.5 rounded-full hover:bg-[#d4af37]/10 transition">
                <div className="w-5 h-5 rounded-full bg-[#d4af37] text-black flex items-center justify-center text-xs font-bold">
                  {user.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
                </div>
                {user.firstName}
              </a>
              <button onClick={handleLogout} className="text-xs text-zinc-500 hover:text-white transition ml-2">Logout</button>
            </div>
          ) : (
            <a href="/auth/login" className="btn-gold text-sm !py-2 !px-5 ml-2">Sign In</a>
          )}
        </div>
      </div>
    </nav>
  );
}
