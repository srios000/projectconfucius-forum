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
          "linear-gradient(135deg, hsl(var(--primary-deep)) 0%, hsl(var(--primary)) 100%)",
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
        <div className="flex items-center gap-3.5 min-w-0">
          {community.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={community.imageUrl}
              alt=""
              className="size-14 rounded-full object-cover ring-2 ring-white/40 shadow-md shrink-0"
            />
          ) : (
            <div
              className="size-14 rounded-full ring-2 ring-white/40 shadow-md shrink-0 flex items-center justify-center font-serif text-xl font-bold text-white/90"
              style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.04))" }}
            >
              {community.id.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="font-serif text-lg font-semibold tracking-tight truncate drop-shadow-sm">c/{community.id}</h1>
            <p className="text-xs text-white/95 mt-0.5 drop-shadow-sm">A place for considered discussion.</p>
            <div className="text-[11px] text-white/90 mt-2.5 flex gap-3 drop-shadow-sm">
              <span>{community.numberOfMembers ?? 0} members</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
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
