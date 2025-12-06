import { savedPostStateAtom } from "@/atoms/savedPostsAtom";
import useSavedPosts from "@/hooks/useSavedPosts";
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
import { BsTrash } from "react-icons/bs";
import { FaReddit } from "react-icons/fa";

const SavedPostsModal: React.FC = () => {
  const [savedPostState, setSavedPostState] = useAtom(savedPostStateAtom);
  const { onRemoveSavedPost } = useSavedPosts();

  const handleClose = () => {
    setSavedPostState((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <DialogRoot
      open={savedPostState.isOpen}
      onOpenChange={(e: { open: boolean }) =>
        setSavedPostState((prev) => ({ ...prev, isOpen: e.open }))
      }
      size="lg"
    >
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Saved Posts</DialogTitle>
          </DialogHeader>
          <DialogCloseTrigger />
          <DialogBody pb={6}>
            <Stack gap={4}>
              {savedPostState.savedPosts.length === 0 ? (
                <Text color="gray.500" textAlign="center">
                  No saved posts yet.
                </Text>
              ) : (
                savedPostState.savedPosts.map((item) => (
                  <Flex
                    key={item.id}
                    p={3}
                    borderWidth="1px"
                    borderRadius="md"
                    align="center"
                    justify="space-between"
                    _hover={{ borderColor: "gray.400" }}
                  >
                    <Flex align="center" flex={1} gap={3}>
                      {item.communityImageURL ? (
                        <Image
                          src={item.communityImageURL}
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
                      as={BsTrash}
                      cursor="pointer"
                      color="gray.500"
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
