'use client';
import { useState } from 'react';
import { formatPrice } from '@/lib/api';

const perfumeData: Record<string, { id: string; name: string; brand: string; price: number; sale_price: number | null; category: string; fragrance_family: string; description: string; top_notes: string[]; middle_notes: string[]; base_notes: string[]; size_ml: number; images: string[]; thumbnail: string; average_rating: number; total_reviews: number }> = {
  'royal-oud-noir': { id: '1', name: 'Royal Oud Noir', brand: 'AuraPerfume', price: 4999, sale_price: 3999, category: 'men', fragrance_family: 'oud', description: 'A majestic blend of rare oud, smoky incense, and rich amber. This opulent fragrance embodies royalty with deep woody layers and a warm, lingering trail that commands attention. Crafted from the finest ingredients sourced across the globe.', top_notes: ['Bergamot', 'Saffron', 'Pink Pepper'], middle_notes: ['Oud', 'Rose', 'Incense'], base_notes: ['Amber', 'Sandalwood', 'Musk'], size_ml: 100, images: ['https://images.unsplash.com/photo-1594035910387-fea081ac05b2?w=800'], thumbnail: 'https://images.unsplash.com/photo-1594035910387-fea081ac05b2?w=800', average_rating: 4.8, total_reviews: 124 },
  'velvet-rose-elixir': { id: '2', name: 'Velvet Rose Elixir', brand: 'AuraPerfume', price: 3499, sale_price: null, category: 'women', fragrance_family: 'floral', description: 'An enchanting bouquet of Bulgarian roses, velvety peony, and warm vanilla. This luxurious floral fragrance wraps you in elegance, perfect for evenings and special occasions.', top_notes: ['Rose', 'Lychee', 'Pink Pepper'], middle_notes: ['Peony', 'Jasmine', 'Iris'], base_notes: ['Vanilla', 'Patchouli', 'White Musk'], size_ml: 100, images: ['https://images.unsplash.com/photo-1541643600914-78b084683601?w=800'], thumbnail: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800', average_rating: 4.7, total_reviews: 89 },
};

// Fallback for unknown slugs
const defaultPerfume = { id: '1', name: 'Royal Oud Noir', brand: 'AuraPerfume', price: 4999, sale_price: 3999, category: 'men', fragrance_family: 'oud', description: 'A majestic blend of rare oud, smoky incense, and rich amber.', top_notes: ['Bergamot', 'Saffron'], middle_notes: ['Oud', 'Rose'], base_notes: ['Amber', 'Musk'], size_ml: 100, images: ['https://images.unsplash.com/photo-1594035910387-fea081ac05b2?w=800'], thumbnail: 'https://images.unsplash.com/photo-1594035910387-fea081ac05b2?w=800', average_rating: 4.8, total_reviews: 124 };

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const perfume = perfumeData[slug] || defaultPerfume;
  const [qty, setQty] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  const handleAddToCart = () => {
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="grid md:grid-cols-2 gap-12">
        {/* Image */}
        <div className="relative">
          <div className="aspect-square rounded-3xl overflow-hidden border border-[rgba(212,175,55,0.15)]">
            <img src={perfume.thumbnail} alt={perfume.name} className="w-full h-full object-cover" />
          </div>
          {perfume.sale_price && (
            <div className="absolute top-6 left-6 badge-sale text-sm">{Math.round((1 - perfume.sale_price / perfume.price) * 100)}% OFF</div>
          )}
        </div>

        {/* Details */}
        <div>
          <p className="text-sm uppercase tracking-[3px] mb-2" style={{ color: '#d4af37' }}>{perfume.brand}</p>
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>{perfume.name}</h1>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(s => <span key={s} className={s <= Math.round(perfume.average_rating) ? 'star-filled' : 'star-empty'}>★</span>)}
            </div>
            <span className="text-sm text-zinc-500">{perfume.average_rating} ({perfume.total_reviews} reviews)</span>
          </div>

          <div className="flex items-center gap-4 mb-6">
            {perfume.sale_price ? (
              <><span className="text-3xl font-bold" style={{ color: '#d4af37' }}>{formatPrice(perfume.sale_price)}</span><span className="text-xl text-zinc-500 line-through">{formatPrice(perfume.price)}</span></>
            ) : (
              <span className="text-3xl font-bold" style={{ color: '#d4af37' }}>{formatPrice(perfume.price)}</span>
            )}
          </div>

          <p className="text-zinc-400 leading-relaxed mb-8">{perfume.description}</p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="glass-card p-4 text-center">
              <p className="text-xs text-zinc-500 mb-1">Category</p>
              <p className="font-semibold capitalize">{perfume.category}</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-xs text-zinc-500 mb-1">Family</p>
              <p className="font-semibold capitalize">{perfume.fragrance_family}</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-xs text-zinc-500 mb-1">Size</p>
              <p className="font-semibold">{perfume.size_ml} ml</p>
            </div>
          </div>

          {/* Notes */}
          <div className="mb-8">
            <h3 className="font-semibold mb-3" style={{ color: '#d4af37' }}>Fragrance Notes</h3>
            <div className="space-y-3">
              <div><span className="text-xs text-zinc-500 uppercase tracking-wider">Top:</span> <span className="text-sm">{perfume.top_notes.join(' · ')}</span></div>
              <div><span className="text-xs text-zinc-500 uppercase tracking-wider">Middle:</span> <span className="text-sm">{perfume.middle_notes.join(' · ')}</span></div>
              <div><span className="text-xs text-zinc-500 uppercase tracking-wider">Base:</span> <span className="text-sm">{perfume.base_notes.join(' · ')}</span></div>
            </div>
          </div>

          {/* Add to cart */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center glass-card">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-4 py-3 text-lg hover:text-[#d4af37] transition-colors">−</button>
              <span className="px-4 py-3 font-semibold">{qty}</span>
              <button onClick={() => setQty(Math.min(10, qty + 1))} className="px-4 py-3 text-lg hover:text-[#d4af37] transition-colors">+</button>
            </div>
            <button onClick={handleAddToCart} className="btn-gold flex-1 text-center justify-center" id="add-to-cart-btn">
              {addedToCart ? '✓ Added to Cart!' : '🛒 Add to Cart'}
            </button>
          </div>
          <button className="btn-outline-gold w-full text-center">♡ Add to Wishlist</button>

          <div className="mt-8 space-y-2 text-sm text-zinc-500">
            <p>✓ Free shipping on orders above ₹2,000</p>
            <p>✓ 7-day return policy</p>
            <p>✓ 100% authentic products</p>
          </div>
        </div>
      </div>
    </div>
  );
}
