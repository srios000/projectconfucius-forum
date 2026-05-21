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
  isVotePending?: boolean;
};

/**
 * Upvote/downvote controls for a post card.
 * @param userVoteValue - Current user's vote value to style icons.
 * @param onVote - Handler invoked with vote intent.
 * @param post - Post being voted on.
 * @param votingDisabled - Disables interaction when lacking permission.
 * @returns Icon pair with vote count.
 */
const VoteSection: React.FC<VoteSectionProps> = ({
  userVoteValue,
  onVote,
  post,
  votingDisabled,
  isVotePending,
}) => {
  const interactionBlocked = votingDisabled || isVotePending;
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
        opacity={isVotePending ? 0.5 : 1}
        fontSize={22}
        cursor={interactionBlocked ? "not-allowed" : "pointer"}
        _hover={interactionBlocked ? undefined : { color: "red.300" }}
        onClick={(event) =>
          !interactionBlocked && onVote(event, post, 1, post.communityId)
        }
      />
      <Text
        fontSize="12pt"
        color={{ base: "gray.600", _dark: "gray.400" }}
        opacity={isVotePending ? 0.5 : 1}
        transition="opacity 0.15s"
      >
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
        opacity={isVotePending ? 0.5 : 1}
        _hover={interactionBlocked ? undefined : { color: "red.300" }}
        fontSize={22}
        cursor={interactionBlocked ? "not-allowed" : "pointer"}
        onClick={(event) =>
          !interactionBlocked && onVote(event, post, -1, post.communityId)
        }
      />
    </>
  );
};

export default VoteSection;
