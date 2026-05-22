"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Mail,
  Phone,
  ShieldCheck,
  Zap,
} from "lucide-react";
import {
  DigitalInvoiceAnim,
  FaqAccordion,
  JobDoneAnim,
  JobLifecycleAnimation,
  OnTheWayAnim,
  ServicesSection,
  WorkerTeamFull,
  equipmentChips,
  processSteps,
  reassuranceItems,
  trustChips,
} from "./landing-parts";
import { BrandMark } from "./brand-mark";

const gold = "#C9A227";
const dGold = "#6B5010";

const updateCards = [
  {
    Anim: OnTheWayAnim,
    title: "On the way",
    text: "Text when the crew is heading over.",
  },
  {
    Anim: JobDoneAnim,
    title: "Job done",
    text: "Message when the work is finished, before we leave.",
  },
  {
    Anim: DigitalInvoiceAnim,
    title: "Digital invoice",
    text: "Same-day invoice. Pay online — no cash, no chasing.",
  },
];

const returnPerks = [
  {
    value: "Smarter scheduling",
    title: "Return bookings",
    text: "Once we know the property, repeat visits are faster to scope, quote, and schedule.",
  },
  {
    value: "Service on file",
    title: "First access",
    text: "Property notes from your last visit mean the next quote takes minutes, not a walkthrough.",
  },
  {
    value: "Seasonal bundles",
    title: "Spring & fall resets",
    text: "Combine outside jobs into one visit and one practical quote when the season calls for it.",
  },
  {
    value: "Neighbour routing",
    title: "Same-street jobs",
    text: "If a neighbour books around the same time, we can often route both jobs and price it efficiently.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-[#111111]">

      {/* ── NAV ── */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-black/8 bg-white/92 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-4 lg:px-8">
          <Link href="/" aria-label="Doorway Detail home" className="text-base text-black sm:text-lg">
            <BrandMark />
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-semibold text-black/60 lg:flex">
            <a href="#services" className="transition hover:text-black">Services</a>
            <a href="#how-it-works" className="transition hover:text-black">How It Works</a>
            <a href="#why-doorway" className="transition hover:text-black">Why Doorway</a>
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <a href="tel:289-772-5757" className="inline-flex items-center gap-2 text-sm font-bold text-black/65 transition hover:text-black">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ backgroundColor: gold }} />
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: gold }} />
              </span>
              <Phone size={16} />
              289-772-5757
            </a>
            <Link href="/quote" className="inline-flex items-center gap-2 rounded-lg bg-black px-5 py-3 text-sm font-black text-white transition hover:bg-[#C9A227] hover:text-black">
              Get a Quote
              <ArrowRight size={16} />
            </Link>
          </div>
          <Link href="/quote" className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-3 text-sm font-black text-white md:hidden">
            Quote
            <ArrowRight size={15} />
          </Link>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="px-5 pb-16 pt-24 sm:pt-32 lg:px-8 lg:pb-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="mb-5 text-sm font-black uppercase tracking-[0.24em]" style={{ color: dGold }}>
              Serving the GTA &amp; KW area
            </p>
            <h1 className="max-w-3xl text-balance text-5xl font-black leading-[1.05] text-black sm:text-6xl lg:text-7xl">
              Premium exterior care. Zero headaches.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-black/65 sm:text-lg sm:leading-8">
              Stop chasing unreliable contractors. Get specialized crews for your windows, gutters, and
              landscaping who show up on time, communicate clearly, and never ask for upfront payment.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/quote"
                className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-4 text-base font-black text-black shadow-lg transition hover:bg-black hover:text-white"
                style={{ backgroundColor: gold }}
              >
                Get a Quote
                <ArrowRight size={19} />
              </Link>
              <a href="tel:289-772-5757"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-black/20 bg-white px-6 py-4 text-base font-black text-black transition hover:border-black"
              >
                <Phone size={18} />
                Call or Text
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-2">
              {trustChips.map((chip) => (
                <span key={chip} className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-[#F5F4F0] px-3 py-2 text-sm font-bold text-black/70 shadow-sm">
                  <Check size={14} style={{ color: dGold }} />
                  {chip}
                </span>
              ))}
            </div>
          </div>

          {/* Hero illustration */}
          <div className="flex h-[440px] items-end justify-center overflow-hidden rounded-2xl border border-black/10 bg-[#F5F4F0] px-4 pb-0 pt-8 sm:h-[480px] sm:px-6">
            <WorkerTeamFull />
          </div>
        </div>
      </section>

      {/* ── EQUIPMENT CREDIBILITY STRIP ── */}
      <section className="border-y border-black/8 bg-[#F5F4F0] px-5 py-10 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em]" style={{ color: dGold }}>
                Industrial equipment, every job.
              </p>
              <p className="mt-2 max-w-3xl text-base font-bold leading-7 text-black">
                We don&apos;t show up with consumer gear.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {equipmentChips.map((chip) => (
                <span key={chip}
                  className="inline-flex items-center gap-2 rounded-full border border-black/12 bg-white px-4 py-2 text-sm font-bold text-black/75"
                >
                  <Zap size={14} style={{ color: dGold }} />
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SATISFACTION GUARANTEE BAR ── */}
      <section className="px-5 py-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div
            className="flex flex-col items-start gap-3 rounded-xl border-l-4 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:gap-4 sm:px-6"
            style={{ borderColor: gold }}
          >
            <ShieldCheck size={26} style={{ color: dGold }} className="shrink-0" />
            <div className="flex-1">
              <p className="text-base font-black text-black">
                100% satisfaction — we don&apos;t leave until you&apos;re happy.
              </p>
              <p className="text-sm text-black/60">
                Missed a spot? We come back. No extra invoice.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICES (interactive tab section) ── */}
      <ServicesSection />

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="scroll-mt-24 bg-[#F5F4F0] px-5 py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 max-w-2xl">
            <p className="text-sm font-black uppercase tracking-[0.24em]" style={{ color: dGold }}>How it works</p>
            <h2 className="mt-3 text-4xl font-black text-black sm:text-5xl">Quote to clean.</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {processSteps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="rounded-xl border border-black/10 bg-white p-6 shadow-sm"
              >
                <div className="mb-8 flex items-center justify-between">
                  <step.icon size={26} style={{ color: dGold }} />
                  <span className="text-4xl font-black text-black/10">0{index + 1}</span>
                </div>
                <h3 className="text-xl font-black text-black">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-black/65">{step.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BEFORE / AFTER (placeholder until photo set is delivered) ── */}
      <section className="px-5 py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-black uppercase tracking-[0.24em]" style={{ color: dGold }}>
                Before &amp; after
              </p>
              <h2 className="mt-3 text-4xl font-black text-black sm:text-5xl">
                See the difference, side by side.
              </h2>
              <p className="mt-4 text-base leading-7 text-black/65">
                Real jobs. Same surface, before and after.
              </p>
            </div>
            <a
              href="tel:289-772-5757"
              className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-black/15 bg-white px-5 py-3 text-sm font-black text-black transition hover:border-black lg:self-end"
            >
              <Phone size={16} />
              Book yours: 289-772-5757
            </a>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {["Driveway pressure wash", "Window restoration", "Gutter flush", "Full exterior reset"].map((label) => (
              <div
                key={label}
                className="flex aspect-[16/10] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-black/15 bg-[#F5F4F0] p-6 text-center"
              >
                <div
                  className="grid h-10 w-10 place-items-center rounded-full"
                  style={{ backgroundColor: `${gold}22`, color: dGold }}
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </div>
                <p className="text-sm font-black text-black">{label}</p>
                <p className="text-xs text-black/45">Photo coming soon</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW WE KEEP YOU UPDATED ── */}
      <section className="px-5 py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 max-w-2xl">
            <p className="text-sm font-black uppercase tracking-[0.24em]" style={{ color: dGold }}>
              Always in the loop
            </p>
            <h2 className="mt-3 text-4xl font-black text-black sm:text-5xl">
              You&apos;re never left wondering.
            </h2>
          </div>
          <div className="space-y-6">
            <div className="grid gap-5 sm:grid-cols-3">
              {updateCards.map((card, i) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="rounded-xl border border-black/10 bg-[#F5F4F0] p-6"
                >
                  <card.Anim />
                  <h3 className="mt-4 text-xl font-black text-black">{card.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-black/65">{card.text}</p>
                </motion.div>
              ))}
            </div>
            <JobLifecycleAnimation />
          </div>
        </div>
      </section>

      {/* ── WHY DOORWAY ── */}
      <section id="why-doorway" className="scroll-mt-24 bg-[#111111] px-5 py-20 text-white lg:px-8 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em]" style={{ color: gold }}>Why Doorway</p>
            <h2 className="mt-3 text-4xl font-black text-white sm:text-5xl">
              One team for the outside jobs.
            </h2>
            <p className="mt-5 text-base leading-7 text-white/60">
              Clear scope, proper equipment, follow-up after. That&apos;s it.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {reassuranceItems.map((item) => (
              <div key={item.title} className="rounded-xl border border-white/10 bg-white/[0.04] p-6">
                <item.icon size={26} style={{ color: gold }} />
                <h3 className="mt-5 text-xl font-black">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/60">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SAME-STREET DISCOUNT ── */}
      <section className="px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div
            className="rounded-2xl border-2 p-8 lg:p-10"
            style={{ borderColor: gold, backgroundColor: `${gold}12` }}
          >
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.22em]" style={{ color: dGold }}>
                  Neighbour routing
                </p>
                <h2 className="mt-3 text-3xl font-black text-black">
                  Working on your street? Let us know.
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-7 text-black/65">
                  Neighbours booking around the same time? Mention it in the quote — we route together and discount accordingly.
                </p>
              </div>
              <Link
                href="/quote"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-black px-6 py-4 font-black text-white transition hover:bg-[#C9A227] hover:text-black"
              >
                Submit a quote
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── RETURN CLIENT PERKS ── */}
      <section className="bg-[#F5F4F0] px-5 py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.24em]" style={{ color: dGold }}>
                Return clients
              </p>
              <h2 className="mt-3 text-4xl font-black text-black sm:text-5xl">
                Better every time you book.
              </h2>
              <p className="mt-5 text-base leading-7 text-black/65">
                Repeat clients get priority time slots and faster quotes.
              </p>
              <Link
                href="/quote"
                className="mt-7 inline-flex items-center gap-2 rounded-lg bg-black px-6 py-4 font-black text-white transition hover:bg-[#C9A227] hover:text-black"
              >
                Get your first quote
                <ArrowRight size={18} />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {returnPerks.map((perk) => (
                <div key={perk.title} className="rounded-xl border border-black/10 bg-white p-5">
                  <p className="text-lg font-black" style={{ color: gold }}>{perk.value}</p>
                  <h3 className="mt-1 font-black text-black">{perk.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-black/60">{perk.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CUSTOM REQUESTS ── */}
      <section className="px-5 py-20 lg:px-8 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em]" style={{ color: dGold }}>
              Custom requests
            </p>
            <h2 className="mt-3 text-4xl font-black text-black sm:text-5xl">
              Something else on the outside of your home?
            </h2>
            <p className="mt-5 max-w-3xl text-base leading-7 text-black/60">
              If it&apos;s on the outside of your home, send it. We&apos;ll tell you straight what we can do.
            </p>
          </div>
          <Link
            href="/quote"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-6 py-4 font-black text-white transition hover:bg-[#C9A227] hover:text-black"
          >
            Tell us what you need
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-[#F5F4F0] px-5 py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.24em]" style={{ color: dGold }}>FAQ</p>
              <h2 className="mt-3 text-4xl font-black text-black sm:text-5xl">
                Common questions.
              </h2>
              <p className="mt-5 text-base leading-7 text-black/60">
                Still not sure? Call or text us at{" "}
                <a href="tel:289-772-5757" className="font-bold text-black hover:underline">
                  289-772-5757
                </a>{" "}
                and we&apos;ll answer directly.
              </p>
            </div>
            <FaqAccordion />
          </div>
        </div>
      </section>

      {/* ── CONTRACTORS ── */}
      <section className="px-5 py-14 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-xl border border-black/10 bg-[#F5F4F0] p-6 lg:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em]" style={{ color: dGold }}>
                Contractors
              </p>
              <h2 className="mt-2 text-2xl font-black text-black">Join the Doorway Detail team.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-black/60">
                We work with reliable contractors as the company grows. If you care about clean work,
                communication, and showing up prepared, reach out.
              </p>
            </div>
            <a
              href="mailto:doorwaydetail@gmail.com"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-black/15 bg-white px-5 py-4 font-black text-black transition hover:border-black"
            >
              <Mail size={18} />
              doorwaydetail@gmail.com
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#111111] px-5 pb-28 pt-16 text-white md:pb-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <BrandMark variant="dark" className="text-white" />
              <p className="mt-4 max-w-xl text-sm leading-6 text-white/50">
                Professional exterior cleaning with a quote-first booking process. Windows, gutters,
                pressure washing, and landscaping — across the GTA and KW area.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/quote"
                className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-4 font-black text-black transition hover:bg-white"
                style={{ backgroundColor: gold }}
              >
                Get a Quote
                <ArrowRight size={18} />
              </Link>
              <a
                href="tel:289-772-5757"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 px-6 py-4 font-black text-white transition hover:border-white/50"
              >
                <Phone size={18} />
                289-772-5757
              </a>
            </div>
          </div>
          <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-white/40 md:flex-row md:items-center md:justify-between">
            <p>&copy; {new Date().getFullYear()} Doorway Detail. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/privacy" className="transition hover:text-white">Privacy Policy</Link>
              <Link href="/terms" className="transition hover:text-white">Terms of Service</Link>
              <Link href="/login" className="transition hover:text-white">Staff Login</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* ── MOBILE STICKY CTA ── */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-black/10 bg-white/95 p-3 shadow-lg backdrop-blur md:hidden">
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/quote"
            className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-black text-black"
            style={{ backgroundColor: gold }}
          >
            Get Quote
            <ArrowRight size={16} />
          </Link>
          <a
            href="tel:289-772-5757"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#111111] px-4 py-3 text-sm font-black text-white"
          >
            <Phone size={16} />
            Call
          </a>
        </div>
      </div>
    </main>
  );
}
