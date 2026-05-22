"use server";

import { getPosts, type PostCursor } from "@/lib/posts/getPosts";
import { getCommunities, type CommunityCursor } from "@/lib/community/getCommunities";
import { getCommunityData } from "@/lib/community/getCommunityData";
import { getComments } from "@/lib/comments/getComments";
import { getSearchData } from "@/lib/search/getSearchData";
import { getPost } from "@/lib/posts/getPost";
import { fetchCommunityAdmins } from "@/lib/community/fetchCommunityAdmins";
import { fetchCommunityMembers } from "@/lib/community/fetchCommunityMembers";
import { findUserByEmail } from "@/lib/community/findUserByEmail";
import { searchUsersByEmail } from "@/lib/community/searchUsersByEmail";
import { getUserProfile } from "@/lib/users/getUserProfile";

// Public reads — no auth required (guest feed, search, community pages).
// Wrapped as server actions so client hooks never import `@/lib/db`.

export async function getPostsAction(
  communityId?: string,
  communityIds?: string[],
  isGenericHome?: boolean,
  lastVisible?: PostCursor,
  wallUserId?: string
) {
  return getPosts(communityId, communityIds, isGenericHome, lastVisible, wallUserId);
}

export async function getCommunitiesAction(
  limitValue: number,
  lastVisible?: CommunityCursor
) {
  return getCommunities(limitValue, lastVisible);
}

export async function getCommunityDataAction(communityId: string) {
  return getCommunityData(communityId);
}

export async function getCommentsAction(postId: string) {
  return getComments(postId);
}

export async function getSearchDataAction(q: string) {
  return getSearchData(q);
}

export async function getPostAction(postId: string) {
  return getPost(postId);
}

export async function fetchCommunityAdminsAction(communityId: string) {
  return fetchCommunityAdmins(communityId);
}

export async function fetchCommunityMembersAction(communityId: string) {
  return fetchCommunityMembers(communityId);
}

export async function findUserByEmailAction(email: string) {
  return findUserByEmail(email);
}

export async function searchUsersByEmailAction(emailQuery: string) {
  return searchUsersByEmail(emailQuery);
}

export async function getUserProfileAction(idOrUsername: string) {
  return getUserProfile(idOrUsername);
}
