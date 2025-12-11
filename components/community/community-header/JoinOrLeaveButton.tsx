import React from "react";
import { Button } from "@chakra-ui/react";

type JoinOrLeaveButtonProps = {
  isJoined: boolean;
  onClick: () => void;
  isLoading?: boolean;
};

const JoinOrLeaveButton: React.FC<JoinOrLeaveButtonProps> = ({
  isJoined,
  onClick,
  isLoading,
}) => {
  return (
    <Button
      variant={isJoined ? "outline" : "solid"}
      height="40px"
      pr={{ base: 2, md: 6 }}
      pl={{ base: 2, md: 6 }}
      onClick={onClick}
      shadow="md"
      width="120px"
      loading={isLoading}
    >
      {isJoined ? "Unsubscribe" : "Subscribe"}
    </Button>
  );
};

export default JoinOrLeaveButton;
