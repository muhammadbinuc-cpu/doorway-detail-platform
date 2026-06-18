import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { renderInvoicePdf } from "@/lib/server/invoice-pdf";
import { formatInvoiceNumber } from "@/lib/business";
import { validateId } from "@/lib/validation";

// Same statuses the public invoice page (and Firestore rules) expose.
const VIEWABLE = new Set(["INVOICED", "UNPAID", "PAID"]);

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    validateId(id);
    const snap = await adminDb.collection("jobs").doc(id).get();
    const job = snap.data();
    if (!job || !VIEWABLE.has(job.status)) {
      return new NextResponse("Invoice not found", { status: 404 });
    }
    const pdf = await renderInvoicePdf(job, id);
    const label = formatInvoiceNumber(job.invoiceNumber, id).replace("#", "");
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Invoice-${label}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new NextResponse("Could not generate invoice", { status: 500 });
  }
}
