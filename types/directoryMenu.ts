import { IconType } from "react-icons";

/**
 * Item used in the navbar directory dropdown to route between communities or home.
 */
export type DirectoryMenuItem = {
  displayText: string;
  link: string;
  icon: IconType;
  iconColor: string | { base: string; _dark: string };
  imageURL?: string;
};
