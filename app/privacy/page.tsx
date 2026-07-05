import type { Metadata } from "next";
import ContentNotAvailable from "@/components/common/ContentNotAvailable";

export const metadata: Metadata = {
  title: "Privacy Policy · Project Confucius Forum",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-3 py-10">
      <ContentNotAvailable
        variant="comingSoon"
        title="Privacy Policy"
        description="Our privacy policy is being finalized. Check back before long."
      />
    </div>
  );
}
