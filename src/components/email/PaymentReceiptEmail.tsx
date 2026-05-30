import {
  Html,
  Body,
  Container,
  Preview,
  Section,
  Text,
  Head,
  Heading,
  Row,
  Column,
  Hr,
} from "@react-email/components";
import * as React from "react";

interface ReceiptBusiness {
  name: string;
  phone: string;
  hstNumber?: string;
}

interface PaymentReceiptEmailProps {
  clientName: string;
  invoiceNumber: string;
  amount: number;
  method: string; // "E-transfer" | "Cash" | "Card"
  date: string;
  business: ReceiptBusiness;
}

const money = (n: number) => `$${n.toFixed(2)}`;

export const PaymentReceiptEmail = ({
  clientName,
  invoiceNumber,
  amount,
  method,
  date,
  business,
}: PaymentReceiptEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Payment received — Invoice {invoiceNumber} from DoorWay Detail</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>
              DOORWAY <span style={{ color: "#D4AF37" }}>DETAIL</span>
            </Heading>
            <Text style={headerSubtitle}>PAYMENT RECEIPT</Text>
          </Section>

          <Section style={contentPadding}>
            <Heading as="h2" style={greeting}>Thank you, {clientName}! ✅</Heading>
            <Text style={paragraph}>
              We&apos;ve received your payment in full. This email is your receipt — no balance remains.
            </Text>

            <Section style={box}>
              <Row style={rowStyle}>
                <Column><Text style={label}>Invoice</Text></Column>
                <Column style={right}><Text style={value}>{invoiceNumber}</Text></Column>
              </Row>
              <Row style={rowStyle}>
                <Column><Text style={label}>Date</Text></Column>
                <Column style={right}><Text style={value}>{date}</Text></Column>
              </Row>
              <Row style={rowStyle}>
                <Column><Text style={label}>Method</Text></Column>
                <Column style={right}><Text style={value}>{method}</Text></Column>
              </Row>
              <Hr style={hr} />
              <Row>
                <Column><Text style={totalLabel}>Amount Paid</Text></Column>
                <Column style={right}><Text style={totalValue}>{money(amount)}</Text></Column>
              </Row>
            </Section>

            <Text style={paragraph}>
              Questions about your receipt? Call or text{" "}
              <a href={`tel:${business.phone}`} style={link}>{business.phone}</a>.
            </Text>

            <Text style={footer}>
              {business.name}
              {business.hstNumber ? ` · HST# ${business.hstNumber}` : ""} · {business.phone}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default PaymentReceiptEmail;

// --- STYLES ---
const fontFamily = '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol"';

const main = { backgroundColor: "#f9fafb", fontFamily, padding: "20px 0" };

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  borderRadius: "24px",
  overflow: "hidden",
  border: "1px solid #e5e7eb",
  maxWidth: "600px",
};

const header = { backgroundColor: "#000000", padding: "32px", textAlign: "center" as const };

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

const contentPadding = { padding: "32px" };

const greeting = { fontSize: "22px", fontWeight: "900", color: "#000000", margin: "0 0 12px" };

const paragraph = { fontSize: "15px", lineHeight: "24px", color: "#374151", margin: "0 0 20px" };

const box = {
  backgroundColor: "#f9fafb",
  borderRadius: "16px",
  padding: "20px 24px",
  marginBottom: "24px",
  border: "1px solid #e5e7eb",
};

const rowStyle = { marginBottom: "8px" };
const right = { textAlign: "right" as const };

const label = { fontSize: "14px", fontWeight: "600", color: "#6b7280", margin: "0" };
const value = { fontSize: "14px", fontWeight: "700", color: "#111827", margin: "0" };

const hr = { borderColor: "#e5e7eb", margin: "12px 0" };

const totalLabel = { fontSize: "18px", fontWeight: "900", color: "#000000", margin: "0" };
const totalValue = { fontSize: "18px", fontWeight: "900", color: "#16a34a", margin: "0" };

const link = { color: "#6B5010", fontWeight: "700", textDecoration: "underline" };

const footer = {
  color: "#9ca3af",
  fontSize: "12px",
  fontWeight: "700",
  textAlign: "center" as const,
  margin: "28px 0 0",
};
