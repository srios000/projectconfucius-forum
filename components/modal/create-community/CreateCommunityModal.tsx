"use client";
import React from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BsFillEyeFill, BsFillPersonFill } from "react-icons/bs";
import { HiLockClosed } from "react-icons/hi";
import { useCreateCommunity } from "@/hooks/community/useCreateCommunity";
import {
  createCommunitySchema,
  CreateCommunityInput,
} from "@/schema/community";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import CommunityNameSection from "./CommunityNameSection";
import CommunityTypeOptions from "./CommunityTypeOptions";

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

const CreateCommunityModal: React.FC<CreateCommunityModalProps> = ({
  open,
  handleClose,
}) => {
  const { createCommunity, loading } = useCreateCommunity();
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<CreateCommunityInput>({
    resolver: zodResolver(createCommunitySchema),
    defaultValues: {
      type: "public",
      name: "",
    },
    mode: "onChange",
  });

  const communityName = useWatch({ control, name: "name" });
  const communityType = useWatch({ control, name: "type" });
  const charRemaining = 21 - (communityName?.length || 0);

  const onSubmit = async (data: CreateCommunityInput) => {
    const success = await createCommunity(data.name, data.type);
    if (success) {
      handleClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-[460px] p-0 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border">
          <DialogTitle className="text-center font-serif text-lg">Create Community</DialogTitle>
        </DialogHeader>
        <div className="px-5 py-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <CommunityNameSection
              charRemaining={charRemaining}
              error={errors.name?.message}
              register={register("name")}
            />
            <div className="border-t border-border pt-4">
              <label className="text-[12.5px] font-semibold text-foreground">Community Type</label>
              <CommunityTypeOptions
                options={COMMUNITY_TYPE_OPTIONS}
                communityType={communityType}
                onCommunityTypeChange={(value) =>
                  setValue("type", value as any)
                }
              />
            </div>
          </form>
        </div>
        <DialogFooter className="px-5 py-3.5 bg-muted/30 border-t border-border flex gap-3">
          <DialogClose asChild>
            <Button variant="outline" size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); handleClose(); }} disabled={loading}>
              Cancel
            </Button>
          </DialogClose>
          <Button size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); handleSubmit(onSubmit)(); }} disabled={loading}>
            {loading ? "Creating…" : "Create Community"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCommunityModal;
