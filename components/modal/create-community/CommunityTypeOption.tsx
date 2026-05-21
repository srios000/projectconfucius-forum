import React, { FC } from "react";
import type { IconType } from "react-icons";

type CommunityTypeOptionProps = {
  name: string;
  icon: IconType;
  label: string;
  description: string;
  isChecked: boolean;
  onChange: (value: string) => void;
};

const CommunityTypeOption: FC<CommunityTypeOptionProps> = ({
  name,
  icon: Icon,
  label,
  description,
  isChecked,
  onChange,
}) => {
  return (
    <div
      onClick={() => onChange(name)}
      className={
        "flex items-center justify-between border rounded-xl p-3 cursor-pointer transition-all " +
        (isChecked
          ? "border-primary bg-primary-mute/50 text-foreground"
          : "border-border hover:bg-muted/40 text-muted-foreground")
      }
    >
      <div className="flex items-center gap-3">
        <Icon className="size-5 text-muted-foreground shrink-0" />
        <div className="flex flex-col text-left">
          <span className="text-[12.5px] font-semibold text-foreground leading-tight">{label}</span>
          <span className="text-[11px] text-muted-foreground mt-0.5">{description}</span>
        </div>
      </div>
      <div
        className={
          "size-4 rounded-full border flex items-center justify-center transition-colors shrink-0 " +
          (isChecked ? "border-primary bg-primary" : "border-border")
        }
      >
        {isChecked && <div className="size-1.5 rounded-full bg-white" />}
      </div>
    </div>
  );
};

export default CommunityTypeOption;
