import { atom } from "jotai";
import { Post, PostVote } from "@/types/post";

/**
 * Represents the base state for the atom.
 * @property selectedPost - the post that is currently selected
 * @property posts - all the posts
 * @property postVotes - all the post votes
 */
interface PostState {
  selectedPost: Post | null;
  posts: Post[];
  postVotes: PostVote[];
}

/**
 * Represents the default state of the atom.
 * Initially:
 *  - No post is selected
 *  - There are no posts to be displayed
 *  - Posts have not been voted on by the current user
 * @property selectedPost - null as no post is selected
 * @property posts - empty array as there are no posts
 * @property postVotes - empty array as posts have not been voted on
 *
 * @requires PostState - default state type
 */
const defaultPostState: PostState = {
  selectedPost: null,
  posts: [],
  postVotes: [],
};

/**
 * Holds the active post, loaded posts list, and vote cache for the user session.
 * @returns Jotai atom that stores post selection and voting state.
 */
export const postStateAtom = atom<PostState>(defaultPostState);
