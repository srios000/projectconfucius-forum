import { atom } from "jotai";
import { TiHome } from "react-icons/ti";
import { DirectoryMenuItem } from "@/types/directoryMenu";

/**
 * Interface which describes the state of the directory menu.
 * @property isOpen - whether the directory menu is open or not
 * @property selectedMenuItem - the menu item that is currently selected
 */
interface DirectoryMenuState {
  isOpen: boolean;
  selectedMenuItem: DirectoryMenuItem;
}

export const defaultMenuItem = {
  displayText: "Home",
  link: "/",
  icon: TiHome,
  iconColor: { base: "black", _dark: "white" },
};

export const defaultMenuState: DirectoryMenuState = {
  isOpen: false,
  selectedMenuItem: defaultMenuItem,
};

/**
 * Controls the navbar directory dropdown and the currently highlighted item.
 * @returns Jotai atom containing open state and selected menu item.
 */
export const directoryMenuAtom = atom<DirectoryMenuState>(defaultMenuState);
