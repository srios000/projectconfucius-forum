import type { Metadata } from "next";
import ContentNotAvailable from "@/components/common/ContentNotAvailable";

export const metadata: Metadata = {
  title: "Terms of Service · Project Confucius Forum",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-3 py-10">
      <ContentNotAvailable
        variant="comingSoon"
        title="Terms of Service"
        description="Our terms of service are being drafted. Check back before long."
      />
    </div>
  );
}
