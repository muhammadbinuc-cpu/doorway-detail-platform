"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Droplets, Wind, Shield, ArrowRight, CheckCircle, Phone, Mail } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-lg bg-black/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-black italic"
          >
            DOORWAY <span className="text-[#D4AF37]">DETAIL</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Link
              href="/login"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Staff Login
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl md:text-8xl font-black mb-6 leading-tight">
              Detail Done{" "}
              <span className="text-[#D4AF37] italic">Flawlessly</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            Premium exterior cleaning services for discerning homeowners in Oakville.
            Precision pressure washing, crystal-clear windows, and immaculate gutter detailing.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link
              href="/quote"
              className="group bg-[#D4AF37] text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-white transition-all flex items-center gap-2 shadow-xl shadow-[#D4AF37]/20 hover:shadow-2xl hover:shadow-[#D4AF37]/30 transform hover:scale-105"
            >
              Get Instant Quote
              <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
            </Link>
            <Link
              href="/admin"
              className="border-2 border-white/20 text-white px-8 py-4 rounded-full font-bold text-lg hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all"
            >
              Admin Login
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-24 px-6 bg-zinc-950">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-black mb-4">
              Our <span className="text-[#D4AF37]">Services</span>
            </h2>
            <p className="text-gray-400 text-lg">
              Transforming your home's exterior with meticulous care
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Droplets,
                title: "Pressure Washing",
                description: "High-powered cleaning for driveways, decks, and siding. Restore your home's original brilliance.",
                delay: 0,
              },
              {
                icon: Sparkles,
                title: "Window Cleaning",
                description: "Streak-free clarity inside and out. Professional results that let the light shine through.",
                delay: 0.2,
              },
              {
                icon: Wind,
                title: "Gutter Detail",
                description: "Prevent water damage with thorough cleaning and inspection. Peace of mind guaranteed.",
                delay: 0.4,
              },
            ].map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: service.delay }}
                whileHover={{ scale: 1.05, y: -10 }}
                className="group bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-3xl p-8 hover:border-[#D4AF37]/50 transition-all cursor-pointer"
              >
                <div className="bg-[#D4AF37]/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#D4AF37] transition-colors">
                  <service.icon className="text-[#D4AF37] group-hover:text-black transition-colors" size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-4">{service.title}</h3>
                <p className="text-gray-400 leading-relaxed">
                  {service.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto bg-gradient-to-r from-[#D4AF37]/10 to-transparent border border-[#D4AF37]/20 rounded-3xl p-12 text-center backdrop-blur-sm"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="text-[#D4AF37]" size={32} />
            <h3 className="text-3xl font-black">Trusted Excellence</h3>
          </div>
          <p className="text-xl text-gray-400 mb-6">
            Trusted by <span className="text-[#D4AF37] font-bold">50+ Homeowners</span> in Oakville
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <CheckCircle className="text-[#D4AF37]" size={16} />
              Fully Insured
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="text-[#D4AF37]" size={16} />
              Eco-Friendly Products
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="text-[#D4AF37]" size={16} />
              Satisfaction Guaranteed
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-950 border-t border-white/10 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center gap-8 mb-12">
            <h2 className="text-4xl font-bold">Ready to Transform Your Home?</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="tel:289-772-5757"
                className="flex items-center justify-center gap-3 bg-[#D4AF37] text-black px-8 py-4 rounded-full font-bold hover:bg-white transition-colors"
              >
                <Phone size={20} />
                Call: 289-772-5757
              </a>
              <a
                href="mailto:Doorwaydetail@gmail.com"
                className="flex items-center justify-center gap-3 border-2 border-white/20 text-white px-8 py-4 rounded-full font-bold hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all"
              >
                <Mail size={20} />
                Email Us
              </a>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <p>&copy; {new Date().getFullYear()} Doorway Detail. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
            </div>
            <p className="italic">Detail Done Flawlessly</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
