"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import {
  Loader2,
  Send,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Download,
  Ban,
} from "lucide-react";
import { toast } from "sonner";
import {
  emailInvoice,
  sendInvoiceReminder,
  markInvoicePaid,
  voidInvoice,
} from "@/app/actions";
import {
  computeInvoiceTotals,
  getDueDate,
  isOverdue,
  type LineItem,
} from "@/lib/invoice";
import { formatInvoiceNumber } from "@/lib/business";
import { statusMeta } from "@/lib/job-status";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useConfirm } from "@/components/ui/ConfirmDialog";

interface InvoiceJob {
  id: string;
  name?: string;
  service?: string;
  status: string;
  price?: number;
  discount?: number;
  taxRate?: number;
  lineItems?: LineItem[];
  invoiceNumber?: number;
  invoicedAt?: { seconds?: number };
  paymentMethod?: string;
  reminderCount?: number;
}

const INVOICE_STATUSES = new Set(["INVOICED", "UNPAID", "PAID"]);
const PAY_METHODS: { key: string; label: string }[] = [
  { key: "etransfer", label: "E-transfer" },
  { key: "cash", label: "Cash" },
  { key: "card", label: "Card" },
];
const METHOD_LABEL: Record<string, string> = {
  etransfer: "E-transfer",
  cash: "Cash",
  card: "Card",
};
const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
const overdueOf = (job: InvoiceJob) =>
  isOverdue({
    status: job.status,
    invoicedAt: job.invoicedAt?.seconds
      ? new Date(job.invoicedAt.seconds * 1000)
      : null,
  });

export default function InvoicesPage() {
  const [jobs, setJobs] = useState<InvoiceJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [reminderId, setReminderId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [methodPickerId, setMethodPickerId] = useState<string | null>(null);
  const [voidingId, setVoidingId] = useState<string | null>(null);
  const router = useRouter();
  const confirm = useConfirm();

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        const q = query(
          collection(db, "jobs"),
          orderBy("createdAt", "desc"),
          limit(100),
        );
        unsubscribeSnapshot = onSnapshot(
          q,
          (snap) => {
            setJobs(
              snap.docs.map((d) => ({ id: d.id, ...d.data() }) as InvoiceJob),
            );
            setLoading(false);
          },
          (error) => {
            if (error.code !== "permission-denied")
              console.error("Firestore Error:", error);
          },
        );
      } else {
        if (unsubscribeSnapshot) unsubscribeSnapshot();
        router.push("/login");
      }
    });
    return () => {
      if (unsubscribeSnapshot) unsubscribeSnapshot();
      unsubscribeAuth();
    };
  }, [router]);

  const invoices = jobs.filter((j) => INVOICE_STATUSES.has(j.status));
  const totalsFor = (j: InvoiceJob) => computeInvoiceTotals(j).total;

  const outstanding = invoices.filter(
    (j) => j.status === "INVOICED" || j.status === "UNPAID",
  );
  const outstandingAmount = outstanding.reduce(
    (acc, j) => acc + totalsFor(j),
    0,
  );
  const paidAmount = invoices
    .filter((j) => j.status === "PAID")
    .reduce((acc, j) => acc + totalsFor(j), 0);
  const overdueCount = invoices.filter(overdueOf).length;

  const errText = (res: { success: boolean; error?: string }) =>
    ("error" in res ? res.error : undefined) || "Unknown error";
  // A successful save can still carry a delivery warning (email didn't send).
  const warnText = (res: { deliveryWarning?: string }) =>
    "deliveryWarning" in res ? res.deliveryWarning : undefined;

  const handleResend = async (id: string) => {
    if (
      !(await confirm({
        message: "Re-send this invoice email?",
        confirmText: "Send",
      }))
    )
      return;
    setSendingId(id);
    const res = await emailInvoice(id);
    setSendingId(null);
    if (!res.success) return toast.error(errText(res));
    const warn = warnText(res);
    if (warn) toast.warning(warn);
    else toast.success("Invoice sent");
  };

  const handleVoid = async (id: string) => {
    if (
      !(await confirm({
        message:
          "Void this invoice? It will be cancelled and removed from outstanding totals. This cannot be undone.",
        confirmText: "Void invoice",
      }))
    )
      return;
    setVoidingId(id);
    const res = await voidInvoice(id);
    setVoidingId(null);
    if (res.success) toast.success("Invoice voided");
    else toast.error(errText(res));
  };

  const handleReminder = async (id: string) => {
    if (
      !(await confirm({
        message: "Send a payment reminder (email + SMS) to this customer?",
        confirmText: "Send reminder",
      }))
    )
      return;
    setReminderId(id);
    const res = await sendInvoiceReminder(id);
    setReminderId(null);
    if (res.success) toast.success("Reminder sent");
    else toast.error(errText(res));
  };

  const handleMarkPaid = async (id: string, method: string) => {
    setMethodPickerId(null);
    setPayingId(id);
    const res = await markInvoicePaid(id, method);
    setPayingId(null);
    if (res.success) toast.success("Marked paid");
    else toast.error(errText(res));
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans text-black">
      <AdminSidebar active="invoices" />

      <main className="flex-1 p-6 md:p-10 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-black">Invoices</h1>
            <p className="text-gray-500 mt-1">
              Every invoiced, unpaid, and paid job in one place.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-gray-400 text-xs font-bold uppercase">
                Outstanding
              </h3>
              <p className="text-4xl font-black mt-2">{outstanding.length}</p>
            </div>
            <div
              className={`p-6 rounded-2xl shadow-sm border ${overdueCount > 0 ? "bg-red-50 border-red-200" : "bg-white border-gray-100"}`}
            >
              <h3 className="text-gray-400 text-xs font-bold uppercase flex items-center gap-1">
                {overdueCount > 0 && (
                  <AlertTriangle size={12} className="text-red-500" />
                )}{" "}
                Overdue
              </h3>
              <p
                className={`text-4xl font-black mt-2 ${overdueCount > 0 ? "text-red-600" : ""}`}
              >
                {overdueCount}
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-gray-400 text-xs font-bold uppercase">
                Owed to You
              </h3>
              <p className="text-4xl font-black mt-2 text-red-500">
                ${outstandingAmount.toFixed(2)}
              </p>
            </div>
            <div className="bg-[#D4AF37] text-black p-6 rounded-2xl shadow-sm">
              <h3 className="text-black/60 text-xs font-bold uppercase">
                Collected
              </h3>
              <p className="text-4xl font-black mt-2">
                ${paidAmount.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-5 text-xs font-bold text-gray-400 uppercase">
                    Invoice #
                  </th>
                  <th className="p-5 text-xs font-bold text-gray-400 uppercase">
                    Client
                  </th>
                  <th className="p-5 text-xs font-bold text-gray-400 uppercase">
                    Issued
                  </th>
                  <th className="p-5 text-xs font-bold text-gray-400 uppercase">
                    Due
                  </th>
                  <th className="p-5 text-xs font-bold text-gray-400 uppercase text-right">
                    Total
                  </th>
                  <th className="p-5 text-xs font-bold text-gray-400 uppercase">
                    Status
                  </th>
                  <th className="p-5 text-xs font-bold text-gray-400 uppercase text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-10 text-center text-gray-400 italic"
                    >
                      No invoices yet. Send one from the Dashboard.
                    </td>
                  </tr>
                )}
                {invoices.map((job) => {
                  const meta = statusMeta(job.status);
                  const issuedAt = job.invoicedAt?.seconds
                    ? new Date(job.invoicedAt.seconds * 1000)
                    : null;
                  const overdue = overdueOf(job);
                  const isPaid = job.status === "PAID";
                  const busy = payingId === job.id;
                  return (
                    <tr
                      key={job.id}
                      className="border-b last:border-0 hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-5 font-mono font-bold">
                        {formatInvoiceNumber(job.invoiceNumber, job.id)}
                      </td>
                      <td className="p-5 font-bold">{job.name || "—"}</td>
                      <td className="p-5 text-sm text-gray-500">
                        {issuedAt ? fmtDate(issuedAt) : "—"}
                      </td>
                      <td
                        className={`p-5 text-sm ${overdue ? "text-red-600 font-bold" : "text-gray-500"}`}
                      >
                        {issuedAt ? fmtDate(getDueDate(issuedAt)) : "—"}
                      </td>
                      <td className="p-5 text-right font-bold text-[#D4AF37]">
                        ${totalsFor(job).toFixed(2)}
                      </td>
                      <td className="p-5">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={`px-2 py-1 text-xs font-bold rounded ${meta.pill}`}
                          >
                            {meta.label}
                          </span>
                          {overdue && (
                            <span className="px-2 py-0.5 text-[10px] font-black rounded bg-red-100 text-red-700 flex items-center gap-1">
                              <AlertTriangle size={10} /> OVERDUE
                            </span>
                          )}
                          {isPaid && job.paymentMethod && (
                            <span className="text-[10px] text-gray-400 font-semibold">
                              via{" "}
                              {METHOD_LABEL[job.paymentMethod] ||
                                job.paymentMethod}
                            </span>
                          )}
                          {!isPaid && (job.reminderCount ?? 0) > 0 && (
                            <span className="text-[10px] text-gray-400 font-semibold">
                              {job.reminderCount} reminder
                              {job.reminderCount === 1 ? "" : "s"} sent
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-5">
                        <div className="flex items-center gap-3 justify-end flex-wrap">
                          <a
                            href={`/invoice/${job.id}`}
                            target="_blank"
                            className="text-sm font-bold text-gray-500 hover:text-black flex items-center gap-1"
                          >
                            <ExternalLink size={14} /> View
                          </a>
                          <a
                            href={`/invoice/${job.id}/pdf`}
                            target="_blank"
                            className="text-sm font-bold text-gray-500 hover:text-black flex items-center gap-1"
                          >
                            <Download size={14} /> PDF
                          </a>
                          {!isPaid && (
                            <>
                              <button
                                onClick={() => handleResend(job.id)}
                                disabled={sendingId === job.id}
                                className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1 disabled:opacity-50"
                              >
                                {sendingId === job.id ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <Send size={14} />
                                )}{" "}
                                Resend
                              </button>
                              <button
                                onClick={() => handleReminder(job.id)}
                                disabled={reminderId === job.id}
                                className="text-sm font-bold text-amber-600 hover:underline flex items-center gap-1 disabled:opacity-50"
                              >
                                {reminderId === job.id ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <AlertTriangle size={14} />
                                )}{" "}
                                Remind
                              </button>
                              {methodPickerId === job.id ? (
                                <span className="flex items-center gap-1">
                                  {PAY_METHODS.map((m) => (
                                    <button
                                      key={m.key}
                                      onClick={() =>
                                        handleMarkPaid(job.id, m.key)
                                      }
                                      disabled={busy}
                                      className="text-xs font-bold bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 disabled:opacity-50"
                                    >
                                      {m.label}
                                    </button>
                                  ))}
                                  <button
                                    onClick={() => setMethodPickerId(null)}
                                    className="text-xs text-gray-400 hover:text-black px-1"
                                  >
                                    ✕
                                  </button>
                                </span>
                              ) : (
                                <button
                                  onClick={() => setMethodPickerId(job.id)}
                                  disabled={busy}
                                  className="text-sm font-bold text-green-600 hover:underline flex items-center gap-1 disabled:opacity-50"
                                >
                                  {busy ? (
                                    <Loader2
                                      size={14}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <CheckCircle2 size={14} />
                                  )}{" "}
                                  Mark Paid
                                </button>
                              )}
                              <button
                                onClick={() => handleVoid(job.id)}
                                disabled={voidingId === job.id}
                                className="text-sm font-bold text-red-600 hover:underline flex items-center gap-1 disabled:opacity-50"
                              >
                                {voidingId === job.id ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <Ban size={14} />
                                )}{" "}
                                Void
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
