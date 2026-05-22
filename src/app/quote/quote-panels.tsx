import Link from "next/link";
import { Check, CheckCircle, Home } from "lucide-react";

export function QuoteSuccess({ name }: { name: string }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black p-5 text-center text-white">
      <div className="relative mb-8">
        <div className="absolute inset-0 rounded-full bg-[#C9A227] opacity-25 blur-3xl" />
        <div className="relative rounded-full border border-[#C9A227] bg-black p-8 shadow-[0_0_50px_rgba(201,162,39,0.28)]">
          <CheckCircle className="h-24 w-24 text-[#C9A227]" />
        </div>
      </div>

      <h1 className="text-5xl font-black tracking-normal text-white">
        Quote <span className="text-[#C9A227]">Received</span>
      </h1>

      <p className="mt-6 max-w-lg text-xl leading-relaxed text-white/62">
        Thank you, <span className="font-bold text-white">{name}</span>. We will contact you shortly to confirm the details and next steps.
      </p>

      <Link
        href="/"
        className="mt-10 inline-flex items-center gap-3 rounded-lg bg-[#C9A227] px-8 py-4 text-lg font-black text-black transition hover:bg-white"
      >
        <Home size={20} />
        Return to Home
      </Link>
    </main>
  );
}

export function QuoteIntro() {
  return (
    <aside className="rounded-lg bg-black p-6 text-white shadow-[0_22px_60px_rgba(17,17,17,0.18)]">
      <p className="text-sm font-black uppercase tracking-[0.22em] text-[#C9A227]">Quote request</p>
      <h1 className="mt-4 text-4xl font-black leading-tight">Tell us what your exterior needs.</h1>
      <p className="mt-4 text-sm leading-6 text-white/62">
        Choose the main service, add the details that matter, and we will confirm scope before scheduling.
      </p>
      <div className="mt-8 space-y-3 text-sm font-semibold text-white/72">
        {["Free estimate", "Call or text follow-up", "No backend account needed"].map((item) => (
          <div key={item} className="flex items-center gap-2">
            <Check size={16} className="text-[#C9A227]" />
            {item}
          </div>
        ))}
      </div>
    </aside>
  );
}
