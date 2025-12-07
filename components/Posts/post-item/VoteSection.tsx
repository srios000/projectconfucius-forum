import React from "react";
import { Icon, Text } from "@chakra-ui/react";
import {
  IoArrowDownCircleOutline,
  IoArrowDownCircleSharp,
  IoArrowUpCircleOutline,
  IoArrowUpCircleSharp,
} from "react-icons/io5";
import { Post } from "@/atoms/postsAtom";

type VoteSectionProps = {
  userVoteValue?: number;
  onVote: (
    event: React.MouseEvent<SVGElement, MouseEvent>,
    post: Post,
    vote: number,
    communityId: string
  ) => void;
  post: Post;
};

const VoteSection: React.FC<VoteSectionProps> = ({
  userVoteValue,
  onVote,
  post,
}) => {
  return (
    <>
      <Icon
        as={userVoteValue === 1 ? IoArrowUpCircleSharp : IoArrowUpCircleOutline}
        color={userVoteValue === 1 ? "red.500" : "gray.500"}
        fontSize={22}
        cursor="pointer"
        _hover={{ color: "red.300" }}
        onClick={(event) => onVote(event, post, 1, post.communityId)}
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
        color={userVoteValue === -1 ? "red.500" : "gray.500"}
        _hover={{ color: "red.300" }}
        fontSize={22}
        cursor="pointer"
        onClick={(event) => onVote(event, post, -1, post.communityId)}
      />
    </>
  );
};

export default VoteSection;
