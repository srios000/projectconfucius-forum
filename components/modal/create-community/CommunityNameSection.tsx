import React from "react";
import { Box, Text, Input } from "@chakra-ui/react";

interface CommunityNameSectionProps {
  communityName: string;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  charRemaining: number;
  error: string;
}

/**
 * Input block for community name entry with character counter and errors.
 * @param communityName - Current name value.
 * @param handleChange - Change handler enforced by the modal.
 * @param charRemaining - Remaining characters allowed.
 * @param error - Validation error message to display.
 * @returns Form section for naming a community.
 */
const CommunityNameSection: React.FC<CommunityNameSectionProps> = ({
  communityName,
  handleChange,
  charRemaining,
  error,
}) => {
  return (
    <Box>
      <Text fontWeight={600} fontSize={15}>
        Name
      </Text>
      <Text fontSize={11} color="gray.500">
        Community names cannot be changed
      </Text>
      <Input
        mt={2}
        value={communityName}
        placeholder="Community Name"
        onChange={handleChange}
        fontSize="10pt"
        borderRadius={"xl"}
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
      <Text
        fontSize="9pt"
        mt={1}
        color={charRemaining === 0 ? "red" : "gray.500"}
      >
        {charRemaining} Characters remaining
      </Text>
      <Text fontSize="9pt" color="red" pt={1}>
        {error}
      </Text>
    </Box>
  );
};

export default CommunityNameSection;
