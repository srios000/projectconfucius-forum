import { auth } from "@/firebase/clientApp";
import useSelectFile from "@/hooks/useSelectFile";
import useUserProfile from "@/hooks/useUserProfile";
import {
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
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import React, { useRef, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { MdAccountCircle } from "react-icons/md";

type ProfileModalProps = {
  open: boolean;
  handleClose: () => void;
};

const ProfileModal: React.FC<ProfileModalProps> = ({ open, handleClose }) => {
  const [user] = useAuthState(auth);
  const { updateImage, removeImage, updateName, loading } = useUserProfile();
  const { selectedFile, setSelectedFile, onSelectFile } = useSelectFile(
    300,
    300
  );
  const selectFileRef = useRef<HTMLInputElement>(null);
  const [deleteImage, setDeleteImage] = useState(false);
  const [userName, setUserName] = useState(user?.displayName || "");
  const [isEditing, setIsEditing] = useState(false);

  /**
   * Closes the modal and resets the states.
   */
  const closeModal = () => {
    setSelectedFile("");
    setDeleteImage(false);
    setIsEditing(false);
    handleClose();
  };

  /**
   * Update profile image of the currently logged in user.
   * Exists if the user is not logged in or no image is selected.
   */
  const onUpdateImage = async () => {
    if (selectedFile) {
      await updateImage(selectedFile);
    }
  };

  /**
   * Deletes the profile image of the currently logged in user.
   * Exists if the user is not logged in.
   */
  const onDeleteImage = async () => {
    await removeImage();
  };

  /**
   * Update profile name of the currently logged in user.
   * Updates:
   *  - `displayName` in `users` collection
   *  - `creatorDisplayText` in `comments` collection
   *  - `creatorUsername` in `posts` collection
   * Updates values in multiple places as they are repeated in different collections.
   */
  const onUpdateUserName = async () => {
    if (userName) {
      await updateName(userName);
    }
  };

  /**
   * Updates the state which tracks the name of the user.
   * @param {React.ChangeEvent<HTMLInputElement>} event - event of the input field
   */
  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUserName(event.target.value);
  };

  /**
   * Saves the changes made to the profile.
   * If the profile image is changed, it is updated.
   * If the profile image is deleted, it is deleted.
   * If the profile name is changed, it is updated.
   * Closes the modal after saving.
   */
  const handleSaveButtonClick = () => {
    if (selectedFile) {
      onUpdateImage();
    }
    if (deleteImage) {
      onDeleteImage();
    }
    if (userName && userName !== user?.displayName) {
      onUpdateUserName();
    }
    closeModal();
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
            <DialogTitle>Profile</DialogTitle>
          </DialogHeader>
          <DialogCloseTrigger position="absolute" top={2} right={2} />
          <DialogBody display="flex" flexDirection="column" padding="10px 0px">
            <Stack p={5} gap={5}>
              {/* image */}
              <Stack direction="column" align="center" justify="center" p={2}>
                {user?.photoURL || selectedFile ? (
                  <Image
                    src={selectedFile || (user?.photoURL as string)}
                    alt="User Photo"
                    height="120px"
                    borderRadius="full"
                    shadow="md"
                  />
                ) : (
                  <Icon
                    fontSize={120}
                    mr={1}
                    color="gray.300"
                    as={MdAccountCircle}
                  />
                )}
                <Text
                  fontSize="xl"
                  color={{ base: "gray.700", _dark: "gray.200" }}
                >
                  {user?.displayName}
                </Text>
              </Stack>

              {isEditing && (
                <Stack gap={1} direction="row" flexGrow={1}>
                  <Button
                    flex={1}
                    height={34}
                    onClick={() => selectFileRef.current?.click()}
                  >
                    {user?.photoURL ? "Change Image" : "Add Image"}
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/png,image/gif,image/jpeg"
                    hidden
                    ref={selectFileRef}
                    onChange={onSelectFile}
                  />
                  {user?.photoURL && (
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
                </Stack>
              )}
              {/*  */}

              {/* name */}
              {!isEditing && (
                <Flex direction="column">
                  <Flex direction="row">
                    <Text
                      fontSize="12pt"
                      color={{ base: "gray.600", _dark: "gray.400" }}
                      mr={1}
                      fontWeight={600}
                    >
                      Email:
                    </Text>
                    <Text fontSize="12pt">{user?.email}</Text>
                  </Flex>
                  <Flex direction="row">
                    <Text
                      fontSize="12pt"
                      color={{ base: "gray.600", _dark: "gray.400" }}
                      mr={1}
                      fontWeight={600}
                    >
                      User Name:
                    </Text>
                    <Text fontSize="12pt">{user?.displayName || ""}</Text>
                  </Flex>
                </Flex>
              )}
              {isEditing && (
                <Flex direction="column">
                  <Text
                    fontSize="sm"
                    color={{ base: "gray.500", _dark: "gray.400" }}
                    mb={1}
                  >
                    User Name
                  </Text>
                  <Input
                    name="displayName"
                    placeholder="User Name"
                    value={userName}
                    type="text"
                    onChange={handleNameChange}
                    _hover={{
                      bg: { base: "white", _dark: "gray.700" },
                      border: "1px solid",
                      borderColor: { base: "red.500", _dark: "red.400" },
                    }}
                    _focus={{
                      bg: { base: "white", _dark: "gray.700" },
                      border: "1px solid",
                      borderColor: { base: "red.500", _dark: "red.400" },
                    }}
                    borderRadius={10}
                  />
                </Flex>
              )}
              {/*  */}
            </Stack>
          </DialogBody>
          <DialogFooter
            bg={{ base: "gray.100", _dark: "gray.700" }}
            borderRadius="0px 0px 10px 10px"
          >
            <Stack direction="row" width="100%" gap={2}>
              <Button
                variant="outline"
                height="30px"
                flex={1}
                onClick={closeModal}
              >
                Cancel
              </Button>
              {isEditing ? (
                <Button height="30px" flex={1} onClick={handleSaveButtonClick}>
                  Save
                </Button>
              ) : (
                <Button
                  height="30px"
                  flex={1}
                  onClick={() => {
                    setIsEditing(true);
                  }}
                >
                  Edit
                </Button>
              )}
            </Stack>
          </DialogFooter>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
};
export default ProfileModal;
