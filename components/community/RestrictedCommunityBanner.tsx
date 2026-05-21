import React from "react";
import { FaLock } from "react-icons/fa";

type RestrictedCommunityBannerProps = {
  title?: string;
  description?: string;
};

/**
 * A placeholder banner displayed when a user attempts to view a private or restricted community without permission.
 * @param title - Custom title for the restriction message.
 * @param description - Custom description explaining the access limitation.
 * @returns A centered banner with a lock icon and explanatory text.
 */
const RestrictedCommunityBanner: React.FC<RestrictedCommunityBannerProps> = ({
  title = "This community is private",
  description = "Posts are only shown to subscribers.",
}) => {
  return (
    <div className="flex flex-col justify-center items-center border border-border rounded-xl p-10 bg-card">
      <FaLock className="text-[50px] text-muted-foreground/60 mb-4" />
      <span className="font-semibold text-lg">{title}</span>
      <p className="text-muted-foreground mt-1 text-sm">{description}</p>
    </div>
  );
};

export default RestrictedCommunityBanner;
