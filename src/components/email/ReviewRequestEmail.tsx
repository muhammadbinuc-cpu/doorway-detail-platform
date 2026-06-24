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

interface ReviewRequestBusiness {
  name: string;
  phone: string;
}

interface ReviewRequestEmailProps {
  clientName: string;
  reviewUrl: string;
  business: ReviewRequestBusiness;
}

export const ReviewRequestEmail = ({
  clientName,
  reviewUrl,
  business,
}: ReviewRequestEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>How did we do? Leave {business.name} a quick review</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>
              DOORWAY <span style={{ color: "#D4AF37" }}>DETAIL</span>
            </Heading>
            <Text style={headerSubtitle}>THANK YOU</Text>
          </Section>
          <Section style={content}>
            <Text style={greeting}>Thank you, {clientName}! 🙌</Text>
            <Text style={body}>
              We hope your property looks fantastic. If you have a moment, a
              quick review means the world to a local business like ours and
              helps your neighbours find us.
            </Text>
            <Button style={button} href={reviewUrl}>
              Leave a review
            </Button>
            <Text style={body}>
              Spot anything you&apos;re not 100% happy with? Reply or call{" "}
              {business.phone} and we&apos;ll make it right.
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

export default ReviewRequestEmail;

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
const button = {
  backgroundColor: "#000000",
  borderRadius: "12px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "700",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  width: "100%",
  padding: "18px 0",
  margin: "0 0 20px",
};
const footer = {
  color: "#9ca3af",
  fontSize: "12px",
  fontWeight: "700",
  textAlign: "center" as const,
  margin: "24px 0 0",
};
