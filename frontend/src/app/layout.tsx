import type { Metadata } from "next";
import "./globals.css";
import Navbar from "../components/Navbar";

export const metadata: Metadata = {
  title: "AuraPerfume — Luxury Fragrances",
  description: "Discover exquisite luxury perfumes crafted for the discerning connoisseur. Premium oud, floral, woody, and fresh fragrances.",
  keywords: "perfume, luxury, fragrance, oud, floral, cologne, AuraPerfume",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <Navbar />

        <main className="pt-20">{children}</main>

        <footer style={{ background: '#0d0d14', borderTop: '1px solid rgba(212,175,55,0.1)' }} className="mt-20">
          <div className="max-w-7xl mx-auto px-6 py-16">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
              <div>
                <h3 className="text-xl font-bold text-gold-gradient mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>AuraPerfume</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">Crafting exquisite luxury fragrances for those who appreciate the art of scent.</p>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-4 tracking-wider uppercase text-zinc-300">Shop</h4>
                <div className="flex flex-col gap-2">
                  <a href="/products?category=men" className="text-sm text-zinc-500 hover:text-[#d4af37]">Men</a>
                  <a href="/products?category=women" className="text-sm text-zinc-500 hover:text-[#d4af37]">Women</a>
                  <a href="/products?category=unisex" className="text-sm text-zinc-500 hover:text-[#d4af37]">Unisex</a>
                  <a href="/products?fragranceFamily=oud" className="text-sm text-zinc-500 hover:text-[#d4af37]">Oud Collection</a>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-4 tracking-wider uppercase text-zinc-300">Company</h4>
                <div className="flex flex-col gap-2">
                  <a href="/contact" className="text-sm text-zinc-500 hover:text-[#d4af37]">Contact Us</a>
                  <a href="#" className="text-sm text-zinc-500 hover:text-[#d4af37]">About</a>
                  <a href="#" className="text-sm text-zinc-500 hover:text-[#d4af37]">Careers</a>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-4 tracking-wider uppercase text-zinc-300">Newsletter</h4>
                <p className="text-sm text-zinc-500 mb-3">Get exclusive offers and new arrivals.</p>
                <div className="flex gap-2">
                  <input type="email" placeholder="Your email" className="input-luxury !py-2 !text-sm flex-1" />
                  <button className="btn-gold !py-2 !px-4 !text-sm">→</button>
                </div>
              </div>
            </div>
            <div className="border-t border-zinc-800 mt-12 pt-8 text-center text-sm text-zinc-600">
              © 2024 AuraPerfume. All rights reserved. | Premium Luxury Fragrances
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
