import { defaultMenuItem, uiAtom } from "@/atoms/uiAtom";
import { useActiveCommunity } from "@/hooks/community/useActiveCommunity";
import { DirectoryMenuItem } from "@/types/directoryMenu";
import { useAtom } from "jotai";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { IoPeopleCircleOutline } from "react-icons/io5";

const useDirectory = () => {
  const [ui, setUi] = useAtom(uiAtom);
  const { directoryMenu } = ui;
  const { community: currentCommunity } = useActiveCommunity();
  const router = useRouter();
  const pathname = usePathname();

  const onSelectMenuItem = (menuItem: DirectoryMenuItem) => {
    setUi((prev) => ({
      ...prev,
      directoryMenu: { ...prev.directoryMenu, selectedMenuItem: menuItem },
    }));

    router.push(menuItem.link);
    if (directoryMenu.isOpen) {
      setDirectoryOpen(false);
    }
  };

  const setDirectoryOpen = (isOpen: boolean) => {
    setUi((prev) => ({
      ...prev,
      directoryMenu: { ...prev.directoryMenu, isOpen },
    }));
  };

  const toggleMenuOpen = () => {
    setDirectoryOpen(!directoryMenu.isOpen);
  };

  useEffect(() => {
    if (currentCommunity && pathname !== "/" && pathname !== "/communities") {
      setUi((prev) => ({
        ...prev,
        directoryMenu: {
          ...prev.directoryMenu,
          selectedMenuItem: {
            displayText: currentCommunity.id,
            link: `community/${currentCommunity.id}`,
            imageURL: currentCommunity.imageUrl,
            icon: IoPeopleCircleOutline,
            iconColor: { base: "red.500", _dark: "red.400" },
          },
        },
      }));
    } else if (pathname === "/communities") {
      setUi((prev) => ({
        ...prev,
        directoryMenu: {
          ...prev.directoryMenu,
          selectedMenuItem: {
            displayText: "Communities",
            link: "/communities",
            imageURL: "",
            icon: IoPeopleCircleOutline,
            iconColor: { base: "red.500", _dark: "red.400" },
          },
        },
      }));
    } else if (pathname === "/") {
      setUi((prev) => ({
        ...prev,
        directoryMenu: { ...prev.directoryMenu, selectedMenuItem: defaultMenuItem },
      }));
    }
  }, [currentCommunity, pathname]);

  return {
    directoryState: directoryMenu,
    toggleMenuOpen,
    setDirectoryOpen,
    onSelectMenuItem,
  };
};
export default useDirectory;
