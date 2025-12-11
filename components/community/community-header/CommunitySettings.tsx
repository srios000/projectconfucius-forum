import React, { useState } from "react";
import { IconButton, Icon } from "@chakra-ui/react";
import useCommunityPermissions from "@/hooks/community/useCommunityPermissions";
import { useParams } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/firebase/clientApp";
import { FiSettings } from "react-icons/fi";
import CommunitySettingsModal from "../../modal/community-settings/CommunitySettings";
import { Community } from "@/types/community";

type CommunitySettingsProps = {
  communityData: Community;
};

/**
 * Settings gear shown to community admins.
 * @param communityData - Community used for permission checks and modal context.
 * @returns Icon button that opens the community settings modal.
 */
const CommunitySettings: React.FC<CommunitySettingsProps> = ({
  communityData,
}) => {
  const params = useParams();
  const communityId = params?.communityId;
  const [user] = useAuthState(auth);
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
          <IconButton
            aria-label="Toggle color mode"
            variant="ghost"
            fontSize={20}
            onClick={() => setCommunitySettingsModalOpen(true)}
          >
            <Icon as={FiSettings} />
          </IconButton>
        </>
      )}
    </>
  );
};

export default CommunitySettings;
