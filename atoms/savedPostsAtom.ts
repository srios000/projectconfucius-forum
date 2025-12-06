import { atom } from "jotai";

export type SavedPost = {
  id: string;
  postId: string;
  communityId: string;
  postTitle: string;
  communityImageURL?: string;
};

interface SavedPostState {
  savedPosts: SavedPost[];
  isOpen: boolean;
  fetched: boolean;
}

const defaultSavedPostState: SavedPostState = {
  savedPosts: [],
  isOpen: false,
  fetched: false,
};

export const savedPostStateAtom = atom<SavedPostState>(defaultSavedPostState);
