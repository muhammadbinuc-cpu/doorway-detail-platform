"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
const skin = "#F5C89A";
const K = "#111111";

// ─── DATA ────────────────────────────────────────────────────────────────────

export const trustChips = [
  "Free estimates",
  "Specialized crews",
  "Clear updates",
  "No upfront payment",
  "Insured",
  "GTA service area",
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
    text: "Send the service, address, and any details. Takes 2 minutes.",
  },
  {
    icon: MessageCircle,
    title: "We confirm the scope",
    text: "We call or text back fast — confirming the work, timing, access needs, and what to expect on the day.",
  },
  {
    icon: CalendarCheck,
    title: "We show up prepared",
    text: "The right equipment for the task, careful work, and a digital invoice sent as soon as we're done.",
  },
];

export const reassuranceItems = [
  {
    icon: ShieldCheck,
    title: "Professional standards",
    text: "We confirm the scope clearly, use the right equipment, and leave the work area tidy.",
  },
  {
    icon: BadgeCheck,
    title: "Clear communication",
    text: "We keep you updated before arrival, after completion, and when the invoice is ready.",
  },
  {
    icon: Zap,
    title: "Proper equipment",
    text: "Water-fed poles, commercial pressure washers, soft-wash systems. We bring what the job actually needs — not whatever fits in a van.",
  },
  {
    icon: Tag,
    title: "Better every visit",
    text: "Return clients get priority scheduling, seasonal bundle recommendations, and a crew that already knows the property.",
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
    a: "We serve homes across the GTA, including Oakville, Mississauga, Burlington, Brampton, Hamilton, and nearby areas.",
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
    a: "Depends on the job. Windows get water-fed pole systems for upper floors and traditional squeegees for lower. Pressure washing uses commercial-grade hot-water machines. Gutters get proper flush attachments. We don't use consumer hardware on client properties.",
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

// ─── CHARACTER SVGs ───────────────────────────────────────────────────────────
// All use viewBox="0 0 300 360". Character centered at x=150, head at cy=68.

function WorkerWindowCleaner() {
  return (
    <svg viewBox="0 0 300 360" className="h-full w-full" aria-hidden="true">
      {/* Window pane */}
      <rect x="188" y="45" width="100" height="128" rx="4" fill="white" stroke={K} strokeWidth="3.5" />
      <line x1="238" y1="45" x2="238" y2="173" stroke={K} strokeWidth="2.5" />
      <line x1="188" y1="109" x2="288" y2="109" stroke={K} strokeWidth="2.5" />
      <path d="M196 56 L212 56 L196 78Z" fill="white" opacity="0.55" />
      {/* Animated squeegee arm */}
      <motion.g
        animate={{ rotate: [-20, 6, -20] }}
        style={{ transformOrigin: "192px 130px" }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <line x1="192" y1="130" x2="253" y2="72" stroke={K} strokeWidth="7" strokeLinecap="round" />
        <rect x="246" y="59" width="33" height="10" rx="4" fill={gold} stroke={K} strokeWidth="3"
          transform="rotate(-42 253 67)" />
        <line x1="248" y1="70" x2="277" y2="48" stroke={K} strokeWidth="3.5" strokeLinecap="round" />
        <line x1="192" y1="120" x2="192" y2="134" stroke={K} strokeWidth="22" strokeLinecap="round" />
      </motion.g>
      {/* Character with idle bob */}
      <motion.g animate={{ y: [0, -5, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
        <circle cx="150" cy="68" r="34" fill={skin} stroke={K} strokeWidth="3.5" />
        <path d="M116 68 C116 32 184 32 184 68 C180 50 170 40 160 37 C153 34 147 34 140 37 C128 42 118 54 116 68Z" fill={K} />
        <circle cx="139" cy="64" r="4.5" fill={K} />
        <circle cx="161" cy="64" r="4.5" fill={K} />
        <path d="M137 81 Q150 93 163 81" stroke={K} strokeWidth="3" fill="none" strokeLinecap="round" />
        <rect x="143" y="102" width="14" height="18" fill={skin} />
        <path d="M108 120 Q112 110 130 110 L170 110 Q188 110 192 120 L192 210 L108 210Z" fill={gold} stroke={K} strokeWidth="3.5" />
        <rect x="141" y="112" width="18" height="9" rx="2" fill={dGold} stroke={K} strokeWidth="2" />
        <rect x="108" y="207" width="84" height="13" rx="3" fill={dGold} stroke={K} strokeWidth="2.5" />
        <line x1="108" y1="134" x2="72" y2="196" stroke={K} strokeWidth="22" strokeLinecap="round" />
        <line x1="192" y1="134" x2="206" y2="116" stroke={K} strokeWidth="22" strokeLinecap="round" />
        <rect x="108" y="220" width="34" height="90" rx="6" fill={K} />
        <rect x="158" y="220" width="34" height="90" rx="6" fill={K} />
        <ellipse cx="121" cy="313" rx="27" ry="11" fill={gold} stroke={K} strokeWidth="3" />
        <ellipse cx="173" cy="313" rx="27" ry="11" fill={gold} stroke={K} strokeWidth="3" />
      </motion.g>
    </svg>
  );
}

function WorkerPressureWasher() {
  return (
    <svg viewBox="0 0 300 360" aria-hidden="true" className="h-full w-full">
      <rect x="10" y="308" width="280" height="38" rx="4" fill="#E5E4E0" stroke={K} strokeWidth="2.5" />
      {/* Water spray */}
      <motion.g
        animate={{ opacity: [0.5, 1, 0.5], x: [-3, 3, -3] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <path d="M207 252 C228 272 248 287 252 308" stroke="#5EADC9" strokeWidth="5" strokeLinecap="round" fill="none" strokeDasharray="8 6" />
        <path d="M207 252 C234 264 256 274 264 296" stroke="#5EADC9" strokeWidth="4" strokeLinecap="round" fill="none" strokeDasharray="6 8" />
        <path d="M207 252 C220 276 226 295 228 312" stroke="#5EADC9" strokeWidth="3" strokeLinecap="round" fill="none" strokeDasharray="5 9" opacity="0.7" />
        {[0, 1, 2].map((i) => (
          <motion.circle key={i} cx={237 + i * 12} cy={296 + i * 5} r={5}
            fill="#5EADC9" opacity="0.7"
            animate={{ opacity: [0, 0.9, 0], scale: [0.4, 1.6, 0.4] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.25 }}
          />
        ))}
      </motion.g>
      {/* Wand */}
      <motion.g
        animate={{ rotate: [-7, 7, -7] }}
        style={{ transformOrigin: "180px 190px" }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <line x1="180" y1="190" x2="210" y2="252" stroke={K} strokeWidth="8" strokeLinecap="round" />
        <line x1="200" y1="228" x2="222" y2="220" stroke={K} strokeWidth="12" strokeLinecap="round" />
        <circle cx="210" cy="254" r="8" fill={gold} stroke={K} strokeWidth="3" />
        <line x1="210" y1="256" x2="210" y2="267" stroke={K} strokeWidth="5" />
      </motion.g>
      <motion.g animate={{ y: [0, -4, 0] }} transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}>
        <circle cx="150" cy="68" r="34" fill={skin} stroke={K} strokeWidth="3.5" />
        <path d="M116 65 C116 32 184 32 184 65Z" fill={K} />
        <rect x="108" y="59" width="84" height="12" rx="5" fill={K} />
        <circle cx="139" cy="64" r="4.5" fill={K} />
        <circle cx="161" cy="64" r="4.5" fill={K} />
        <path d="M137 81 Q150 93 163 81" stroke={K} strokeWidth="3" fill="none" strokeLinecap="round" />
        <rect x="143" y="102" width="14" height="18" fill={skin} />
        <path d="M108 120 Q112 110 130 110 L170 110 Q188 110 192 120 L192 210 L108 210Z" fill={gold} stroke={K} strokeWidth="3.5" />
        <rect x="141" y="112" width="18" height="9" rx="2" fill={dGold} stroke={K} strokeWidth="2" />
        <rect x="108" y="207" width="84" height="13" rx="3" fill={dGold} stroke={K} strokeWidth="2.5" />
        <line x1="108" y1="134" x2="74" y2="196" stroke={K} strokeWidth="22" strokeLinecap="round" />
        <line x1="192" y1="134" x2="214" y2="180" stroke={K} strokeWidth="22" strokeLinecap="round" />
        <rect x="108" y="220" width="34" height="90" rx="6" fill={K} />
        <rect x="158" y="220" width="34" height="90" rx="6" fill={K} />
        <ellipse cx="121" cy="313" rx="27" ry="11" fill={gold} stroke={K} strokeWidth="3" />
        <ellipse cx="173" cy="313" rx="27" ry="11" fill={gold} stroke={K} strokeWidth="3" />
      </motion.g>
    </svg>
  );
}

function WorkerLandscaper() {
  return (
    <svg viewBox="0 0 300 360" aria-hidden="true" className="h-full w-full">
      <rect x="10" y="308" width="280" height="38" rx="4" fill="#C8D8A0" stroke={K} strokeWidth="2.5" />
      <path d="M36 310 C38 294 45 284 47 279 C49 284 52 295 51 310" fill="#7A9E52" stroke={K} strokeWidth="2" />
      <path d="M54 310 C55 298 60 290 63 286 C65 290 67 300 66 310" fill="#6A8C44" stroke={K} strokeWidth="2" />
      <path d="M218 310 C220 296 226 287 229 283 C231 287 234 297 233 310" fill="#7A9E52" stroke={K} strokeWidth="2" />
      <path d="M236 310 C237 300 241 292 244 288 C246 292 248 302 246 310" fill="#8AAE5C" stroke={K} strokeWidth="1.5" />
      {/* Rake animated */}
      <motion.g
        animate={{ rotate: [-12, 12, -12] }}
        style={{ transformOrigin: "196px 148px" }}
        transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }}
      >
        <line x1="196" y1="148" x2="256" y2="306" stroke={K} strokeWidth="7" strokeLinecap="round" />
        <rect x="238" y="298" width="40" height="12" rx="3" fill={gold} stroke={K} strokeWidth="3"
          transform="rotate(-20 256 304)" />
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={i} x1={242 + i * 8} y1={305} x2={240 + i * 8} y2={320}
            stroke={K} strokeWidth="2.5" strokeLinecap="round"
            transform="rotate(-20 256 304)" />
        ))}
      </motion.g>
      <motion.g animate={{ y: [0, -4, 0] }} transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}>
        <circle cx="150" cy="68" r="34" fill={skin} stroke={K} strokeWidth="3.5" />
        <path d="M116 68 C116 32 184 32 184 68 C180 52 172 42 164 38 C158 35 150 34 143 37 C130 42 118 55 116 68Z" fill={K} />
        <path d="M184 58 C196 72 193 95 181 108" stroke={K} strokeWidth="9" strokeLinecap="round" fill="none" />
        <circle cx="139" cy="64" r="4.5" fill={K} />
        <circle cx="161" cy="64" r="4.5" fill={K} />
        <path d="M137 81 Q150 93 163 81" stroke={K} strokeWidth="3" fill="none" strokeLinecap="round" />
        <rect x="143" y="102" width="14" height="18" fill={skin} />
        <path d="M108 120 Q112 110 130 110 L170 110 Q188 110 192 120 L192 210 L108 210Z" fill={gold} stroke={K} strokeWidth="3.5" />
        <rect x="141" y="112" width="18" height="9" rx="2" fill={dGold} stroke={K} strokeWidth="2" />
        <rect x="108" y="207" width="84" height="13" rx="3" fill={dGold} stroke={K} strokeWidth="2.5" />
        <line x1="108" y1="134" x2="72" y2="196" stroke={K} strokeWidth="22" strokeLinecap="round" />
        <line x1="192" y1="134" x2="216" y2="162" stroke={K} strokeWidth="22" strokeLinecap="round" />
        <rect x="108" y="220" width="34" height="90" rx="6" fill={K} />
        <rect x="158" y="220" width="34" height="90" rx="6" fill={K} />
        <ellipse cx="121" cy="313" rx="27" ry="11" fill={gold} stroke={K} strokeWidth="3" />
        <ellipse cx="173" cy="313" rx="27" ry="11" fill={gold} stroke={K} strokeWidth="3" />
      </motion.g>
    </svg>
  );
}

function WorkerGutterCleaner() {
  return (
    <svg viewBox="0 0 300 360" aria-hidden="true" className="h-full w-full">
      {/* Gutter at top of frame */}
      <path d="M20 36 L150 8 L280 36" fill="none" stroke={K} strokeWidth="4.5" strokeLinejoin="round" />
      <rect x="20" y="34" width="260" height="18" rx="4" fill="#D0CFCC" stroke={K} strokeWidth="3.5" />
      {[0, 1, 2, 3].map((i) => (
        <ellipse key={i} cx={52 + i * 54} cy="43" rx="12" ry="6" fill="#7A9E52" opacity="0.9" />
      ))}
      {/* Falling debris */}
      {[0, 1, 2].map((i) => (
        <motion.circle key={i} cx={112 + i * 30} cy={58} r={5} fill="#7A9E52"
          animate={{ y: [0, 50, 0], opacity: [0, 1, 0] }}
          transition={{ duration: 1.7, repeat: Infinity, delay: i * 0.5, ease: "easeIn" }}
        />
      ))}
      {/* Long pole to gutter */}
      <motion.g
        animate={{ rotate: [-4, 4, -4] }}
        style={{ transformOrigin: "192px 134px" }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <line x1="192" y1="134" x2="162" y2="52" stroke={K} strokeWidth="7" strokeLinecap="round" />
        <rect x="148" y="38" width="36" height="20" rx="4" fill={gold} stroke={K} strokeWidth="3.5"
          transform="rotate(-8 166 48)" />
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={i} x1={151 + i * 7} y1={52} x2={150 + i * 7} y2={65}
            stroke={K} strokeWidth="2.5" strokeLinecap="round"
            transform="rotate(-8 166 48)" />
        ))}
      </motion.g>
      <motion.g animate={{ y: [0, -5, 0] }} transition={{ duration: 2.7, repeat: Infinity, ease: "easeInOut" }}>
        <circle cx="150" cy="68" r="34" fill={skin} stroke={K} strokeWidth="3.5" />
        <path d="M116 65 C116 32 184 32 184 65Z" fill={K} />
        <rect x="108" y="59" width="84" height="12" rx="5" fill={K} />
        <circle cx="139" cy="64" r="4.5" fill={K} />
        <circle cx="161" cy="64" r="4.5" fill={K} />
        <path d="M137 81 Q150 93 163 81" stroke={K} strokeWidth="3" fill="none" strokeLinecap="round" />
        <rect x="143" y="102" width="14" height="18" fill={skin} />
        <path d="M108 120 Q112 110 130 110 L170 110 Q188 110 192 120 L192 210 L108 210Z" fill={gold} stroke={K} strokeWidth="3.5" />
        <rect x="141" y="112" width="18" height="9" rx="2" fill={dGold} stroke={K} strokeWidth="2" />
        <rect x="108" y="207" width="84" height="13" rx="3" fill={dGold} stroke={K} strokeWidth="2.5" />
        <line x1="108" y1="134" x2="72" y2="196" stroke={K} strokeWidth="22" strokeLinecap="round" />
        <line x1="192" y1="134" x2="205" y2="114" stroke={K} strokeWidth="22" strokeLinecap="round" />
        <rect x="108" y="220" width="34" height="90" rx="6" fill={K} />
        <rect x="158" y="220" width="34" height="90" rx="6" fill={K} />
        <ellipse cx="121" cy="313" rx="27" ry="11" fill={gold} stroke={K} strokeWidth="3" />
        <ellipse cx="173" cy="313" rx="27" ry="11" fill={gold} stroke={K} strokeWidth="3" />
      </motion.g>
    </svg>
  );
}

// Two workers side by side — used for hero + Full Exterior tab
export function WorkerTeamFull() {
  const sc = 0.72;
  // Worker base at original scale, translated and scaled via transform
  return (
    <svg viewBox="0 0 420 360" aria-hidden="true" className="h-full w-full">
      {/* Left worker — curly hair, squeegee */}
      <motion.g animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
        <g transform={`translate(22, 18) scale(${sc})`}>
          <circle cx="150" cy="68" r="34" fill={skin} stroke={K} strokeWidth="3.5" />
          <path d="M116 68 C116 32 184 32 184 68 C180 50 170 40 160 37 C153 34 147 34 140 37 C128 42 118 54 116 68Z" fill={K} />
          <circle cx="139" cy="64" r="4.5" fill={K} />
          <circle cx="161" cy="64" r="4.5" fill={K} />
          <path d="M137 81 Q150 93 163 81" stroke={K} strokeWidth="3" fill="none" strokeLinecap="round" />
          <rect x="143" y="102" width="14" height="18" fill={skin} />
          <path d="M108 120 Q112 110 130 110 L170 110 Q188 110 192 120 L192 210 L108 210Z" fill={gold} stroke={K} strokeWidth="3.5" />
          <rect x="141" y="112" width="18" height="9" rx="2" fill={dGold} stroke={K} strokeWidth="2" />
          <rect x="108" y="207" width="84" height="13" rx="3" fill={dGold} stroke={K} strokeWidth="2.5" />
          <line x1="108" y1="134" x2="72" y2="196" stroke={K} strokeWidth="22" strokeLinecap="round" />
          <line x1="192" y1="134" x2="214" y2="106" stroke={K} strokeWidth="22" strokeLinecap="round" />
          <line x1="214" y1="106" x2="252" y2="68" stroke={K} strokeWidth="6" strokeLinecap="round" />
          <rect x="244" y="55" width="30" height="10" rx="3" fill={gold} stroke={K} strokeWidth="3"
            transform="rotate(-42 252 63)" />
          <rect x="108" y="220" width="34" height="90" rx="6" fill={K} />
          <rect x="158" y="220" width="34" height="90" rx="6" fill={K} />
          <ellipse cx="121" cy="313" rx="27" ry="11" fill={gold} stroke={K} strokeWidth="3" />
          <ellipse cx="173" cy="313" rx="27" ry="11" fill={gold} stroke={K} strokeWidth="3" />
        </g>
      </motion.g>

      {/* Right worker — cap, broom */}
      <motion.g animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.75 }}>
        <g transform={`translate(204, 18) scale(${sc})`}>
          <circle cx="150" cy="68" r="34" fill={skin} stroke={K} strokeWidth="3.5" />
          <path d="M116 65 C116 32 184 32 184 65Z" fill={K} />
          <rect x="108" y="59" width="84" height="12" rx="5" fill={K} />
          <circle cx="139" cy="64" r="4.5" fill={K} />
          <circle cx="161" cy="64" r="4.5" fill={K} />
          <path d="M137 81 Q150 93 163 81" stroke={K} strokeWidth="3" fill="none" strokeLinecap="round" />
          <rect x="143" y="102" width="14" height="18" fill={skin} />
          <path d="M108 120 Q112 110 130 110 L170 110 Q188 110 192 120 L192 210 L108 210Z" fill={gold} stroke={K} strokeWidth="3.5" />
          <rect x="141" y="112" width="18" height="9" rx="2" fill={dGold} stroke={K} strokeWidth="2" />
          <rect x="108" y="207" width="84" height="13" rx="3" fill={dGold} stroke={K} strokeWidth="2.5" />
          <line x1="108" y1="134" x2="72" y2="196" stroke={K} strokeWidth="22" strokeLinecap="round" />
          <line x1="192" y1="134" x2="210" y2="170" stroke={K} strokeWidth="22" strokeLinecap="round" />
          <line x1="210" y1="170" x2="234" y2="302" stroke={K} strokeWidth="7" strokeLinecap="round" />
          <rect x="218" y="295" width="34" height="11" rx="3" fill={gold} stroke={K} strokeWidth="3"
            transform="rotate(-18 234 300)" />
          <rect x="108" y="220" width="34" height="90" rx="6" fill={K} />
          <rect x="158" y="220" width="34" height="90" rx="6" fill={K} />
          <ellipse cx="121" cy="313" rx="27" ry="11" fill={gold} stroke={K} strokeWidth="3" />
          <ellipse cx="173" cy="313" rx="27" ry="11" fill={gold} stroke={K} strokeWidth="3" />
        </g>
      </motion.g>
    </svg>
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
      "Exterior and interior windows",
      "Screens, tracks, and frames",
      "Water-fed pole systems for upper floors",
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
      "Light property tidy — not full landscaping work",
    ],
    Character: WorkerLandscaper,
  },
  {
    title: "Gutter Cleaning",
    summary: "Clear gutters and downspouts before they cause water damage.",
    bullets: [
      "Full debris removal and gutter flush",
      "Downspout clearing and inspection",
      "Soffit and fascia detail on request",
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
            {SERVICES.map((s, i) => (
              <button
                key={s.title}
                onClick={() => setActive(i)}
                className={`shrink-0 rounded-xl px-5 py-4 text-left text-sm font-bold transition lg:w-full ${
                  active === i
                    ? "text-black shadow-md"
                    : "border border-black/10 bg-[#F5F4F0] text-black/60 hover:border-black/25 hover:text-black"
                }`}
                style={active === i ? { backgroundColor: gold } : {}}
              >
                {s.title}
              </button>
            ))}
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
                className="grid md:grid-cols-[1fr_1.1fr]"
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
                <div className="flex min-h-[300px] items-end justify-center bg-white px-6 pb-0 pt-6">
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
      className="rounded-xl border border-black/10 bg-[#F5F4F0] p-5"
    >
      <div className="mb-6">
        <p className="text-sm font-black uppercase tracking-[0.18em]" style={{ color: dGold }}>
          Your job, start to finish
        </p>
        <h3 className="mt-2 text-2xl font-black text-black">No payment upfront.</h3>
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
    </motion.div>
  );
}
