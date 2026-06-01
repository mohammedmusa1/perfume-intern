'use client';
import { useState } from 'react';
import { formatPrice } from '@/lib/api';

const sampleCart = [
  { id: '1', name: 'Royal Oud Noir', brand: 'AuraPerfume', price: 3999, thumbnail: 'https://images.unsplash.com/photo-1594035910387-fea081ac05b2?w=200', quantity: 1, size_ml: 100 },
  { id: '2', name: 'Golden Saffron', brand: 'AuraPerfume', price: 6499, thumbnail: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=200', quantity: 2, size_ml: 100 },
];

export default function CartPage() {
  const [items, setItems] = useState(sampleCart);
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = subtotal >= 2000 ? 0 : 99;
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal - discount + shipping + tax;

  const updateQty = (id: string, qty: number) => { if (qty < 1) return; setItems(items.map(i => i.id === id ? { ...i, quantity: qty } : i)); };
  const removeItem = (id: string) => setItems(items.filter(i => i.id !== id));
  const applyCoupon = () => { if (coupon.toUpperCase() === 'WELCOME20') { setDiscount(Math.min(subtotal * 0.2, 500)); } };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-gold-gradient mb-8" style={{ fontFamily: 'Playfair Display, serif' }}>Shopping Cart</h1>
      {items.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🛒</p>
          <p className="text-xl text-zinc-500 mb-4">Your cart is empty</p>
          <a href="/products" className="btn-gold">Browse Products</a>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-4">
            {items.map(item => (
              <div key={item.id} className="glass-card p-5 flex gap-5 items-center">
                <img src={item.thumbnail} alt={item.name} className="w-24 h-24 object-cover rounded-xl" />
                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-[2px]" style={{ color: '#d4af37' }}>{item.brand}</p>
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                  <p className="text-sm text-zinc-500">{item.size_ml}ml</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(item.id, item.quantity - 1)} className="w-8 h-8 rounded-lg border border-zinc-700 flex items-center justify-center hover:border-[#d4af37]">−</button>
                  <span className="w-8 text-center font-semibold">{item.quantity}</span>
                  <button onClick={() => updateQty(item.id, item.quantity + 1)} className="w-8 h-8 rounded-lg border border-zinc-700 flex items-center justify-center hover:border-[#d4af37]">+</button>
                </div>
                <p className="font-bold text-lg w-28 text-right" style={{ color: '#d4af37' }}>{formatPrice(item.price * item.quantity)}</p>
                <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-300 text-lg">✕</button>
              </div>
            ))}
          </div>
          <div>
            <div className="glass-card p-6 sticky top-24">
              <h3 className="font-bold text-lg mb-6">Order Summary</h3>
              <div className="space-y-3 text-sm mb-6">
                <div className="flex justify-between"><span className="text-zinc-400">Subtotal</span><span>{formatPrice(subtotal)}</span></div>
                {discount > 0 && <div className="flex justify-between text-green-400"><span>Discount</span><span>-{formatPrice(discount)}</span></div>}
                <div className="flex justify-between"><span className="text-zinc-400">Shipping</span><span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span></div>
                <div className="flex justify-between"><span className="text-zinc-400">Tax (18% GST)</span><span>{formatPrice(tax)}</span></div>
                <hr className="border-zinc-700" />
                <div className="flex justify-between text-lg font-bold"><span>Total</span><span style={{ color: '#d4af37' }}>{formatPrice(total)}</span></div>
              </div>
              <div className="flex gap-2 mb-6">
                <input value={coupon} onChange={e => setCoupon(e.target.value)} placeholder="Coupon code" className="input-luxury !py-2 flex-1 !text-sm" id="coupon-input" />
                <button onClick={applyCoupon} className="btn-gold !py-2 !px-4 !text-sm">Apply</button>
              </div>
              <a href="/checkout" className="btn-gold w-full text-center block" id="checkout-btn">Proceed to Checkout →</a>
              <p className="text-xs text-zinc-500 text-center mt-3">Free shipping on orders above ₹2,000</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
