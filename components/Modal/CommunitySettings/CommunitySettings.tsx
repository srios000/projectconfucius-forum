import { Community, communityStateAtom } from "@/atoms/communitiesAtom";
import useCommunityImage from "@/hooks/community/useCommunityImage";
import useCommunityPrivacy from "@/hooks/community/useCommunityPrivacy";
import useDeleteCommunity from "@/hooks/community/useDeleteCommunity";
import useCustomToast from "@/hooks/useCustomToast";
import useSelectFile from "@/hooks/useSelectFile";
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
  Separator,
  Stack,
} from "@chakra-ui/react";
import { useAtom } from "jotai";
import React, { useRef, useState } from "react";
import {
  AdminManager,
  DangerZone,
  ImageSettings,
  ModalFooter,
  PrivacySettings,
} from ".";

type CommunitySettingsModalProps = {
  open: boolean;
  handleClose: () => void;
  communityData: Community;
};

/**
 * Modal for managing community settings including image, privacy, admins, and deletion
 */
const CommunitySettingsModal: React.FC<CommunitySettingsModalProps> = ({
  open,
  handleClose,
  communityData,
}) => {
  const { selectedFile, setSelectedFile, onSelectFile } = useSelectFile(
    300,
    300
  );
  const selectFileRef = useRef<HTMLInputElement>(null);
  const [communityStateValue] = useAtom(communityStateAtom);
  const [deleteImage, setDeleteImage] = useState(false);
  const [selectedPrivacyType, setSelectedPrivacyType] = useState("");
  const showToast = useCustomToast();

  const { updateImage, deleteCommunityImage } =
    useCommunityImage(communityData);
  const { updatePrivacyType } = useCommunityPrivacy(communityData);
  const { deleteCommunity, loading } = useDeleteCommunity(communityData);

  const handlePrivacyTypeChange = (details: { value: string }) => {
    setSelectedPrivacyType(details.value);
  };

  const handleSaveButtonClick = async () => {
    if (selectedPrivacyType) {
      await updatePrivacyType(selectedPrivacyType);
    }
    if (selectedFile) {
      await updateImage(selectedFile);
      setSelectedFile("");
    }
    if (deleteImage) {
      await deleteCommunityImage();
    }
    showToast({
      title: "Settings Updated",
      description: "Your settings have been updated",
      status: "success",
    });
    closeModal();
  };

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
                <ImageSettings
                  selectedFile={selectedFile || ""}
                  onSelectFile={onSelectFile}
                  selectFileRef={selectFileRef}
                  currentCommunity={
                    communityStateValue.currentCommunity || null
                  }
                  deleteImage={deleteImage}
                  setDeleteImage={setDeleteImage}
                />
                <Separator />
                <PrivacySettings
                  currentCommunity={
                    communityStateValue.currentCommunity || null
                  }
                  selectedPrivacyType={selectedPrivacyType}
                  handlePrivacyTypeChange={handlePrivacyTypeChange}
                />
                <Separator />
                <AdminManager
                  communityData={
                    communityStateValue.currentCommunity || communityData
                  }
                />
                <Separator />
                <DangerZone
                  deleteCommunity={deleteCommunity}
                  loading={loading}
                />
              </Stack>
            </DialogBody>
          </Box>
          <ModalFooter onCancel={closeModal} onSave={handleSaveButtonClick} />
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
};

export default CommunitySettingsModal;
