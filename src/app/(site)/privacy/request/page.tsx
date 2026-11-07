import type { Metadata } from "next";
import { Container, PageHeader } from "@/components/shared/section";
import { RequestForm } from "./request-form";

export const metadata: Metadata = { title: "Privacy request", robots: { index: false } };

export default function PrivacyRequestPage() {
  return (
    <>
      <PageHeader eyebrow="Privacy" title="Access or delete your data" intro="Under GDPR, UK GDPR and CCPA you can ask for a copy of your personal data or ask us to delete it." />
      <Container className="max-w-[720px] py-10 md:py-14"><RequestForm /></Container>
    </>
  );
}
