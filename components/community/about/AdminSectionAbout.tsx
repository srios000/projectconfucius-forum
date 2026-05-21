import React from "react";
import { useRouter } from "next/navigation";
import { Community } from "@/types/community";
import { Button } from "@/components/ui/button";
import useCommunityPermissions from "@/hooks/community/useCommunityPermissions";

type AdminSectionAboutProps = {
  communityData: Community;
};

const AdminSectionAbout: React.FC<AdminSectionAboutProps> = ({
  communityData,
}) => {
  const router = useRouter();
  const { isAdmin } = useCommunityPermissions(communityData);

  return (
    <>
      {isAdmin && (
        <Button
          variant="outline"
          className="w-full h-8"
          onClick={() => router.push(`/c/${communityData.id}/settings`)}
        >
          Community Settings
        </Button>
      )}
    </>
  );
};

export default AdminSectionAbout;
