import React from "react";
import { Text } from "@chakra-ui/react";
import { Post } from "@/types/post";

type PostTitleProps = {
  post: Post;
};

const PostTitle: React.FC<PostTitleProps> = ({ post }) => {
  return (
    <Text fontSize="14pt" fontWeight={600}>
      {post.title}
    </Text>
  );
};

export default PostTitle;
