import {
  Html,
  Body,
  Container,
  Preview,
  Section,
  Text,
  Head,
  Heading,
  Hr,
} from "@react-email/components";
import * as React from "react";

interface NewLeadEmailProps {
  businessName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  services: string;
  notes?: string;
  // Whether the customer-facing confirmations went out. false = failed,
  // null = not attempted (e.g. no phone).
  emailOk: boolean;
  smsOk: boolean | null;
}

export const NewLeadEmail = ({
  businessName,
  customerName,
  customerEmail,
  customerPhone,
  services,
  notes,
  emailOk,
  smsOk,
}: NewLeadEmailProps) => {
  const smsLine =
    smsOk === null
      ? "No phone provided — no SMS sent."
      : smsOk
        ? "Confirmation SMS sent ✅"
        : "⚠️ Confirmation SMS FAILED — follow up with this customer directly.";
  const emailLine = emailOk
    ? "Confirmation email sent ✅"
    : "⚠️ Confirmation email FAILED — follow up with this customer directly.";

  return (
    <Html>
      <Head />
      <Preview>New lead — {customerName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>New Lead</Heading>
            <Text style={headerSubtitle}>{businessName}</Text>
          </Section>
          <Section style={content}>
            <Text style={label}>CUSTOMER</Text>
            <Text style={value}>{customerName}</Text>
            <Text style={value}>{customerEmail}</Text>
            <Text style={value}>{customerPhone || "No phone"}</Text>

            <Hr style={hr} />

            <Text style={label}>REQUESTED</Text>
            <Text style={value}>{services}</Text>
            {notes ? (
              <>
                <Text style={label}>NOTES</Text>
                <Text style={value}>{notes}</Text>
              </>
            ) : null}

            <Hr style={hr} />

            <Text style={emailOk ? okText : alertText}>{emailLine}</Text>
            <Text style={smsOk === false ? alertText : okText}>{smsLine}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default NewLeadEmail;

const fontFamily =
  '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif';

const main = { backgroundColor: "#f9fafb", fontFamily, padding: "20px 0" };
const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  borderRadius: "16px",
  overflow: "hidden",
  border: "1px solid #e5e7eb",
  maxWidth: "560px",
};
const header = {
  backgroundColor: "#000000",
  padding: "24px 32px",
};
const headerTitle = {
  color: "#ffffff",
  fontSize: "20px",
  fontWeight: "900",
  margin: "0",
};
const headerSubtitle = {
  color: "#9ca3af",
  fontSize: "12px",
  fontWeight: "700",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  margin: "4px 0 0",
};
const content = { padding: "24px 32px" };
const label = {
  color: "#9ca3af",
  fontSize: "11px",
  fontWeight: "700",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  margin: "12px 0 2px",
};
const value = {
  color: "#111827",
  fontSize: "15px",
  fontWeight: "600",
  margin: "0",
};
const hr = { borderColor: "#e5e7eb", margin: "16px 0" };
const okText = {
  color: "#16a34a",
  fontSize: "13px",
  fontWeight: "700",
  margin: "2px 0",
};
const alertText = {
  color: "#b91c1c",
  fontSize: "13px",
  fontWeight: "700",
  margin: "2px 0",
};
