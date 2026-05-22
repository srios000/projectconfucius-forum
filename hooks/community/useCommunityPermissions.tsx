import { Community } from "@/types/community";
import { useSession } from "@/lib/auth-client";
import useCommunityState from "./useCommunityState";
import {
  checkCommunityPermission,
  checkCommunityViewPermission,
} from "@/lib/community/communityPermissions";

/**
 * A custom hook that calculates permission flags for the current user within a community.
 *
 * Moderator/creator status is derived from the user's community snippet
 * (`isModerator`), since the client session only exposes the central auth id —
 * the authoritative checks run server-side in the write actions.
 * @param communityData - The community object to check permissions against.
 * @returns An object containing boolean permission flags and a loading state indicator.
 */
const useCommunityPermissions = (communityData?: Community) => {
  const { data: session, isPending } = useSession();
  const user = session?.user ?? null;
  const { communityStateValue } = useCommunityState();

  const loading =
    isPending || (!!user && !communityStateValue.snippetFetched);

  if (!communityData) {
    return {
      isCreator: false,
      isAdmin: false,
      canManageAdmins: false,
      canPost: false,
      canComment: false,
      canView: false,
      loading,
    };
  }

  const snippet = communityStateValue.mySnippets.find(
    (s) => s.communityId === communityData.id
  );
  const isModerator = !!snippet?.isModerator;
  // The creator is always seeded as a moderator; the client cannot map the
  // central auth id to the local creatorId, so moderator status is used.
  const isCreator = isModerator;
  const isAdmin = isModerator;

  const hasPermission = checkCommunityPermission(
    communityData,
    communityStateValue.mySnippets
  );

  const canView = checkCommunityViewPermission(
    communityData,
    communityStateValue.mySnippets
  );

  return {
    isCreator,
    isAdmin,
    canManageAdmins: isAdmin,
    canPost: hasPermission,
    canComment: hasPermission,
    canView,
    loading,
  };
};

export default useCommunityPermissions;
