import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { LineItem } from "@/lib/invoice";

export interface InvoicePdfProps {
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  hstNumber?: string;
  clientName: string;
  clientAddress: string;
  invoiceLabel: string;
  issuedDate: string;
  dueDate: string;
  status: string;
  lineItems: LineItem[];
  subtotal: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes?: string;
}

const GOLD = "#C9A227";
const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, color: "#111", fontFamily: "Helvetica" },
  header: {
    backgroundColor: "#111",
    padding: 20,
    marginBottom: 24,
    borderRadius: 6,
  },
  brand: { color: "#fff", fontSize: 18, fontFamily: "Helvetica-Bold" },
  brandGold: { color: GOLD },
  sub: { color: "#9ca3af", fontSize: 8, marginTop: 4, letterSpacing: 2 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  label: {
    color: "#9ca3af",
    fontSize: 8,
    marginBottom: 2,
    textTransform: "uppercase",
  },
  bold: { fontFamily: "Helvetica-Bold" },
  block: { marginBottom: 20 },
  table: {
    backgroundColor: "#f8f8f6",
    borderRadius: 6,
    padding: 16,
    marginTop: 12,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  divider: { borderTopWidth: 1, borderTopColor: "#e5e7eb", marginVertical: 8 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  totalText: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  gold: { color: GOLD },
  muted: { color: "#6b7280" },
  notes: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#f8f8f6",
    borderRadius: 6,
  },
  footer: { marginTop: 28, textAlign: "center", color: "#9ca3af", fontSize: 8 },
  paidBadge: {
    color: "#16a34a",
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    marginTop: 8,
  },
});

export default function InvoicePdf(p: InvoicePdfProps) {
  return (
    <Document title={`Invoice ${p.invoiceLabel}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>
            DOORWAY <Text style={styles.brandGold}>DETAIL</Text>
          </Text>
          <Text style={styles.sub}>OFFICIAL INVOICE</Text>
        </View>

        <View style={[styles.row, styles.block]}>
          <View>
            <Text style={styles.label}>Billed To</Text>
            <Text style={styles.bold}>{p.clientName}</Text>
            <Text style={styles.muted}>{p.clientAddress}</Text>
          </View>
          <View>
            <Text style={styles.label}>Invoice</Text>
            <Text style={styles.bold}>{p.invoiceLabel}</Text>
            <Text style={styles.muted}>Issued {p.issuedDate}</Text>
            <Text style={styles.muted}>Due {p.dueDate}</Text>
            {p.status === "PAID" && (
              <Text style={styles.paidBadge}>PAID IN FULL</Text>
            )}
          </View>
        </View>

        <View style={styles.table}>
          {p.lineItems.map((it, i) => (
            <View key={i} style={styles.item}>
              <Text style={styles.bold}>
                {it.description}
                {it.quantity > 1 ? `  x ${it.quantity}` : ""}
              </Text>
              <Text style={styles.bold}>
                ${(it.quantity * it.unitPrice).toFixed(2)}
              </Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.item}>
            <Text style={styles.muted}>Subtotal</Text>
            <Text style={styles.muted}>${p.subtotal.toFixed(2)}</Text>
          </View>
          {p.discount > 0 && (
            <View style={styles.item}>
              <Text style={{ color: "#16a34a" }}>Discount</Text>
              <Text style={{ color: "#16a34a" }}>
                -${p.discount.toFixed(2)}
              </Text>
            </View>
          )}
          <View style={styles.item}>
            <Text style={styles.muted}>Tax ({p.taxRate}%)</Text>
            <Text style={styles.muted}>${p.taxAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalText}>
              Total {p.status === "PAID" ? "Paid" : "Due"}
            </Text>
            <Text style={[styles.totalText, styles.gold]}>
              ${p.total.toFixed(2)}
            </Text>
          </View>
        </View>

        {p.notes ? (
          <View style={styles.notes}>
            <Text style={styles.label}>Notes</Text>
            <Text>{p.notes}</Text>
          </View>
        ) : null}

        <View style={styles.footer}>
          <Text style={styles.bold}>{p.businessName}</Text>
          <Text>
            {p.businessAddress} · {p.businessPhone}
          </Text>
          {p.hstNumber ? <Text>HST# {p.hstNumber}</Text> : null}
        </View>
      </Page>
    </Document>
  );
}
