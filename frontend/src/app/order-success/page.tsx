export default function OrderSuccessPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="glass-card p-12 text-center max-w-lg">
        <div className="text-7xl mb-6">🎉</div>
        <h1 className="text-3xl font-bold text-gold-gradient mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>Order Placed!</h1>
        <p className="text-zinc-400 mb-2">Your order has been confirmed and is being processed.</p>
        <p className="text-sm text-zinc-500 mb-8">Order #AP-LXRH42-9KM2 • You will receive a confirmation email shortly.</p>
        <div className="glass-card p-6 mb-8 text-left">
          <div className="flex justify-between text-sm mb-2"><span className="text-zinc-400">Estimated Delivery</span><span className="font-semibold">3-5 Business Days</span></div>
          <div className="flex justify-between text-sm mb-2"><span className="text-zinc-400">Payment</span><span className="text-green-400 font-semibold">✓ Confirmed</span></div>
          <div className="flex justify-between text-sm"><span className="text-zinc-400">Total Paid</span><span className="font-bold" style={{ color: '#d4af37' }}>₹20,056</span></div>
        </div>
        <div className="flex gap-4 justify-center">
          <a href="/orders" className="btn-gold">View Orders</a>
          <a href="/products" className="btn-outline-gold">Continue Shopping</a>
        </div>
      </div>
    </div>
  );
}
