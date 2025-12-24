"use client";

import { useState } from 'react';
import { Sparkles, Sprout, CloudRain, Phone, Mail } from 'lucide-react';
import Link from 'next/link';
import QuoteModal from '@/components/QuoteModal';

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen font-sans bg-white">
      <QuoteModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center py-24 text-center bg-black text-white px-4 sm:px-6 lg:px-8 overflow-hidden">

        {/* Decorative elements to mimic the clean detail look */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent opacity-50"></div>

        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
          {/* Logo/Title Representation */}
          <div className="mb-6 flex flex-col items-center">
            {/* Assuming a simple icon construction for the logo feel if no image provided, 
                    but text-based is safer. Using the "Roof" motif from flyer could be done with SVG but text is requested. */}
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight uppercase leading-tight">
              DOORWAY <br className="sm:hidden" />
              <span className="text-gold">DETAIL</span>
            </h1>
            <div className="w-24 h-1 bg-gold mt-4 rounded-full"></div>
          </div>

          <p className="text-xl md:text-2xl text-gray-300 mb-10 font-medium tracking-wide">
            Detail Done Flawlessly
          </p>

          <button
            onClick={() => setIsModalOpen(true)}
            className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold uppercase tracking-wider text-black bg-gold rounded-full overflow-hidden transition-transform active:scale-95 hover:shadow-[0_0_20px_rgba(212,175,55,0.5)]"
          >
            <span className="relative z-10">Get Instant Quote</span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
          </button>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="inline-block text-3xl md:text-4xl font-bold text-black border-b-4 border-gold pb-2">
              Our Services
            </h2>
            <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
              We will Elevate your home's curb appeal with expert exterior detailing services.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {/* Window Cleaning */}
            <div className="group bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-gold/30">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-gold/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-gold group-hover:text-black transition-colors duration-300 text-gold">
                  <Sparkles className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-extrabold text-black mb-4 uppercase">Window Cleaning</h3>
                <p className="text-gray-600 leading-relaxed">
                  Enhance your home with our expert window cleaning for brighter, inviting spaces
                </p>
              </div>
            </div>

            {/* Weed Removal */}
            <div className="group bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-gold/30">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-gold/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-gold group-hover:text-black transition-colors duration-300 text-gold">
                  <Sprout className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-extrabold text-black mb-4 uppercase">Weed Removal</h3>
                <p className="text-gray-600 leading-relaxed">
                  Boost your home's appeal with our grass-cutting and weed removal for a cleaner look
                </p>
              </div>
            </div>

            {/* Gutter Cleaning */}
            <div className="group bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-gold/30">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-gold/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-gold group-hover:text-black transition-colors duration-300 text-gold">
                  <CloudRain className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-extrabold text-black mb-4 uppercase">Gutter Cleaning</h3>
                <p className="text-gray-600 leading-relaxed">
                  Protect your home with our gutter cleaning service for optimal drainage and preservation
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer / Contact */}
      <footer className="bg-black text-white pt-16 pb-8 px-4 sm:px-6 lg:px-8 mt-auto border-t border-gold/20">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col items-center text-center gap-8 mb-12">
            <h2 className="text-3xl font-bold tracking-tight">Ready to transform your home?</h2>
            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
              <a href="tel:289-772-5757" className="flex items-center justify-center gap-3 bg-gold text-black px-8 py-4 rounded-full font-bold hover:bg-white transition-colors min-w-[280px]">
                <Phone className="w-5 h-5" />
                <span>Call or Text: 289-772-5757</span>
              </a>
              <a href="mailto:Doorwaydetail@gmail.com" className="flex items-center justify-center gap-3 bg-zinc-800 text-white border border-zinc-700 px-8 py-4 rounded-full font-bold hover:bg-zinc-700 transition-colors min-w-[280px]">
                <Mail className="w-5 h-5" />
                <span>Doorwaydetail@gmail.com</span>
              </a>
            </div>
          </div>

          <div className="h-px bg-zinc-800 w-full mb-8"></div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-zinc-500 text-sm">
            <p>&copy; {new Date().getFullYear()} Doorway Detail. All rights reserved.</p>
            <p>Detail Done Flawlessly</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
