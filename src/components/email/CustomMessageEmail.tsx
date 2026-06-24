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

interface CustomMessageBusiness {
  name: string;
  phone: string;
}

interface CustomMessageEmailProps {
  clientName: string;
  message: string;
  business: CustomMessageBusiness;
}

export const CustomMessageEmail = ({
  clientName,
  message,
  business,
}: CustomMessageEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>A message from {business.name}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>
              DOORWAY <span style={{ color: "#D4AF37" }}>DETAIL</span>
            </Heading>
          </Section>
          <Section style={content}>
            <Text style={greeting}>Hi {clientName},</Text>
            <Text style={messageText}>{message}</Text>
            <Text style={footer}>
              {business.name} · {business.phone}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default CustomMessageEmail;

const fontFamily =
  '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif';

const main = { backgroundColor: "#f9fafb", fontFamily, padding: "20px 0" };
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
  padding: "28px 32px",
  textAlign: "center" as const,
};
const headerTitle = {
  color: "#ffffff",
  fontSize: "22px",
  fontWeight: "900",
  fontStyle: "italic",
  letterSpacing: "0.05em",
  margin: "0",
};
const content = { padding: "32px" };
const greeting = {
  fontSize: "16px",
  fontWeight: "700",
  color: "#000000",
  margin: "0 0 12px",
};
const messageText = {
  fontSize: "15px",
  color: "#374151",
  margin: "0 0 20px",
  lineHeight: "1.6",
  whiteSpace: "pre-wrap" as const,
};
const footer = {
  color: "#9ca3af",
  fontSize: "12px",
  fontWeight: "700",
  margin: "24px 0 0",
};
