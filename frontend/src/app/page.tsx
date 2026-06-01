'use client';
import { useEffect, useState } from 'react';
import { formatPrice } from '@/lib/api';

// Sample data for static rendering (when API is not available)
const samplePerfumes = [
  { id: '1', name: 'Royal Oud Noir', slug: 'royal-oud-noir', brand: 'AuraPerfume', price: 4999, sale_price: 3999, thumbnail: 'https://images.unsplash.com/photo-1594035910387-fea081ac05b2?w=400', category: 'men', fragrance_family: 'oud', average_rating: 4.8, total_reviews: 124, is_featured: true, is_best_seller: true, short_description: 'Majestic oud with smoky incense and rich amber' },
  { id: '2', name: 'Velvet Rose Elixir', slug: 'velvet-rose-elixir', brand: 'AuraPerfume', price: 3499, sale_price: null, thumbnail: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400', category: 'women', fragrance_family: 'floral', average_rating: 4.7, total_reviews: 89, is_featured: true, is_best_seller: true, short_description: 'Enchanting roses with peony and warm vanilla' },
  { id: '3', name: 'Ocean Breeze Aqua', slug: 'ocean-breeze-aqua', brand: 'AuraPerfume', price: 2499, sale_price: 1999, thumbnail: 'https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=400', category: 'unisex', fragrance_family: 'fresh', average_rating: 4.5, total_reviews: 67, is_featured: true, short_description: 'Refreshing ocean mist with cucumber and citrus' },
  { id: '4', name: 'Midnight Amber', slug: 'midnight-amber', brand: 'AuraPerfume', price: 5499, sale_price: null, thumbnail: 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=400', category: 'men', fragrance_family: 'oriental', average_rating: 4.9, total_reviews: 156, is_featured: true, is_best_seller: true, short_description: 'Seductive amber with vetiver and exotic spices' },
  { id: '5', name: 'Sakura Bloom', slug: 'sakura-bloom', brand: 'AuraPerfume', price: 2999, sale_price: 2499, thumbnail: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=400', category: 'women', fragrance_family: 'floral', average_rating: 4.6, total_reviews: 93, is_best_seller: true, short_description: 'Delicate cherry blossom with peach and sandalwood' },
  { id: '6', name: 'Golden Saffron', slug: 'golden-saffron', brand: 'AuraPerfume', price: 7999, sale_price: 6499, thumbnail: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400', category: 'unisex', fragrance_family: 'luxury', average_rating: 4.9, total_reviews: 201, is_featured: true, is_best_seller: true, short_description: 'Precious saffron with rose absolute and oud' },
];

const categories = [
  { name: 'Men', slug: 'men', image: 'https://images.unsplash.com/photo-1594035910387-fea081ac05b2?w=400', count: 45 },
  { name: 'Women', slug: 'women', image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400', count: 52 },
  { name: 'Unisex', slug: 'unisex', image: 'https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=400', count: 28 },
  { name: 'Oud', slug: 'oud', image: 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=400', count: 18 },
  { name: 'Floral', slug: 'floral', image: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=400', count: 35 },
  { name: 'Luxury', slug: 'luxury', image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400', count: 15 },
];

const testimonials = [
  { name: 'Priya Mehta', text: 'Royal Oud Noir is absolutely divine. The scent lingers for hours and I get compliments everywhere I go.', rating: 5, city: 'Mumbai' },
  { name: 'Arjun Kapoor', text: 'Golden Saffron is worth every rupee. The most luxurious fragrance I have ever owned.', rating: 5, city: 'Delhi' },
  { name: 'Sneha Reddy', text: 'Velvet Rose Elixir makes me feel like royalty. Perfect for special occasions.', rating: 5, city: 'Hyderabad' },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= rating ? 'star-filled' : 'star-empty'}>★</span>
      ))}
    </div>
  );
}

function ProductCard({ perfume }: { perfume: typeof samplePerfumes[0] }) {
  return (
    <a href={`/products/${perfume.slug}`} className="product-card block group">
      <div className="relative overflow-hidden aspect-[3/4]">
        <img src={perfume.thumbnail} alt={perfume.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
        {perfume.sale_price && (
          <div className="absolute top-4 left-4 badge-sale">
            {Math.round((1 - perfume.sale_price / perfume.price) * 100)}% OFF
          </div>
        )}
        {perfume.is_best_seller && (
          <div className="absolute top-4 right-4 badge-gold">Bestseller</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div className="p-5">
        <p className="text-xs uppercase tracking-[2px] mb-1" style={{ color: '#d4af37' }}>{perfume.brand}</p>
        <h3 className="font-semibold text-lg mb-1">{perfume.name}</h3>
        <p className="text-sm text-zinc-500 mb-3 line-clamp-1">{perfume.short_description}</p>
        <div className="flex items-center gap-2 mb-2">
          <StarRating rating={Math.round(perfume.average_rating)} />
          <span className="text-xs text-zinc-500">({perfume.total_reviews})</span>
        </div>
        <div className="flex items-center gap-3">
          {perfume.sale_price ? (
            <>
              <span className="text-xl font-bold" style={{ color: '#d4af37' }}>{formatPrice(perfume.sale_price)}</span>
              <span className="text-sm text-zinc-500 line-through">{formatPrice(perfume.price)}</span>
            </>
          ) : (
            <span className="text-xl font-bold" style={{ color: '#d4af37' }}>{formatPrice(perfume.price)}</span>
          )}
        </div>
      </div>
    </a>
  );
}

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const featured = samplePerfumes.filter(p => p.is_featured);
  const bestSellers = samplePerfumes.filter(p => p.is_best_seller);

  return (
    <div>
      {/* ── Hero Banner ─────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=1600" alt="Luxury perfume" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(10,10,15,0.9), rgba(26,26,46,0.7))' }} />
        </div>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-20 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #d4af37, transparent)' }} />
          <div className="absolute bottom-20 left-20 w-72 h-72 rounded-full opacity-5" style={{ background: 'radial-gradient(circle, #d4af37, transparent)' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
          <div className={mounted ? 'animate-fade-in-up' : 'opacity-0'}>
            <div className="inline-block mb-6">
              <span className="badge-gold">✨ New Collection 2024</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
              Discover Your <span className="text-gold-gradient">Signature</span> Scent
            </h1>
            <p className="text-lg text-zinc-400 mb-8 max-w-lg leading-relaxed">
              Explore our curated collection of luxury fragrances, meticulously crafted from the world&apos;s finest ingredients for the discerning connoisseur.
            </p>
            <div className="flex gap-4 flex-wrap">
              <a href="/products" className="btn-gold text-lg">Explore Collection</a>
              <a href="/products?fragranceFamily=oud" className="btn-outline-gold text-lg">Oud Collection →</a>
            </div>
            <div className="flex gap-10 mt-12">
              <div><p className="text-3xl font-bold text-gold-gradient">200+</p><p className="text-sm text-zinc-500">Premium Scents</p></div>
              <div><p className="text-3xl font-bold text-gold-gradient">50K+</p><p className="text-sm text-zinc-500">Happy Customers</p></div>
              <div><p className="text-3xl font-bold text-gold-gradient">4.9★</p><p className="text-sm text-zinc-500">Average Rating</p></div>
            </div>
          </div>
          <div className={`hidden md:block ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
            <div className="relative">
              <div className="absolute inset-0 rounded-3xl" style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.2), transparent)', transform: 'rotate(3deg)' }} />
              <img src="https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600" alt="Featured perfume" className="rounded-3xl shadow-2xl relative z-10 w-full" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Perfumes ───────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="section-title text-gold-gradient" style={{ fontFamily: 'Playfair Display, serif' }}>Featured Collection</h2>
          <p className="section-subtitle">Hand-picked luxury fragrances for the season</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {featured.map((p, i) => (
            <div key={p.id} className={mounted ? 'animate-fade-in-up' : 'opacity-0'} style={{ animationDelay: `${i * 0.1}s` }}>
              <ProductCard perfume={p} />
            </div>
          ))}
        </div>
      </section>

      {/* ── Categories ──────────────────────────────────────── */}
      <section className="py-20" style={{ background: 'linear-gradient(180deg, transparent, rgba(212,175,55,0.03), transparent)' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="section-title text-gold-gradient" style={{ fontFamily: 'Playfair Display, serif' }}>Shop by Category</h2>
            <p className="section-subtitle">Find your perfect fragrance family</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((cat) => (
              <a key={cat.slug} href={`/products?category=${cat.slug}`} className="group text-center">
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden mb-4 border-2 border-transparent group-hover:border-[#d4af37] transition-all duration-300">
                  <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-white">{cat.name}</span>
                  </div>
                </div>
                <p className="text-xs text-zinc-500">{cat.count} Products</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Best Sellers ─────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="section-title text-gold-gradient" style={{ fontFamily: 'Playfair Display, serif' }}>Best Sellers</h2>
          <p className="section-subtitle">Most loved fragrances by our customers</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {bestSellers.map((p, i) => (
            <div key={p.id} className={mounted ? 'animate-fade-in-up' : 'opacity-0'} style={{ animationDelay: `${i * 0.1}s` }}>
              <ProductCard perfume={p} />
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────── */}
      <section className="py-20" style={{ background: 'linear-gradient(180deg, transparent, rgba(212,175,55,0.03), transparent)' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="section-title text-gold-gradient" style={{ fontFamily: 'Playfair Display, serif' }}>What Our Customers Say</h2>
            <p className="section-subtitle">Voices from fragrance connoisseurs</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="glass-card p-8">
                <StarRating rating={t.rating} />
                <p className="mt-4 text-zinc-300 leading-relaxed italic">&ldquo;{t.text}&rdquo;</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'linear-gradient(135deg, #d4af37, #b8860b)', color: '#0a0a0f' }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-zinc-500">{t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Newsletter ───────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="glass-card p-12 md:p-16 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #d4af37, transparent)' }} />
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
            Join the <span className="text-gold-gradient">AuraPerfume</span> Family
          </h2>
          <p className="text-zinc-400 mb-8 max-w-md mx-auto">Subscribe for exclusive access to new releases, special offers, and fragrance tips.</p>
          <div className="flex gap-3 max-w-md mx-auto">
            <input type="email" placeholder="Enter your email" className="input-luxury flex-1" />
            <button className="btn-gold whitespace-nowrap">Subscribe ✨</button>
          </div>
        </div>
      </section>
    </div>
  );
}
