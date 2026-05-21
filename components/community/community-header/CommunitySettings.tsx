import React from "react";
import { useRouter } from "next/navigation";
import { IconButton, Icon } from "@chakra-ui/react";
import useCommunityPermissions from "@/hooks/community/useCommunityPermissions";
import { FiSettings } from "react-icons/fi";
import { Community } from "@/types/community";

type CommunitySettingsProps = {
  communityData: Community;
};

/**
 * Settings gear shown to community admins.
 * @param communityData - Community used for permission checks and modal context.
 * @returns Icon button that navigates to the community settings page.
 */
const CommunitySettings: React.FC<CommunitySettingsProps> = ({
  communityData,
}) => {
  const router = useRouter();
  const { isAdmin } = useCommunityPermissions(communityData);

  return (
    <>
      {isAdmin && (
        <IconButton
          aria-label="View community settings"
          variant="ghost"
          fontSize={20}
          onClick={() => router.push(`/c/${communityData.id}/settings`)}
        >
          <Icon as={FiSettings} />
        </IconButton>
      )}
    </>
  );
};

export default CommunitySettings;

