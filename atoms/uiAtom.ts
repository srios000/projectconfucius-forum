import { atom } from "jotai";
import { TiHome } from "react-icons/ti";
import { DirectoryMenuItem } from "@/types/directoryMenu";

interface DirectoryMenuState {
  isOpen: boolean;
  selectedMenuItem: DirectoryMenuItem;
}

export interface UiState {
  directoryMenu: DirectoryMenuState;
}

export const defaultMenuItem: DirectoryMenuItem = {
  displayText: "Home",
  link: "/",
  icon: TiHome,
  iconColor: { base: "black", _dark: "white" },
};

const defaultUiState: UiState = {
  directoryMenu: { isOpen: false, selectedMenuItem: defaultMenuItem },
};

export const uiAtom = atom<UiState>(defaultUiState);
