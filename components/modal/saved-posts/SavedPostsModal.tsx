import { uiAtom } from "@/atoms/uiAtom";
import useSavedPosts from "@/hooks/posts/useSavedPosts";
import {
  DialogBackdrop,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogHeader,
  DialogPositioner,
  DialogRoot,
  DialogTitle,
  Flex,
  Icon,
  Image,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useAtom } from "jotai";
import Link from "next/link";
import React from "react";
import { LuTrash } from "react-icons/lu";
import { FaReddit } from "react-icons/fa";

const SavedPostsModal: React.FC = () => {
  const [ui, setUi] = useAtom(uiAtom);
  const { savedPosts, onRemoveSavedPost } = useSavedPosts();
  const isOpen = ui.savedPostsModalOpen;

  const handleClose = () => {
    setUi((prev) => ({ ...prev, savedPostsModalOpen: false }));
  };

  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={(e: { open: boolean }) =>
        setUi((prev) => ({ ...prev, savedPostsModalOpen: e.open }))
      }
      size="lg"
    >
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent borderRadius={10}>
          <DialogHeader>
            <DialogTitle>Saved Posts</DialogTitle>
          </DialogHeader>
          <DialogCloseTrigger />
          <DialogBody pb={6} rounded={"xl"}>
            <Stack gap={4}>
              {savedPosts.length === 0 ? (
                <Text color="gray.500" textAlign="center">
                  No saved posts yet.
                </Text>
              ) : (
                savedPosts.map((item) => (
                  <Flex
                    key={item.id}
                    p={3}
                    borderWidth="1px"
                    borderRadius="xl"
                    align="center"
                    justify="space-between"
                    _hover={{ borderColor: "gray.400" }}
                  >
                    <Flex align="center" flex={1} gap={3}>
                      {item.communityImageUrl ? (
                        <Image
                          src={item.communityImageUrl}
                          borderRadius="full"
                          boxSize="40px"
                          alt="Community Image"
                        />
                      ) : (
                        <Icon as={FaReddit} fontSize={40} color="brand.100" />
                      )}
                      <Stack gap={0}>
                        <Link
                          href={`/community/${item.communityId}/comments/${item.postId}`}
                          onClick={handleClose}
                        >
                          <Text
                            fontWeight="bold"
                            fontSize="lg"
                            _hover={{ textDecoration: "underline" }}
                          >
                            {item.postTitle}
                          </Text>
                        </Link>
                        <Link
                          href={`/community/${item.communityId}`}
                          onClick={handleClose}
                        >
                          <Text
                            fontSize="sm"
                            color="gray.500"
                            _hover={{ textDecoration: "underline" }}
                          >
                            r/{item.communityId}
                          </Text>
                        </Link>
                      </Stack>
                    </Flex>
                    <Icon
                      as={LuTrash}
                      cursor="pointer"
                      color="gray.500"
                      mr={2}
                      fontSize={20}
                      _hover={{ color: "red.500" }}
                      onClick={() => onRemoveSavedPost(item.postId)}
                    />
                  </Flex>
                ))
              )}
            </Stack>
          </DialogBody>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
};

export default SavedPostsModal;
