"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Loader2,
  Trash2,
  Save,
  FileText,
  Pencil,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  createJobFromClient,
  deleteClient,
  updateClient,
  updateClientNotes,
} from "@/app/actions";
import { statusMeta } from "@/lib/job-status";
import { useConfirm } from "@/components/ui/ConfirmDialog";

interface ClientProfileData {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  propertyNotes?: string;
}

interface JobHistoryItem {
  id: string;
  service?: string;
  status?: string;
  createdAt?: {
    seconds?: number;
  };
}

export default function ClientProfile() {
  const params = useParams();
  const id = params?.id as string;
  const [client, setClient] = useState<ClientProfileData | null>(null);
  const [history, setHistory] = useState<JobHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingJob, setCreatingJob] = useState(false);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [editing, setEditing] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const router = useRouter();
  const confirm = useConfirm();

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const snap = await getDoc(doc(db, "clients", id));
        if (snap.exists()) {
          const data = snap.data() as Omit<ClientProfileData, "id">;
          setClient({ id: snap.id, ...data });
          setNotes(data.propertyNotes || "");
        }
        const q = query(
          collection(db, "jobs"),
          where("clientId", "==", id),
          orderBy("createdAt", "desc"),
        );
        const jobs = await getDocs(q);
        setHistory(
          jobs.docs.map((d) => ({ id: d.id, ...d.data() }) as JobHistoryItem),
        );
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const startEditing = () => {
    if (!client) return;
    setForm({
      name: client.name || "",
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
    });
    setEditing(true);
  };

  const handleSaveInfo = async () => {
    setSavingInfo(true);
    const res = await updateClient(id, { ...form, propertyNotes: notes });
    setSavingInfo(false);
    if (res.success) {
      setClient((prev) => (prev ? { ...prev, ...form } : prev));
      setEditing(false);
      toast.success("Client updated");
    } else {
      toast.error(
        ("error" in res ? res.error : undefined) || "Failed to update client",
      );
    }
  };

  const handleNewJob = async () => {
    if (
      !(await confirm({
        message: "Start a new job for this client?",
        confirmText: "Start job",
      }))
    )
      return;
    setCreatingJob(true);
    const res = await createJobFromClient(id);
    if (res.success) {
      toast.success("Job created");
      router.push("/admin");
    } else {
      toast.error(
        ("error" in res ? res.error : undefined) || "Failed to create job",
      );
      setCreatingJob(false);
    }
  };

  const handleDelete = async () => {
    if (
      !(await confirm({
        title: "Delete client?",
        message: "This permanently deletes the client.",
        danger: true,
        confirmText: "Delete",
      }))
    )
      return;
    const res = await deleteClient(id);
    if (res.success) {
      toast.success("Client deleted");
      router.push("/admin/clients");
    } else
      toast.error(
        ("error" in res ? res.error : undefined) || "Failed to delete client",
      );
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    const res = await updateClientNotes(id, notes);
    setSavingNotes(false);
    if (res.success) toast.success("Notes saved");
    else
      toast.error(
        ("error" in res ? res.error : undefined) || "Failed to save notes",
      );
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  if (!client) return <div>Client not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-black p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        <Link
          href="/admin/clients"
          className="flex items-center gap-2 text-gray-500 hover:text-black mb-8 font-bold"
        >
          <ArrowLeft size={18} /> Back to Clients
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN: Profile & Notes */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border relative overflow-hidden">
              <div className="relative z-10">
                {editing ? (
                  <div className="space-y-3">
                    <input
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      placeholder="Name"
                      className="w-full text-2xl font-black bg-gray-50 rounded-xl p-3 outline-none border border-transparent focus:border-[#D4AF37] transition-all"
                    />
                    <div className="flex items-center gap-3">
                      <Mail size={18} className="text-gray-400 shrink-0" />
                      <input
                        value={form.email}
                        onChange={(e) =>
                          setForm({ ...form, email: e.target.value })
                        }
                        placeholder="Email"
                        className="w-full bg-gray-50 rounded-xl p-3 font-medium outline-none border border-transparent focus:border-[#D4AF37] transition-all"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone size={18} className="text-gray-400 shrink-0" />
                      <input
                        value={form.phone}
                        onChange={(e) =>
                          setForm({ ...form, phone: e.target.value })
                        }
                        placeholder="Phone"
                        className="w-full bg-gray-50 rounded-xl p-3 font-medium outline-none border border-transparent focus:border-[#D4AF37] transition-all"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin size={18} className="text-gray-400 shrink-0" />
                      <input
                        value={form.address}
                        onChange={(e) =>
                          setForm({ ...form, address: e.target.value })
                        }
                        placeholder="Address"
                        className="w-full bg-gray-50 rounded-xl p-3 font-medium outline-none border border-transparent focus:border-[#D4AF37] transition-all"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={handleSaveInfo}
                        disabled={savingInfo}
                        className="bg-black text-white px-4 py-2 rounded-xl font-bold hover:bg-[#D4AF37] hover:text-black transition-all flex items-center gap-2 disabled:opacity-60"
                      >
                        {savingInfo ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Save size={16} />
                        )}{" "}
                        Save
                      </button>
                      <button
                        onClick={() => setEditing(false)}
                        disabled={savingInfo}
                        className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl font-bold hover:bg-gray-200 transition-all flex items-center gap-2"
                      >
                        <X size={16} /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-4">
                      <h1 className="text-4xl font-black">{client.name}</h1>
                      <button
                        onClick={startEditing}
                        className="text-sm font-bold text-[#D4AF37] hover:underline flex items-center gap-1 shrink-0"
                      >
                        <Pencil size={14} /> Edit
                      </button>
                    </div>
                    <div className="space-y-3 text-gray-600 font-medium">
                      <div className="flex items-center gap-3">
                        <Mail size={18} /> {client.email}
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone size={18} /> {client.phone}
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin size={18} /> {client.address}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
            </div>

            {/* Property Notes */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-black flex items-center gap-2">
                  <FileText size={20} /> Property Notes
                </h3>
                <button
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="text-sm font-bold text-[#D4AF37] hover:underline flex items-center gap-1"
                >
                  {savingNotes ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}{" "}
                  Save Notes
                </button>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-32 bg-gray-50 rounded-xl p-4 font-medium outline-none border border-transparent focus:border-[#D4AF37] transition-all resize-none"
                placeholder="Enter gate codes, preferences, or property-specific instructions here..."
              />
            </div>

            {/* Job History */}
            <div>
              <h3 className="text-lg font-black mb-4 text-gray-400 uppercase">
                Job History
              </h3>
              <div className="space-y-4">
                {history.length === 0 && (
                  <p className="text-gray-400 italic">No jobs yet.</p>
                )}
                {history.map((job) => (
                  <div
                    key={job.id}
                    className="bg-white p-6 rounded-2xl border flex justify-between items-center hover:shadow-md transition-shadow"
                  >
                    <div>
                      <h4 className="font-bold">{job.service}</h4>
                      <p className="text-xs text-gray-400">
                        {job.createdAt?.seconds
                          ? new Date(
                              job.createdAt.seconds * 1000,
                            ).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${statusMeta(job.status || "").pill}`}
                    >
                      {statusMeta(job.status || "").label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Actions */}
          <div className="space-y-4">
            <button
              onClick={handleNewJob}
              disabled={creatingJob}
              className="w-full bg-black text-white p-4 rounded-xl font-bold hover:bg-[#D4AF37] hover:text-black transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {creatingJob ? (
                <Loader2 className="animate-spin" />
              ) : (
                "+ Start New Job"
              )}
            </button>

            <button
              onClick={handleDelete}
              className="w-full bg-red-50 text-red-500 p-4 rounded-xl font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2"
            >
              <Trash2 size={18} /> Delete Client
            </button>

            <div className="bg-blue-50 p-6 rounded-2xl text-blue-900 text-sm font-medium">
              <p className="mb-2">
                <strong>💡 Pro Tip:</strong>
              </p>
              Use &quot;Property Notes&quot; to track gate codes or specific
              cleaning instructions to ensure consistent service.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
