import { Button, Flex, Text } from "@chakra-ui/react";
import { useSetAtom } from "jotai";
import React from "react";
import { useSignInWithEmailAndPassword } from "react-firebase-hooks/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authModalStateAtom } from "../../../atoms/authModalAtom";
import { auth } from "../../../firebase/clientApp";
import { FIREBASE_ERRORS } from "../../../firebase/errors";
import InputField from "./InputField";
import { PasswordInput } from "@/components/ui/password-input";
import { loginSchema, LoginInput } from "@/schema/auth";

type LoginProps = {};

/**
 * Allows the user to input the log in credentials (email and password) to log into the site.
 * Contains 2 input fields, `Email` and `Password` and a log in button.
 *
 * If the credentials are correct, the user is signed in.
 * If the credentials are incorrect, error messages are displayed.
 *
 * Buttons for resetting the password and signing up are present.
 * Clicking these buttons would change the modal to the appropriate view.
 * @returns {React.FC} - Login component
 *
 * @see https://github.com/CSFrequency/react-firebase-hooks/tree/master/auth
 */
const Login: React.FC<LoginProps> = () => {
  const setAuthModalState = useSetAtom(authModalStateAtom); // Set global state
  const [signInWithEmailAndPassword, user, loading, error] =
    useSignInWithEmailAndPassword(auth);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  const onSubmit = (data: LoginInput) => {
    signInWithEmailAndPassword(data.email, data.password);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <InputField placeholder="Email" type="email" {...register("email")} />
      {errors.email && (
        <Text color="red.500" fontSize="10pt" mt={1}>
          {errors.email.message}
        </Text>
      )}

      <PasswordInput
        placeholder="Password"
        rootProps={{ mb: 2, mt: 2 }}
        fontSize="10pt"
        bg={{ base: "gray.50", _dark: "gray.800" }}
        borderColor={{ base: "gray.200", _dark: "gray.600" }}
        _placeholder={{ color: "gray.500" }}
        _hover={{
          bg: { base: "white", _dark: "gray.700" },
          border: "1px solid",
          borderColor: { base: "red.500", _dark: "red.400" },
        }}
        _focus={{
          outline: "none",
          bg: { base: "white", _dark: "gray.700" },
          border: "1px solid",
          borderColor: { base: "red.500", _dark: "red.400" },
        }}
        {...register("password")}
      />
      {errors.password && (
        <Text color="red.500" fontSize="10pt" mt={1}>
          {errors.password.message}
        </Text>
      )}

      <Text
        textAlign="center"
        color={{ base: "red.500", _dark: "red.400" }}
        fontSize="10pt"
        fontWeight="800"
        mt={2}
      >
        {FIREBASE_ERRORS[error?.code as keyof typeof FIREBASE_ERRORS]}
      </Text>

      <Button
        width="100%"
        height="36px"
        mt={2}
        mb={2}
        type="submit"
        loading={loading}
        disabled={!isValid}
      >
        {" "}
        {/* When the form is submitted, execute onSubmit function */}
        Log In
      </Button>

      <Flex fontSize="9pt" justifyContent="center" mb={2}>
        <Text fontSize="9pt" mr={1}>
          Forgot your password?
        </Text>
        <Text
          color={{ base: "red.500", _dark: "red.400" }}
          fontWeight={700}
          cursor="pointer"
          onClick={() =>
            setAuthModalState((prev) => ({
              ...prev,
              view: "resetPassword",
            }))
          }
        >
          Reset Password
        </Text>
      </Flex>

      <Flex fontSize="9pt" justifyContent="center">
        <Text mr={1}>Want to join the circus? </Text>
        <Text
          color={{ base: "red.500", _dark: "red.400" }}
          fontWeight={700}
          cursor="pointer"
          onClick={() =>
            setAuthModalState((prev) => ({
              ...prev,
              view: "signup",
            }))
          }
        >
          Sign Up
        </Text>
      </Flex>
    </form>
  );
};

export default Login;
