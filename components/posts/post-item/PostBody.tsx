import React from "react";
import { Text, Flex, Skeleton, Image } from "@chakra-ui/react";
import { Post } from "@/types/post";

type PostBodyProps = {
  post: Post;
  loadingImage: boolean;
  setLoadingImage: (value: React.SetStateAction<boolean>) => void;
};

/**
 * Renders the post body preview and optional image with skeleton fallback.
 * @param post - Post content to show.
 * @param loadingImage - Whether the image is still loading.
 * @param setLoadingImage - Setter triggered on image load.
 * @returns Text excerpt and image block.
 */
const PostBody: React.FC<PostBodyProps> = ({
  post,
  loadingImage,
  setLoadingImage,
}) => {
  return (
    <>
      <Text fontSize="12pt">{post.body.split(" ").slice(0, 30).join(" ")}</Text>
      {post.imageUrl && (
        <Flex
          justify="center"
          align="center"
          position="relative"
          mt={4}
          width="100%"
          minHeight={loadingImage ? "300px" : undefined}
        >
          <Image
            src={post.imageUrl}
            alt="Image for post"
            maxHeight="450px"
            maxWidth="100%"
            borderRadius="10px"
            loading="lazy"
            decoding="async"
            opacity={loadingImage ? 0 : 1}
            transition="opacity 0.3s"
            onLoad={() => setLoadingImage(false)}
            onError={() => setLoadingImage(false)}
            shadow="md"
          />
          {loadingImage && (
            <Skeleton position="absolute" inset={0} borderRadius={10} />
          )}
        </Flex>
      )}
    </>
  );
};

export default PostBody;
