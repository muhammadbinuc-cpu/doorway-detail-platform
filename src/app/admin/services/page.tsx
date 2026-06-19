"use client";

import { useEffect, useState, type FormEvent } from "react";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { Loader2, Search, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createService, updateService, deleteService } from "@/app/actions";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useConfirm } from "@/components/ui/ConfirmDialog";

interface ServiceItem {
  id: string;
  name: string;
  description?: string;
  unitPrice: number;
}

const emptyForm = {
  name: "",
  description: "",
  unitPrice: "0",
};

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(
    null,
  );
  const [serviceForm, setServiceForm] = useState(emptyForm);
  const router = useRouter();
  const confirm = useConfirm();

  useEffect(() => {
    let unsubscribeServices: (() => void) | null = null;
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        const servicesQuery = query(collection(db, "services"), orderBy("name"));
        unsubscribeServices = onSnapshot(
          servicesQuery,
          (snap) => {
            setServices(
              snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ServiceItem),
            );
            setLoading(false);
          },
          (error) => {
            if (error.code !== "permission-denied")
              console.error("Firestore Services Error:", error);
            setLoading(false);
          },
        );
      } else {
        if (unsubscribeServices) unsubscribeServices();
        router.push("/login");
      }
    });
    return () => {
      if (unsubscribeServices) unsubscribeServices();
      unsubscribeAuth();
    };
  }, [router]);

  const errText = (res: { success: boolean; error?: string }) =>
    ("error" in res ? res.error : undefined) || "Unknown error";

  const openAddModal = () => {
    setEditingService(null);
    setServiceForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (service: ServiceItem) => {
    setEditingService(service);
    setServiceForm({
      name: service.name,
      description: service.description || "",
      unitPrice: String(service.unitPrice ?? 0),
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      name: serviceForm.name,
      description: serviceForm.description,
      unitPrice: parseFloat(serviceForm.unitPrice) || 0,
    };
    const result = editingService
      ? await updateService(editingService.id, payload)
      : await createService(payload);

    if (result.success) {
      toast.success(editingService ? "Service updated" : "Service added");
      setIsModalOpen(false);
      setEditingService(null);
      setServiceForm(emptyForm);
    } else {
      toast.error(errText(result));
    }
  };

  const handleDelete = async (service: ServiceItem) => {
    if (
      !(await confirm({
        title: "Delete service?",
        message: `Remove ${service.name} from the catalog? Existing invoices are unchanged.`,
        danger: true,
        confirmText: "Delete",
      }))
    )
      return;
    const result = await deleteService(service.id);
    if (result.success) toast.success("Service deleted");
    else toast.error(errText(result));
  };

  const filteredServices = services.filter((service) => {
    const q = searchTerm.toLowerCase();
    return (
      service.name.toLowerCase().includes(q) ||
      (service.description || "").toLowerCase().includes(q)
    );
  });

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans text-black">
      <AdminSidebar active="services" />

      <main className="flex-1 p-6 md:p-10 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-black">Service Catalog</h1>
              <p className="text-gray-500 mt-1">
                Manage reusable invoice line items.
              </p>
            </div>
            <button
              onClick={openAddModal}
              className="bg-black text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#D4AF37] hover:text-black transition-all"
            >
              <Plus size={18} /> Add Service
            </button>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex items-center gap-3">
            <Search className="text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by service or description..."
              className="flex-1 outline-none font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-6 text-xs font-bold text-gray-400 uppercase">
                    Service
                  </th>
                  <th className="p-6 text-xs font-bold text-gray-400 uppercase">
                    Description
                  </th>
                  <th className="p-6 text-xs font-bold text-gray-400 uppercase text-right">
                    Unit Price
                  </th>
                  <th className="p-6 text-xs font-bold text-gray-400 uppercase text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredServices.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-10 text-center text-gray-400 italic"
                    >
                      No services found.
                    </td>
                  </tr>
                )}
                {filteredServices.map((service) => (
                  <tr
                    key={service.id}
                    className="border-b last:border-0 hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-6 font-bold">{service.name}</td>
                    <td className="p-6 text-sm text-gray-500">
                      {service.description || "-"}
                    </td>
                    <td className="p-6 text-right font-bold text-[#D4AF37]">
                      ${Number(service.unitPrice || 0).toFixed(2)}
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-3 justify-end">
                        <button
                          onClick={() => openEditModal(service)}
                          className="text-sm font-bold text-gray-500 hover:text-black flex items-center gap-1"
                        >
                          <Pencil size={14} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(service)}
                          className="text-sm font-bold text-red-600 hover:underline flex items-center gap-1"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-3xl w-full max-w-lg shadow-2xl">
            <h2 className="text-2xl font-black mb-6">
              {editingService ? "Edit Service" : "Add Service"}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <input
                placeholder="Service name"
                required
                className="w-full bg-gray-50 p-4 rounded-xl font-bold outline-none focus:ring-2 focus:ring-[#D4AF37]"
                value={serviceForm.name}
                onChange={(e) =>
                  setServiceForm({ ...serviceForm, name: e.target.value })
                }
              />
              <textarea
                placeholder="Description"
                className="w-full bg-gray-50 p-4 rounded-xl font-bold outline-none focus:ring-2 focus:ring-[#D4AF37] resize-none h-24"
                value={serviceForm.description}
                onChange={(e) =>
                  setServiceForm({
                    ...serviceForm,
                    description: e.target.value,
                  })
                }
              />
              <input
                placeholder="Unit price"
                type="number"
                min={0}
                step="0.01"
                required
                className="w-full bg-gray-50 p-4 rounded-xl font-bold outline-none focus:ring-2 focus:ring-[#D4AF37]"
                value={serviceForm.unitPrice}
                onChange={(e) =>
                  setServiceForm({
                    ...serviceForm,
                    unitPrice: e.target.value,
                  })
                }
              />
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 p-4 rounded-xl font-bold text-gray-500 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-black text-white p-4 rounded-xl font-bold hover:bg-[#D4AF37] hover:text-black"
                >
                  {editingService ? "Save Changes" : "Save Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
