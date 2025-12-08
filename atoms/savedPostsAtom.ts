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

/**
 * Tracks saved posts modal state and cached posts for the current user.
 * @returns Jotai atom with modal visibility, fetch flag, and saved items.
 */
export const savedPostStateAtom = atom<SavedPostState>(defaultSavedPostState);
