import React from "react";
import { Button, Image } from "@chakra-ui/react";

interface AuthButtonProps {
  provider: string;
  loading: boolean;
  onClick: () => void;
  image: string;
}

const AuthButton: React.FC<AuthButtonProps> = ({
  provider,
  loading,
  onClick,
  image,
}) => {
  return (
    <Button
      flexGrow={1}
      variant={"oauth" as any}
      loading={loading}
      onClick={onClick}
      width="50%"
    >
      <Image
        src={image}
        alt={`Continue with ${provider}`}
        mr={2}
        height="20px"
      />
      {provider}
    </Button>
  );
};

export default AuthButton;
