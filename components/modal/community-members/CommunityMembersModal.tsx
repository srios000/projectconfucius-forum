"use client";

import React, { useState } from "react";
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
import { useCommunityMembersListQuery } from "@/lib/queries/community/use-community-members-list";
import { LuTrash } from "react-icons/lu";
import useCommunityPermissions from "@/hooks/community/useCommunityPermissions";
import { useCommunityDataQuery } from "@/lib/queries/community/use-community-data";
import useRemoveCommunityMember from "@/hooks/community/useRemoveCommunityMember";
import ConfirmationDialog from "@/components/modal/ConfirmationDialog";

type CommunityMembersModalProps = {
  isOpen: boolean;
  onClose: () => void;
  communityId: string;
};

/**
 * Modal that lists community members and allows admins to remove subscribers.
 * Fetches members on open to keep the list fresh.
 * @param isOpen - Whether the modal is visible.
 * @param onClose - Callback to close the modal.
 * @param communityId - Community whose members are shown.
 * @returns Dialog with member cards and optional remove actions.
 */
const CommunityMembersModal: React.FC<CommunityMembersModalProps> = ({
  isOpen,
  onClose,
  communityId,
}) => {
  const membersQuery = useCommunityMembersListQuery({
    communityId,
    enabled: isOpen,
  });
  const members = membersQuery.data ?? [];
  const loading = membersQuery.isLoading;
  const error = membersQuery.error;
  const memberCount = members?.length ?? 0;
  const { data: communityDataForPerms } = useCommunityDataQuery({ communityId });
  const { isAdmin } = useCommunityPermissions(communityDataForPerms ?? undefined);
  const { removeMember, loading: removeLoading } = useRemoveCommunityMember();
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);

  const handleRemoveMember = async (memberId: string) => {
    await removeMember(communityId, memberId);
  };

  const confirmRemoveMember = async () => {
    if (!memberToRemove) return;
    await handleRemoveMember(memberToRemove);
    setMemberToRemove(null);
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
            key={member.id}
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
                colorPalette="red"
                size="sm"
                aria-label="Remove member"
                onClick={() => setMemberToRemove(member.id)}
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
      onOpenChange={(details: { open: boolean }) => !details.open && onClose()}
      placement="center"
    >
      <Portal>
        <DialogBackdrop bg="rgba(0, 0, 0, 0.4)" backdropFilter="blur(6px)" />
        <DialogPositioner>
          <DialogContent maxH="70vh" borderRadius="xl">
            <DialogHeader>
              <DialogTitle>
                {memberCount} Community Member{memberCount === 1 ? "" : "s"}
              </DialogTitle>
            </DialogHeader>
            <DialogCloseTrigger />
            <DialogBody pb={6} overflowY="auto">
              {renderContent()}
            </DialogBody>
          </DialogContent>
        </DialogPositioner>
      </Portal>
      <ConfirmationDialog
        open={!!memberToRemove}
        onClose={() => setMemberToRemove(null)}
        onConfirm={confirmRemoveMember}
        title="Remove Member"
        body="Are you sure you want to remove this member from the community?"
        confirmButtonText="Remove"
        isLoading={removeLoading}
      />
    </DialogRoot>
  );
};

export default CommunityMembersModal;
