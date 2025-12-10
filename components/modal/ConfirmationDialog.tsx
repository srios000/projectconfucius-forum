import {
  Button,
  DialogActionTrigger,
  DialogBackdrop,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogPositioner,
  DialogRoot,
  DialogTitle,
  Portal,
} from "@chakra-ui/react";
import React from "react";

interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  isLoading?: boolean;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmButtonText = "Confirm",
  cancelButtonText = "Cancel",
  isLoading = false,
}) => {
  return (
    <DialogRoot
      open={open}
      onOpenChange={(details: { open: boolean }) => !details.open && onClose()}
      placement="center"
    >
      <Portal>
        <DialogBackdrop />
        <DialogPositioner>
          <DialogContent borderRadius={"xl"}>
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
            </DialogHeader>
            <DialogBody>{body}</DialogBody>
            <DialogFooter>
              <DialogActionTrigger asChild>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  disabled={isLoading}
                >
                  {cancelButtonText}
                </Button>
              </DialogActionTrigger>
              <Button
                colorPalette="red"
                onClick={(e) => {
                  e.stopPropagation();
                  onConfirm();
                }}
                loading={isLoading}
              >
                {confirmButtonText}
              </Button>
            </DialogFooter>
            <DialogCloseTrigger
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onClose();
              }}
            />
          </DialogContent>
        </DialogPositioner>
      </Portal>
    </DialogRoot>
  );
};

export default ConfirmationDialog;
