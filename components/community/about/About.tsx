import { Community } from "@/types/community";
import useCommunityState from "@/hooks/community/useCommunityState";
import { useRouter } from "next/navigation";
import React from "react";
import AboutCommunity from "./AboutCommunity";
import AboutHeaderBar from "./AboutHeaderBar";
import AdminSectionAbout from "./AdminSectionAbout";
import useCommunityPermissions from "@/hooks/community/useCommunityPermissions";
import { Button } from "@/components/ui/button";

type AboutProps = {
  communityData: Community;
};

/**
 * This about component is used for displaying general information about the community.
 * @param communityData - data required to be displayed
 * @returns About component
 */
const About: React.FC<AboutProps> = ({ communityData }) => {
  const router = useRouter();
  const { communityStateValue } = useCommunityState();
  const isJoined = !!communityStateValue.mySnippets.find(
    (item) => item.communityId === communityData.id
  );
  const { canView, canPost } = useCommunityPermissions(communityData);

  if (!canView) {
    return null;
  }

  return (
    <div className="sticky top-[80px] rounded-xl shadow-md overflow-hidden border border-border bg-card">
      <AboutHeaderBar communityName={communityData.id} />
      <div className="flex flex-col p-3">
        <div className="flex flex-col gap-2.5">
          <AboutCommunity communityData={communityData} />
          {canPost && (
            <Button
              className="w-full h-8"
              onClick={() => {
                router.push(`/c/${communityData.id}`);
              }}
            >
              Create Post
            </Button>
          )}
          {isJoined && (
            <Button
              variant="outline"
              className="w-full h-8"
              onClick={() => {
                router.push(`/c/${communityData.id}/members`);
              }}
            >
              View Subscribers
            </Button>
          )}
          <AdminSectionAbout communityData={communityData} />
        </div>
      </div>
    </div>
  );
};
export default About;
