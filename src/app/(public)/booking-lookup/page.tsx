import { Container, PageHeader } from "@/components/ui";
import { LookupForm } from "./LookupForm";

export const metadata = {
  title: "Find your booking",
  description:
    "Look up your QUALITY Hearing Care appointment with your booking reference and mobile number.",
};

export default function BookingLookupPage() {
  return (
    <Container className="py-12">
      <PageHeader
        eyebrow="Appointments"
        title="Find your booking"
        description="Enter your appointment number and the mobile number you booked with. Both are required — this keeps your booking private."
      />
      <LookupForm />
    </Container>
  );
}
