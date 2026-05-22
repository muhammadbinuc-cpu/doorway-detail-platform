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
} from "@react-email/components";
import * as React from "react";

interface InvoiceEmailProps {
  clientName: string;
  service: string;
  amount: number;
  invoiceUrl: string;
  invoiceId: string;
}

export const InvoiceEmail = ({
  clientName,
  service,
  amount,
  invoiceUrl,
  invoiceId,
}: InvoiceEmailProps) => {
  const formattedId = invoiceId.slice(0, 6).toUpperCase();

  return (
    <Html>
      <Head />
      <Preview>Official Invoice #{formattedId} from DoorWay Detail</Preview>
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
            {/* --- BILLED TO SECTION --- */}
            <Section style={{ marginBottom: "32px" }}>
              <Row>
                <Column>
                  <Text style={label}>BILLED TO</Text>
                  <Heading as="h3" style={clientNameHeading}>{clientName}</Heading>
                </Column>
                <Column style={{ textAlign: "right" }}>
                  <Text style={label}>INVOICE #</Text>
                  <Text style={invoiceIdText}>{formattedId}</Text>
                </Column>
              </Row>
            </Section>

            {/* --- SUMMARY BOX --- */}
            <Section style={summaryBox}>
              <Row style={{ marginBottom: "16px", borderBottom: "1px solid #e5e7eb", paddingBottom: "16px" }}>
                <Column>
                  <Text style={itemTitle}>{service}</Text>
                </Column>
                <Column style={{ textAlign: "right" }}>
                  <Text style={itemPrice}>${amount.toFixed(2)}</Text>
                </Column>
              </Row>
              {/* Note: We are simplifying tax/discount for the email view to just show total for now to ensure layout stability */}
              <Row style={{ paddingTop: "16px" }}>
                <Column>
                  <Text style={totalLabel}>Total Due</Text>
                </Column>
                <Column style={{ textAlign: "right" }}>
                  <Text style={totalPrice}>${amount.toFixed(2)}</Text>
                </Column>
              </Row>
            </Section>

            {/* --- BUTTON --- */}
            <Button style={button} href={invoiceUrl}>
              Pay ${amount.toFixed(2)}
            </Button>

            {/* --- FOOTER --- */}
            <Text style={footer}>
              SECURE PAYMENT PROCESSING
            </Text>
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
  backgroundColor: "#f9fafb", // bg-gray-50
  fontFamily: fontFamily,
  padding: "20px 0",
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  borderRadius: "24px", // rounded-3xl
  overflow: "hidden",
  border: "1px solid #e5e7eb", // border-gray-100
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
  color: "#9ca3af", // text-gray-400
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
  color: "#9ca3af", // text-gray-400
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
  color: "#6b7280", // text-gray-500
  margin: "0",
};

const summaryBox = {
  backgroundColor: "#f9fafb", // bg-gray-50
  borderRadius: "16px", // rounded-2xl
  padding: "24px",
  marginBottom: "32px",
  border: "1px solid #e5e7eb",
};

const itemTitle = {
  fontSize: "16px",
  fontWeight: "700",
  color: "#000000",
  margin: "0",
};

const itemPrice = {
  fontSize: "16px",
  fontWeight: "700",
  color: "#000000",
  margin: "0",
};

const totalLabel = {
  fontSize: "20px",
  fontWeight: "900",
  color: "#000000",
  margin: "0",
};

const totalPrice = {
  fontSize: "20px",
  fontWeight: "900",
  color: "#D4AF37", // Gold
  margin: "0",
};

const button = {
  backgroundColor: "#000000",
  borderRadius: "12px", // rounded-xl
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
  color: "#9ca3af", // text-gray-400
  fontSize: "12px",
  fontWeight: "700",
  textTransform: "uppercase" as const,
  textAlign: "center" as const,
  marginTop: "24px",
  margin: "24px 0 0",
};
