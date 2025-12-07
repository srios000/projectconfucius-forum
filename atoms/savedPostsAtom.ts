import { atom } from "jotai";
import { SavedPost } from "@/types/savedPost";

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
