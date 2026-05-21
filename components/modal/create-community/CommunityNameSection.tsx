import React from "react";
import { UseFormRegisterReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";

interface CommunityNameSectionProps {
  charRemaining?: number;
  error?: string;
  register?: UseFormRegisterReturn;
}

const CommunityNameSection: React.FC<CommunityNameSectionProps> = ({
  charRemaining,
  error,
  register,
}) => {
  return (
    <div className="space-y-1.5">
      <label className="text-[12.5px] font-semibold text-foreground">Name</label>
      <div className="text-[11px] text-muted-foreground">Community names cannot be changed</div>
      <Input
        placeholder="Community Name"
        className="mt-1 bg-muted/50 focus-visible:bg-card focus-visible:ring-primary focus-visible:border-primary"
        {...register}
      />
      <div className="flex justify-between items-center text-[10.5px] pt-1">
        <span className={charRemaining === 0 ? "text-destructive" : "text-muted-foreground"}>
          {charRemaining} Characters remaining
        </span>
        {error && <span className="text-destructive font-semibold">{error}</span>}
      </div>
    </div>
  );
};

export default CommunityNameSection;
