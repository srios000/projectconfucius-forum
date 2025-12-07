import React from "react";
import { Text, Flex, Skeleton, Image } from "@chakra-ui/react";
import { Post } from "@/atoms/postsAtom";

type PostBodyProps = {
  post: Post;
  loadingImage: boolean;
  setLoadingImage: (value: React.SetStateAction<boolean>) => void;
};

const PostBody: React.FC<PostBodyProps> = ({
  post,
  loadingImage,
  setLoadingImage,
}) => {
  return (
    <>
      <Text fontSize="12pt">{post.body.split(" ").slice(0, 30).join(" ")}</Text>
      {post.imageURL && (
        <Flex justify="center" align="center">
          {loadingImage && (
            <Skeleton height="300px" width="100%" borderRadius={10} />
          )}
          <Image
            mt={4}
            src={post.imageURL}
            alt="Image for post"
            maxHeight="450px"
            maxWidth="100%"
            borderRadius="10px"
            display={loadingImage ? "none" : "unset"}
            onLoad={() => setLoadingImage(false)}
            shadow="md"
          />
        </Flex>
      )}
    </>
  );
};

export default PostBody;
