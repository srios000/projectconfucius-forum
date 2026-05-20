import { atom } from "jotai";
import { TiHome } from "react-icons/ti";
import { Community } from "@/types/community";
import { Post } from "@/types/post";
import { DirectoryMenuItem } from "@/types/directoryMenu";

interface DirectoryMenuState {
  isOpen: boolean;
  selectedMenuItem: DirectoryMenuItem;
}

export interface UiState {
  selectedPost: Post | null;
  currentCommunity: Community | null;
  directoryMenu: DirectoryMenuState;
  savedPostsModalOpen: boolean;
}

export const defaultMenuItem: DirectoryMenuItem = {
  displayText: "Home",
  link: "/",
  icon: TiHome,
  iconColor: { base: "black", _dark: "white" },
};

const defaultUiState: UiState = {
  selectedPost: null,
  currentCommunity: null,
  directoryMenu: { isOpen: false, selectedMenuItem: defaultMenuItem },
  savedPostsModalOpen: false,
};

export const uiAtom = atom<UiState>(defaultUiState);
