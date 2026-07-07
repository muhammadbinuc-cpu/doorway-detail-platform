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

interface QuoteEmailBusiness {
  name: string;
  phone: string;
}

interface QuoteEmailProps {
  clientName: string;
  quoteNumber: string;
  quoteUrl: string;
  lineItems: LineItem[];
  invoiceItems?: string[];
  subtotal: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  validUntil: string;
  quoteNotes?: string;
  business: QuoteEmailBusiness;
}

const money = (n: number) => `$${n.toFixed(2)}`;

export const QuoteEmail = ({
  clientName,
  quoteNumber,
  quoteUrl,
  lineItems,
  invoiceItems,
  subtotal,
  discount,
  taxRate,
  taxAmount,
  total,
  validUntil,
  quoteNotes,
  business,
}: QuoteEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>
        Your quote {quoteNumber} from Doorway Detail — {money(total)}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>
              DOORWAY <span style={{ color: "#C9A227" }}>DETAIL</span>
            </Heading>
            <Text style={headerSubtitle}>YOUR QUOTE — NOT A BILL</Text>
          </Section>

          <Section style={contentPadding}>
            <Section style={{ marginBottom: "24px" }}>
              <Row>
                <Column>
                  <Text style={label}>PREPARED FOR</Text>
                  <Heading as="h3" style={clientNameHeading}>
                    {clientName}
                  </Heading>
                </Column>
                <Column style={{ textAlign: "right" }}>
                  <Text style={label}>QUOTE</Text>
                  <Text style={quoteIdText}>{quoteNumber}</Text>
                  <Text style={validText}>Valid until {validUntil}</Text>
                </Column>
              </Row>
            </Section>

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
                    <Text style={itemPrice}>
                      {money(item.quantity * item.unitPrice)}
                    </Text>
                  </Column>
                </Row>
              ))}

              {invoiceItems && invoiceItems.length > 0
                ? invoiceItems.map((item, i) => (
                    <Text key={`inc-${i}`} style={includedItem}>
                      • {item}
                    </Text>
                  ))
                : null}

              <Hr style={hr} />

              <Row style={{ marginBottom: "6px" }}>
                <Column>
                  <Text style={smallLabel}>Subtotal</Text>
                </Column>
                <Column style={{ textAlign: "right" }}>
                  <Text style={smallValue}>{money(subtotal)}</Text>
                </Column>
              </Row>
              {discount > 0 && (
                <Row style={{ marginBottom: "6px" }}>
                  <Column>
                    <Text style={smallLabelGreen}>Discount</Text>
                  </Column>
                  <Column style={{ textAlign: "right" }}>
                    <Text style={smallValueGreen}>-{money(discount)}</Text>
                  </Column>
                </Row>
              )}
              <Row style={{ marginBottom: "6px" }}>
                <Column>
                  <Text style={smallLabel}>Tax ({taxRate}%)</Text>
                </Column>
                <Column style={{ textAlign: "right" }}>
                  <Text style={smallValue}>{money(taxAmount)}</Text>
                </Column>
              </Row>

              <Hr style={hr} />

              <Row style={{ paddingTop: "4px" }}>
                <Column>
                  <Text style={totalLabel}>Quoted Total</Text>
                </Column>
                <Column style={{ textAlign: "right" }}>
                  <Text style={totalPrice}>{money(total)}</Text>
                </Column>
              </Row>
            </Section>

            <Button style={button} href={quoteUrl}>
              View &amp; Accept Quote
            </Button>
            <Text style={noPayText}>
              Nothing is charged now. Accepting just tells us you&apos;re in —
              we&apos;ll text you to book a time, and you only pay after the
              work is done.
            </Text>

            {quoteNotes ? (
              <Section style={notesBox}>
                <Text style={label}>NOTES</Text>
                <Text style={notesText}>{quoteNotes}</Text>
              </Section>
            ) : null}

            <Text style={footer}>
              {business.name} · {business.phone}
            </Text>
            <Text style={footerSub}>
              Questions? Reply to this email or call/text anytime.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default QuoteEmail;

// --- STYLES --- (matches InvoiceEmail, gold = brand #C9A227)
const fontFamily =
  '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol"';

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
  color: "#C9A227",
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

const quoteIdText = {
  fontSize: "16px",
  fontFamily:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  fontWeight: "700",
  color: "#000000",
  margin: "0",
};

const validText = {
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

const includedItem = {
  fontSize: "13px",
  fontWeight: "600",
  color: "#6b7280",
  margin: "0 0 4px",
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
  color: "#C9A227",
  margin: "0",
};

const button = {
  backgroundColor: "#C9A227",
  borderRadius: "12px",
  color: "#000000",
  fontSize: "18px",
  fontWeight: "700",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  width: "100%",
  padding: "20px 0",
};

const noPayText = {
  fontSize: "12px",
  fontWeight: "600",
  color: "#6b7280",
  textAlign: "center" as const,
  margin: "12px 0 0",
};

const notesBox = {
  backgroundColor: "#f9fafb",
  borderRadius: "12px",
  padding: "16px 20px",
  margin: "20px 0 0",
  border: "1px solid #e5e7eb",
};

const notesText = {
  fontSize: "13px",
  color: "#374151",
  margin: "4px 0 0",
  whiteSpace: "pre-wrap" as const,
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
