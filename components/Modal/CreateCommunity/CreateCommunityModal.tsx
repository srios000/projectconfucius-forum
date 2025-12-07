import { useCreateCommunity } from "@/hooks/useCreateCommunity";
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

/**
 * Options for the community type that can be created.
 * @param {public, restricted, private} - community types
 * @param {BsFillPersonFill, BsFillEyeFill, HiLockClosed} - icons for the community types
 * @param {Public, Restricted, Private} - labels for the community types
 */
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

/**
 * Controls whether the modal is open or closed by its state.
 * Handles closing the modal.
 * @param {boolean} open - controls whether the modal is open or closed by its state
 * @param {() => void} handleClose - handles closing the modal
 */
type CreateCommunityModalProps = {
  open: boolean;
  handleClose: () => void;
};

/**
 * Modal for creating communities.
 * @param {boolean} open - controls whether the modal is open or closed by its state
 * @param {() => void} handleClose - handles closing the modal
 *
 * @returns {React.FC} - modal for creating communities
 *
 * @requires CommunityTypeOptionProps - options for the community type that can be created
 * @requires CommunityNameSection - section for entering the name of the community to be created
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

  /**
   * Handles changes in the input element which takes the name of the community to be created.
   *
   * If the community name entered is above the limit:
   *  - Exists if the community name is too long (above the limit).
   *
   * If the community name entered is within the limit:
   *  - Updates the state of `communityName` which allows the creation of the community with the inputted name
   *  - Updates the number of characters remaining based on the number of characters used so far.
   * @param {string} value - selected community type
   */
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.value.length > communityNameLengthLimit) return; // community is not created if the name is above the limit
    setCommunityName(event.target.value); // updates the state of `communityName`
    setCharRemaining(communityNameLengthLimit - event.target.value.length); // computing remaining characters for community names
  };

  /**
   * Only 1 checkbox can be toggled as only 1 community type can be created.
   * If a community type checkbox is toggled,
   * toggling another checkbox would untoggle the previous one.
   * @param {React.ChangeEvent<HTMLInputElement>} event - change in HTML input field
   */
  const onCommunityTypeChange = (value: string) => {
    setCommunityType(value);
  };

  /**
   * Creates a new community in Firestore with the given community name and privacy type,
   * and adds the current user as the community creator and member.
   *
   * Does not allow creating a community if:
   *  - It contains special characters
   *  - If the the name is too short
   *  - If the name is already taken
   *
   * @async
   *
   * @throws {Error} If the community name contains special characters or is too short, or if the community name is already taken.
   *
   * @returns {void}
   */
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
