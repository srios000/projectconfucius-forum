import { Community } from "@/types/community";
import React, { useState } from "react";
import useCommunityState from "@/hooks/community/useCommunityState";
import useCommunityMembershipActions from "@/hooks/community/useCommunityMembershipActions";
import CommunityIcon from "./CommunityIcon";
import CommunityName from "./CommunityName";
import JoinOrLeaveButton from "./JoinOrLeaveButton";
import CommunitySettings from "./CommunitySettings";
import CommunityMembersButton from "./CommunityMembersButton";
import ConfirmationDialog from "@/components/modal/ConfirmationDialog";
import { useSession } from "@/lib/auth-client";

type HeaderProps = {
  communityData: Community;
};

const CommunityHeader: React.FC<HeaderProps> = ({ communityData }) => {
  const { communityStateValue } = useCommunityState();
  const { onJoinOrLeaveCommunity, loading } = useCommunityMembershipActions();
  const { data: session, isPending: authLoading } = useSession();
  const user = session?.user ?? null;
  const isJoined = !!communityStateValue.mySnippets.find(
    (item) => item.communityId === communityData.id
  );
  const [leaveConfirmationOpen, setLeaveConfirmationOpen] = useState(false);

  const isGlobalLoading =
    authLoading || (!!user && !communityStateValue.snippetFetched);

  const handleJoinOrLeave = () => {
    if (isJoined) {
      setLeaveConfirmationOpen(true);
    } else {
      onJoinOrLeaveCommunity(communityData, isJoined);
    }
  };

  const onConfirmLeave = async () => {
    await onJoinOrLeaveCommunity(communityData, isJoined);
    setLeaveConfirmationOpen(false);
  };

  return (
    <div className="flex flex-col w-full h-[120px]">
      <div className="h-[30%] bg-primary overflow-hidden">
        {communityData.bannerUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={communityData.bannerUrl}
            alt=""
            className="size-full object-cover"
          />
        )}
      </div>
      <div className="flex justify-center bg-card flex-grow shadow-sm">
        <div className="flex w-[95%] max-w-[1200px] items-center">
          <CommunityIcon imageURL={communityData.imageUrl} />
          <div className="flex p-2.5 w-full items-center">
            <CommunityName id={communityData.id} />
            <div className="flex flex-row flex-grow items-center justify-end gap-2">
              <CommunityMembersButton
                communityId={communityData.id}
                isJoined={isJoined}
              />
              <CommunitySettings communityData={communityData} />
              <JoinOrLeaveButton
                isJoined={isJoined}
                onClick={handleJoinOrLeave}
                isLoading={loading || isGlobalLoading}
              />
            </div>
          </div>
        </div>
      </div>
      <ConfirmationDialog
        open={leaveConfirmationOpen}
        onClose={() => setLeaveConfirmationOpen(false)}
        onConfirm={onConfirmLeave}
        title="Unsubscribe from Community"
        body={`Are you sure you want to unsubscribe from c/${communityData.id}?`}
        confirmButtonText="Unsubscribe"
        isLoading={loading}
      />
    </div>
  );
};
export default CommunityHeader;
