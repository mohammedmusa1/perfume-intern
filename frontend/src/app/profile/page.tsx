'use client';
export default function ProfilePage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-gold-gradient mb-8" style={{ fontFamily: 'Playfair Display, serif' }}>My Profile</h1>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="glass-card p-6 text-center">
          <div className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold" style={{ background: 'linear-gradient(135deg, #d4af37, #b8860b)', color: '#0a0a0f' }}>R</div>
          <h2 className="font-bold text-lg">Riya Sharma</h2>
          <p className="text-sm text-zinc-500">customer@example.com</p>
          <p className="text-xs text-green-400 mt-2">✓ Verified</p>
        </div>
        <div className="md:col-span-2 glass-card p-6">
          <h2 className="font-bold text-lg mb-6" style={{ color: '#d4af37' }}>Edit Profile</h2>
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs uppercase tracking-wider text-zinc-400 mb-1 block">First Name</label><input defaultValue="Riya" className="input-luxury" id="profile-fname" /></div>
              <div><label className="text-xs uppercase tracking-wider text-zinc-400 mb-1 block">Last Name</label><input defaultValue="Sharma" className="input-luxury" id="profile-lname" /></div>
            </div>
            <div><label className="text-xs uppercase tracking-wider text-zinc-400 mb-1 block">Email</label><input defaultValue="customer@example.com" className="input-luxury" disabled /></div>
            <div><label className="text-xs uppercase tracking-wider text-zinc-400 mb-1 block">Phone</label><input className="input-luxury" id="profile-phone" /></div>
            <button type="button" className="btn-gold" id="profile-save">Save Changes</button>
          </form>
        </div>
      </div>
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <a href="/orders" className="glass-card p-5 text-center hover:border-[#d4af37] transition-colors"><p className="text-2xl mb-2">📦</p><p className="font-semibold">Orders</p></a>
        <a href="/wishlist" className="glass-card p-5 text-center hover:border-[#d4af37] transition-colors"><p className="text-2xl mb-2">♡</p><p className="font-semibold">Wishlist</p></a>
        <a href="/coupons" className="glass-card p-5 text-center hover:border-[#d4af37] transition-colors"><p className="text-2xl mb-2">🎟️</p><p className="font-semibold">Coupons</p></a>
        <a href="/contact" className="glass-card p-5 text-center hover:border-[#d4af37] transition-colors"><p className="text-2xl mb-2">💬</p><p className="font-semibold">Support</p></a>
      </div>
    </div>
  );
}
