import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FiUsers } from "react-icons/fi";

type CommunityMembersButtonProps = {
  communityId: string;
  isJoined: boolean;
};

const CommunityMembersButton: React.FC<CommunityMembersButtonProps> = ({
  communityId,
  isJoined,
}) => {
  const router = useRouter();

  if (!isJoined) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-10 text-xl"
      onClick={() => router.push(`/c/${communityId}/members`)}
      title="View community members"
    >
      <FiUsers className="size-5" />
      <span className="sr-only">View community members</span>
    </Button>
  );
};

export default CommunityMembersButton;
