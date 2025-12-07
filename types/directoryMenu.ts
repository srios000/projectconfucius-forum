import { IconType } from "react-icons";

export type DirectoryMenuItem = {
  displayText: string;
  link: string;
  icon: IconType;
  iconColor: string | { base: string; _dark: string };
  imageURL?: string;
};
