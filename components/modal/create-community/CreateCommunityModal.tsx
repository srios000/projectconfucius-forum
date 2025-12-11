import { useCreateCommunity } from "@/hooks/community/useCreateCommunity";
import {
  Box,
  Button,
  CheckboxControl,
  CheckboxIndicator,
  CheckboxLabel,
  CheckboxRoot,
  DialogBackdrop,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogPositioner,
  DialogRoot,
  DialogTitle,
  Flex,
  Icon,
  Input,
  Separator,
  Stack,
  Text,
} from "@chakra-ui/react";
import React, { FC, useState } from "react";
import { IconType } from "react-icons";
import { BsFillEyeFill, BsFillPersonFill } from "react-icons/bs";
import { HiLockClosed } from "react-icons/hi";
import CommunityTypeOptions from "./CommunityTypeOptions";
import CommunityNameSection from "./CommunityNameSection";

const COMMUNITY_TYPE_OPTIONS = [
  {
    name: "public",
    icon: BsFillPersonFill,
    label: "Public",
    description: "Everyone can view and post",
  },
  {
    name: "restricted",
    icon: BsFillEyeFill,
    label: "Restricted",
    description: "Everyone can view but only subscribers can post",
  },
  {
    name: "private",
    icon: HiLockClosed,
    label: "Private",
    description: "Only subscribers can view and post",
  },
];

type CreateCommunityModalProps = {
  open: boolean;
  handleClose: () => void;
};

/**
 * Modal for creating communities with name validation and privacy selection.
 * @param props - Open state and close handler provided by the parent.
 * @returns Dialog that submits creation through `useCreateCommunity`.
 */
const CreateCommunityModal: React.FC<CreateCommunityModalProps> = ({
  open,
  handleClose,
}) => {
  const communityNameLengthLimit = 25; // community names are 25 characters long
  const [communityName, setCommunityName] = useState("");
  const [charRemaining, setCharRemaining] = useState(communityNameLengthLimit);
  const [communityType, setCommunityType] = useState("public");
  const { createCommunity, loading, error, setError } = useCreateCommunity();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.value.length > communityNameLengthLimit) return; // community is not created if the name is above the limit
    setCommunityName(event.target.value); // updates the state of `communityName`
    setCharRemaining(communityNameLengthLimit - event.target.value.length); // computing remaining characters for community names
  };

  const onCommunityTypeChange = (value: string) => {
    setCommunityType(value);
  };

  const handleCreateCommunity = async () => {
    const success = await createCommunity(communityName, communityType);
    if (success) {
      handleClose();
    }
  };

  return (
    <DialogRoot
      open={open}
      onOpenChange={({ open }: { open: boolean }) => {
        if (!open) handleClose();
      }}
    >
      <DialogBackdrop bg="rgba(0, 0, 0, 0.4)" backdropFilter="blur(6px)" />
      <DialogPositioner>
        <DialogContent borderRadius={10}>
          <DialogHeader
            display="flex"
            flexDirection="column"
            padding={3}
            textAlign="center"
          >
            <DialogTitle>Create Community</DialogTitle>
          </DialogHeader>
          <Box pl={3} pr={3}>
            <DialogCloseTrigger position="absolute" top={2} right={2} />
            <DialogBody
              display="flex"
              flexDirection="column"
              padding="10px 0px"
            >
              <CommunityNameSection
                communityName={communityName}
                handleChange={handleChange}
                charRemaining={charRemaining}
                error={error}
              />
              <Separator mt={3} />
              <Box mt={4} mb={4}>
                <Text fontWeight={600} fontSize={15}>
                  Community Type
                </Text>

                <CommunityTypeOptions
                  options={COMMUNITY_TYPE_OPTIONS}
                  communityType={communityType}
                  onCommunityTypeChange={onCommunityTypeChange}
                />
              </Box>
            </DialogBody>
          </Box>

          <DialogFooter
            bg={{ base: "gray.100", _dark: "gray.700" }}
            borderRadius="0px 0px 10px 10px"
          >
            <Stack direction="row" gap={3} width="100%">
              <Button
                variant="outline"
                height="30px"
                flex={1}
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                height="30px"
                flex={1}
                onClick={handleCreateCommunity}
                loading={loading}
              >
                Create Community
              </Button>
            </Stack>
          </DialogFooter>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
};

export default CreateCommunityModal;
