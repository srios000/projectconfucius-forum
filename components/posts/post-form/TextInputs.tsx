import { Button, Flex, Input, Stack, Text, Textarea } from "@chakra-ui/react";
import React from "react";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { CreatePostInput } from "@/schema/post";

type TextInputsProps = {
  register: UseFormRegister<CreatePostInput>;
  errors: FieldErrors<CreatePostInput>;
  handleCreatePost: () => void;
  loading: boolean;
};

/**
 * Sub-component of `NewPostForm` component.
 * Allows user to enter the title and body of the post.
 * @param register - React Hook Form register function
 * @param errors - React Hook Form errors object
 * @param handleCreatePost - function to handle creating post
 * @param loading - is the post being created
 *
 * @returns {React.FC<TextInputsProps>} - input fields for title and body of the post
 */
const TextInputs: React.FC<TextInputsProps> = ({
  register,
  errors,
  handleCreatePost,
  loading,
}) => {
  return (
    <Stack gap={3} width="100%">
      {/* Title  of the post*/}
      <Input
        placeholder="Title"
        fontSize="10pt"
        borderRadius={10}
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
        {...register("title")}
      />
      {errors.title && (
        <Text color="red.500" fontSize="10pt">
          {errors.title.message}
        </Text>
      )}
      {/* Body of the post */}
      <Textarea
        placeholder="Text (Optional)"
        fontSize="10pt"
        height="120px"
        borderRadius={10}
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
        {...register("body")}
      />
      <Flex justify="flex-end">
        {/* Button for creating a new post */}
        <Button
          height="34px"
          padding="0px 30px"
          loading={loading}
          onClick={handleCreatePost}
          shadow="md"
        >
          Post
        </Button>
      </Flex>
    </Stack>
  );
};
export default TextInputs;
