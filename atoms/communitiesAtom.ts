import { atom } from "jotai";
import { Community, CommunitySnippet } from "@/types/community";

/**
 * Stores the community snippets to track the state of the communities atom.
 * @property {CommunitySnippet[]} mySnippets - list of community snippets
 * @property {Community} currentCommunity - the community the user is currently in
 * @property {boolean} snippetFetched - whether the community snippets have been fetched or not
 */
interface CommunityState {
  mySnippets: CommunitySnippet[]; // stores a list of community snippets
  currentCommunity?: Community; // user is not always in a community hence optional
  snippetFetched: boolean;
}

/**
 * Initially, the array for the community state is empty.
 * The community snippets have not been fetched initially hence array is empty.
 * @property {CommunitySnippet[]} mySnippets - empty array
 * @property {boolean} snippetFetched - false by default
 */
export const defaultCommunityState: CommunityState = {
  mySnippets: [],
  snippetFetched: false,
};

/**
 * Atom which describes the state of the community state.
 *
 * @requires CommunityState - state definition
 * @requires defaultCommunityState - default state
 *
 * @see https://jotai.org/docs/core/atom
 */
export const communityStateAtom = atom<CommunityState>(defaultCommunityState);
