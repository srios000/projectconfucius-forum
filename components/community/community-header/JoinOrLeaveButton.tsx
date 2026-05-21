import React from "react";
import { Button } from "@/components/ui/button";

type JoinOrLeaveButtonProps = {
  isJoined: boolean;
  onClick: () => void;
  isLoading?: boolean;
};

/**
 * Subscription toggle button for a community header.
 * @param isJoined - Whether the viewer is already subscribed.
 * @param onClick - Handler to join or leave.
 * @param isLoading - Shows loading state when membership is updating.
 * @returns Styled button with subscribe/unsubscribe label.
 */
const JoinOrLeaveButton: React.FC<JoinOrLeaveButtonProps> = ({
  isJoined,
  onClick,
  isLoading,
}) => {
  return (
    <Button
      variant={isJoined ? "outline" : "default"}
      disabled={isLoading}
      onClick={onClick}
      className="h-10 px-2 md:px-6 shadow-md w-[120px] font-semibold text-xs"
    >
      {isLoading ? "Working..." : isJoined ? "Unsubscribe" : "Subscribe"}
    </Button>
  );
};

export default JoinOrLeaveButton;
