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

interface AppointmentReminderBusiness {
  name: string;
  phone: string;
}

interface AppointmentReminderEmailProps {
  clientName: string;
  dateLabel: string;
  services: string;
  address: string;
  business: AppointmentReminderBusiness;
}

export const AppointmentReminderEmail = ({
  clientName,
  dateLabel,
  services,
  address,
  business,
}: AppointmentReminderEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Reminder: your Doorway Detail appointment is coming up</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>
              DOORWAY <span style={{ color: "#D4AF37" }}>DETAIL</span>
            </Heading>
            <Text style={headerSubtitle}>APPOINTMENT REMINDER</Text>
          </Section>
          <Section style={content}>
            <Text style={greeting}>Hi {clientName},</Text>
            <Text style={body}>
              Just a friendly reminder that your appointment with{" "}
              {business.name} is coming up:
            </Text>
            <Section style={card}>
              <Text style={label}>WHEN</Text>
              <Text style={value}>{dateLabel}</Text>
              <Hr style={hr} />
              <Text style={label}>SERVICE</Text>
              <Text style={value}>{services}</Text>
              <Hr style={hr} />
              <Text style={label}>WHERE</Text>
              <Text style={value}>{address}</Text>
            </Section>
            <Text style={body}>
              We&apos;ll text you when we&apos;re on the way. Need to reschedule
              or have access notes for us? Just call or text {business.phone}.
            </Text>
            <Text style={footer}>
              {business.name} · {business.phone}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default AppointmentReminderEmail;

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
const content = { padding: "32px" };
const greeting = {
  fontSize: "18px",
  fontWeight: "700",
  color: "#000000",
  margin: "0 0 8px",
};
const body = {
  fontSize: "15px",
  color: "#374151",
  margin: "0 0 16px",
  lineHeight: "1.5",
};
const card = {
  backgroundColor: "#f9fafb",
  borderRadius: "16px",
  padding: "20px 24px",
  margin: "0 0 20px",
  border: "1px solid #e5e7eb",
};
const label = {
  color: "#9ca3af",
  fontSize: "11px",
  fontWeight: "700",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  margin: "0 0 2px",
};
const value = {
  color: "#111827",
  fontSize: "16px",
  fontWeight: "700",
  margin: "0",
};
const hr = { borderColor: "#e5e7eb", margin: "12px 0" };
const footer = {
  color: "#9ca3af",
  fontSize: "12px",
  fontWeight: "700",
  textAlign: "center" as const,
  margin: "24px 0 0",
};
