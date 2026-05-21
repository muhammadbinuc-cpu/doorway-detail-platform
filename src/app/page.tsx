"use client";

import Link from "next/link";
import { motion, useInView, useMotionValue, animate } from "framer-motion";
import { useEffect, useRef } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Sparkles, Droplets, Wind, Shield, ArrowRight, CheckCircle, Phone, Mail,
  Leaf, Package, Zap, Home, BadgeCheck, CreditCard,
} from "lucide-react";

// ─── Data ────────────────────────────────────────────────────────────────────

interface Service {
  icon: LucideIcon;
  title: string;
  bullets: string[];
  featured: boolean;
}

const SERVICES: Service[] = [
  { icon: Droplets, title: "Pressure Washing",       bullets: ["Driveway", "Deck & Patio", "Siding & Fencing"],       featured: false },
  { icon: Sparkles, title: "Window Cleaning",         bullets: ["Interior & Exterior", "Frames & Tracks", "Screens"],   featured: false },
  { icon: Wind,     title: "Gutter Detail",           bullets: ["Full Cleanout", "Downspout Flush", "Visual Inspect"],  featured: false },
  { icon: Leaf,     title: "Weed Removal",            bullets: ["Garden Beds", "Driveway Borders", "Walkways"],         featured: false },
  { icon: Package,  title: "Full Exterior Package",   bullets: ["All 4 services bundled", "Best value — one visit", "Tailored to your property"], featured: true },
];

const WHY_US = [
  { icon: Shield,     title: "Fully Insured",          desc: "We carry full liability. Your property is always protected." },
  { icon: Leaf,       title: "Eco-Friendly",            desc: "Biodegradable products, safe for kids, pets, and gardens." },
  { icon: Zap,        title: "Same-Day Response",       desc: "We don't leave you waiting. Expect a call back within hours." },
  { icon: Home,       title: "Local Oakville Experts",  desc: "Oakville-based, not a franchise. We know your neighbourhood." },
  { icon: BadgeCheck, title: "Satisfaction Guaranteed", desc: "Not happy? We come back and make it right. No questions." },
  { icon: CreditCard, title: "Easy Online Payment",     desc: "Secure Stripe checkout from your phone. No cash needed." },
];

// TODO: Replace with real verified customer testimonials before marketing push
const TESTIMONIALS = [
  {
    quote: "Doorway Detail transformed our driveway — it looks brand new. Professional, on time, and the pricing was completely transparent.",
    name: "James T.",
    location: "Oakville, ON",
  },
  {
    quote: "Best window cleaning I've ever had. They cleaned the frames and screens too. Will 100% be using them every season.",
    name: "Maria S.",
    location: "Oakville, ON",
  },
  {
    quote: "Gutters were completely clogged. They cleared everything and showed me before/after photos. Incredible service.",
    name: "David K.",
    location: "Oakville, ON",
  },
];

const FAQ = [
  { q: "Do I need to be home?",                       a: "No — we just need access to the areas being cleaned. We'll confirm all details with you before arrival." },
  { q: "How long does it take?",                      a: "Most jobs take 1–3 hours depending on the scope. We'll give you a time estimate upfront." },
  { q: "Are your products safe for pets & plants?",   a: "Yes. We use biodegradable, eco-certified products only. Safe for the whole family." },
];

// ─── Shared animation variants ────────────────────────────────────────────────

const cardContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};
const cardItem = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

// ─── Counter component ────────────────────────────────────────────────────────

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(motionValue, to, { duration: 1.5, ease: "easeOut" });
    return controls.stop;
  }, [isInView, to, motionValue]);

  useEffect(() => {
    return motionValue.on("change", (v) => {
      if (ref.current) ref.current.textContent = Math.round(v) + suffix;
    });
  }, [motionValue, suffix]);

  return <span ref={ref}>0{suffix}</span>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">

      {/* ── Navigation ── */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-lg bg-black/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-black italic tracking-tight"
          >
            DOORWAY <span className="text-[#D4AF37]">DETAIL</span>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
              Staff Login
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-20 overflow-hidden">
        {/* Background depth layers */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(212,175,55,0.12)_0%,_transparent_65%)] pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-[#D4AF37]/10 blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-[#D4AF37]/8 blur-[120px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center z-10">
          {/* Word-by-word headline */}
          <div className="mb-6 overflow-hidden">
            <h1 className="text-6xl md:text-8xl font-black leading-tight tracking-tight flex flex-wrap justify-center gap-x-5">
              {["Detail", "Done"].map((word, i) => (
                <motion.span
                  key={word}
                  initial={{ opacity: 0, y: 80 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                  className="inline-block"
                >
                  {word}
                </motion.span>
              ))}
              <motion.span
                initial={{ opacity: 0, y: 80 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
                className="inline-block text-[#D4AF37] italic"
              >
                Flawlessly
              </motion.span>
            </h1>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="text-xl md:text-2xl text-gray-400 mb-10 max-w-3xl mx-auto leading-relaxed"
          >
            Premium exterior cleaning for homeowners in Glen Abbey, Bronte, and Old Oakville.
            Pressure washing, window cleaning, gutter detailing — done right, every time.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link
              href="/quote"
              className="group bg-[#D4AF37] text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-white transition-all flex items-center gap-2 shadow-xl shadow-[#D4AF37]/25 hover:shadow-2xl hover:shadow-[#D4AF37]/35 transform hover:scale-105"
            >
              Get Free Estimate
              <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
            </Link>
            <a
              href="tel:289-772-5757"
              className="border-2 border-white/20 text-white px-8 py-4 rounded-full font-bold text-lg hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all flex items-center gap-2"
            >
              <Phone size={18} />
              Call 289-772-5757
            </a>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.85 }}
            className="text-sm text-gray-500 mt-6 tracking-wide"
          >
            ✓ No deposit required &nbsp;·&nbsp; ✓ Free estimates &nbsp;·&nbsp; ✓ Same-day response
          </motion.p>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="bg-[#D4AF37] text-black py-12 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-5xl font-black"><Counter to={50} suffix="+" /></p>
            <p className="text-xs font-bold uppercase tracking-widest opacity-60 mt-1">Homes Cleaned</p>
          </div>
          <div>
            <p className="text-5xl font-black">5.0★</p>
            <p className="text-xs font-bold uppercase tracking-widest opacity-60 mt-1">Rated</p>
          </div>
          <div>
            <p className="text-5xl font-black"><Counter to={100} suffix="%" /></p>
            <p className="text-xs font-bold uppercase tracking-widest opacity-60 mt-1">Satisfaction</p>
          </div>
          <div>
            <p className="text-5xl font-black">Local</p>
            <p className="text-xs font-bold uppercase tracking-widest opacity-60 mt-1">Based & Insured</p>
          </div>
        </div>
      </section>

      {/* ── Services Grid ── */}
      <section className="py-24 px-6 bg-zinc-950">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-black mb-4 tracking-tight">
              Our <span className="text-[#D4AF37]">Services</span>
            </h2>
            <p className="text-gray-400 text-lg">Transforming your home's exterior with meticulous care</p>
          </motion.div>

          {/* 4 standard cards */}
          <motion.div
            variants={cardContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            {SERVICES.filter((s) => !s.featured).map((service) => (
              <motion.div
                key={service.title}
                variants={cardItem}
                whileHover={{ scale: 1.03, y: -6 }}
                className="group bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-3xl p-7 hover:border-[#D4AF37]/50 transition-all flex flex-col"
              >
                <div className="bg-[#D4AF37]/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-[#D4AF37] transition-colors">
                  <service.icon className="text-[#D4AF37] group-hover:text-black transition-colors" size={26} />
                </div>
                <h3 className="text-xl font-bold mb-3">{service.title}</h3>
                <ul className="space-y-2 mb-6 flex-1">
                  {service.bullets.map((b) => (
                    <li key={b} className="text-gray-400 text-sm flex items-center gap-2">
                      <span className="text-[#D4AF37] font-bold text-xs">✓</span>
                      {b}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/quote"
                  className="text-[#D4AF37] text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all"
                >
                  Get a Quote <ArrowRight size={14} />
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {/* Featured Full Exterior Package */}
          {SERVICES.filter((s) => s.featured).map((service) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative bg-gradient-to-r from-[#D4AF37]/10 via-[#D4AF37]/5 to-transparent border-2 border-[#D4AF37]/40 rounded-3xl p-10 flex flex-col md:flex-row items-center justify-between gap-8 hover:border-[#D4AF37]/70 transition-all"
            >
              <div className="absolute top-5 right-5 bg-[#D4AF37] text-black text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                Most Popular
              </div>
              <div className="flex items-start gap-6">
                <div className="bg-[#D4AF37] w-16 h-16 rounded-2xl flex items-center justify-center shrink-0">
                  <service.icon className="text-black" size={30} />
                </div>
                <div>
                  <h3 className="text-2xl font-black mb-3">{service.title}</h3>
                  <ul className="flex flex-wrap gap-5">
                    {service.bullets.map((b) => (
                      <li key={b} className="text-gray-300 text-sm flex items-center gap-2">
                        <span className="text-[#D4AF37] font-bold">✓</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <Link
                href="/quote"
                className="shrink-0 bg-[#D4AF37] text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-white transition-all flex items-center gap-2 shadow-lg shadow-[#D4AF37]/20"
              >
                Book the Package <ArrowRight size={20} />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-24 px-6 bg-black">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl font-black tracking-tight">
              As Easy As <span className="text-[#D4AF37]">1, 2, 3</span>
            </h2>
          </motion.div>

          <div className="relative">
            {/* Connecting line — desktop only */}
            <div className="hidden md:block absolute top-6 left-[16%] right-[16%] h-px bg-gradient-to-r from-[#D4AF37]/20 via-[#D4AF37]/50 to-[#D4AF37]/20" />

            <motion.div
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.2 } } }}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center"
            >
              {[
                { n: "1", title: "Submit a Quote",      lines: ["2-min form online.", "No deposit, no commitment."] },
                { n: "2", title: "We Schedule",          lines: ["We call you within hours.", "You pick the date and time."] },
                { n: "3", title: "Enjoy the Results",    lines: ["We do the work.", "Pay securely online."] },
              ].map((step) => (
                <motion.div
                  key={step.n}
                  variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.6 } } }}
                  className="flex flex-col items-center"
                >
                  <div className="w-12 h-12 rounded-full bg-[#D4AF37] text-black font-black text-xl flex items-center justify-center mb-6 relative z-10 shadow-lg shadow-[#D4AF37]/30">
                    {step.n}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  {step.lines.map((l) => (
                    <p key={l} className="text-gray-400 text-sm leading-relaxed">{l}</p>
                  ))}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Why Choose Us ── */}
      <section className="py-24 px-6 bg-zinc-950">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-black tracking-tight">
              Why Oakville Homeowners{" "}
              <span className="text-[#D4AF37]">Choose Us</span>
            </h2>
          </motion.div>

          <motion.div
            variants={cardContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {WHY_US.map((item) => (
              <motion.div
                key={item.title}
                variants={cardItem}
                className="bg-black border border-white/10 rounded-3xl p-6 hover:border-[#D4AF37]/40 transition-all"
              >
                <div className="bg-[#D4AF37]/10 rounded-xl p-3 w-fit mb-4">
                  <item.icon className="text-[#D4AF37]" size={22} />
                </div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-24 px-6 bg-black">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-black tracking-tight">
              What Our <span className="text-[#D4AF37]">Clients Say</span>
            </h2>
          </motion.div>

          <motion.div
            variants={cardContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {TESTIMONIALS.map((t) => (
              <motion.div
                key={t.name}
                variants={cardItem}
                className="bg-zinc-900 border border-white/10 rounded-3xl p-8 flex flex-col"
              >
                <div className="text-8xl text-[#D4AF37]/20 font-black leading-none mb-1 select-none">&ldquo;</div>
                <p className="text-[#D4AF37] text-lg mb-4 tracking-wide">★★★★★</p>
                <p className="text-gray-300 italic leading-relaxed flex-1 mb-6">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="font-bold text-white">{t.name}</p>
                  <p className="text-gray-500 text-sm">{t.location}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Trust + FAQ ── */}
      <section className="py-24 px-6 bg-zinc-950">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-3xl font-black mb-8">
              Our <span className="text-[#D4AF37]">Promise</span>
            </h3>
            <ul className="space-y-5">
              {["Fully Insured", "Eco-Friendly Products", "Satisfaction Guaranteed", "Licensed & Local"].map((badge) => (
                <li key={badge} className="flex items-center gap-3 text-lg font-medium">
                  <CheckCircle className="text-[#D4AF37] shrink-0" size={22} />
                  {badge}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-3xl font-black mb-8">
              Common <span className="text-[#D4AF37]">Questions</span>
            </h3>
            <div className="divide-y divide-white/10">
              {FAQ.map((item) => (
                <details key={item.q} className="py-4 group">
                  <summary className="cursor-pointer text-[#D4AF37] font-bold list-none flex justify-between items-center hover:opacity-80 transition-opacity">
                    {item.q}
                    <span className="text-white/40 group-open:rotate-45 transition-transform inline-block text-xl font-light leading-none">+</span>
                  </summary>
                  <p className="text-gray-400 text-sm leading-relaxed mt-3">{item.a}</p>
                </details>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-zinc-950 border-t border-white/10 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center gap-8 mb-12">
            <h2 className="text-4xl font-bold tracking-tight">Ready to Transform Your Home?</h2>
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
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            </div>
            <p className="italic">Detail Done Flawlessly</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
