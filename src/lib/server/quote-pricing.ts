import "server-only";

import { adminDb } from "@/lib/firebase-admin";
import {
  getDefaultQuoteServiceOptions,
  normalizeQuoteServiceOptions,
  type QuoteServiceOption,
} from "@/lib/quote-pricing";

export async function loadQuoteServiceOptions(): Promise<QuoteServiceOption[]> {
  try {
    const snapshot = await adminDb
      .collection("settings")
      .doc("quotePricing")
      .get();
    return normalizeQuoteServiceOptions(snapshot.data()?.services);
  } catch (error) {
    console.error("Quote pricing settings could not be loaded:", error);
    return getDefaultQuoteServiceOptions();
  }
}
