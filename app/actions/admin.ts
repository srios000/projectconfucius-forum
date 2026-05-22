"use server";

import { requireUser } from "@/lib/auth/session";
import { addCommunityAdmin } from "@/lib/community/addCommunityAdmin";
import { removeCommunityAdmin } from "@/lib/community/removeCommunityAdmin";
import { removeCommunityMember } from "@/lib/community/removeCommunityMember";

export async function addAdminAction(communityId: string, targetUserId: string) {
  await requireUser();
  return addCommunityAdmin(communityId, targetUserId);
}

export async function removeAdminAction(
  communityId: string,
  targetUserId: string
) {
  await requireUser();
  return removeCommunityAdmin(communityId, targetUserId);
}

export async function removeMemberAction(
  communityId: string,
  memberId: string
) {
  await requireUser();
  return removeCommunityMember(communityId, memberId);
}
