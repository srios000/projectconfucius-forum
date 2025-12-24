import { Button, Flex, Icon, Image, Input, Text } from "@chakra-ui/react";
import { useSetAtom } from "jotai";
import React, { useState } from "react";
import { useSendPasswordResetEmail } from "react-firebase-hooks/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BsDot } from "react-icons/bs";
import { authModalStateAtom } from "../../../atoms/authModalAtom";
import { auth } from "../../../firebase/clientApp";
import { resetPasswordSchema, ResetPasswordInput } from "@/schema/auth";

const ResetPassword: React.FC = () => {
  const setAuthModalState = useSetAtom(authModalStateAtom);
  const [success, setSuccess] = useState(false);
  const [sendPasswordResetEmail, sending, error] =
    useSendPasswordResetEmail(auth);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    await sendPasswordResetEmail(data.email);
    setSuccess(true);
  };

  return (
    <Flex direction="column" alignItems="center" width="100%">
      <Image src="/images/logo.svg" height="40px" mb={2} alt="Website logo" />
      <Text fontWeight={700} mb={2}>
        Reset your password
      </Text>
      {success ? (
        <Text mb={4}>Check your email</Text>
      ) : (
        <>
          <Text fontSize="sm" textAlign="center" mb={2}>
            Enter the email associated with your account and we will send you a
            reset link
          </Text>
          <form onSubmit={handleSubmit(onSubmit)} style={{ width: "100%" }}>
            <Input
              placeholder="Email"
              type="email"
              mb={2}
              fontSize="10pt"
              _placeholder={{ color: "gray.500" }}
              _hover={{
                bg: { base: "white", _dark: "gray.700" },
                border: "1px solid",
                borderColor: "blue.500",
              }}
              _focus={{
                outline: "none",
                bg: { base: "white", _dark: "gray.700" },
                border: "1px solid",
                borderColor: "blue.500",
              }}
              bg={{ base: "gray.50", _dark: "gray.800" }}
              {...register("email")}
            />
            {errors.email && (
              <Text color="red.500" fontSize="10pt" mt={1}>
                {errors.email.message}
              </Text>
            )}
            <Text
              textAlign="center"
              fontSize="10pt"
              color={{ base: "red.500", _dark: "red.400" }}
            >
              {error?.message}
            </Text>
            <Button
              width="100%"
              height="36px"
              mb={2}
              mt={2}
              type="submit"
              loading={sending}
              disabled={!isValid}
            >
              Reset Password
            </Button>
          </form>
        </>
      )}
      <Flex
        alignItems="center"
        fontSize="9pt"
        color={{ base: "red.500", _dark: "red.400" }}
        fontWeight={700}
        cursor="pointer"
      >
        <Text
          onClick={() =>
            setAuthModalState((prev) => ({
              ...prev,
              view: "login",
            }))
          }
        >
          LOGIN
        </Text>
        <Icon as={BsDot} />
        <Text
          onClick={() =>
            setAuthModalState((prev) => ({
              ...prev,
              view: "signup",
            }))
          }
        >
          SIGN UP
        </Text>
      </Flex>
    </Flex>
  );
};
export default ResetPassword;
