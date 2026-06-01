'use client';
export default function CouponsPage() {
  const coupons = [
    { code: 'WELCOME20', desc: '20% off your first order', type: 'percentage', value: 20, min: 1000, max: 500, expires: '2027-12-31' },
    { code: 'FLAT500', desc: '₹500 flat discount', type: 'flat', value: 500, min: 2000, max: null, expires: '2027-06-30' },
    { code: 'LUXURY15', desc: '15% off luxury collection', type: 'percentage', value: 15, min: 5000, max: 1500, expires: '2027-12-31' },
  ];
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-gold-gradient mb-8" style={{ fontFamily: 'Playfair Display, serif' }}>Available Coupons</h1>
      <div className="space-y-4">
        {coupons.map(c => (
          <div key={c.code} className="glass-card p-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="badge-gold text-base px-4 py-1">{c.code}</span>
                <span className="text-xs text-zinc-500">Expires: {c.expires}</span>
              </div>
              <p className="text-sm text-zinc-300">{c.desc}</p>
              <p className="text-xs text-zinc-500 mt-1">Min order: ₹{c.min} {c.max ? `• Max discount: ₹${c.max}` : ''}</p>
            </div>
            <button onClick={() => { navigator.clipboard.writeText(c.code); }} className="btn-outline-gold !py-2 !px-6 !text-sm">Copy Code</button>
          </div>
        ))}
      </div>
    </div>
  );
}
