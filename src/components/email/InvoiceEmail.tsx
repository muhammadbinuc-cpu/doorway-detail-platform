import {
  Html,
  Body,
  Container,
  Preview,
  Section,
  Text,
  Button,
  Head,
  Heading,
  Column,
  Row,
  Hr,
} from "@react-email/components";
import * as React from "react";
import type { LineItem } from "@/lib/invoice";

interface InvoiceEmailBusiness {
  name: string;
  phone: string;
  hstNumber?: string;
}

interface InvoiceEmailProps {
  clientName: string;
  invoiceNumber: string;
  invoiceUrl: string;
  lineItems: LineItem[];
  subtotal: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  dueDate: string;
  business: InvoiceEmailBusiness;
}

const money = (n: number) => `$${n.toFixed(2)}`;

export const InvoiceEmail = ({
  clientName,
  invoiceNumber,
  invoiceUrl,
  lineItems,
  subtotal,
  discount,
  taxRate,
  taxAmount,
  total,
  dueDate,
  business,
}: InvoiceEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Official Invoice {invoiceNumber} from DoorWay Detail</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* --- HEADER --- */}
          <Section style={header}>
            <Heading style={headerTitle}>
              DOORWAY <span style={{ color: "#D4AF37" }}>DETAIL</span>
            </Heading>
            <Text style={headerSubtitle}>OFFICIAL INVOICE</Text>
          </Section>

          {/* --- CONTENT --- */}
          <Section style={contentPadding}>
            {/* --- BILLED TO / META --- */}
            <Section style={{ marginBottom: "24px" }}>
              <Row>
                <Column>
                  <Text style={label}>BILLED TO</Text>
                  <Heading as="h3" style={clientNameHeading}>{clientName}</Heading>
                </Column>
                <Column style={{ textAlign: "right" }}>
                  <Text style={label}>INVOICE</Text>
                  <Text style={invoiceIdText}>{invoiceNumber}</Text>
                  <Text style={dueText}>Due {dueDate}</Text>
                </Column>
              </Row>
            </Section>

            {/* --- SUMMARY BOX --- */}
            <Section style={summaryBox}>
              {lineItems.map((item, i) => (
                <Row key={i} style={{ marginBottom: "10px" }}>
                  <Column>
                    <Text style={itemTitle}>
                      {item.description}
                      {item.quantity > 1 ? ` × ${item.quantity}` : ""}
                    </Text>
                  </Column>
                  <Column style={{ textAlign: "right" }}>
                    <Text style={itemPrice}>{money(item.quantity * item.unitPrice)}</Text>
                  </Column>
                </Row>
              ))}

              <Hr style={hr} />

              <Row style={{ marginBottom: "6px" }}>
                <Column><Text style={smallLabel}>Subtotal</Text></Column>
                <Column style={{ textAlign: "right" }}><Text style={smallValue}>{money(subtotal)}</Text></Column>
              </Row>
              {discount > 0 && (
                <Row style={{ marginBottom: "6px" }}>
                  <Column><Text style={smallLabelGreen}>Discount</Text></Column>
                  <Column style={{ textAlign: "right" }}><Text style={smallValueGreen}>-{money(discount)}</Text></Column>
                </Row>
              )}
              <Row style={{ marginBottom: "6px" }}>
                <Column><Text style={smallLabel}>Tax ({taxRate}%)</Text></Column>
                <Column style={{ textAlign: "right" }}><Text style={smallValue}>{money(taxAmount)}</Text></Column>
              </Row>

              <Hr style={hr} />

              <Row style={{ paddingTop: "4px" }}>
                <Column><Text style={totalLabel}>Total Due</Text></Column>
                <Column style={{ textAlign: "right" }}><Text style={totalPrice}>{money(total)}</Text></Column>
              </Row>
            </Section>

            {/* --- BUTTON --- */}
            <Button style={button} href={invoiceUrl}>
              Pay {money(total)}
            </Button>

            {/* --- FOOTER --- */}
            <Text style={footer}>
              {business.name}
              {business.hstNumber ? ` · HST# ${business.hstNumber}` : ""} · {business.phone}
            </Text>
            <Text style={footerSub}>SECURE PAYMENT PROCESSING</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default InvoiceEmail;

// --- STYLES ---
const fontFamily = '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol"';

const main = {
  backgroundColor: "#f9fafb",
  fontFamily: fontFamily,
  padding: "20px 0",
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  borderRadius: "24px",
  overflow: "hidden",
  border: "1px solid #e5e7eb",
  maxWidth: "600px",
};

const header = {
  backgroundColor: "#000000",
  padding: "32px",
  textAlign: "center" as const,
};

const headerTitle = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "900",
  fontStyle: "italic",
  letterSpacing: "0.05em",
  margin: "0 0 8px",
};

const headerSubtitle = {
  color: "#9ca3af",
  fontSize: "12px",
  fontWeight: "700",
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
  margin: "0",
};

const contentPadding = {
  padding: "32px",
};

const label = {
  color: "#9ca3af",
  fontSize: "12px",
  fontWeight: "700",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  margin: "0 0 4px",
};

const clientNameHeading = {
  fontSize: "20px",
  fontWeight: "700",
  color: "#000000",
  margin: "0",
};

const invoiceIdText = {
  fontSize: "16px",
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  fontWeight: "700",
  color: "#000000",
  margin: "0",
};

const dueText = {
  fontSize: "12px",
  fontWeight: "600",
  color: "#6b7280",
  margin: "4px 0 0",
};

const summaryBox = {
  backgroundColor: "#f9fafb",
  borderRadius: "16px",
  padding: "24px",
  marginBottom: "28px",
  border: "1px solid #e5e7eb",
};

const itemTitle = {
  fontSize: "15px",
  fontWeight: "700",
  color: "#000000",
  margin: "0",
};

const itemPrice = {
  fontSize: "15px",
  fontWeight: "700",
  color: "#000000",
  margin: "0",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "14px 0",
};

const smallLabel = {
  fontSize: "13px",
  fontWeight: "600",
  color: "#6b7280",
  margin: "0",
};

const smallValue = {
  fontSize: "13px",
  fontWeight: "600",
  color: "#374151",
  margin: "0",
};

const smallLabelGreen = { ...smallLabel, color: "#16a34a" };
const smallValueGreen = { ...smallValue, color: "#16a34a" };

const totalLabel = {
  fontSize: "20px",
  fontWeight: "900",
  color: "#000000",
  margin: "0",
};

const totalPrice = {
  fontSize: "20px",
  fontWeight: "900",
  color: "#D4AF37",
  margin: "0",
};

const button = {
  backgroundColor: "#000000",
  borderRadius: "12px",
  color: "#ffffff",
  fontSize: "18px",
  fontWeight: "700",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  width: "100%",
  padding: "20px 0",
};

const footer = {
  color: "#374151",
  fontSize: "13px",
  fontWeight: "700",
  textAlign: "center" as const,
  margin: "24px 0 4px",
};

const footerSub = {
  color: "#9ca3af",
  fontSize: "11px",
  fontWeight: "700",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  textAlign: "center" as const,
  margin: "0",
};
