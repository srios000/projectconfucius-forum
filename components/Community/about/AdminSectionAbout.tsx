import React, { useState } from "react";
import { Community } from "@/atoms/communitiesAtom";
import { Button } from "@chakra-ui/react";
import useCommunityPermissions from "@/hooks/community/useCommunityPermissions";
import CommunitySettingsModal from "@/components/Modal/CommunitySettings/CommunitySettings";

type AdminSectionAboutProps = {
  communityData: Community;
};

const AdminSectionAbout: React.FC<AdminSectionAboutProps> = ({
  communityData,
}) => {
  const [isCommunitySettingsModalOpen, setCommunitySettingsModalOpen] =
    useState(false);
  const { isAdmin } = useCommunityPermissions(communityData);

  return (
    <>
      {isAdmin && (
        <>
          <CommunitySettingsModal
            open={isCommunitySettingsModalOpen}
            handleClose={() => setCommunitySettingsModalOpen(false)}
            communityData={communityData}
          />
          <Button
            width="100%"
            variant={"outline"}
            onClick={() => setCommunitySettingsModalOpen(true)}
          >
            Community Settings
          </Button>
        </>
      )}
    </>
  );
};

export default AdminSectionAbout;
