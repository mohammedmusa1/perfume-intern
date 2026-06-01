'use client';
import { useState } from 'react';
import { formatPrice } from '@/lib/api';

const allPerfumes = [
  { id: '1', name: 'Royal Oud Noir', slug: 'royal-oud-noir', brand: 'AuraPerfume', price: 4999, sale_price: 3999, thumbnail: 'https://images.unsplash.com/photo-1594035910387-fea081ac05b2?w=400', category: 'men', fragrance_family: 'oud', average_rating: 4.8, total_reviews: 124, short_description: 'Majestic oud with smoky incense and rich amber' },
  { id: '2', name: 'Velvet Rose Elixir', slug: 'velvet-rose-elixir', brand: 'AuraPerfume', price: 3499, sale_price: null, thumbnail: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400', category: 'women', fragrance_family: 'floral', average_rating: 4.7, total_reviews: 89, short_description: 'Enchanting roses with peony and warm vanilla' },
  { id: '3', name: 'Ocean Breeze Aqua', slug: 'ocean-breeze-aqua', brand: 'AuraPerfume', price: 2499, sale_price: 1999, thumbnail: 'https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=400', category: 'unisex', fragrance_family: 'fresh', average_rating: 4.5, total_reviews: 67, short_description: 'Refreshing ocean mist with cucumber and citrus' },
  { id: '4', name: 'Midnight Amber', slug: 'midnight-amber', brand: 'AuraPerfume', price: 5499, sale_price: null, thumbnail: 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=400', category: 'men', fragrance_family: 'oriental', average_rating: 4.9, total_reviews: 156, short_description: 'Seductive amber with vetiver and exotic spices' },
  { id: '5', name: 'Sakura Bloom', slug: 'sakura-bloom', brand: 'AuraPerfume', price: 2999, sale_price: 2499, thumbnail: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=400', category: 'women', fragrance_family: 'floral', average_rating: 4.6, total_reviews: 93, short_description: 'Delicate cherry blossom with peach and sandalwood' },
  { id: '6', name: 'Cedar & Sage', slug: 'cedar-sage', brand: 'AuraPerfume', price: 3999, sale_price: null, thumbnail: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=400', category: 'men', fragrance_family: 'woody', average_rating: 4.4, total_reviews: 45, short_description: 'Grounding cedarwood with sage and earthy moss' },
  { id: '7', name: 'Golden Saffron', slug: 'golden-saffron', brand: 'AuraPerfume', price: 7999, sale_price: 6499, thumbnail: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400', category: 'unisex', fragrance_family: 'luxury', average_rating: 4.9, total_reviews: 201, short_description: 'Precious saffron with rose absolute and oud' },
  { id: '8', name: 'Citrus Soleil', slug: 'citrus-soleil', brand: 'AuraPerfume', price: 1999, sale_price: null, thumbnail: 'https://images.unsplash.com/photo-1594035910387-fea081ac05b2?w=400', category: 'unisex', fragrance_family: 'citrus', average_rating: 4.3, total_reviews: 38, short_description: 'Sun-kissed lemons and mandarin burst with energy' },
];

const categoryFilters = ['all', 'men', 'women', 'unisex'];
const fragranceFilters = ['all', 'luxury', 'oud', 'floral', 'woody', 'fresh', 'oriental', 'citrus'];

export default function ProductsPage() {
  const [category, setCategory] = useState('all');
  const [fragrance, setFragrance] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState([0, 10000]);

  const filtered = allPerfumes.filter(p => {
    if (category !== 'all' && p.category !== category) return false;
    if (fragrance !== 'all' && p.fragrance_family !== fragrance) return false;
    const price = p.sale_price || p.price;
    if (price < priceRange[0] || price > priceRange[1]) return false;
    return true;
  }).sort((a, b) => {
    const pa = a.sale_price || a.price, pb = b.sale_price || b.price;
    if (sortBy === 'price_asc') return pa - pb;
    if (sortBy === 'price_desc') return pb - pa;
    if (sortBy === 'rating') return b.average_rating - a.average_rating;
    return 0;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gold-gradient mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>Our Collection</h1>
        <p className="text-zinc-500">Explore our curated luxury fragrances</p>
      </div>

      {/* Filters */}
      <div className="glass-card p-6 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className="text-xs uppercase tracking-wider text-zinc-400 mb-2 block">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-luxury !py-2" id="filter-category">
              {categoryFilters.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-zinc-400 mb-2 block">Fragrance</label>
            <select value={fragrance} onChange={(e) => setFragrance(e.target.value)} className="input-luxury !py-2" id="filter-fragrance">
              {fragranceFilters.map(f => <option key={f} value={f}>{f === 'all' ? 'All Fragrances' : f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-zinc-400 mb-2 block">Max Price: {formatPrice(priceRange[1])}</label>
            <input type="range" min="0" max="10000" step="500" value={priceRange[1]} onChange={(e) => setPriceRange([0, Number(e.target.value)])} className="w-full accent-[#d4af37]" id="filter-price" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-zinc-400 mb-2 block">Sort By</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input-luxury !py-2" id="filter-sort">
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>
      </div>

      <p className="text-sm text-zinc-500 mb-6">{filtered.length} product{filtered.length !== 1 ? 's' : ''} found</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map((p) => (
          <a key={p.id} href={`/products/${p.slug}`} className="product-card block group">
            <div className="relative overflow-hidden aspect-[3/4]">
              <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              {p.sale_price && <div className="absolute top-3 left-3 badge-sale">{Math.round((1 - p.sale_price / p.price) * 100)}% OFF</div>}
            </div>
            <div className="p-4">
              <p className="text-[10px] uppercase tracking-[2px] mb-1" style={{ color: '#d4af37' }}>{p.brand}</p>
              <h3 className="font-semibold mb-1">{p.name}</h3>
              <div className="flex items-center gap-1 mb-2">
                {[1,2,3,4,5].map(s => <span key={s} className={s <= Math.round(p.average_rating) ? 'star-filled text-xs' : 'star-empty text-xs'}>★</span>)}
                <span className="text-xs text-zinc-500 ml-1">({p.total_reviews})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold" style={{ color: '#d4af37' }}>{formatPrice(p.sale_price || p.price)}</span>
                {p.sale_price && <span className="text-xs text-zinc-500 line-through">{formatPrice(p.price)}</span>}
              </div>
            </div>
          </a>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <p className="text-2xl text-zinc-500">No perfumes match your filters</p>
          <button onClick={() => { setCategory('all'); setFragrance('all'); setPriceRange([0,10000]); }} className="btn-gold mt-4">Clear Filters</button>
        </div>
      )}
    </div>
  );
}
