import { Flex, Input, Text } from "@chakra-ui/react";
import { User } from "firebase/auth";
import React from "react";

type UserInfoSectionProps = {
  user: User | null | undefined;
  isEditing: boolean;
  userName: string;
  handleNameChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

/**
 * Profile info block that toggles between read-only and editable username.
 * @param user - Firebase user for email and current display name.
 * @param isEditing - Whether to show the input.
 * @param userName - Controlled input value for the name.
 * @param handleNameChange - Change handler for the name field.
 * @returns Email and name display with optional edit input.
 */
const UserInfoSection: React.FC<UserInfoSectionProps> = ({
  user,
  isEditing,
  userName,
  handleNameChange,
}) => {
  return (
    <>
      {!isEditing && (
        <Flex direction="column">
          <Flex direction="row">
            <Text
              fontSize="12pt"
              color={{ base: "gray.600", _dark: "gray.400" }}
              mr={1}
              fontWeight={600}
            >
              Email:
            </Text>
            <Text fontSize="12pt">{user?.email}</Text>
          </Flex>
          <Flex direction="row">
            <Text
              fontSize="12pt"
              color={{ base: "gray.600", _dark: "gray.400" }}
              mr={1}
              fontWeight={600}
            >
              User Name:
            </Text>
            <Text fontSize="12pt">{user?.displayName || ""}</Text>
          </Flex>
        </Flex>
      )}
      {isEditing && (
        <Flex direction="column">
          <Text
            fontSize="sm"
            color={{ base: "gray.500", _dark: "gray.400" }}
            mb={1}
          >
            User Name
          </Text>
          <Input
            name="displayName"
            placeholder="User Name"
            value={userName}
            type="text"
            onChange={handleNameChange}
            _hover={{
              bg: { base: "white", _dark: "gray.700" },
              border: "1px solid",
              borderColor: { base: "red.500", _dark: "red.400" },
            }}
            _focus={{
              bg: { base: "white", _dark: "gray.700" },
              border: "1px solid",
              borderColor: { base: "red.500", _dark: "red.400" },
            }}
            borderRadius={10}
          />
        </Flex>
      )}
    </>
  );
};

export default UserInfoSection;
