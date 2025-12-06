import { Community, communityStateAtom } from "@/atoms/communitiesAtom";
import { auth } from "@/firebase/clientApp";
import { useCommunitySettings } from "@/hooks/useCommunitySettings";
import useCustomToast from "@/hooks/useCustomToast";
import useSelectFile from "@/hooks/useSelectFile";
import {
  Box,
  Button,
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
  Image,
  NativeSelectField,
  NativeSelectRoot,
  Separator,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useAtom } from "jotai";
import React, { useRef, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { BsFillPeopleFill } from "react-icons/bs";
import AdminManager from "./AdminManager";

/**
 * @param {boolean} open - boolean to determine if the modal is open or not
 * @param {function} handleClose - function to close the modal
 * @param {Community} communityData - data required to be displayed
 */
type CommunitySettingsModalProps = {
  open: boolean;
  handleClose: () => void;
  communityData: Community;
};

/**
 * Allows the admin to change the settings of the community.
 * The following settings can be changed:
 *  - Community image
 *  - Visibility of the community
 * @param {open} - boolean to determine if the modal is open or not
 * @param {handleClose} - function to close the modal
 * @param {communityData} - data required to be displayed
 * @returns {React.FC<CommunitySettingsModalProps>} - CommunitySettingsModal component
 */
const CommunitySettingsModal: React.FC<CommunitySettingsModalProps> = ({
  open,
  handleClose,
  communityData,
}) => {
  const [user] = useAuthState(auth);

  const { selectedFile, setSelectedFile, onSelectFile } = useSelectFile(
    300,
    300
  );
  const selectFileRef = useRef<HTMLInputElement>(null);
  // const setCommunityStateValue = useSetRecoilState(communityState);
  const [communityStateValue] = useAtom(communityStateAtom);
  const [deleteImage, setDeleteImage] = useState(false);
  const showToast = useCustomToast();

  const {
    updateImage,
    deleteCommunityImage,
    updatePrivacyType,
    uploadingImage,
    deleteCommunity,
    loading,
  } = useCommunitySettings(communityData);

  /**
   * Allows admin to change the image of the community.
   */
  const onUpdateImage = async () => {
    if (!selectedFile) return;
    await updateImage(selectedFile);
    setSelectedFile("");
  };

  /**
   * Deletes the image of the community.
   */
  const onDeleteImage = async () => {
    await deleteCommunityImage();
  };

  const [selectedPrivacyType, setSelectedPrivacyType] = useState("");

  /**
   * Changes the privacy type of the current community.
   * @param {string} privacyType - privacy type to be changed to
   */
  const onUpdateCommunityPrivacyType = async (privacyType: string) => {
    await updatePrivacyType(privacyType);
  };

  /**
   * Handles changes to the privacy type select input.
   * @param {React.ChangeEvent<HTMLInputElement>} event - event when user selects a file
   */
  const handlePrivacyTypeChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setSelectedPrivacyType(event.target.value); // set selected privacy type
  };

  /**
   * Handles applying changes to the community settings.
   * Changes can be:
   * - Changing the privacy type
   * - Changing the community image
   * - Deleting the community image
   */
  const handleSaveButtonClick = () => {
    // Save privacy type change
    if (selectedPrivacyType) {
      onUpdateCommunityPrivacyType(selectedPrivacyType);
    }
    if (selectedFile) {
      onUpdateImage();
    }
    if (deleteImage) {
      onDeleteImage();
    }
    showToast({
      title: "Settings Updated",
      description: "Your settings have been updated",
      status: "success",
    });
    closeModal();
  };

  /**
   * Closes the modal and resets the state.
   */
  const closeModal = () => {
    setSelectedFile("");
    setSelectedPrivacyType("");
    setDeleteImage(false);
    handleClose();
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
            <DialogTitle>Community Settings</DialogTitle>
          </DialogHeader>
          <Box>
            <DialogCloseTrigger position="absolute" top={2} right={2} />
            <DialogBody
              display="flex"
              flexDirection="column"
              padding="10px 0px"
            >
              <Stack fontSize="10pt" gap={2} p={5}>
                {/* community image */}
                <Flex align="center" justify="center" p={2}>
                  {communityStateValue.currentCommunity?.imageURL ||
                  selectedFile ? (
                    <Image
                      src={
                        selectedFile ||
                        communityStateValue.currentCommunity?.imageURL
                      }
                      alt="Community Photo"
                      height="120px"
                      borderRadius="full"
                      shadow="md"
                    />
                  ) : (
                    <Icon
                      fontSize={120}
                      mr={1}
                      color="gray.300"
                      as={BsFillPeopleFill}
                    />
                  )}
                </Flex>
                <Flex align="center" justify="center">
                  <Text
                    fontSize="14pt"
                    fontWeight={600}
                    color={{ base: "gray.600", _dark: "gray.400" }}
                  >
                    {communityData.id}
                  </Text>
                </Flex>

                <Stack gap={1} direction="row" flexGrow={1}>
                  <Button
                    flex={1}
                    height={34}
                    onClick={() => selectFileRef.current?.click()}
                  >
                    {communityStateValue.currentCommunity?.imageURL
                      ? "Change Image"
                      : "Add Image"}
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/png,image/gif,image/jpeg"
                    hidden
                    ref={selectFileRef}
                    onChange={onSelectFile}
                  />
                  {communityStateValue.currentCommunity?.imageURL && (
                    <Button
                      flex={1}
                      height={34}
                      variant="outline"
                      onClick={() => setDeleteImage(true)}
                      disabled={deleteImage}
                    >
                      Delete Image
                    </Button>
                  )}

                  {/*  */}
                </Stack>
                <Separator />
                {/* Change community privacy type */}
                <Flex direction="column">
                  <Stack gap={2} direction="column" flexGrow={1}>
                    <Text
                      fontWeight={600}
                      fontSize="12pt"
                      color={{ base: "gray.500", _dark: "gray.400" }}
                    >
                      Community Type
                    </Text>
                    <Text
                      fontWeight={500}
                      fontSize="10pt"
                      color={{ base: "gray.500", _dark: "gray.400" }}
                    >
                      {`Currently ${communityStateValue.currentCommunity?.privacyType}`}
                    </Text>

                    <NativeSelectRoot>
                      <NativeSelectField
                        placeholder="Select option"
                        mt={2}
                        onChange={handlePrivacyTypeChange}
                        value={
                          selectedPrivacyType ||
                          communityStateValue.currentCommunity?.privacyType ||
                          ""
                        }
                        bg={{ base: "gray.50", _dark: "gray.800" }}
                        borderColor={{ base: "gray.200", _dark: "gray.600" }}
                        _hover={{
                          bg: { base: "white", _dark: "gray.700" },
                          border: "1px solid",
                          borderColor: { base: "red.500", _dark: "red.400" },
                        }}
                        _focus={{
                          outline: "none",
                          bg: { base: "white", _dark: "gray.700" },
                          border: "1px solid",
                          borderColor: { base: "red.500", _dark: "red.400" },
                        }}
                      >
                        <option value="public">Public</option>
                        <option value="restricted">Restricted</option>
                        <option value="private">Private</option>
                      </NativeSelectField>
                    </NativeSelectRoot>
                  </Stack>
                </Flex>

                <Separator />
                <AdminManager
                  communityData={
                    communityStateValue.currentCommunity || communityData
                  }
                />
                <Separator />
                <Flex align="center" justify="space-between" p={1}>
                  <Text fontWeight={600} fontSize="10pt">
                    Delete Community
                  </Text>
                  <Button
                    variant="solid"
                    colorPalette="red"
                    height="30px"
                    onClick={deleteCommunity}
                    loading={loading}
                  >
                    Delete
                  </Button>
                </Flex>
              </Stack>
            </DialogBody>
          </Box>

          <DialogFooter
            bg={{ base: "gray.100", _dark: "gray.700" }}
            borderRadius="0px 0px 10px 10px"
          >
            <Stack direction="row" justifyContent="space-between" width="100%">
              <Button
                width="100%"
                variant="outline"
                height="30px"
                mr={3}
                onClick={closeModal}
                flex={1}
              >
                Cancel
              </Button>
              <Button
                width="100%"
                height="30px"
                onClick={handleSaveButtonClick}
                flex={1}
              >
                Save
              </Button>
            </Stack>
          </DialogFooter>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
};

export default CommunitySettingsModal;
