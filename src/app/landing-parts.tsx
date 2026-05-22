"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  Check,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  MessageCircle,
  ShieldCheck,
  Tag,
  Wrench,
  Zap,
} from "lucide-react";
import Link from "next/link";

const gold = "#C9A227";
const dGold = "#6B5010";
const K = "#111111";

// ─── DATA ────────────────────────────────────────────────────────────────────

export const trustChips = [
  "Free estimates",
  "Specialized crews",
  "Clear updates",
  "No upfront payment",
  "Insured",
  "GTA + KW service area",
];

export const equipmentChips = [
  "Water-fed pole systems",
  "Commercial pressure washers",
  "Soft-wash systems",
  "Gutter flush tools",
  "Insured & equipped",
];

export const processSteps = [
  {
    icon: ClipboardList,
    title: "Request a quote",
    text: "Send service + address. 2 minutes.",
  },
  {
    icon: MessageCircle,
    title: "We confirm the scope",
    text: "Quick call or text to lock the work and timing.",
  },
  {
    icon: CalendarCheck,
    title: "We show up prepared",
    text: "Right equipment, careful work, digital invoice when done.",
  },
];

export const reassuranceItems = [
  {
    icon: ShieldCheck,
    title: "Professional standards",
    text: "Clear scope, proper gear, tidy worksite.",
  },
  {
    icon: BadgeCheck,
    title: "Clear communication",
    text: "Updates before, during, and after the job.",
  },
  {
    icon: Zap,
    title: "Proper equipment",
    text: "Commercial-grade tools for every surface.",
  },
  {
    icon: Tag,
    title: "Better every visit",
    text: "Repeat clients get priority slots and faster quotes.",
  },
];

export const faqItems = [
  {
    q: "Are you insured?",
    a: "Yes. If you need proof of insurance before booking, ask during the quote process and we'll confirm the details.",
  },
  {
    q: "Do I need to be home?",
    a: "No. We need access to the work area and a way to reach you. We text when we arrive and when the job is done.",
  },
  {
    q: "What areas do you serve?",
    a: "We serve homes across the GTA and the Kitchener-Waterloo area, including Oakville, Mississauga, Burlington, Hamilton, Kitchener, Waterloo, and Cambridge.",
  },
  {
    q: "How do I pay?",
    a: "We send a digital invoice after the job is done. Pay by e-transfer, credit card, or phone. No payment upfront.",
  },
  {
    q: "How do you price jobs?",
    a: "Every property is different, so we quote after reviewing the service, address, access, and any notes you send. Estimates are free and there is no obligation.",
  },
  {
    q: "What equipment do you use?",
    a: "Depends on the job. Windows are cleaned with water-fed pole systems on every floor (safer than ladders and reaches second- and third-storey panes easily). Pressure washing uses commercial-grade hot-water machines. Gutters get proper flush attachments. We don't use consumer hardware on client properties.",
  },
];

export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  },
};

// ─── FAQ ACCORDION ───────────────────────────────────────────────────────────

export function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-3">
      {faqItems.map((item, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-black/10 bg-white">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between px-6 py-4 text-left font-bold text-black transition hover:bg-[#F5F4F0]"
          >
            <span>{item.q}</span>
            <motion.span
              animate={{ rotate: open === i ? 45 : 0 }}
              transition={{ duration: 0.2 }}
              className="ml-4 shrink-0 text-2xl font-black leading-none"
              style={{ color: dGold }}
            >
              +
            </motion.span>
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <p className="px-6 pb-5 text-sm leading-7 text-black/65">{item.a}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

// ─── CHARACTER COMPONENTS (PNG-based, brand-matched) ─────────────────────────
// Each service panel uses a full-bleed crop so the illustration fills the frame.

const bob = {
  animate: { y: [0, -8, 0] },
  transition: { duration: 3, repeat: Infinity, ease: "easeInOut" as const },
};

// Per-image crop/zoom config: transform is applied to a wrapper so it
// works independently of Next.js fill internals.
const CHAR_CONFIG: Record<string, { contain?: boolean; wrapStyle?: React.CSSProperties }> = {
  "/workers/landscaping-v3.png": {
    contain: true,
    wrapStyle: { transform: "scale(1.6) translateY(6%)", transformOrigin: "center top" },
  },
  "/workers/gutter-v3.png": {
    contain: true,
    wrapStyle: { transform: "scale(1.4) translateX(10%)", transformOrigin: "center center" },
  },
};

function CharacterImage({ src, alt, priority = false }: { src: string; alt: string; priority?: boolean }) {
  const cfg = CHAR_CONFIG[src];
  return (
    <motion.div
      animate={bob.animate}
      transition={bob.transition}
      className="relative h-full w-full overflow-hidden"
    >
      {/* Inner wrapper handles per-image zoom/translate */}
      <div className="absolute inset-0" style={cfg?.wrapStyle}>
        <Image
          src={src}
          alt={alt}
          priority={priority}
          fill
          sizes="(min-width: 768px) 40vw, 100vw"
          className={cfg?.contain ? "object-contain" : "object-cover"}
        />
      </div>
    </motion.div>
  );
}

function WorkerWindowCleaner() {
  return <CharacterImage src="/workers/window-v3.png" alt="Doorway Detail window cleaning crew member" />;
}

function WorkerPressureWasher() {
  return <CharacterImage src="/workers/pressure-v3.png" alt="Doorway Detail pressure washing crew member" />;
}

function WorkerLandscaper() {
  return <CharacterImage src="/workers/landscaping-v3.png" alt="Doorway Detail landscaping crew member" />;
}

function WorkerGutterCleaner() {
  return <CharacterImage src="/workers/gutter-v3.png" alt="Doorway Detail gutter cleaning crew member" />;
}

// Team composition for hero + Full Exterior tab — single composite illustration.
export function WorkerTeamFull() {
  return (
    <motion.div
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      className="flex h-full w-full items-center justify-center"
    >
      <Image
        src="/workers/team-v4.png"
        alt="Doorway Detail crew — gutter, window, and landscaping"
        width={1172}
        height={634}
        priority
        className="h-auto max-h-full w-full max-w-full object-contain"
      />
    </motion.div>
  );
}

// ─── SERVICES SECTION ─────────────────────────────────────────────────────────

interface ServiceEntry {
  title: string;
  summary: string;
  bullets: string[];
  Character: React.FC;
}

const SERVICES: ServiceEntry[] = [
  {
    title: "Window Cleaning",
    summary: "Crystal-clear glass, streak-free results on every pane.",
    bullets: [
      "Exterior windows — every floor",
      "Screens, tracks, and frames",
      "Water-fed pole systems — safer than ladders",
    ],
    Character: WorkerWindowCleaner,
  },
  {
    title: "Pressure Washing",
    summary: "Commercial-grade equipment removes years of buildup from hard surfaces.",
    bullets: [
      "Driveways, walkways, and patios",
      "Decks, fences, and siding",
      "Calibrated pressure — safe on all surfaces",
    ],
    Character: WorkerPressureWasher,
  },
  {
    title: "Landscaping",
    summary: "Tidy exterior details that make the whole property look cared for.",
    bullets: [
      "Weed removal and edge cleanup",
      "Garden beds and seasonal tidy",
      "Full landscaping and seasonal property work",
    ],
    Character: WorkerLandscaper,
  },
  {
    title: "Gutter Cleaning",
    summary: "Clear gutters and downspouts before they cause water damage.",
    bullets: [
      "Full debris removal and gutter flush",
      "Downspout clearing and inspection",
      "Soffit and fascia detailing on request",
    ],
    Character: WorkerGutterCleaner,
  },
  {
    title: "Full Exterior Package",
    summary: "Every core service in one coordinated visit.",
    bullets: [
      "Windows, gutters, pressure washing, and landscaping",
      "Clear scope before the crew arrives",
      "Useful for spring and fall property resets",
    ],
    Character: WorkerTeamFull,
  },
];

export function ServicesSection() {
  const [active, setActive] = useState(0);
  const service = SERVICES[active];

  return (
    <section id="services" className="scroll-mt-24 px-5 py-20 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12">
          <p className="text-sm font-black uppercase tracking-[0.24em]" style={{ color: dGold }}>
            Services
          </p>
          <h2 className="mt-3 max-w-2xl text-4xl font-black text-black sm:text-5xl">
            Every service, done properly.
          </h2>
        </div>

        <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
          {/* Tab list */}
          <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:pb-0">
            {SERVICES.map((s, i) => {
              const isPopular = s.title === "Full Exterior Package";
              return (
                <button
                  key={s.title}
                  onClick={() => setActive(i)}
                  className={`relative shrink-0 rounded-xl px-5 py-4 text-left text-sm font-bold transition lg:w-full ${
                    active === i
                      ? "text-black shadow-md"
                      : "border border-black/10 bg-[#F5F4F0] text-black/60 hover:border-black/25 hover:text-black"
                  }`}
                  style={active === i ? { backgroundColor: gold } : {}}
                >
                  {isPopular && (
                    <span
                      className="absolute -right-1 -top-2 rounded-full bg-black px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-sm"
                      style={{ color: gold }}
                    >
                      Most Popular
                    </span>
                  )}
                  {s.title}
                </button>
              );
            })}
          </div>

          {/* Character + info panel */}
          <div className="overflow-hidden rounded-2xl border border-black/10 bg-[#F5F4F0]">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, x: 28 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -28 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="grid md:grid-cols-[1.15fr_0.85fr]"
              >
                <div className="flex flex-col justify-center p-7 lg:p-9">
                  <h3 className="text-3xl font-black text-black lg:text-4xl">{service.title}</h3>
                  <p className="mt-4 text-base leading-7 text-black/65">{service.summary}</p>
                  <ul className="mt-6 space-y-3">
                    {service.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-3 text-sm font-semibold text-black/75">
                        <CheckCircle2 size={17} className="mt-0.5 shrink-0" style={{ color: dGold }} />
                        {b}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/quote"
                    className="mt-7 inline-flex w-fit items-center gap-2 rounded-lg bg-black px-5 py-3 text-sm font-black text-white transition hover:bg-[#C9A227] hover:text-black"
                  >
                    Request this service
                    <ArrowRight size={16} />
                  </Link>
                </div>
                <div className="relative h-[380px] overflow-hidden bg-white md:h-[460px]">
                  <service.Character />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Full Exterior callout — keep below character panel */}
        <div
          className="mt-6 rounded-xl border bg-black px-6 py-6 text-white shadow-lg lg:px-8"
          style={{ borderColor: `${gold}55` }}
        >
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em]" style={{ color: gold }}>
                Best value
              </p>
              <h3 className="mt-2 text-2xl font-black">Book the Full Exterior Package</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">
                Windows, pressure washing, gutter cleaning, and landscaping in one coordinated visit.
                We confirm the scope first so the crew shows up prepared.
              </p>
            </div>
            <Link
              href="/quote"
              className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-4 font-black text-black transition hover:bg-white"
              style={{ backgroundColor: gold }}
            >
              Book the Package
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── JOB LIFECYCLE ANIMATION ──────────────────────────────────────────────────

const LIFECYCLE_STAGES = [
  { label: "Quote sent", Icon: ClipboardList },
  { label: "Scheduled", Icon: CalendarCheck },
  { label: "In progress", Icon: Wrench },
  { label: "Invoiced", Icon: CreditCard },
  { label: "Paid", Icon: BadgeCheck },
];

export function JobLifecycleAnimation() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive((p) => (p + 1) % LIFECYCLE_STAGES.length), 1800);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border border-black/10 bg-[#F5F4F0] p-6 lg:p-10"
    >
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div>
          <div className="mb-6">
            <p className="text-sm font-black uppercase tracking-[0.18em]" style={{ color: dGold }}>
              Your job, start to finish
            </p>
            <h3 className="mt-2 text-2xl font-black text-black lg:text-3xl">No payment upfront.</h3>
            <p className="mt-3 max-w-md text-sm leading-6 text-black/60">
              Free quote first. We invoice after the job is done — pay online, no cash, no chasing.
            </p>
          </div>

      {/* Mobile: vertical list */}
      <div className="flex flex-col gap-3 sm:hidden">
        {LIFECYCLE_STAGES.map((stage, i) => {
          const isActive = i === active;
          const isDone = i < active;
          return (
            <div key={stage.label} className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                {isActive && (
                  <span
                    className="absolute inset-0 animate-ping rounded-full opacity-40"
                    style={{ backgroundColor: gold }}
                  />
                )}
                <div
                  className="relative grid h-10 w-10 place-items-center rounded-full border-2 transition-all duration-500"
                  style={{
                    backgroundColor: isActive ? gold : isDone ? K : "white",
                    borderColor: isActive || isDone ? gold : "rgba(0,0,0,0.12)",
                  }}
                >
                  {isDone ? (
                    <Check size={16} color={gold} />
                  ) : (
                    <stage.Icon size={16} color={isActive ? "#fff" : "rgba(0,0,0,0.35)"} />
                  )}
                </div>
              </div>
              <p
                className="text-sm font-black transition-all duration-300"
                style={{ color: isActive ? K : isDone ? dGold : "rgba(0,0,0,0.35)" }}
              >
                {stage.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Desktop: horizontal with progress line */}
      <div className="hidden sm:block">
        <div className="relative flex items-start justify-between">
          {/* Background track */}
          <div
            className="absolute left-5 right-5 top-5 h-0.5"
            style={{ backgroundColor: "rgba(0,0,0,0.10)" }}
          />
          {/* Animated fill */}
          <motion.div
            className="absolute left-5 top-5 h-0.5 origin-left"
            style={{ backgroundColor: gold }}
            animate={{ scaleX: active / (LIFECYCLE_STAGES.length - 1) }}
            transition={{ duration: 0.45, ease: "easeInOut" }}
          />
          {LIFECYCLE_STAGES.map((stage, i) => {
            const isActive = i === active;
            const isDone = i < active;
            return (
              <div key={stage.label} className="relative z-10 flex flex-col items-center gap-2">
                <div className="relative">
                  {isActive && (
                    <span
                      className="absolute inset-0 animate-ping rounded-full opacity-40"
                      style={{ backgroundColor: gold }}
                    />
                  )}
                  <div
                    className="relative grid h-10 w-10 place-items-center rounded-full border-2 transition-all duration-500"
                    style={{
                      backgroundColor: isActive ? gold : isDone ? K : "white",
                      borderColor: isActive || isDone ? gold : "rgba(0,0,0,0.12)",
                    }}
                  >
                    {isDone ? (
                      <CheckCircle2 size={16} color={gold} />
                    ) : (
                      <stage.Icon size={16} color={isActive ? "#fff" : "rgba(0,0,0,0.35)"} />
                    )}
                  </div>
                </div>
                <p
                  className="max-w-[64px] text-center text-xs font-black transition-all duration-300"
                  style={{ color: isActive ? K : isDone ? dGold : "rgba(0,0,0,0.35)" }}
                >
                  {stage.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
        </div>

        {/* Right column — reassurance / proof block */}
        <div className="rounded-xl border border-black/10 bg-white p-5 lg:p-6">
          <p className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: dGold }}>
            Why this matters
          </p>
          <ul className="mt-4 space-y-3 text-sm font-semibold text-black/75">
            {[
              "Free quote — no obligation, no upsell",
              "We don't get paid until the work is finished",
              "Pay online from a digital invoice — no cash or e-transfer chasing",
              "Insured, with proof of insurance on request",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2">
                <Check size={16} className="mt-0.5 shrink-0" style={{ color: gold }} />
                {line}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}

// ─── ANIMATED UPDATE-CARD ICONS ───────────────────────────────────────────────

export function OnTheWayAnim() {
  return (
    <div className="relative inline-flex h-10 w-10 items-center justify-center">
      <motion.span
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: `${gold}33` }}
        animate={{ scale: [1, 1.7, 1], opacity: [0.6, 0, 0.6] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
      />
      <motion.svg
        viewBox="0 0 24 24"
        width="26"
        height="26"
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        className="relative"
      >
        <path
          d="M12 2 C7.6 2 4 5.6 4 10 C4 16 12 22 12 22 C12 22 20 16 20 10 C20 5.6 16.4 2 12 2 Z"
          fill={gold}
          stroke={K}
          strokeWidth="1.2"
        />
        <circle cx="12" cy="10" r="3" fill="#fff" />
      </motion.svg>
    </div>
  );
}

export function JobDoneAnim() {
  return (
    <motion.div
      className="inline-flex h-10 w-10 items-center justify-center rounded-full"
      style={{ backgroundColor: gold }}
      initial={{ scale: 0.6, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 220, damping: 14, delay: 0.1 }}
    >
      <motion.svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <motion.path
          d="M5 12.5 L10 17.5 L19 7"
          fill="none"
          stroke="#fff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: 0.35, ease: "easeOut" }}
        />
      </motion.svg>
    </motion.div>
  );
}

export function DigitalInvoiceAnim() {
  return (
    <div className="relative inline-flex h-10 w-10 items-center justify-center overflow-hidden">
      <motion.svg
        viewBox="0 0 24 24"
        width="28"
        height="28"
        initial={{ y: 18, opacity: 0, rotate: -8 }}
        whileInView={{ y: 0, opacity: 1, rotate: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.55, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      >
        <rect x="4" y="2.5" width="16" height="19" rx="2" fill="#fff" stroke={K} strokeWidth="1.5" />
        <rect x="4" y="2.5" width="16" height="4" rx="2" fill={gold} />
        <line x1="7" y1="11" x2="17" y2="11" stroke={dGold} strokeWidth="1.4" strokeLinecap="round" />
        <line x1="7" y1="14" x2="15" y2="14" stroke={dGold} strokeWidth="1.4" strokeLinecap="round" />
        <line x1="7" y1="17" x2="13" y2="17" stroke={dGold} strokeWidth="1.4" strokeLinecap="round" />
        <motion.circle
          cx="17.5"
          cy="18"
          r="3"
          fill={gold}
          stroke={K}
          strokeWidth="1.2"
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.7, type: "spring", stiffness: 300, damping: 14 }}
        />
      </motion.svg>
    </div>
  );
}
