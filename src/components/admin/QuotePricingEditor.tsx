"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { updateQuotePricing } from "@/app/actions";
import { db } from "@/lib/firebase";
import {
  getDefaultQuoteServiceOptions,
  normalizeQuoteServiceOptions,
  type QuoteServiceTitle,
} from "@/lib/quote-pricing";

interface QuotePriceDraft {
  title: QuoteServiceTitle;
  low: string;
  high: string;
}

function toDrafts(
  options: ReturnType<typeof getDefaultQuoteServiceOptions>,
): QuotePriceDraft[] {
  return options.map((option) => ({
    title: option.title,
    low: String(option.low),
    high: String(option.high),
  }));
}

export function QuotePricingEditor() {
  const [drafts, setDrafts] = useState<QuotePriceDraft[]>(() =>
    toDrafts(getDefaultQuoteServiceOptions()),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, "settings", "quotePricing"),
      (snapshot) => {
        setDrafts(
          toDrafts(normalizeQuoteServiceOptions(snapshot.data()?.services)),
        );
        setLoading(false);
        setLoadError(false);
      },
      (error) => {
        console.warn("Quote pricing listener failed:", error);
        setLoading(false);
        setLoadError(true);
      },
    );
    return unsubscribe;
  }, []);

  const updateDraft = (
    title: QuoteServiceTitle,
    field: "low" | "high",
    value: string,
  ) => {
    setDrafts((current) =>
      current.map((draft) =>
        draft.title === title ? { ...draft, [field]: value } : draft,
      ),
    );
  };

  const handleSave = async () => {
    const services = drafts.map((draft) => ({
      title: draft.title,
      low: Number(draft.low),
      high: Number(draft.high),
    }));
    if (
      drafts.some((draft) => draft.low === "" || draft.high === "") ||
      services.some(
        (service) =>
          !Number.isFinite(service.low) ||
          !Number.isFinite(service.high) ||
          service.low < 0 ||
          service.high < service.low,
      )
    ) {
      toast.error("Each maximum must be greater than or equal to its minimum.");
      return;
    }

    setSaving(true);
    try {
      const result = await updateQuotePricing(services);
      if (result.success) {
        toast.success("Public quote prices updated");
        return;
      }
      toast.error(
        ("error" in result ? result.error : undefined) ||
          "Could not update quote prices",
      );
    } catch {
      toast.error("Could not update quote prices");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mb-8 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-black">Public quote price ranges</h2>
          <p className="mt-1 text-sm text-gray-500">
            These minimum and maximum prices appear instantly on the customer
            quote form.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={loading || saving || loadError}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-5 py-3 font-bold text-white transition hover:bg-[#C9A227] hover:text-black disabled:opacity-50"
        >
          {loading || saving ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <Save size={18} />
          )}
          {loading ? "Loading Prices" : "Save Quote Prices"}
        </button>
      </div>

      {loadError && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          Saved pricing could not be loaded. The safe default ranges are shown;
          refresh before editing.
        </p>
      )}

      <div className="grid gap-3">
        {drafts.map((draft) => {
          const inputId = draft.title.toLowerCase().replaceAll(" ", "-");
          return (
            <div
              key={draft.title}
              className="grid gap-3 rounded-xl bg-gray-50 p-4 sm:grid-cols-[1fr_140px_140px] sm:items-end"
            >
              <p className="self-center font-bold">{draft.title}</p>
              <label className="text-xs font-bold uppercase text-gray-500">
                Minimum
                <input
                  id={`${inputId}-minimum`}
                  aria-label={`${draft.title} minimum price`}
                  type="number"
                  min={0}
                  step="0.01"
                  value={draft.low}
                  onChange={(event) =>
                    updateDraft(draft.title, "low", event.target.value)
                  }
                  className="mt-1 w-full rounded-lg border border-black/10 bg-white p-3 text-base font-bold text-black outline-none focus:border-[#C9A227]"
                />
              </label>
              <label className="text-xs font-bold uppercase text-gray-500">
                Maximum
                <input
                  id={`${inputId}-maximum`}
                  aria-label={`${draft.title} maximum price`}
                  type="number"
                  min={0}
                  step="0.01"
                  value={draft.high}
                  onChange={(event) =>
                    updateDraft(draft.title, "high", event.target.value)
                  }
                  className="mt-1 w-full rounded-lg border border-black/10 bg-white p-3 text-base font-bold text-black outline-none focus:border-[#C9A227]"
                />
              </label>
            </div>
          );
        })}
      </div>
    </section>
  );
}
