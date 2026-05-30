"use client";

import { useState } from "react";
import { Phone, Star, Quote } from "lucide-react";

const gold = "#C9A227";
const dGold = "#6B5010";

// ─────────────────────────────────────────────────────────────────────────────
// BEFORE / AFTER
// Drop real photos in /public and fill `before`/`after` to get an interactive
// drag-slider. Items without photos render an honest "coming soon" tile.
// ─────────────────────────────────────────────────────────────────────────────

interface BAItem {
    label: string;
    before?: string; // e.g. "/before-after/driveway-before.jpg"
    after?: string;
}

const beforeAfterItems: BAItem[] = [
    { label: "Driveway pressure wash" },
    { label: "Window restoration" },
    { label: "Gutter flush" },
    { label: "Full exterior reset" },
];

function BeforeAfterSlider({ item }: { item: BAItem }) {
    const [pos, setPos] = useState(50);
    return (
        <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-black/10 bg-[#F5F4F0] select-none">
            {/* AFTER (full) */}
            <img src={item.after} alt={`${item.label} after`} className="absolute inset-0 h-full w-full object-cover" />
            {/* BEFORE (clipped to slider position) */}
            <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
                <img src={item.before} alt={`${item.label} before`} className="absolute inset-0 h-full w-full object-cover" />
                <span className="absolute left-3 top-3 rounded bg-black/70 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white">Before</span>
            </div>
            <span className="absolute right-3 top-3 rounded px-2 py-1 text-[10px] font-black uppercase tracking-wide text-black" style={{ backgroundColor: gold }}>After</span>
            {/* Handle line */}
            <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow" style={{ left: `${pos}%` }} />
            <input
                type="range" min={0} max={100} value={pos}
                onChange={(e) => setPos(Number(e.target.value))}
                aria-label={`${item.label} before and after slider`}
                className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
            />
            <p className="absolute bottom-3 left-3 text-sm font-black text-white drop-shadow">{item.label}</p>
        </div>
    );
}

function ComingSoonTile({ label }: { label: string }) {
    return (
        <div className="flex aspect-[16/10] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-black/15 bg-[#F5F4F0] p-6 text-center">
            <div className="grid h-10 w-10 place-items-center rounded-full" style={{ backgroundColor: `${gold}22`, color: dGold }}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                </svg>
            </div>
            <p className="text-sm font-black text-black">{label}</p>
            <p className="text-xs text-black/45">Photo coming soon</p>
        </div>
    );
}

export function BeforeAfterGallery() {
    return (
        <section className="px-5 py-20 lg:px-8 lg:py-24">
            <div className="mx-auto max-w-7xl">
                <div className="mb-12 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl">
                        <p className="text-sm font-black uppercase tracking-[0.24em]" style={{ color: dGold }}>Before &amp; after</p>
                        <h2 className="mt-3 text-4xl font-black text-black sm:text-5xl">See the difference, side by side.</h2>
                        <p className="mt-4 text-base leading-7 text-black/65">Real jobs. Same surface, before and after — drag to compare.</p>
                    </div>
                    <a href="tel:289-772-5757" className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-black/15 bg-white px-5 py-3 text-sm font-black text-black transition hover:border-black lg:self-end">
                        <Phone size={16} /> Book yours: 289-772-5757
                    </a>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    {beforeAfterItems.map((item) =>
                        item.before && item.after
                            ? <BeforeAfterSlider key={item.label} item={item} />
                            : <ComingSoonTile key={item.label} label={item.label} />
                    )}
                </div>
            </div>
        </section>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// TESTIMONIALS
// ⚠️ PLACEHOLDER DATA. Replace with real customer reviews (e.g. pulled from your
// Google Business profile) BEFORE publishing. Posting fabricated reviews is
// deceptive and violates Canada's Competition Act. Until real ones exist, the
// section renders an honest "reviews coming soon" prompt instead.
// ─────────────────────────────────────────────────────────────────────────────

interface Testimonial {
    quote: string;
    name: string;
    location: string;
    rating: number;
}

// Leave empty until you have real reviews to show. Example shape:
// { quote: "...", name: "Sarah M.", location: "Oakville", rating: 5 }
const testimonials: Testimonial[] = [];

export function Testimonials() {
    return (
        <section className="px-5 py-20 lg:px-8 lg:py-24">
            <div className="mx-auto max-w-7xl">
                <div className="mb-12 max-w-2xl">
                    <p className="text-sm font-black uppercase tracking-[0.24em]" style={{ color: dGold }}>What clients say</p>
                    <h2 className="mt-3 text-4xl font-black text-black sm:text-5xl">Trusted across the GTA.</h2>
                </div>

                {testimonials.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-black/15 bg-[#F5F4F0] px-6 py-14 text-center">
                        <div className="flex gap-1" style={{ color: gold }}>
                            {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={20} fill="currentColor" />)}
                        </div>
                        <p className="max-w-md text-base font-bold text-black">Real reviews from Oakville homeowners, coming soon.</p>
                        <p className="max-w-md text-sm text-black/55">We just finished a job? <a href="tel:289-772-5757" className="font-bold text-black hover:underline">Tell us how we did.</a></p>
                    </div>
                ) : (
                    <div className="grid gap-5 md:grid-cols-3">
                        {testimonials.map((t, i) => (
                            <figure key={i} className="flex flex-col rounded-xl border border-black/10 bg-white p-6 shadow-sm">
                                <Quote size={24} style={{ color: gold }} />
                                <blockquote className="mt-4 flex-1 text-base leading-7 text-black/80">&ldquo;{t.quote}&rdquo;</blockquote>
                                <div className="mt-5 flex gap-0.5" style={{ color: gold }}>
                                    {Array.from({ length: t.rating }).map((_, s) => <Star key={s} size={15} fill="currentColor" />)}
                                </div>
                                <figcaption className="mt-3 text-sm font-black text-black">
                                    {t.name} <span className="font-semibold text-black/45">· {t.location}</span>
                                </figcaption>
                            </figure>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
