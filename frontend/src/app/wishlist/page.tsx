'use client';
import { formatPrice } from '@/lib/api';

const wishlistItems = [
  { id: '1', name: 'Midnight Amber', brand: 'AuraPerfume', price: 5499, thumbnail: 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=300', average_rating: 4.9, slug: 'midnight-amber' },
  { id: '2', name: 'Sakura Bloom', brand: 'AuraPerfume', price: 2999, sale_price: 2499, thumbnail: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=300', average_rating: 4.6, slug: 'sakura-bloom' },
];

export default function WishlistPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-gold-gradient mb-8" style={{ fontFamily: 'Playfair Display, serif' }}>My Wishlist</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {wishlistItems.map(item => (
          <div key={item.id} className="product-card">
            <a href={`/products/${item.slug}`} className="block">
              <div className="aspect-[3/4] overflow-hidden"><img src={item.thumbnail} alt={item.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" /></div>
            </a>
            <div className="p-4">
              <p className="text-[10px] uppercase tracking-[2px]" style={{ color: '#d4af37' }}>{item.brand}</p>
              <h3 className="font-semibold">{item.name}</h3>
              <div className="flex items-center gap-2 mt-2">
                <span className="font-bold" style={{ color: '#d4af37' }}>{formatPrice(item.price)}</span>
              </div>
              <div className="flex gap-2 mt-3">
                <button className="btn-gold flex-1 !py-2 !text-sm text-center justify-center">Add to Cart</button>
                <button className="w-10 h-10 rounded-xl border border-red-500/30 text-red-400 flex items-center justify-center hover:bg-red-500/10">✕</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
