import { Button, Stack, Text } from "@chakra-ui/react";
import React from "react";

type DangerZoneProps = {
  deleteCommunity: () => Promise<void>;
  loading: boolean;
};

/**
 * Component for dangerous community actions like deletion
 */
const DangerZone: React.FC<DangerZoneProps> = ({
  deleteCommunity,
  loading,
}) => {
  return (
    <Stack>
      <Text fontWeight={600} fontSize="12pt" color="red.500">
        Danger Zone
      </Text>
      <Text fontSize="9pt" color={{ base: "gray.600", _dark: "gray.400" }}>
        Once you delete a community, there is no going back. Please be certain.
      </Text>
      <Button
        variant="outline"
        colorScheme="red"
        height="30px"
        onClick={deleteCommunity}
        loading={loading}
      >
        Delete Community
      </Button>
    </Stack>
  );
};

export default DangerZone;
