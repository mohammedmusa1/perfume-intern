'use client';
import { useState, useEffect } from 'react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState({
    fname: 'Riya',
    lname: 'Sharma',
    street: '42 Marine Drive',
    city: 'Mumbai',
    state: 'Maharashtra',
    zip: '400020',
    phone: '9876543210',
  });

  // Dynamically load Razorpay SDK script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const amount = 20056; // in INR
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_SvDHRw08qyVnPl',
        amount: amount * 100, // Razorpay works in paisa
        currency: 'INR',
        name: 'AuraPerfume',
        description: 'Order Payment for AP-LXRH42-9KM2',
        image: 'https://images.unsplash.com/photo-1594035910387-fea081ac05b2?w=100',
        handler: function (response: any) {
          // Trigger order success routing on authorized payment
          window.location.href = `/order-success?payment_id=${response.razorpay_payment_id}`;
        },
        prefill: {
          name: `${address.fname} ${address.lname}`,
          email: 'customer@example.com',
          contact: address.phone,
        },
        notes: {
          address: `${address.street}, ${address.city}, ${address.state} - ${address.zip}`,
        },
        theme: {
          color: '#d4af37', // luxury gold theme
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        alert(`Payment failed: ${response.error.description}`);
      });
      rzp.open();
    } catch (err) {
      console.error('Payment initiation failed', err);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-gold-gradient mb-8" style={{ fontFamily: 'Playfair Display, serif' }}>Checkout</h1>
      <div className="grid lg:grid-cols-2 gap-10">
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h2 className="font-bold text-lg mb-4" style={{ color: '#d4af37' }}>Shipping Address</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wider text-zinc-400 mb-1 block">First Name</label>
                  <input
                    value={address.fname}
                    onChange={(e) => setAddress({ ...address, fname: e.target.value })}
                    className="input-luxury"
                    id="checkout-fname"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-zinc-400 mb-1 block">Last Name</label>
                  <input
                    value={address.lname}
                    onChange={(e) => setAddress({ ...address, lname: e.target.value })}
                    className="input-luxury"
                    id="checkout-lname"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-zinc-400 mb-1 block">Street Address</label>
                <input
                  value={address.street}
                  onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  className="input-luxury"
                  id="checkout-street"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wider text-zinc-400 mb-1 block">City</label>
                  <input
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className="input-luxury"
                    id="checkout-city"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-zinc-400 mb-1 block">State</label>
                  <input
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    className="input-luxury"
                    id="checkout-state"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-zinc-400 mb-1 block">PIN Code</label>
                  <input
                    value={address.zip}
                    onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                    className="input-luxury"
                    id="checkout-zip"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-zinc-400 mb-1 block">Phone</label>
                <input
                  type="tel"
                  value={address.phone}
                  onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                  className="input-luxury"
                  id="checkout-phone"
                />
              </div>
            </div>
          </div>
          <div className="glass-card p-6">
            <h2 className="font-bold text-lg mb-4" style={{ color: '#d4af37' }}>Payment Method</h2>
            <div className="space-y-3">
              {['Razorpay (UPI, Card, NetBanking)'].map(m => (
                <label key={m} className="flex items-center gap-3 p-3 rounded-xl border border-[#d4af37] bg-zinc-900/50 cursor-pointer">
                  <input type="radio" name="payment" className="accent-[#d4af37]" defaultChecked /> <span>{m}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div>
          <div className="glass-card p-6 sticky top-24">
            <h2 className="font-bold text-lg mb-4">Order Summary</h2>
            <div className="space-y-3 text-sm mb-6">
              <div className="flex justify-between"><span className="text-zinc-400">Royal Oud Noir × 1</span><span>₹3,999</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Golden Saffron × 2</span><span>₹12,998</span></div>
              <hr className="border-zinc-700" />
              <div className="flex justify-between"><span className="text-zinc-400">Subtotal</span><span>₹16,997</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Shipping</span><span className="text-green-400">Free</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Tax (18%)</span><span>₹3,059</span></div>
              <hr className="border-zinc-700" />
              <div className="flex justify-between text-lg font-bold"><span>Total</span><span style={{ color: '#d4af37' }}>₹20,056</span></div>
            </div>
            <button onClick={handlePayment} className="btn-gold w-full text-center justify-center text-lg" id="place-order-btn" disabled={loading}>
              {loading ? 'Opening payment gateway...' : 'Place Order & Pay →'}
            </button>
            <p className="text-xs text-zinc-500 text-center mt-3">🔒 Secured by Razorpay</p>
          </div>
        </div>
      </div>
    </div>
  );
}
