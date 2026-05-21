import SettingsLayout from "@/components/settings/SettingsLayout";
import SavedPostsList from "@/components/saved/SavedPostsList";

export default function SavedPage() {
  return (
    <SettingsLayout>
      <SavedPostsList />
    </SettingsLayout>
  );
}
