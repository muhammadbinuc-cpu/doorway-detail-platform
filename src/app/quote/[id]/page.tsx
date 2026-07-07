"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useParams } from "next/navigation";
import { Loader2, CheckCircle, Phone } from "lucide-react";
import { toast } from "sonner";
import { acceptQuote } from "@/app/actions";
import { computeInvoiceTotals, type LineItem } from "@/lib/invoice";
import { BUSINESS, formatQuoteNumber } from "@/lib/business";

interface QuoteJob {
  id: string;
  name?: string;
  address?: string;
  status?: string;
  price?: number;
  discount?: number;
  taxRate?: number;
  lineItems?: LineItem[];
  invoiceItems?: string[];
  invoiceNotes?: string;
  quoteNumber?: number;
  quoteSentAt?: { seconds?: number };
  quoteValidUntil?: { seconds?: number };
  quoteAcceptedAt?: { seconds?: number };
}

const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const toDate = (t?: { seconds?: number }) =>
  t?.seconds ? new Date(t.seconds * 1000) : null;

function ContactFooter() {
  return (
    <p className="text-gray-500 text-sm mt-4">
      Questions? Call or text{" "}
      <a href={`tel:${BUSINESS.phone}`} className="font-bold text-black">
        {BUSINESS.phone}
      </a>{" "}
      or email{" "}
      <a
        href={`mailto:${BUSINESS.email}`}
        className="font-bold text-black break-all"
      >
        {BUSINESS.email}
      </a>
    </p>
  );
}

export default function QuotePage() {
  const params = useParams();
  const id = params?.id as string;
  const [job, setJob] = useState<QuoteJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [justAccepted, setJustAccepted] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchJob = async () => {
      try {
        const snap = await getDoc(doc(db, "jobs", id));
        if (snap.exists()) setJob({ id: snap.id, ...snap.data() } as QuoteJob);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  const handleAccept = async () => {
    setAccepting(true);
    const res = await acceptQuote(id);
    setAccepting(false);
    if (res.success) {
      setJustAccepted(true);
    } else {
      toast.error(
        ("error" in res ? res.error : undefined) ||
          "Something went wrong — call or text us instead.",
      );
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-[#C9A227]" size={48} />
      </div>
    );

  if (!job || job.status !== "QUOTE_SENT")
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-10 rounded-3xl max-w-md w-full text-center shadow-xl">
          <h1 className="text-2xl font-black mb-2">
            This quote isn&apos;t available
          </h1>
          <p className="text-gray-500 text-sm">
            It may have already been booked, or the link is out of date.
          </p>
          <ContactFooter />
        </div>
      </div>
    );

  const { lineItems, subtotal, discount, taxRate, taxAmount, total } =
    computeInvoiceTotals(job);
  const quoteLabel = formatQuoteNumber(job.quoteNumber, job.id);
  const sentAt = toDate(job.quoteSentAt);
  const validUntil = toDate(job.quoteValidUntil);
  const expired = !!validUntil && validUntil.getTime() < Date.now();
  const accepted = justAccepted || !!job.quoteAcceptedAt;

  if (accepted) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <div className="bg-white p-10 rounded-3xl max-w-md w-full text-center shadow-2xl">
          <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
          <h1 className="text-3xl font-black mb-2 text-black">
            Quote accepted
          </h1>
          <p className="text-gray-500 mb-2">
            Thanks, {job.name}! We&apos;ll text you shortly to book a time that
            works.
          </p>
          <p className="text-gray-400 text-xs font-mono mb-8">
            Quote {quoteLabel}
          </p>
          <div className="bg-gray-100 p-4 rounded-xl flex justify-between font-bold text-lg text-black">
            <span>Quoted total:</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <p className="text-gray-400 text-xs mt-4">
            Nothing to pay now — you&apos;re invoiced after the work is done.
          </p>
          <ContactFooter />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 font-sans text-black">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-black p-8 text-white text-center">
          <h1 className="text-2xl font-black italic tracking-wider mb-2">
            DOORWAY <span className="text-[#C9A227]">DETAIL</span>
          </h1>
          <p className="text-[#C9A227] text-sm font-bold tracking-widest uppercase">
            Your quote — not a bill
          </p>
        </div>

        <div className="p-8 md:p-12">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-gray-400 text-xs font-bold uppercase tracking-wide mb-1">
                Prepared for
              </h2>
              <p className="text-xl font-bold">{job.name}</p>
              <p className="text-gray-500">{job.address}</p>
            </div>
            <div className="text-right">
              <h2 className="text-gray-400 text-xs font-bold uppercase tracking-wide mb-1">
                Quote
              </h2>
              <p className="font-mono font-bold text-black">{quoteLabel}</p>
              {sentAt && (
                <p className="text-gray-500 text-sm mt-2">
                  Sent {fmtDate(sentAt)}
                </p>
              )}
              {validUntil && (
                <p
                  className={`text-sm ${expired ? "text-red-600 font-bold" : "text-gray-500"}`}
                >
                  Valid until {fmtDate(validUntil)}
                </p>
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100">
            {lineItems.map((item, i) => (
              <div
                key={i}
                className="flex justify-between items-center mb-3 last:mb-0"
              >
                <span className="font-bold">
                  {item.description}
                  {item.quantity > 1 && (
                    <span className="text-gray-400 font-semibold">
                      {" "}
                      × {item.quantity}
                    </span>
                  )}
                </span>
                <span className="font-bold">
                  ${(item.quantity * item.unitPrice).toFixed(2)}
                </span>
              </div>
            ))}

            {job.invoiceItems &&
              job.invoiceItems.length > 0 &&
              !(job.lineItems && job.lineItems.length > 0) && (
                <ul className="mt-2 space-y-1">
                  {job.invoiceItems.map((item, i) => (
                    <li
                      key={i}
                      className="flex gap-2 text-sm text-gray-500 font-medium"
                    >
                      <span className="text-[#C9A227]">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}

            <div className="border-t border-gray-200 mt-4 pt-4 space-y-2">
              <div className="flex justify-between items-center text-gray-500 text-sm">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between items-center text-green-600 text-sm">
                  <span>Discount</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-gray-500 text-sm">
                <span>Tax ({taxRate}%)</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center text-xl font-black pt-4 mt-4 border-t border-gray-200">
              <span>Quoted total</span>
              <span className="text-[#C9A227]">${total.toFixed(2)}</span>
            </div>
          </div>

          {job.invoiceNotes && (
            <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100">
              <h2 className="text-gray-400 text-xs font-bold uppercase tracking-wide mb-2">
                Notes
              </h2>
              <p className="text-gray-600 text-sm whitespace-pre-wrap">
                {job.invoiceNotes}
              </p>
            </div>
          )}

          {expired ? (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-5 py-4 text-sm font-medium">
              This quote has expired. Call or text {BUSINESS.phone} and
              we&apos;ll get you an updated price — it only takes a minute.
            </div>
          ) : (
            <>
              <button
                onClick={handleAccept}
                disabled={accepting}
                className="w-full bg-[#C9A227] text-black py-5 rounded-xl font-bold text-lg hover:bg-black hover:text-white transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {accepting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <CheckCircle size={20} />
                )}
                Accept quote
              </button>
              <p className="text-gray-400 text-xs text-center mt-3">
                Nothing is charged now. Accepting tells us you&apos;re in —
                we&apos;ll text you to book a time, and you pay only after the
                work is done.
              </p>
              <a
                href={`tel:${BUSINESS.phone}`}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 text-sm font-bold text-gray-500 hover:text-black transition-colors"
              >
                <Phone size={16} /> Questions? Call or text {BUSINESS.phone}
              </a>
            </>
          )}

          <div className="mt-8 pt-6 border-t border-gray-100 text-center text-xs text-gray-400 leading-relaxed">
            <p className="font-bold text-gray-500">{BUSINESS.name}</p>
            <p>
              {BUSINESS.address} · {BUSINESS.phone}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
