import React from "react";
import { useRouter } from "next/navigation";
import { IconButton, Icon } from "@chakra-ui/react";
import { FiUsers } from "react-icons/fi";

type CommunityMembersButtonProps = {
  communityId: string;
  isJoined: boolean;
};

/**
 * Button that navigates to the community members page for subscribers.
 * @param communityId - Community whose members should be listed.
 * @param isJoined - Whether the current user is a member; hides button otherwise.
 * @returns Icon button.
 */
const CommunityMembersButton: React.FC<CommunityMembersButtonProps> = ({
  communityId,
  isJoined,
}) => {
  const router = useRouter();

  if (!isJoined) {
    return null;
  }

  return (
    <IconButton
      aria-label="View community members"
      variant="ghost"
      fontSize={20}
      onClick={() => router.push(`/c/${communityId}/members`)}
    >
      <Icon as={FiUsers} />
    </IconButton>
  );
};

export default CommunityMembersButton;

