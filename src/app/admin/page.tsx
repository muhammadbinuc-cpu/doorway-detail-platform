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
} from "../actions";
import { JOB_WORKFLOW } from "@/lib/fsm_logic";
import { statusLabel } from "@/lib/job-status";
import { formatInvoiceNumber, BUSINESS } from "@/lib/business";
import { computeInvoiceTotals, getDueDate, type LineItem } from "@/lib/invoice";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
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
  invoiceNumber?: number;
}

const getNextStatuses = (currentStatus: string): string[] => {
  const allowed = JOB_WORKFLOW[currentStatus] || [];
  return [currentStatus, ...allowed];
};

const emptyLineItem = (): LineItem => ({
  description: "",
  quantity: 1,
  unitPrice: 0,
});

export default function AdminPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [editForm, setEditForm] = useState({
    discount: 0,
    taxRate: 13,
    invoiceNotes: "",
  });
  const [editLineItems, setEditLineItems] = useState<LineItem[]>([]);
  const [syncingJobId, setSyncingJobId] = useState<string | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [schedulingJobId, setSchedulingJobId] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [syncError, setSyncError] = useState<string | null>(null);
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
  const buildInvoiceUpdate = () => ({
    ...editForm,
    lineItems: editLineItems
      .filter((li) => li.description.trim() && li.quantity > 0)
      .map((li) => ({
        description: li.description.trim(),
        quantity: li.quantity,
        unitPrice: li.unitPrice,
      })),
  });
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
                    <div className="flex items-center gap-2 mt-2 bg-gray-50 p-2 rounded w-fit">
                      <span className="font-bold text-gray-400">$</span>
                      <input
                        type="number"
                        defaultValue={job.price}
                        onBlur={(e) => handlePrice(job.id, e.target.value)}
                        className="bg-transparent font-bold w-20 outline-none"
                      />
                      {job.price && (
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
                                discount: job.discount || 0,
                                taxRate: job.taxRate || 13,
                                invoiceNotes: job.invoiceNotes || "",
                              });
                              setEditLineItems(
                                job.lineItems && job.lineItems.length > 0
                                  ? job.lineItems.map((li) => ({ ...li }))
                                  : [],
                              );
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
                {/* LINE ITEMS EDITOR */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase">
                      Line Items
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setEditLineItems([...editLineItems, emptyLineItem()])
                      }
                      className="text-xs font-bold text-[#D4AF37] hover:underline"
                    >
                      + Add item
                    </button>
                  </div>
                  {editLineItems.length === 0 && (
                    <p className="text-xs text-gray-400 mb-2">
                      No line items — the invoice uses the job&apos;s single
                      price. Add items for a detailed breakdown.
                    </p>
                  )}
                  <div className="space-y-2">
                    {editLineItems.map((li, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          value={li.description}
                          onChange={(e) =>
                            setEditLineItems(
                              editLineItems.map((x, i) =>
                                i === idx
                                  ? { ...x, description: e.target.value }
                                  : x,
                              ),
                            )
                          }
                          placeholder="Description"
                          className="flex-1 bg-gray-50 p-2 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-[#D4AF37]"
                        />
                        <input
                          type="number"
                          min={1}
                          value={li.quantity}
                          onChange={(e) =>
                            setEditLineItems(
                              editLineItems.map((x, i) =>
                                i === idx
                                  ? {
                                      ...x,
                                      quantity: parseInt(e.target.value) || 1,
                                    }
                                  : x,
                              ),
                            )
                          }
                          className="w-14 bg-gray-50 p-2 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-[#D4AF37]"
                          title="Qty"
                        />
                        <input
                          type="number"
                          min={0}
                          value={li.unitPrice}
                          onChange={(e) =>
                            setEditLineItems(
                              editLineItems.map((x, i) =>
                                i === idx
                                  ? {
                                      ...x,
                                      unitPrice:
                                        parseFloat(e.target.value) || 0,
                                    }
                                  : x,
                              ),
                            )
                          }
                          className="w-20 bg-gray-50 p-2 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-[#D4AF37]"
                          title="Unit price ($)"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setEditLineItems(
                              editLineItems.filter((_, i) => i !== idx),
                            )
                          }
                          className="text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
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
                  const cleaned = editLineItems.filter(
                    (li) => li.description.trim() && li.quantity > 0,
                  );
                  const t = computeInvoiceTotals({
                    lineItems: cleaned,
                    price: editingJob.price,
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
            <input
              type="datetime-local"
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
    </div>
  );
}
