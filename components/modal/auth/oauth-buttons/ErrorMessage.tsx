import React from "react";
import { Text } from "@chakra-ui/react";
import { AuthError } from "firebase/auth";
import { FIREBASE_ERRORS } from "@/firebase/errors";

interface ErrorMessageProps {
  error: AuthError | undefined;
}

const AuthenticationErrorMessage: React.FC<ErrorMessageProps> = ({ error }) => {
  return error ? (
    <Text textAlign="center" color="red" fontSize="10pt" fontWeight="800">
      {FIREBASE_ERRORS[error.message as keyof typeof FIREBASE_ERRORS]}
    </Text>
  ) : null;
};

export default AuthenticationErrorMessage;
