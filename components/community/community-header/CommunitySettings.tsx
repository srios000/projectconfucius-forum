import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import useCommunityPermissions from "@/hooks/community/useCommunityPermissions";
import { FiSettings } from "react-icons/fi";
import { Community } from "@/types/community";

type CommunitySettingsProps = {
  communityData: Community;
};

const CommunitySettings: React.FC<CommunitySettingsProps> = ({
  communityData,
}) => {
  const router = useRouter();
  const { isAdmin } = useCommunityPermissions(communityData);

  return (
    <>
      {isAdmin && (
        <Button
          variant="ghost"
          size="icon"
          className="size-10 text-xl"
          onClick={() => router.push(`/c/${communityData.id}/settings`)}
          title="View community settings"
        >
          <FiSettings className="size-5" />
          <span className="sr-only">View community settings</span>
        </Button>
      )}
    </>
  );
};

export default CommunitySettings;
