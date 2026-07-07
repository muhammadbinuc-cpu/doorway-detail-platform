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
  Plus,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  emailInvoice,
  sendInvoiceReminder,
  markInvoicePaid,
  voidInvoice,
  createInvoiceForClient,
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
import {
  LineItemsEditor,
  type CatalogService,
} from "@/components/admin/LineItemsEditor";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { EmailStatusBadge } from "@/components/admin/EmailStatusBadge";
import { NumberField } from "@/components/admin/NumberField";

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
  lastEmailStatus?: "sent" | "failed";
  lastEmailAt?: { seconds?: number };
  lastEmailError?: string;
}

interface ClientOption {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
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
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [catalogServices, setCatalogServices] = useState<CatalogService[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [reminderId, setReminderId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [methodPickerId, setMethodPickerId] = useState<string | null>(null);
  const [voidingId, setVoidingId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [createLineItems, setCreateLineItems] = useState<LineItem[]>([]);
  const [createForm, setCreateForm] = useState({
    discount: 0,
    taxRate: 0,
    invoiceNotes: "",
  });
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const router = useRouter();
  const confirm = useConfirm();

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;
    let unsubscribeClients: (() => void) | null = null;
    let unsubscribeServices: (() => void) | null = null;
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
        const clientsQuery = query(collection(db, "clients"), orderBy("name"));
        unsubscribeClients = onSnapshot(
          clientsQuery,
          (snap) => {
            setClients(
              snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ClientOption),
            );
          },
          (error) => {
            if (error.code !== "permission-denied")
              console.error("Firestore Clients Error:", error);
          },
        );
        const servicesQuery = query(
          collection(db, "services"),
          orderBy("name"),
        );
        unsubscribeServices = onSnapshot(
          servicesQuery,
          (snap) => {
            setCatalogServices(
              snap.docs.map(
                (d) => ({ id: d.id, ...d.data() }) as CatalogService,
              ),
            );
          },
          (error) => {
            if (error.code !== "permission-denied")
              console.error("Firestore Services Error:", error);
          },
        );
      } else {
        if (unsubscribeSnapshot) unsubscribeSnapshot();
        if (unsubscribeClients) unsubscribeClients();
        if (unsubscribeServices) unsubscribeServices();
        router.push("/login");
      }
    });
    return () => {
      if (unsubscribeSnapshot) unsubscribeSnapshot();
      if (unsubscribeClients) unsubscribeClients();
      if (unsubscribeServices) unsubscribeServices();
      unsubscribeAuth();
    };
  }, [router]);

  const invoices = jobs.filter((j) => INVOICE_STATUSES.has(j.status));
  const totalsFor = (j: InvoiceJob) => computeInvoiceTotals(j).total;
  const selectedClient =
    clients.find((client) => client.id === selectedClientId) || null;
  const filteredClients = clients.filter((client) => {
    const q = clientSearch.toLowerCase();
    return (
      String(client.name || "")
        .toLowerCase()
        .includes(q) ||
      String(client.email || "")
        .toLowerCase()
        .includes(q) ||
      String(client.address || "")
        .toLowerCase()
        .includes(q)
    );
  });
  const cleanCreateLineItems = () =>
    createLineItems
      .filter((li) => li.description.trim() && li.quantity > 0)
      .map((li) => ({
        description: li.description.trim(),
        quantity: li.quantity,
        unitPrice: li.unitPrice,
      }));
  const createPreview = computeInvoiceTotals({
    lineItems: cleanCreateLineItems(),
    discount: createForm.discount,
    taxRate: createForm.taxRate,
  });

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
    if (!res.success) return toast.error(errText(res));
    const warn = warnText(res);
    if (warn) toast.warning(warn);
    else toast.success("Marked paid");
  };

  const resetCreateInvoice = () => {
    setSelectedClientId("");
    setClientSearch("");
    setCreateLineItems([]);
    setCreateForm({ discount: 0, taxRate: 0, invoiceNotes: "" });
  };

  const handleCreateInvoice = async (sendAfterSave: boolean) => {
    const lineItems = cleanCreateLineItems();
    if (!selectedClientId) {
      toast.error("Select a client");
      return;
    }
    if (lineItems.length === 0) {
      toast.error("Add at least one line item");
      return;
    }
    if (
      sendAfterSave &&
      !(await confirm({
        message: `Create and email this invoice to ${selectedClient?.name || "the client"}?`,
        confirmText: "Save & Send",
      }))
    )
      return;

    setCreatingInvoice(true);
    const res = await createInvoiceForClient(selectedClientId, {
      lineItems,
      discount: createForm.discount,
      taxRate: createForm.taxRate,
      invoiceNotes: createForm.invoiceNotes,
    });

    if (!res.success || !("jobId" in res)) {
      setCreatingInvoice(false);
      toast.error(errText(res));
      return;
    }

    if (sendAfterSave) {
      const sendRes = await emailInvoice(res.jobId);
      if (!sendRes.success)
        toast.error(`Invoice saved, but email failed: ${errText(sendRes)}`);
      else {
        const warn = warnText(sendRes);
        if (warn) toast.warning(warn);
        else toast.success("Invoice created and sent");
      }
    } else {
      toast.success("Invoice created");
    }

    setCreatingInvoice(false);
    setIsCreateModalOpen(false);
    resetCreateInvoice();
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
          <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-black">Invoices</h1>
              <p className="text-gray-500 mt-1">
                Every invoiced, unpaid, and paid job in one place.
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-black text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#D4AF37] hover:text-black transition-all"
            >
              <Plus size={18} /> Create Invoice
            </button>
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
                          <EmailStatusBadge
                            status={job.lastEmailStatus}
                            at={job.lastEmailAt}
                            error={job.lastEmailError}
                          />
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

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-5xl w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black">Create Invoice</h2>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  resetCreateInvoice();
                }}
                disabled={creatingInvoice}
                className="text-gray-400 hover:text-black disabled:opacity-50"
                aria-label="Close create invoice modal"
              >
                <X size={24} />
              </button>
            </div>

            <div className="grid md:grid-cols-[1.15fr_0.85fr] gap-8 max-h-[76vh] overflow-auto">
              <div className="space-y-5 pr-1">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                    Client
                  </label>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 mb-3 flex items-center gap-2">
                    <Search className="text-gray-400" size={18} />
                    <input
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      placeholder="Search clients..."
                      className="bg-transparent outline-none flex-1 font-bold text-sm"
                    />
                  </div>
                  <div className="max-h-48 overflow-auto rounded-xl border border-gray-100">
                    {filteredClients.length === 0 && (
                      <p className="p-4 text-sm text-gray-400 italic">
                        No clients found.
                      </p>
                    )}
                    {filteredClients.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => setSelectedClientId(client.id)}
                        className={`w-full text-left p-4 border-b last:border-0 transition-colors ${
                          selectedClientId === client.id
                            ? "bg-[#D4AF37] text-black"
                            : "bg-white hover:bg-gray-50"
                        }`}
                      >
                        <span className="block font-bold">{client.name}</span>
                        <span className="block text-xs opacity-70 mt-1">
                          {client.address}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <LineItemsEditor
                  lineItems={createLineItems}
                  onChange={setCreateLineItems}
                  catalogServices={catalogServices}
                  emptyMessage="Add at least one line item before saving."
                />

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                      Discount Amount ($)
                    </label>
                    <NumberField
                      min={0}
                      value={createForm.discount}
                      onChange={(discount) =>
                        setCreateForm({ ...createForm, discount })
                      }
                      className="w-full bg-gray-50 p-3 rounded-xl font-bold outline-none focus:ring-2 focus:ring-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                      Tax Rate (%)
                    </label>
                    <NumberField
                      min={0}
                      value={createForm.taxRate}
                      placeholder="13"
                      onChange={(taxRate) =>
                        setCreateForm({ ...createForm, taxRate })
                      }
                      className="w-full bg-gray-50 p-3 rounded-xl font-bold outline-none focus:ring-2 focus:ring-[#D4AF37]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                    Invoice Notes
                  </label>
                  <textarea
                    value={createForm.invoiceNotes}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        invoiceNotes: e.target.value,
                      })
                    }
                    className="w-full bg-gray-50 p-3 rounded-xl font-bold outline-none focus:ring-2 focus:ring-[#D4AF37] resize-none h-24"
                    placeholder="Thank you for your business..."
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => handleCreateInvoice(false)}
                    disabled={creatingInvoice}
                    className="flex-1 bg-gray-100 text-black p-4 rounded-xl font-bold hover:bg-gray-200 transition-all disabled:opacity-50"
                  >
                    {creatingInvoice ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="animate-spin" size={16} /> Saving
                      </span>
                    ) : (
                      "Save"
                    )}
                  </button>
                  <button
                    onClick={() => handleCreateInvoice(true)}
                    disabled={creatingInvoice}
                    className="flex-1 bg-black text-white p-4 rounded-xl font-bold hover:bg-[#D4AF37] hover:text-black transition-all disabled:opacity-50"
                  >
                    {creatingInvoice ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="animate-spin" size={16} /> Saving
                      </span>
                    ) : (
                      "Save & Send"
                    )}
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">
                  Preview
                </p>
                <div className="rounded-2xl border border-gray-200 overflow-hidden text-black">
                  <div className="bg-black p-5 text-center">
                    <p className="text-white font-black italic tracking-wider">
                      DOORWAY <span className="text-[#D4AF37]">DETAIL</span>
                    </p>
                    <p className="text-gray-400 text-[10px] font-bold tracking-widest uppercase mt-1">
                      Official Invoice
                    </p>
                  </div>
                  <div className="p-5 text-sm">
                    <div className="flex justify-between gap-4 mb-4">
                      <div>
                        <p className="text-gray-400 text-[10px] font-bold uppercase">
                          Billed To
                        </p>
                        <p className="font-bold">
                          {selectedClient?.name || "Select a client"}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {selectedClient?.address || "-"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-400 text-[10px] font-bold uppercase">
                          Total
                        </p>
                        <p className="font-black text-[#D4AF37]">
                          ${createPreview.total.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      {createPreview.lineItems.map((item, i) => (
                        <div
                          key={i}
                          className="flex justify-between gap-3 mb-2 last:mb-0"
                        >
                          <span className="font-bold">
                            {item.description}
                            {item.quantity > 1 && (
                              <span className="text-gray-400 font-semibold">
                                {" "}
                                x {item.quantity}
                              </span>
                            )}
                          </span>
                          <span className="font-bold whitespace-nowrap">
                            ${(item.quantity * item.unitPrice).toFixed(2)}
                          </span>
                        </div>
                      ))}
                      <div className="border-t border-gray-200 mt-3 pt-3 space-y-1 text-xs">
                        <div className="flex justify-between text-gray-500">
                          <span>Subtotal</span>
                          <span>${createPreview.subtotal.toFixed(2)}</span>
                        </div>
                        {createPreview.discount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Discount</span>
                            <span>-${createPreview.discount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-gray-500">
                          <span>Tax ({createPreview.taxRate}%)</span>
                          <span>${createPreview.taxAmount.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="flex justify-between font-black pt-3 mt-3 border-t border-gray-200">
                        <span>Total Due</span>
                        <span className="text-[#D4AF37]">
                          ${createPreview.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    {createForm.invoiceNotes.trim() && (
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mt-3">
                        <p className="text-gray-400 text-[10px] font-bold uppercase mb-1">
                          Notes
                        </p>
                        <p className="text-gray-600 text-xs whitespace-pre-wrap">
                          {createForm.invoiceNotes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
