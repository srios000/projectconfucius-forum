import { validateSignupForm } from "@/lib/validation";
import { Button, Flex, Text } from "@chakra-ui/react";
import { useSetAtom } from "jotai";
import React, { useState } from "react";
import { useCreateUserWithEmailAndPassword } from "react-firebase-hooks/auth";
import { authModalStateAtom } from "../../../atoms/authModalAtom";
import { auth } from "../../../firebase/clientApp";
import { FIREBASE_ERRORS } from "../../../firebase/errors";
import InputField from "./InputField";
import { PasswordInput } from "@/components/ui/password-input";

/**
 * Allows the user to create an account by inputting the required credentials (email and password).
 * There are 2 password fields to ensure that the user inputs the correct password.
 * If the 2 passwords do not match, the account is not created and an error is displayed.
 * If the email already exists, the account is not created and an error is displayed.
 *
 * A button to log in instead is available which would switch the modal to the log in view when clicked.
 * @returns {React.FC} - Sign up components view for modal.
 *
 * @see https://github.com/CSFrequency/react-firebase-hooks/tree/master/auth
 */
const SignUp = () => {
  const setAuthModalState = useSetAtom(authModalStateAtom); // Set global state
  const [signUpForm, setSignUpForm] = useState({
    email: "", // Initially empty email
    password: "", // Initially empty password
    confirmPassword: "", // Initially empty confirm password
  });
  const [error, setError] = useState(""); // Initially empty error
  const [
    createUserWithEmailAndPassword, // returns a function that returns the user, loading or error
    user,
    loading,
    userError,
  ] = useCreateUserWithEmailAndPassword(auth);

  /**
   * This function is used as the event handler for a form submission.
   * It will prevent the page from refreshing.
   * Checks if the password and confirm password fields match and the password requirements are met:
   *  - If they do not match, an error message is set and the function returns without creating a new user.
   *  - If the password does not meet the requirements, an error message is set and the function returns without creating a new user.
   *  - If the passwords match and the password meets the requirements, a new user is created using the email and password provided in the form.
   * @param {React.FormEvent<HTMLFormElement>} event - the submit event triggered by the form
   *
   * @returns exit if there is an error or the passwords do not match
   */
  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevent the page from refreshing
    if (error) setError(""); // If there is an error, clear it

    const validationError = validateSignupForm(signUpForm);
    if (validationError) {
      setError(validationError);
      return;
    }

    createUserWithEmailAndPassword(signUpForm.email, signUpForm.password); // Create user with email and password
  }; // Function to execute when the form is submitted

  /**
   * Function to execute when the form is changed (when email and password are typed).
   * Multiple inputs use the same onChange function.
   * @param {React.ChangeEvent<HTMLInputElement>} event - the change event triggered by the input
   */
  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Update form state
    setSignUpForm((prev) => ({
      ...prev, // Spread previous state because we don't want to lose the other input's value
      [event.target.name]: event.target.value, // Catch the name of the input that was changed and update the corresponding state
    }));
  };

  const isButtonDisabled = () => {
    return (
      !signUpForm.email || !signUpForm.password || !signUpForm.confirmPassword
    );
  };

  return (
    <form onSubmit={onSubmit}>
      <InputField
        name="email"
        placeholder="Email"
        type="email"
        onChange={onChange}
      />

      <PasswordInput
        name="password"
        placeholder="Password"
        onChange={onChange}
        required
        rootProps={{ mb: 2 }}
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
      />

      <PasswordInput
        name="confirmPassword"
        placeholder="Confirm Password"
        onChange={onChange}
        required
        rootProps={{ mb: 2 }}
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
      />

      {/* If there is error than the error is shown */}

      <Text
        textAlign="center"
        color={{ base: "red.500", _dark: "red.400" }}
        fontSize="10pt"
        fontWeight="800"
      >
        {error ||
          FIREBASE_ERRORS[userError?.code as keyof typeof FIREBASE_ERRORS]}
      </Text>

      <Button
        width="100%"
        height="36px"
        mt={2}
        mb={2}
        type="submit"
        loading={loading} // If loading (from Firebase) is true, show loading spinner
        disabled={isButtonDisabled()}
      >
        {" "}
        {/* When the form is submitted, execute onSubmit function */}
        Sign Up
      </Button>

      <Flex fontSize="9pt" justifyContent="center">
        <Text mr={1}>Already a Clown? </Text>
        <Text
          color={{ base: "red.500", _dark: "red.400" }}
          fontWeight={700}
          cursor="pointer"
          onClick={() =>
            setAuthModalState((prev) => ({
              ...prev,
              view: "login",
            }))
          }
        >
          Log In
        </Text>
      </Flex>
    </form>
  );
};

export default SignUp;
