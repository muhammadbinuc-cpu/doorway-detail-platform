import {
  Html,
  Body,
  Container,
  Preview,
  Section,
  Text,
  Head,
  Heading,
} from "@react-email/components";
import * as React from "react";

interface QuoteConfirmationBusiness {
  name: string;
  phone: string;
}

interface QuoteConfirmationEmailProps {
  clientName: string;
  services: string;
  business: QuoteConfirmationBusiness;
}

export const QuoteConfirmationEmail = ({
  clientName,
  services,
  business,
}: QuoteConfirmationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>We&apos;ve got your request — DoorWay Detail</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>
              DOORWAY <span style={{ color: "#D4AF37" }}>DETAIL</span>
            </Heading>
            <Text style={headerSubtitle}>REQUEST RECEIVED</Text>
          </Section>

          <Section style={contentPadding}>
            <Heading as="h2" style={greeting}>Thanks, {clientName} 👋</Heading>
            <Text style={paragraph}>
              We&apos;ve received your request and a member of the team will call or
              text you shortly to confirm the details and get you scheduled.
            </Text>

            <Section style={summaryBox}>
              <Text style={label}>YOU REQUESTED</Text>
              <Text style={servicesText}>{services}</Text>
            </Section>

            <Text style={paragraph}>
              Need to reach us sooner? Call or text{" "}
              <a href={`tel:${business.phone}`} style={link}>{business.phone}</a>.
            </Text>

            <Text style={footer}>{business.name} · {business.phone}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default QuoteConfirmationEmail;

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

const summaryBox = {
  backgroundColor: "#f9fafb",
  borderRadius: "16px",
  padding: "20px",
  marginBottom: "20px",
  border: "1px solid #e5e7eb",
};

const label = {
  color: "#9ca3af",
  fontSize: "12px",
  fontWeight: "700",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  margin: "0 0 6px",
};

const servicesText = { fontSize: "16px", fontWeight: "700", color: "#000000", margin: "0" };

const link = { color: "#6B5010", fontWeight: "700", textDecoration: "underline" };

const footer = {
  color: "#9ca3af",
  fontSize: "12px",
  fontWeight: "700",
  textAlign: "center" as const,
  margin: "28px 0 0",
};
