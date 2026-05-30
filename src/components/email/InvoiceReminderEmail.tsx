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
} from "@react-email/components";
import * as React from "react";

interface ReminderBusiness {
  name: string;
  phone: string;
  hstNumber?: string;
}

interface InvoiceReminderEmailProps {
  clientName: string;
  invoiceNumber: string;
  invoiceUrl: string;
  total: number;
  dueDate: string;
  business: ReminderBusiness;
}

const money = (n: number) => `$${n.toFixed(2)}`;

export const InvoiceReminderEmail = ({
  clientName,
  invoiceNumber,
  invoiceUrl,
  total,
  dueDate,
  business,
}: InvoiceReminderEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Payment reminder — Invoice {invoiceNumber} from DoorWay Detail</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>
              DOORWAY <span style={{ color: "#D4AF37" }}>DETAIL</span>
            </Heading>
            <Text style={headerSubtitle}>PAYMENT REMINDER</Text>
          </Section>

          <Section style={contentPadding}>
            <Heading as="h2" style={greeting}>Hi {clientName},</Heading>
            <Text style={paragraph}>
              This is a friendly reminder that invoice{" "}
              <strong>{invoiceNumber}</strong> is awaiting payment. It was due on{" "}
              <strong>{dueDate}</strong>.
            </Text>

            <Section style={amountBox}>
              <Text style={amountLabel}>Total Due</Text>
              <Text style={amountValue}>{money(total)}</Text>
            </Section>

            <Button style={button} href={invoiceUrl}>
              Pay {money(total)}
            </Button>

            <Text style={paragraph}>
              Already paid? Please disregard this message. Questions? Call or text{" "}
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

export default InvoiceReminderEmail;

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

const amountBox = {
  backgroundColor: "#f9fafb",
  borderRadius: "16px",
  padding: "20px 24px",
  marginBottom: "24px",
  border: "1px solid #e5e7eb",
  textAlign: "center" as const,
};

const amountLabel = {
  color: "#9ca3af",
  fontSize: "12px",
  fontWeight: "700",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  margin: "0 0 6px",
};

const amountValue = { fontSize: "32px", fontWeight: "900", color: "#D4AF37", margin: "0" };

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
  marginBottom: "20px",
};

const link = { color: "#6B5010", fontWeight: "700", textDecoration: "underline" };

const footer = {
  color: "#9ca3af",
  fontSize: "12px",
  fontWeight: "700",
  textAlign: "center" as const,
  margin: "28px 0 0",
};
