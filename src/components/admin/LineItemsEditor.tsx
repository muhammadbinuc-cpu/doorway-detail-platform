"use client";

import { X } from "lucide-react";
import type { LineItem } from "@/lib/invoice";
import { NumberField } from "@/components/admin/NumberField";

export interface CatalogService {
  id: string;
  name: string;
  description?: string;
  unitPrice: number;
}

interface LineItemsEditorProps {
  lineItems: LineItem[];
  onChange: (lineItems: LineItem[]) => void;
  catalogServices: CatalogService[];
  emptyMessage?: string;
}

const emptyLineItem = (): LineItem => ({
  description: "",
  quantity: 1,
  unitPrice: 0,
});

const catalogDescription = (service: CatalogService): string => {
  const detail = service.description?.trim();
  return detail ? `${service.name} - ${detail}` : service.name;
};

const formatCurrency = (amount: number): string => `$${amount.toFixed(2)}`;

export function LineItemsEditor({
  lineItems,
  onChange,
  catalogServices,
  emptyMessage = "No line items yet. Add items for a detailed breakdown.",
}: LineItemsEditorProps) {
  const updateLineItem = (idx: number, next: LineItem) => {
    onChange(lineItems.map((item, i) => (i === idx ? next : item)));
  };

  const insertCatalogService = (serviceId: string) => {
    const service = catalogServices.find((item) => item.id === serviceId);
    if (!service) return;
    onChange([
      ...lineItems,
      {
        description: catalogDescription(service),
        quantity: 1,
        unitPrice: service.unitPrice,
      },
    ]);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
        <label className="block text-xs font-bold text-gray-500 uppercase">
          Line Items
        </label>
        <button
          type="button"
          onClick={() => onChange([...lineItems, emptyLineItem()])}
          className="text-xs font-bold text-[#D4AF37] hover:underline self-start sm:self-auto"
        >
          + Add item
        </button>
      </div>
      <select
        value=""
        onChange={(e) => insertCatalogService(e.target.value)}
        disabled={catalogServices.length === 0}
        className="w-full bg-gray-50 p-3 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-[#D4AF37] disabled:text-gray-400 mb-3"
      >
        <option value="">
          {catalogServices.length > 0
            ? "Insert from catalog"
            : "No catalog items yet"}
        </option>
        {catalogServices.map((service) => (
          <option key={service.id} value={service.id}>
            {service.name} - {formatCurrency(service.unitPrice)}
          </option>
        ))}
      </select>
      {lineItems.length === 0 && (
        <p className="text-xs text-gray-400 mb-2">{emptyMessage}</p>
      )}
      <div className="space-y-2">
        {lineItems.map((li, idx) => (
          <div
            key={idx}
            className="grid grid-cols-[1fr_3.5rem_5rem_1.75rem] gap-2 items-center"
          >
            <input
              value={li.description}
              onChange={(e) =>
                updateLineItem(idx, { ...li, description: e.target.value })
              }
              placeholder="Description"
              className="min-w-0 bg-gray-50 p-2 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-[#D4AF37]"
            />
            <NumberField
              integer
              min={1}
              emptyValue={1}
              placeholder="1"
              value={li.quantity}
              onChange={(quantity) =>
                updateLineItem(idx, { ...li, quantity: quantity || 1 })
              }
              className="w-full bg-gray-50 p-2 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-[#D4AF37]"
              title="Qty"
            />
            <NumberField
              min={0}
              value={li.unitPrice}
              onChange={(unitPrice) =>
                updateLineItem(idx, { ...li, unitPrice })
              }
              className="w-full bg-gray-50 p-2 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-[#D4AF37]"
              title="Unit price ($)"
            />
            <button
              type="button"
              onClick={() => onChange(lineItems.filter((_, i) => i !== idx))}
              className="text-gray-300 hover:text-red-500 transition-colors"
              aria-label="Remove line item"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
