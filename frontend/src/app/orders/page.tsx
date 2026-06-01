'use client';
import { formatPrice } from '@/lib/api';

const sampleOrders = [
  { id: '1', order_number: 'AP-LXRH42-9KM2', status: 'delivered', total: 20056, created_at: '2024-12-15', items: [{ name: 'Royal Oud Noir', qty: 1 }, { name: 'Golden Saffron', qty: 2 }] },
  { id: '2', order_number: 'AP-MK9X31-7PL4', status: 'shipped', total: 3499, created_at: '2024-12-20', items: [{ name: 'Velvet Rose Elixir', qty: 1 }] },
  { id: '3', order_number: 'AP-QW4E88-2TR1', status: 'processing', total: 1999, created_at: '2024-12-28', items: [{ name: 'Ocean Breeze Aqua', qty: 1 }] },
];

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400', confirmed: 'bg-blue-500/20 text-blue-400', processing: 'bg-purple-500/20 text-purple-400',
  shipped: 'bg-cyan-500/20 text-cyan-400', delivered: 'bg-green-500/20 text-green-400', cancelled: 'bg-red-500/20 text-red-400',
};

export default function OrdersPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-gold-gradient mb-8" style={{ fontFamily: 'Playfair Display, serif' }}>My Orders</h1>
      <div className="space-y-4">
        {sampleOrders.map(order => (
          <div key={order.id} className="glass-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
              <div><p className="font-bold text-lg">{order.order_number}</p><p className="text-sm text-zinc-500">{order.created_at}</p></div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${statusColors[order.status]}`}>{order.status}</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {order.items.map((item, i) => <span key={i} className="text-sm text-zinc-400">{item.name} × {item.qty}{i < order.items.length - 1 ? ',' : ''}</span>)}
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-lg" style={{ color: '#d4af37' }}>{formatPrice(order.total)}</span>
              <a href={`/orders/${order.id}`} className="text-sm text-[#d4af37] hover:underline">View Details →</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
