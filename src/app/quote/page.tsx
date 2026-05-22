"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  User,
} from "lucide-react";
import { submitQuote } from "../actions";
import { BrandMark } from "../brand-mark";
import { QuoteIntro, QuoteSuccess } from "./quote-panels";
import { buildServiceSummary, serviceOptions } from "./quote-options";

export default function QuotePage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    service: "Window Cleaning",
  });

  const activeService = serviceOptions.find((service) => service.title === formData.service) ?? serviceOptions[0];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleServiceSelect = (service: string) => {
    setFormData({ ...formData, service });
    setSelectedDetails([]);
  };

  const toggleDetail = (detail: string) => {
    setSelectedDetails((current) =>
      current.includes(detail) ? current.filter((item) => item !== detail) : [...current, detail]
    );
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const quotePayload = {
      ...formData,
      service: buildServiceSummary(formData.service, selectedDetails, notes),
    };

    try {
      const result = await submitQuote(quotePayload);

      if (result.success) {
        setSuccess(true);
        return;
      }

      throw new Error(result.error || "Submission failed");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      alert(`Something went wrong: ${message}.`);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return <QuoteSuccess name={formData.name} />;
  }

  return (
    <main className="min-h-screen bg-[#f8f5ee] text-black">
      <nav className="sticky top-0 z-10 border-b border-black/10 bg-[#f8f5ee]/95 px-5 py-5 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <Link href="/" aria-label="Doorway Detail home" className="text-base text-black sm:text-lg">
            <BrandMark />
          </Link>
          <div className="text-sm font-bold text-black/55">
            Step <span className="text-black">{step}</span> of 2
          </div>
        </div>
      </nav>

      <section className="mx-auto flex min-h-[calc(100vh-76px)] max-w-5xl items-center px-5 py-10">
        <div className="grid w-full gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
          <QuoteIntro />

          <div className="rounded-lg border border-black/10 bg-white p-5 shadow-sm sm:p-8">
            <div className="mb-9 h-1.5 overflow-hidden rounded-full bg-black/10">
              <div
                className="h-full bg-[#C9A227] transition-all duration-500 ease-out"
                style={{ width: step === 1 ? "50%" : "100%" }}
              />
            </div>

            <form onSubmit={step === 1 ? handleNext : handleSubmit} className="space-y-7">
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-black">Contact details</h2>
                    <p className="mt-2 text-sm text-black/58">We use this to confirm your estimate and booking details.</p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-black text-black/65">Full Name *</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-black/35" size={18} />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-black/12 bg-[#f8f5ee] py-4 pl-12 pr-4 font-semibold text-black outline-none transition focus:border-[#C9A227]"
                        placeholder="Full name"
                        required
                        minLength={2}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-black text-black/65">Email Address *</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-black/35" size={18} />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-black/12 bg-[#f8f5ee] py-4 pl-12 pr-4 font-semibold text-black outline-none transition focus:border-[#C9A227]"
                          placeholder="you@example.com"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-black text-black/65">Phone Number *</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-black/35" size={18} />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-black/12 bg-[#f8f5ee] py-4 pl-12 pr-4 font-semibold text-black outline-none transition focus:border-[#C9A227]"
                          placeholder="289-772-5757"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-black py-4 font-black text-white transition hover:bg-[#C9A227] hover:text-black">
                    Next Step
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-black">Service details</h2>
                    <p className="mt-2 text-sm text-black/58">Pick the main service and any details you already know.</p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-black text-black/65">Service Address *</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-black/35" size={18} />
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-black/12 bg-[#f8f5ee] py-4 pl-12 pr-4 font-semibold text-black outline-none transition focus:border-[#C9A227]"
                        placeholder="Service address"
                        required
                        minLength={5}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-3 block text-sm font-black text-black/65">Main Service *</label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {serviceOptions.map((service) => (
                        <button
                          key={service.title}
                          type="button"
                          onClick={() => handleServiceSelect(service.title)}
                          className={`rounded-lg border p-4 text-left transition ${
                            formData.service === service.title
                              ? "border-[#C9A227] bg-[#C9A227] text-black"
                              : "border-black/10 bg-[#f8f5ee] text-black/68 hover:border-black/35"
                          }`}
                        >
                          <span className="flex items-center gap-3 font-black">
                            <Sparkles size={18} />
                            {service.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-3 block text-sm font-black text-black/65">Helpful Details</label>
                    <div className="flex flex-wrap gap-2">
                      {activeService.details.map((detail) => (
                        <button
                          key={detail}
                          type="button"
                          onClick={() => toggleDetail(detail)}
                          className={`rounded-lg border px-3 py-2 text-sm font-bold transition ${
                            selectedDetails.includes(detail)
                              ? "border-black bg-black text-white"
                              : "border-black/10 bg-white text-black/62 hover:border-black/30"
                          }`}
                        >
                          {detail}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-black text-black/65">Anything else we should know?</label>
                    <textarea
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      maxLength={100}
                      className="h-28 w-full resize-none rounded-lg border border-black/12 bg-[#f8f5ee] p-4 font-semibold text-black outline-none transition focus:border-[#C9A227]"
                      placeholder="Example: side gate access, high windows, heavy buildup, timing preference"
                    />
                    <p className="mt-2 text-xs font-semibold text-black/42">{100 - notes.length} characters left</p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="inline-flex w-1/3 items-center justify-center gap-2 rounded-lg bg-black/8 py-4 font-black text-black transition hover:bg-black/12"
                    >
                      <ChevronLeft size={20} />
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#C9A227] py-4 font-black text-black transition hover:bg-black hover:text-white disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="animate-spin" /> : "Submit Quote Request"}
                      {!loading && <ArrowRight size={18} />}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
