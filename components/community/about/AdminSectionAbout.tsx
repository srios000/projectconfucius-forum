import React from "react";
import { useRouter } from "next/navigation";
import { Community } from "@/types/community";
import { Button } from "@chakra-ui/react";
import useCommunityPermissions from "@/hooks/community/useCommunityPermissions";

type AdminSectionAboutProps = {
  communityData: Community;
};

/**
 * Shows a community settings entry point when the viewer is an admin.
 * @param communityData - Community used to derive permissions and pass into the modal.
 * @returns Button and modal wiring for admin settings.
 */
const AdminSectionAbout: React.FC<AdminSectionAboutProps> = ({
  communityData,
}) => {
  const router = useRouter();
  const { isAdmin } = useCommunityPermissions(communityData);

  return (
    <>
      {isAdmin && (
        <Button
          width="100%"
          variant={"outline"}
          onClick={() => router.push(`/c/${communityData.id}/settings`)}
        >
          Community Settings
        </Button>
      )}
    </>
  );
};

export default AdminSectionAbout;

