import React from "react";
import { Icon, Text } from "@chakra-ui/react";
import {
  IoArrowDownCircleOutline,
  IoArrowDownCircleSharp,
  IoArrowUpCircleOutline,
  IoArrowUpCircleSharp,
} from "react-icons/io5";
import { Post } from "@/types/post";

type VoteSectionProps = {
  userVoteValue?: number;
  onVote: (
    event: React.MouseEvent<SVGElement, MouseEvent>,
    post: Post,
    vote: number,
    communityId: string
  ) => void;
  post: Post;
  votingDisabled?: boolean;
};

const VoteSection: React.FC<VoteSectionProps> = ({
  userVoteValue,
  onVote,
  post,
  votingDisabled,
}) => {
  return (
    <>
      <Icon
        as={userVoteValue === 1 ? IoArrowUpCircleSharp : IoArrowUpCircleOutline}
        color={
          votingDisabled
            ? "gray.300"
            : userVoteValue === 1
            ? "red.500"
            : "gray.500"
        }
        fontSize={22}
        cursor={votingDisabled ? "not-allowed" : "pointer"}
        _hover={votingDisabled ? undefined : { color: "red.300" }}
        onClick={(event) =>
          !votingDisabled && onVote(event, post, 1, post.communityId)
        }
      />
      <Text fontSize="12pt" color={{ base: "gray.600", _dark: "gray.400" }}>
        {post.voteStatus}
      </Text>
      <Icon
        as={
          userVoteValue === -1
            ? IoArrowDownCircleSharp
            : IoArrowDownCircleOutline
        }
        color={
          votingDisabled
            ? "gray.300"
            : userVoteValue === -1
            ? "red.500"
            : "gray.500"
        }
        _hover={votingDisabled ? undefined : { color: "red.300" }}
        fontSize={22}
        cursor={votingDisabled ? "not-allowed" : "pointer"}
        onClick={(event) =>
          !votingDisabled && onVote(event, post, -1, post.communityId)
        }
      />
    </>
  );
};

export default VoteSection;
