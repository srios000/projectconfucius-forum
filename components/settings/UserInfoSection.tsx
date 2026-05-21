import { SessionUser } from "@/types/sessionUser";
import React from "react";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { EditProfileInput } from "@/schema/profile";
import { Input } from "@/components/ui/input";

type UserInfoSectionProps = {
  user: SessionUser | null | undefined;
  isEditing: boolean;
  register: UseFormRegister<EditProfileInput>;
  errors: FieldErrors<EditProfileInput>;
};

const UserInfoSection: React.FC<UserInfoSectionProps> = ({
  user,
  isEditing,
  register,
  errors,
}) => {
  return (
    <div className="space-y-4">
      {!isEditing && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-muted-foreground w-24">Email:</span>
            <span className="text-foreground">{user?.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-muted-foreground w-24">User Name:</span>
            <span className="text-foreground">{user?.name || ""}</span>
          </div>
        </div>
      )}
      {isEditing && (
        <div className="flex flex-col w-full space-y-1.5">
          <label className="text-sm font-semibold text-muted-foreground">User Name</label>
          <Input
            placeholder="User Name"
            type="text"
            className="bg-muted/50 focus-visible:bg-card focus-visible:ring-primary focus-visible:border-primary"
            {...register("displayName")}
          />
          {errors.displayName && (
            <span className="text-destructive text-[11px] font-semibold">
              {errors.displayName.message}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default UserInfoSection;
