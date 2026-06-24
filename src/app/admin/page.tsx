"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  MapPin,
  Phone,
  Trash2,
  FileText,
  TrendingUp,
  Settings,
  X,
  Truck,
  Repeat,
  MessageSquare,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { toast } from "sonner";
import {
  confirmBooking,
  updateJobStatus,
  emailInvoice,
  updateJobDetails,
  sendOnMyWay,
  createRecurringJob,
  deleteJob,
  messageCustomer,
} from "../actions";
import { JOB_WORKFLOW } from "@/lib/fsm_logic";
import { statusLabel } from "@/lib/job-status";
import { formatInvoiceNumber, BUSINESS } from "@/lib/business";
import { computeInvoiceTotals, getDueDate, type LineItem } from "@/lib/invoice";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import {
  LineItemsEditor,
  type CatalogService,
} from "@/components/admin/LineItemsEditor";
import { useConfirm } from "@/components/ui/ConfirmDialog";

interface Job {
  id: string;
  name: string;
  service: string;
  address: string;
  phone: string;
  status:
    | "LEAD_RECEIVED"
    | "SCHEDULED"
    | "COMPLETED"
    | "INVOICED"
    | "PAID"
    | "UNPAID"
    | "LOST"
    | "CANCELLED";
  createdAt: unknown;
  price?: number;
  discount?: number;
  taxRate?: number;
  invoiceNotes?: string;
  lineItems?: LineItem[];
  invoiceItems?: string[];
  invoiceNumber?: number;
  preferredDate?: string;
  preferredWindow?: string;
  details?: string;
  promoCode?: string;
  promoDiscount?: number;
}

// Default clock time we pre-fill the scheduler with for each requested window.
const WINDOW_START: Record<string, string> = {
  Morning: "09:00",
  Afternoon: "13:00",
  Evening: "17:00",
};

// Build a datetime-local value ("YYYY-MM-DDTHH:mm") from a job's requested
// preferred date + window, so opening the scheduler pre-fills their request.
const preferredDateTimeLocal = (job: Job): string => {
  if (!job.preferredDate) return "";
  const time = WINDOW_START[job.preferredWindow ?? ""] ?? "09:00";
  return `${job.preferredDate}T${time}`;
};

const getNextStatuses = (currentStatus: string): string[] => {
  const allowed = JOB_WORKFLOW[currentStatus] || [];
  return [currentStatus, ...allowed];
};

export default function AdminPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [catalogServices, setCatalogServices] = useState<CatalogService[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [editForm, setEditForm] = useState({
    price: 0,
    discount: 0,
    taxRate: 0,
    invoiceNotes: "",
  });
  const [editLineItems, setEditLineItems] = useState<LineItem[]>([]);
  const [editInvoiceItems, setEditInvoiceItems] = useState<string[]>([]);
  const [invoiceMode, setInvoiceMode] = useState<"lump" | "itemized">("lump");
  const [syncingJobId, setSyncingJobId] = useState<string | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [schedulingJobId, setSchedulingJobId] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [messagingJob, setMessagingJob] = useState<Job | null>(null);
  const [messageBody, setMessageBody] = useState("");
  const [messageChannel, setMessageChannel] = useState<
    "sms" | "email" | "both"
  >("sms");
  const [sendingMessage, setSendingMessage] = useState(false);
  const router = useRouter();
  const confirm = useConfirm();

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;
    let unsubscribeServices: (() => void) | null = null;
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        const q = query(
          collection(db, "jobs"),
          orderBy("createdAt", "desc"),
          limit(50),
        );
        unsubscribeSnapshot = onSnapshot(
          q,
          (snap) => {
            setJobs(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Job));
            setLoading(false);
          },
          (error) => {
            if (error.code !== "permission-denied")
              console.error("Firestore Error:", error);
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
        if (unsubscribeServices) unsubscribeServices();
        router.push("/login");
      }
    });
    return () => {
      if (unsubscribeSnapshot) unsubscribeSnapshot();
      if (unsubscribeServices) unsubscribeServices();
      unsubscribeAuth();
    };
  }, [router]);

  const totalRevenue = jobs.reduce(
    (acc, job) =>
      acc +
      (job.status === "COMPLETED" || job.status === "PAID"
        ? job.price || 0
        : 0),
    0,
  );
  const potentialRevenue = jobs.reduce((acc, job) => acc + (job.price || 0), 0);
  const activeJobs = jobs.filter(
    (j) => j.status !== "COMPLETED" && j.status !== "PAID",
  ).length;
  const chartData = [
    {
      name: "Leads",
      amount: jobs.filter((j) => j.status === "LEAD_RECEIVED").length * 150,
    },
    {
      name: "Scheduled",
      amount: jobs
        .filter((j) => j.status === "SCHEDULED")
        .reduce((acc, j) => acc + (j.price || 0), 0),
    },
    { name: "Completed", amount: totalRevenue },
  ];

  const errText = (res: { success: boolean; error?: string }) =>
    ("error" in res ? res.error : undefined) || "Unknown error";

  // ✅ SECURE: Use Server Action
  const handleDelete = async (id: string) => {
    if (
      !(await confirm({
        title: "Delete job?",
        message: "This permanently removes the job.",
        danger: true,
        confirmText: "Delete",
      }))
    )
      return;
    const res = await deleteJob(id);
    if (res.success) toast.success("Job deleted");
    else toast.error(errText(res));
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    const res = await updateJobStatus(id, status);
    if (!res.success) toast.error(errText(res));
  };
  const handlePrice = async (id: string, val: string) => {
    await updateJobDetails(id, { price: parseFloat(val) });
  };
  // Build the invoice-details payload from the modal's current edits.
  // The two modes are mutually exclusive in storage: itemized writes priced
  // lineItems (and clears invoiceItems); "one price + list" writes the lump
  // price plus description-only invoiceItems (and clears lineItems).
  const buildInvoiceUpdate = () => {
    if (invoiceMode === "itemized") {
      return {
        ...editForm,
        lineItems: editLineItems
          .filter((li) => li.description.trim() && li.quantity > 0)
          .map((li) => ({
            description: li.description.trim(),
            quantity: li.quantity,
            unitPrice: li.unitPrice,
          })),
        invoiceItems: [],
      };
    }
    return {
      ...editForm,
      lineItems: [],
      invoiceItems: editInvoiceItems.map((it) => it.trim()).filter(Boolean),
    };
  };
  const handleSendInvoice = async (id: string) => {
    if (
      !(await confirm({
        message: "Send the invoice email to this customer?",
        confirmText: "Send",
      }))
    )
      return;
    const res = await emailInvoice(id);
    if (res.success) toast.success("Invoice sent");
    else toast.error(errText(res));
  };
  const handleOnMyWay = async (id: string) => {
    if (
      !(await confirm({
        message: "Send an 'on my way' SMS to this customer?",
        confirmText: "Send",
      }))
    )
      return;
    const res = await sendOnMyWay(id);
    if (res.success) toast.success("SMS sent");
    else toast.error(errText(res));
  };
  const openMessage = (job: Job) => {
    setMessagingJob(job);
    setMessageBody("");
    setMessageChannel("sms");
    setIsMessageModalOpen(true);
  };
  const handleSendMessage = async () => {
    if (!messagingJob || !messageBody.trim()) return;
    setSendingMessage(true);
    const res = await messageCustomer(
      messagingJob.id,
      messageChannel,
      messageBody.trim(),
    );
    setSendingMessage(false);
    if (res.success) {
      toast.success("Message sent");
      setIsMessageModalOpen(false);
    } else {
      toast.error(errText(res));
    }
  };
  const handleRecurring = async (id: string) => {
    if (
      !(await confirm({
        message: "Create a new recurring job from this one?",
        confirmText: "Create",
      }))
    )
      return;
    const res = await createRecurringJob(id);
    if (res.success) toast.success("Recurring job created");
    else toast.error(errText(res));
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans text-black">
      <AdminSidebar active="dashboard" />
      <main className="flex-1 p-6 md:p-10 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-gray-400 text-xs font-bold uppercase">
                Active Jobs
              </h3>
              <p className="text-4xl font-black mt-2">{activeJobs}</p>
            </div>
            <div className="bg-[#D4AF37] text-black p-6 rounded-2xl shadow-sm">
              <h3 className="text-black/60 text-xs font-bold uppercase">
                Total Revenue
              </h3>
              <p className="text-4xl font-black mt-2">
                ${totalRevenue.toFixed(2)}
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-gray-400 text-xs font-bold uppercase">
                Pipeline Value
              </h3>
              <p className="text-4xl font-black mt-2 text-blue-600">
                ${potentialRevenue.toFixed(2)}
              </p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8 h-80">
            <h3 className="font-bold flex items-center gap-2 mb-4">
              <TrendingUp size={16} /> Revenue Overview
            </h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis
                  dataKey="name"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 2 ? "#D4AF37" : "#e5e7eb"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <AnimatePresence mode="popLayout">
            <div className="grid gap-6">
              {jobs.map((job) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  className="bg-white p-6 rounded-3xl shadow-sm border flex flex-col md:flex-row justify-between gap-6"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-xl font-bold">
                        {job.name || "Unknown"}
                      </h3>
                      <select
                        value={job.status}
                        onChange={(e) =>
                          handleStatusUpdate(job.id, e.target.value)
                        }
                        className="px-3 py-1 text-xs font-bold rounded bg-gray-100 border-none outline-none cursor-pointer hover:bg-gray-200 transition-colors"
                      >
                        {getNextStatuses(job.status).map((s) => (
                          <option key={s} value={s}>
                            {statusLabel(s)}
                          </option>
                        ))}
                      </select>
                      {job.invoiceNumber && (
                        <span className="px-2 py-1 text-xs font-mono font-bold text-gray-400 bg-gray-50 rounded">
                          Invoice{" "}
                          {formatInvoiceNumber(job.invoiceNumber, job.id)}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 flex gap-4">
                      <span className="flex items-center gap-1">
                        <MapPin size={14} /> {job.address}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone size={14} /> {job.phone}
                      </span>
                    </div>
                    {job.preferredDate && (
                      <div className="text-xs font-bold text-[#6B5010] bg-[#D4AF37]/10 px-2 py-1 rounded w-fit">
                        Prefers: {job.preferredDate}
                        {job.preferredWindow ? ` · ${job.preferredWindow}` : ""}
                      </div>
                    )}
                    {job.promoCode && (
                      <div className="text-xs font-bold text-green-700 bg-green-50 px-2 py-1 rounded w-fit">
                        Promo: {job.promoCode}
                        {job.promoDiscount ? ` (−$${job.promoDiscount})` : ""}
                      </div>
                    )}
                    {job.details && (
                      <p className="text-xs text-gray-500 italic max-w-md">
                        “{job.details}”
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2 bg-gray-50 p-2 rounded w-fit">
                      <span className="font-bold text-gray-400">$</span>
                      <input
                        type="number"
                        defaultValue={job.price}
                        onBlur={(e) => handlePrice(job.id, e.target.value)}
                        className="bg-transparent font-bold w-20 outline-none"
                      />
                      {(job.price ||
                        (job.lineItems && job.lineItems.length > 0)) && (
                        <div className="flex items-center gap-2 border-l pl-2 border-gray-300">
                          <a
                            href={`/invoice/${job.id}`}
                            target="_blank"
                            className="text-[#D4AF37] text-xs font-bold flex items-center gap-1 hover:underline"
                          >
                            <FileText size={12} /> View
                          </a>
                          <button
                            onClick={() => handleSendInvoice(job.id)}
                            className="text-blue-500 text-xs font-bold hover:underline"
                          >
                            Send
                          </button>
                          <button
                            onClick={() => {
                              setEditingJob(job);
                              setEditForm({
                                price: job.price || 0,
                                // Auto-apply a validated promo discount the
                                // first time (respects an explicit 0 once set).
                                discount:
                                  job.discount ?? job.promoDiscount ?? 0,
                                taxRate: job.taxRate || 0,
                                invoiceNotes: job.invoiceNotes || "",
                              });
                              const hasItemized =
                                !!job.lineItems && job.lineItems.length > 0;
                              setEditLineItems(
                                hasItemized
                                  ? (job.lineItems ?? []).map((li) => ({
                                      ...li,
                                    }))
                                  : [],
                              );
                              setEditInvoiceItems(
                                job.invoiceItems && job.invoiceItems.length > 0
                                  ? [...job.invoiceItems]
                                  : [],
                              );
                              setInvoiceMode(hasItemized ? "itemized" : "lump");
                              setShowSettingsModal(true);
                            }}
                            className="text-gray-400 hover:text-black transition-colors"
                          >
                            <Settings size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 justify-center border-l pl-6 w-full md:w-40">
                    {/* SCHEDULE / RESCHEDULE LOGIC */}
                    {(job.status === "LEAD_RECEIVED" ||
                      job.status === "SCHEDULED") && (
                      <button
                        onClick={() => {
                          setSchedulingJobId(job.id);
                          setScheduleDate(preferredDateTimeLocal(job));
                          setIsScheduleModalOpen(true);
                        }}
                        disabled={syncingJobId === job.id}
                        className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#D4AF37] hover:text-black transition-all disabled:opacity-50"
                      >
                        {syncingJobId === job.id ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="animate-spin" size={14} />{" "}
                            Syncing...
                          </span>
                        ) : job.status === "SCHEDULED" ? (
                          "Reschedule"
                        ) : (
                          "Schedule"
                        )}
                      </button>
                    )}
                    {/* ON MY WAY BUTTON */}
                    {job.status === "SCHEDULED" && (
                      <>
                        <button
                          onClick={() => handleOnMyWay(job.id)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                        >
                          <Truck size={14} /> On My Way
                        </button>
                        <button
                          onClick={() =>
                            handleStatusUpdate(job.id, "COMPLETED")
                          }
                          className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-green-700 transition-all"
                        >
                          Complete
                        </button>
                      </>
                    )}
                    {/* RECURRING BUTTON */}
                    {(job.status === "COMPLETED" || job.status === "PAID") && (
                      <button
                        onClick={() => handleRecurring(job.id)}
                        className="bg-purple-100 text-purple-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-purple-200 transition-all flex items-center justify-center gap-2"
                      >
                        <Repeat size={14} /> Recurring
                      </button>
                    )}
                    <button
                      onClick={() => openMessage(job)}
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-200 transition-all"
                    >
                      <MessageSquare size={14} /> Message
                    </button>
                    <button
                      onClick={() => handleDelete(job.id)}
                      className="bg-red-50 text-red-500 px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-100 transition-all"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        </div>
      </main>

      {/* INVOICE SETTINGS MODAL */}
      {showSettingsModal && editingJob && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 max-w-4xl w-full shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-xl">
                Invoice — Edit &amp; Preview
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-gray-400 hover:text-black"
              >
                <X size={24} />
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-8 max-h-[72vh] overflow-auto">
              <div className="space-y-4 pr-1">
                {/* PRICING STYLE TOGGLE */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                    Pricing style
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setInvoiceMode("lump")}
                      className={`p-3 rounded-xl text-sm font-bold border transition-all ${
                        invoiceMode === "lump"
                          ? "bg-[#D4AF37] text-black border-[#D4AF37]"
                          : "bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100"
                      }`}
                    >
                      One price + list
                    </button>
                    <button
                      type="button"
                      onClick={() => setInvoiceMode("itemized")}
                      className={`p-3 rounded-xl text-sm font-bold border transition-all ${
                        invoiceMode === "itemized"
                          ? "bg-[#D4AF37] text-black border-[#D4AF37]"
                          : "bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100"
                      }`}
                    >
                      Itemized prices
                    </button>
                  </div>
                </div>

                {invoiceMode === "lump" ? (
                  <>
                    {/* TOTAL PRICE */}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                        Total Price ($)
                      </label>
                      <input
                        type="number"
                        value={editForm.price}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            price: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full bg-gray-50 p-3 rounded-xl font-bold outline-none focus:ring-2 focus:ring-[#D4AF37]"
                      />
                      <p className="text-xs text-gray-400 mt-1 font-medium">
                        Charge one total. List what&apos;s included below —
                        items show on the invoice without individual prices.
                      </p>
                    </div>
                    {/* INCLUDED ITEMS (description-only) */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase">
                          Included items (no prices)
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setEditInvoiceItems([...editInvoiceItems, ""])
                          }
                          className="text-xs font-bold text-[#D4AF37] hover:underline"
                        >
                          + Add item
                        </button>
                      </div>
                      {editInvoiceItems.length === 0 && (
                        <p className="text-xs text-gray-400 mb-2">
                          Optional. e.g. &ldquo;Exterior windows — all
                          floors&rdquo;, &ldquo;Gutter clearing&rdquo;.
                        </p>
                      )}
                      <div className="space-y-2">
                        {editInvoiceItems.map((it, idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <input
                              value={it}
                              onChange={(e) =>
                                setEditInvoiceItems(
                                  editInvoiceItems.map((v, i) =>
                                    i === idx ? e.target.value : v,
                                  ),
                                )
                              }
                              placeholder="Description"
                              className="flex-1 min-w-0 bg-gray-50 p-2 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-[#D4AF37]"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setEditInvoiceItems(
                                  editInvoiceItems.filter((_, i) => i !== idx),
                                )
                              }
                              className="text-gray-300 hover:text-red-500 transition-colors shrink-0"
                              aria-label="Remove item"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  /* ITEMIZED — each row sets its own price; line items drive the total */
                  <LineItemsEditor
                    lineItems={editLineItems}
                    onChange={setEditLineItems}
                    catalogServices={catalogServices}
                    emptyMessage="Add at least one line item — each row sets its own price and the total is the sum."
                  />
                )}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                    Discount Amount ($)
                  </label>
                  <input
                    type="number"
                    value={editForm.discount}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        discount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-gray-50 p-3 rounded-xl font-bold outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    value={editForm.taxRate}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        taxRate: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-gray-50 p-3 rounded-xl font-bold outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                    Invoice Notes
                  </label>
                  <textarea
                    value={editForm.invoiceNotes}
                    onChange={(e) =>
                      setEditForm({ ...editForm, invoiceNotes: e.target.value })
                    }
                    className="w-full bg-gray-50 p-3 rounded-xl font-bold outline-none focus:ring-2 focus:ring-[#D4AF37] resize-none h-24"
                    placeholder="Thank you for your business..."
                  />
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={async () => {
                      const res = await updateJobDetails(
                        editingJob.id,
                        buildInvoiceUpdate(),
                      );
                      if (!res.success) {
                        toast.error(errText(res));
                        return;
                      }
                      toast.success("Invoice settings saved");
                      setShowSettingsModal(false);
                    }}
                    className="flex-1 bg-gray-100 text-black p-4 rounded-xl font-bold hover:bg-gray-200 transition-all"
                  >
                    Save
                  </button>
                  <button
                    onClick={async () => {
                      if (
                        !(await confirm({
                          message: `Email this invoice to ${editingJob.name || "the customer"}?`,
                          confirmText: "Save & Send",
                        }))
                      )
                        return;
                      const save = await updateJobDetails(
                        editingJob.id,
                        buildInvoiceUpdate(),
                      );
                      if (!save.success) {
                        toast.error(errText(save));
                        return;
                      }
                      const res = await emailInvoice(editingJob.id);
                      if (!res.success) {
                        toast.error(errText(res));
                        return;
                      }
                      if ("deliveryWarning" in res && res.deliveryWarning)
                        toast.warning(res.deliveryWarning as string);
                      else toast.success("Invoice sent");
                      setShowSettingsModal(false);
                    }}
                    className="flex-1 bg-black text-white p-4 rounded-xl font-bold hover:bg-[#D4AF37] hover:text-black transition-all"
                  >
                    Save &amp; Send
                  </button>
                </div>
              </div>

              {/* LIVE PREVIEW — what the customer sees */}
              <div className="max-h-[72vh] overflow-auto">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">
                  Client preview
                </p>
                {(() => {
                  const cleaned =
                    invoiceMode === "itemized"
                      ? editLineItems.filter(
                          (li) => li.description.trim() && li.quantity > 0,
                        )
                      : [];
                  const previewItems =
                    invoiceMode === "lump"
                      ? editInvoiceItems.map((it) => it.trim()).filter(Boolean)
                      : [];
                  const t = computeInvoiceTotals({
                    lineItems: cleaned,
                    price: editForm.price,
                    service: editingJob.service,
                    discount: editForm.discount,
                    taxRate: editForm.taxRate,
                  });
                  const due = getDueDate(null).toLocaleDateString("en-CA", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  });
                  return (
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
                        <div className="flex justify-between mb-4">
                          <div>
                            <p className="text-gray-400 text-[10px] font-bold uppercase">
                              Billed To
                            </p>
                            <p className="font-bold">{editingJob.name}</p>
                            <p className="text-gray-500 text-xs">
                              {editingJob.address}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-400 text-[10px] font-bold uppercase">
                              Invoice
                            </p>
                            <p className="font-mono font-bold">
                              {formatInvoiceNumber(
                                editingJob.invoiceNumber,
                                editingJob.id,
                              )}
                            </p>
                            <p className="text-gray-500 text-xs mt-1">
                              Due {due}
                            </p>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                          {t.lineItems.map((item, i) => (
                            <div
                              key={i}
                              className="flex justify-between mb-2 last:mb-0"
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
                          {previewItems.length > 0 && (
                            <ul className="mt-1 space-y-1">
                              {previewItems.map((it, i) => (
                                <li
                                  key={i}
                                  className="flex gap-2 text-xs text-gray-500 font-medium"
                                >
                                  <span className="text-[#D4AF37]">•</span>
                                  <span>{it}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                          <div className="border-t border-gray-200 mt-3 pt-3 space-y-1 text-xs">
                            <div className="flex justify-between text-gray-500">
                              <span>Subtotal</span>
                              <span>${t.subtotal.toFixed(2)}</span>
                            </div>
                            {t.discount > 0 && (
                              <div className="flex justify-between text-green-600">
                                <span>Discount</span>
                                <span>-${t.discount.toFixed(2)}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-gray-500">
                              <span>Tax ({t.taxRate}%)</span>
                              <span>${t.taxAmount.toFixed(2)}</span>
                            </div>
                          </div>
                          <div className="flex justify-between font-black pt-3 mt-3 border-t border-gray-200">
                            <span>Total Due</span>
                            <span className="text-[#D4AF37]">
                              ${t.total.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        {editForm.invoiceNotes.trim() && (
                          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mt-3">
                            <p className="text-gray-400 text-[10px] font-bold uppercase mb-1">
                              Notes
                            </p>
                            <p className="text-gray-600 text-xs whitespace-pre-wrap">
                              {editForm.invoiceNotes}
                            </p>
                          </div>
                        )}
                        <p className="text-center text-[10px] text-gray-400 mt-4">
                          {BUSINESS.name} · {BUSINESS.address} ·{" "}
                          {BUSINESS.phone}
                          {BUSINESS.hstNumber
                            ? ` · HST# ${BUSINESS.hstNumber}`
                            : ""}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* SCHEDULE MODAL */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center"
          >
            <h3 className="font-black text-xl mb-4">Schedule Appointment</h3>
            <p className="text-gray-500 text-sm mb-6">
              Select a date and time to confirm this booking and sync with
              Google Calendar.
            </p>
            {(() => {
              const j = jobs.find((job) => job.id === schedulingJobId);
              return j?.preferredDate ? (
                <div className="bg-[#D4AF37]/10 text-[#6B5010] text-sm font-bold p-3 rounded-xl mb-4">
                  Customer requested: {j.preferredDate}
                  {j.preferredWindow ? ` · ${j.preferredWindow}` : ""}
                </div>
              ) : null;
            })()}
            <input
              type="datetime-local"
              value={scheduleDate}
              className="w-full bg-gray-50 p-3 rounded-xl font-bold outline-none ring-1 ring-gray-200 focus:ring-[#D4AF37] mb-6"
              onChange={(e) => {
                setScheduleDate(e.target.value);
                setSyncError(null);
              }}
            />
            {syncError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold mb-6">
                ⚠️ {syncError}
              </div>
            )}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setIsScheduleModalOpen(false);
                  setSyncError(null);
                }}
                className="flex-1 bg-gray-100 text-gray-500 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (schedulingJobId && scheduleDate) {
                    setSyncingJobId(schedulingJobId);
                    setSyncError(null);
                    const result = await confirmBooking(
                      schedulingJobId,
                      scheduleDate,
                    );
                    setSyncingJobId(null);
                    if (result.success) {
                      toast.success("Job scheduled");
                      setIsScheduleModalOpen(false);
                    } else {
                      setSyncError(
                        "error" in result
                          ? (result.error ?? "Unknown error")
                          : "Unknown error",
                      );
                    }
                  } else {
                    toast.error("Please select a date.");
                  }
                }}
                disabled={!!syncingJobId}
                className="flex-1 bg-black text-white py-3 rounded-xl font-bold hover:bg-[#D4AF37] hover:text-black transition-colors disabled:opacity-50"
              >
                {syncingJobId ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={16} /> Syncing...
                  </span>
                ) : (
                  "Confirm"
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* MESSAGE CUSTOMER MODAL */}
      {isMessageModalOpen && messagingJob && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-xl">
                Message {messagingJob.name || "customer"}
              </h3>
              <button
                onClick={() => setIsMessageModalOpen(false)}
                className="text-gray-400 hover:text-black"
              >
                <X size={24} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {(["sms", "email", "both"] as const).map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setMessageChannel(ch)}
                  className={`p-2 rounded-xl text-sm font-bold border transition-all capitalize ${
                    messageChannel === ch
                      ? "bg-[#D4AF37] text-black border-[#D4AF37]"
                      : "bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100"
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>
            <textarea
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              maxLength={1000}
              placeholder="e.g. Running about 20 minutes late — see you soon!"
              className="w-full h-32 bg-gray-50 p-3 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-[#D4AF37] resize-none mb-2"
            />
            <p className="text-xs text-gray-400 mb-4">
              {1000 - messageBody.length} characters left · sent to{" "}
              {messageChannel === "email"
                ? "email"
                : messageChannel === "both"
                  ? "SMS + email"
                  : "SMS"}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsMessageModalOpen(false)}
                className="flex-1 bg-gray-100 text-gray-500 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendMessage}
                disabled={sendingMessage || !messageBody.trim()}
                className="flex-1 bg-black text-white py-3 rounded-xl font-bold hover:bg-[#D4AF37] hover:text-black transition-colors disabled:opacity-50"
              >
                {sendingMessage ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={16} /> Sending...
                  </span>
                ) : (
                  "Send"
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
