import { atom } from "jotai";
import { Community, CommunitySnippet } from "@/types/community";

/**
 * Stores the community snippets to track the state of the communities atom.
 * @propertymySnippets - list of community snippets
 * @property currentCommunity - the community the user is currently in
 * @property snippetFetched - whether the community snippets have been fetched or not
 */
interface CommunityState {
  mySnippets: CommunitySnippet[];
  currentCommunity?: Community;
  snippetFetched: boolean;
}

/**
 * Initially, the array for the community state is empty.
 * The community snippets have not been fetched initially hence array is empty.
 * @property mySnippets - empty array
 * @property snippetFetched - false by default
 */
export const defaultCommunityState: CommunityState = {
  mySnippets: [],
  snippetFetched: false,
};

/**
 * Stores the user's community snippets and the active community context.
 * @returns Jotai atom tracking membership data and whether snippets are loaded.
 */
export const communityStateAtom = atom<CommunityState>(defaultCommunityState);
