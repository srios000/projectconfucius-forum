"use client";

import React, { useEffect } from "react";
import {
  Box,
  DialogBackdrop,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogHeader,
  DialogPositioner,
  DialogRoot,
  DialogTitle,
  Flex,
  IconButton,
  Portal,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { CommunityMember } from "@/types/communityMember";
import useCommunityMembers from "@/hooks/community/useCommunityMembers";
import { LuTrash } from "react-icons/lu";
import { useAtomValue } from "jotai";
import { communityStateAtom } from "@/atoms/communitiesAtom";
import useCommunityPermissions from "@/hooks/community/useCommunityPermissions";
import useRemoveCommunityMember from "@/hooks/community/useRemoveCommunityMember";

type CommunityMembersModalProps = {
  isOpen: boolean;
  onClose: () => void;
  communityId: string;
};

const CommunityMembersModal: React.FC<CommunityMembersModalProps> = ({
  isOpen,
  onClose,
  communityId,
}) => {
  const { members, loading, error, loadMembers } = useCommunityMembers();
  const communityStateValue = useAtomValue(communityStateAtom);
  const { isAdmin } = useCommunityPermissions(
    communityStateValue.currentCommunity
  );
  const { removeMember, loading: removeLoading } = useRemoveCommunityMember();

  useEffect(() => {
    if (!isOpen) return;
    loadMembers(communityId);
  }, [isOpen, communityId, loadMembers]);

  const handleRemoveMember = async (memberId: string) => {
    const success = await removeMember(communityId, memberId);
    if (success) {
      loadMembers(communityId);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Flex justify="center" py={10}>
          <Spinner />
        </Flex>
      );
    }

    if (!members.length) {
      return (
        <Flex justify="center" py={10} px={4} textAlign="center">
          <Text color="gray.500">
            {error ? "Failed to load subscribers." : "No subscribers found."}
          </Text>
        </Flex>
      );
    }

    return (
      <Stack gap={2}>
        {members.map((member: CommunityMember) => (
          <Flex
            key={member.uid}
            borderWidth="1px"
            borderRadius="xl"
            p={3}
            borderColor={{ base: "gray.200", _dark: "gray.700" }}
            align="center"
            justify="space-between"
          >
            <Box>
              <Text fontWeight="semibold">
                {member.displayName?.trim() ? member.displayName : "No Name"}
              </Text>
              <Text fontSize="sm" color="gray.500">
                {member.email}
              </Text>
            </Box>
            {isAdmin && (
              <IconButton
                variant="ghost"
                color="red.500"
                _hover={{ color: "red.600", bg: "transparent" }}
                onClick={() => handleRemoveMember(member.uid)}
                disabled={removeLoading}
                aria-label="Remove member"
                size="sm"
              >
                <LuTrash />
              </IconButton>
            )}
          </Flex>
        ))}
      </Stack>
    );
  };

  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={({ open }: { open: boolean }) => {
        if (!open) onClose();
      }}
    >
      <Portal>
        <DialogBackdrop bg="rgba(0, 0, 0, 0.4)" backdropFilter="blur(6px)" />
        <DialogPositioner>
          <DialogContent borderRadius="xl" maxH="80vh">
            <DialogHeader>
              <DialogTitle>{`${members.length} Subscribers`}</DialogTitle>
            </DialogHeader>
            <DialogCloseTrigger />
            <DialogBody pb={6} maxH="60vh" overflowY="auto">
              {renderContent()}
            </DialogBody>
          </DialogContent>
        </DialogPositioner>
      </Portal>
    </DialogRoot>
  );
};

export default CommunityMembersModal;
