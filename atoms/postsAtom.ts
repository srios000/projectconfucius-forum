import { atom } from "jotai";
import { Post, PostVote } from "@/types/post";

/**
 * Represents the base state for the atom.
 * @property {Post | null} selectedPost - the post that is currently selected
 * @property {Post[]} posts - all the posts
 * @property {PostVote[]} postVotes - all the post votes
 */
interface PostState {
  selectedPost: Post | null; // when user opens a post
  posts: Post[]; //  all the post
  postVotes: PostVote[];
}

/**
 * Represents the default state of the atom.
 * Initially:
 *  - No post is selected
 *  - There are no posts to be displayed
 *  - Posts have not been voted on by the current user
 * @property {Post | null} selectedPost - null as no post is selected
 * @property {Post[]} posts - empty array as there are no posts
 * @property {PostVote[]} postVotes - empty array as posts have not been voted on
 *
 * @requires PostState - default state type
 */
const defaultPostState: PostState = {
  selectedPost: null,
  posts: [],
  postVotes: [],
};

/**
 * Atom which describes the state of the posts.
 * Initially:
 *  - No post is selected
 *  - There are no posts to be displayed
 *  - Posts have not been voted on by the current user
 *
 * @requires PostState - type of the state
 * @requires defaultPostState - default state of the atom
 *
 * @see https://jotai.org/docs/core/atom
 */
export const postStateAtom = atom<PostState>(defaultPostState);
