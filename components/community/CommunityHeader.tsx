// components/community/CommunityHeader.tsx
import { Button } from "@/components/ui/button";
import { Community } from "@/types/community";
import CommunitySettings from "./community-header/CommunitySettings";
import CommunityMembersButton from "./community-header/CommunityMembersButton";

type Props = {
  community: Community;
  isJoined: boolean;
  onToggleJoin: () => void;
};

export default function CommunityHeader({ community, isJoined, onToggleJoin }: Props) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 text-white mb-3"
      style={{
        background:
          "linear-gradient(135deg, hsl(var(--primary-deep)) 0%, hsl(var(--primary)) 60%, hsl(var(--primary-soft)) 100%)",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 90% 30%, rgba(255,255,255,0.18), transparent 50%)",
        }}
      />
      <div className="relative flex items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-lg font-semibold tracking-tight">c/{community.id}</h1>
          <p className="text-xs opacity-85 mt-0.5">A place for considered discussion.</p>
          <div className="text-[11px] opacity-75 mt-2.5 flex gap-3">
            <span>{community.numberOfMembers ?? 0} members</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CommunityMembersButton communityId={community.id} isJoined={isJoined} />
          <CommunitySettings communityData={community} />
          <Button
            onClick={onToggleJoin}
            className="bg-white/15 hover:bg-white/25 border border-white/30 backdrop-blur-sm"
          >
            {isJoined ? "✓ Joined" : "Join"}
          </Button>
        </div>
      </div>
    </div>
  );
}
