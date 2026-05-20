"use server";

import { requireUser } from "@/lib/auth/session";
import { createCommunity } from "@/lib/community/createCommunity";
import { joinCommunity } from "@/lib/community/joinCommunity";
import { leaveCommunity } from "@/lib/community/leaveCommunity";
import { getCommunitySnippets } from "@/lib/community/getCommunitySnippets";
import { deleteCommunity } from "@/lib/community/deleteCommunity";
import { updateCommunityPrivacy } from "@/lib/community/updateCommunityPrivacy";
import { deleteCommunityImage } from "@/lib/community/deleteCommunityImage";
import { removeCommunityMember } from "@/lib/community/removeCommunityMember";
import type { Community, CommunitySnippet } from "@/types/community";

export async function createCommunityAction(
  communityName: string,
  communityType: string
) {
  const { userId } = await requireUser();
  return createCommunity(communityName, communityType, userId);
}

export async function joinCommunityAction(
  communityData: Community
): Promise<CommunitySnippet> {
  const { userId } = await requireUser();
  const isCreatorOrModerator = userId === communityData.creatorId;
  return joinCommunity(
    userId,
    communityData.id,
    communityData.imageUrl || undefined,
    isCreatorOrModerator
  );
}

export async function leaveCommunityAction(communityId: string) {
  const { userId } = await requireUser();
  return leaveCommunity(userId, communityId);
}

export async function getCommunitySnippetsAction(): Promise<CommunitySnippet[]> {
  const { userId } = await requireUser();
  return getCommunitySnippets(userId);
}

export async function deleteCommunityAction(communityData: Community) {
  await requireUser();
  return deleteCommunity(communityData);
}

export async function updateCommunityPrivacyAction(
  communityId: string,
  privacyType: string
) {
  await requireUser();
  return updateCommunityPrivacy(communityId, privacyType);
}

export async function deleteCommunityImageAction(communityId: string) {
  await requireUser();
  return deleteCommunityImage(communityId);
}

export async function removeCommunityMemberAction(
  communityId: string,
  memberId: string
) {
  await requireUser();
  return removeCommunityMember(communityId, memberId);
}
