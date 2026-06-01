'use client';
import { formatPrice } from '@/lib/api';

const stats = { totalUsers: 1247, totalOrders: 3891, totalRevenue: 4523800, totalProducts: 48 };
const recentOrders = [
  { order_number: 'AP-QW4E88-2TR1', email: 'priya@gmail.com', total: 1999, status: 'processing', created_at: '2024-12-28' },
  { order_number: 'AP-MK9X31-7PL4', email: 'arjun@gmail.com', total: 3499, status: 'shipped', created_at: '2024-12-20' },
  { order_number: 'AP-LXRH42-9KM2', email: 'sneha@gmail.com', total: 20056, status: 'delivered', created_at: '2024-12-15' },
  { order_number: 'AP-BN7K22-4XM9', email: 'rahul@gmail.com', total: 6499, status: 'confirmed', created_at: '2024-12-10' },
];
const lowStock = [
  { name: 'Golden Saffron', quantity: 5, threshold: 10 },
  { name: 'Midnight Amber', quantity: 8, threshold: 10 },
];
const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400', confirmed: 'bg-blue-500/20 text-blue-400',
  processing: 'bg-purple-500/20 text-purple-400', shipped: 'bg-cyan-500/20 text-cyan-400',
  delivered: 'bg-green-500/20 text-green-400',
};

export default function AdminDashboard() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold text-gold-gradient" style={{ fontFamily: 'Playfair Display, serif' }}>Admin Dashboard</h1>
          <p className="text-zinc-500 mt-1">Welcome back, Admin</p>
        </div>
        <div className="flex gap-3">
          <a href="/admin/products" className="btn-outline-gold !py-2 !px-4 !text-sm">Products</a>
          <a href="/admin/orders" className="btn-outline-gold !py-2 !px-4 !text-sm">Orders</a>
          <a href="/admin/coupons" className="btn-outline-gold !py-2 !px-4 !text-sm">Coupons</a>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { label: 'Total Users', value: stats.totalUsers.toLocaleString(), icon: '👥', color: '#6366f1' },
          { label: 'Total Orders', value: stats.totalOrders.toLocaleString(), icon: '📦', color: '#8b5cf6' },
          { label: 'Revenue', value: formatPrice(stats.totalRevenue), icon: '💰', color: '#d4af37' },
          { label: 'Products', value: stats.totalProducts.toString(), icon: '🧴', color: '#ec4899' },
        ].map((s) => (
          <div key={s.label} className="glass-card p-6 relative overflow-hidden">
            <div className="absolute top-4 right-4 text-3xl opacity-20">{s.icon}</div>
            <p className="text-sm text-zinc-400 mb-1">{s.label}</p>
            <p className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <div className="glass-card p-6">
            <h2 className="font-bold text-lg mb-6" style={{ color: '#d4af37' }}>Recent Orders</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-zinc-500 border-b border-zinc-700">
                  <th className="pb-3">Order</th><th className="pb-3">Customer</th><th className="pb-3">Amount</th><th className="pb-3">Status</th><th className="pb-3">Date</th>
                </tr></thead>
                <tbody>
                  {recentOrders.map((o) => (
                    <tr key={o.order_number} className="border-b border-zinc-800">
                      <td className="py-3 font-mono text-xs">{o.order_number}</td>
                      <td className="py-3">{o.email}</td>
                      <td className="py-3 font-semibold" style={{ color: '#d4af37' }}>{formatPrice(o.total)}</td>
                      <td className="py-3"><span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${statusColors[o.status]}`}>{o.status}</span></td>
                      <td className="py-3 text-zinc-500">{o.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h2 className="font-bold text-lg mb-4 text-red-400">⚠️ Low Stock Alerts</h2>
            <div className="space-y-3">
              {lowStock.map((p) => (
                <div key={p.name} className="flex justify-between items-center p-3 rounded-xl bg-red-500/5 border border-red-500/20">
                  <div><p className="font-semibold text-sm">{p.name}</p><p className="text-xs text-zinc-500">Threshold: {p.threshold}</p></div>
                  <span className="text-lg font-bold text-red-400">{p.quantity}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-card p-6">
            <h2 className="font-bold text-lg mb-4" style={{ color: '#d4af37' }}>📊 Revenue (Monthly)</h2>
            <div className="space-y-2">
              {[{ month: 'Dec', rev: 1250000 }, { month: 'Nov', rev: 980000 }, { month: 'Oct', rev: 1100000 }].map((m) => (
                <div key={m.month} className="flex items-center gap-3">
                  <span className="text-sm text-zinc-400 w-10">{m.month}</span>
                  <div className="flex-1 h-6 rounded-full overflow-hidden" style={{ background: 'rgba(212,175,55,0.1)' }}>
                    <div className="h-full rounded-full" style={{ width: `${(m.rev / 1300000) * 100}%`, background: 'linear-gradient(90deg, #d4af37, #b8860b)' }} />
                  </div>
                  <span className="text-xs font-semibold w-20 text-right">{formatPrice(m.rev)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
