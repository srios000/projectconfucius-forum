import type { Metadata } from "next";
import ContentNotAvailable from "@/components/common/ContentNotAvailable";

export const metadata: Metadata = {
  title: "Community Guidelines · Project Confucius Forum",
};

export default function GuidelinesPage() {
  return (
    <div className="mx-auto max-w-2xl px-3 py-10">
      <ContentNotAvailable
        variant="comingSoon"
        title="Community Guidelines"
        description="Our guidelines for considered discussion are being written. Check back before long."
      />
    </div>
  );
}
