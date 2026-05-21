"use client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  isLoading?: boolean;
};

export default function ConfirmationDialog({
  open, onClose, onConfirm, title, body,
  confirmButtonText = "Confirm", cancelButtonText = "Cancel",
  isLoading = false,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{body}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isLoading} onClick={(e) => { e.stopPropagation(); onClose(); }}>{cancelButtonText}</Button>
          </DialogClose>
          <Button variant="destructive" onClick={(e) => { e.stopPropagation(); onConfirm(); }} disabled={isLoading}>
            {isLoading ? "Working…" : confirmButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
