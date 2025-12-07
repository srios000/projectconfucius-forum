import { atom } from "jotai";
import { TiHome } from "react-icons/ti";
import { DirectoryMenuItem } from "@/types/directoryMenu";

/**
 * Interface which describes the state of the directory menu.
 * @property {boolean} isOpen - whether the directory menu is open or not
 * @property {DirectoryMenuItem} selectedMenuItem - the menu item that is currently selected
 */
interface DirectoryMenuState {
  isOpen: boolean;
  selectedMenuItem: DirectoryMenuItem;
}

/**
 * Default menu item when no community is selected (home page).
 * @property {string} displayText - "Home"
 * @property {string} link - "/" (home page)
 * @property {IconType} icon - TiHome (home icon)
 * @property {string} iconColor - "black"
 */
export const defaultMenuItem = {
  displayText: "Home",
  link: "/",
  icon: TiHome,
  iconColor: { base: "black", _dark: "white" },
};

/**
 * Default state of the directory menu.
 * The directory menu is closed by default.
 * @property {boolean} isOpen - false by default
 * @property {DirectoryMenuItem} selectedMenuItem - default menu item (home page)
 */
export const defaultMenuState: DirectoryMenuState = {
  isOpen: false,
  selectedMenuItem: defaultMenuItem,
};

/**
 * Atom which stores the state of the directory menu.
 */
export const directoryMenuAtom = atom<DirectoryMenuState>(defaultMenuState);
