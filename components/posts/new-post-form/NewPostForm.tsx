import { Community } from "@/types/community";
import useCreatePost from "@/hooks/posts/useCreatePost";
import useSelectFile from "@/hooks/useSelectFile";
import { Flex, Icon, Tabs, Text } from "@chakra-ui/react";
import { User } from "firebase/auth";
import { useParams, useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IoDocumentText, IoImageOutline } from "react-icons/io5";
import BackToCommunityButton from "./BackToCommunityButton";
import PostCreateError from "./PostCreateError";
import TextInputs from "../post-form/TextInputs";
import ImageUpload from "../post-form/ImageUpload";
import { createPostSchema, CreatePostInput } from "@/schema/post";

type NewPostFormProps = {
  user: User; // parent component checks user so additional checks aer not needed ut
  communityImageURL?: string;
  currentCommunity?: Community;
};

// Tab items which are static (not react) hence outside
/**
 * Tabs for post creation form.
 * Static array of objects which are used to dynamically create the navbar component.
 * @param {title} - title of the tab
 * @param {icon} - icon of the tab
 */
const formTabs: FormTab[] = [
  {
    title: "Post",
    icon: IoDocumentText,
  },
  {
    title: "Images",
    icon: IoImageOutline,
  },
  // more can be added which would dynamically be fitted into post creation navbar component
];

/**
 * @param {title} - title of the tab
 * @param {icon} - icon of the tab
 */
export type FormTab = {
  title: string;
  icon: typeof Icon.arguments;
};

/**
 * Component for creating a new post.
 * @param {User} user - user object
 * @param {string} communityImageURL - image url of the community
 * @param {Community} currentCommunity - current community
 *
 * @returns {React.FC} - NewPostForm component
 *
 * @requires TabList - tabs for post creation form
 * @requires BackToCommunityButton - button to go back to community page
 * @requires PostBody - body of the post
 * @requires PostCreateError - error message for post creation
 */
const NewPostForm: React.FC<NewPostFormProps> = ({
  user,
  communityImageURL,
  currentCommunity,
}) => {
  const router = useRouter();
  const params = useParams();
  const [selectedTab, setSelectedTab] = useState(formTabs[0].title); // formTabs[0] = Post
  const { selectedFile, setSelectedFile, onSelectFile } = useSelectFile(
    3000,
    3000
  );
  const { handleCreatePost, loading, error } = useCreatePost();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreatePostInput>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      title: "",
      body: "",
    },
    mode: "onChange",
  });

  /**
   * Handles the creation of a new post.
   * Uploads the posts contents to Firestore including any optional image.
   *
   * @async
   */
  const onCreatePost = async (data: CreatePostInput) => {
    const communityId = params?.communityId as string;
    await handleCreatePost(
      user,
      communityId,
      communityImageURL,
      { title: data.title, body: data.body || "" },
      selectedFile
    );
  };

  return (
    <Flex
      direction="column"
      bg={{ base: "white", _dark: "gray.800" }}
      borderRadius={10}
      mt={2}
      shadow="md"
    >
      <Tabs.Root
        value={selectedTab}
        onValueChange={(e: { value: string }) => setSelectedTab(e.value)}
        width="100%"
        variant="plain"
      >
        <Tabs.List width="100%" gap={2} p={2}>
          {formTabs.map((item) => (
            <Tabs.Trigger
              key={item.title}
              value={item.title}
              flexGrow={1}
              width={0}
              p="14px 0px"
              height="52px"
              cursor="pointer"
              fontWeight={800}
              fontSize="16pt"
              borderWidth="1px"
              borderRadius={10}
              shadow="md"
              display="flex"
              justifyContent="center"
              alignItems="center"
              _hover={{
                bg: { base: "gray.50", _dark: "gray.700" },
                boxShadow: "sm",
              }}
              color={{ base: "gray.500", _dark: "gray.400" }}
              borderColor={{ base: "gray.200", _dark: "gray.600" }}
              _selected={{
                color: { base: "red.500", _dark: "red.400" },
                borderColor: { base: "red.500", _dark: "red.400" },
              }}
            >
              <Flex align="center" height="20px" mr={2}>
                <Icon as={item.icon} />
              </Flex>
              <Text fontSize="10pt">{item.title}</Text>
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <BackToCommunityButton communityId={currentCommunity?.id} />
        <Tabs.Content value="Post" p={4}>
          <TextInputs
            register={register}
            errors={errors}
            handleCreatePost={handleSubmit(onCreatePost)}
            loading={loading}
          />
        </Tabs.Content>
        <Tabs.Content value="Images" p={4}>
          <ImageUpload
            selectedFile={selectedFile}
            onSelectImage={onSelectFile}
            setSelectedTab={setSelectedTab}
            setSelectedFile={setSelectedFile}
          />
        </Tabs.Content>
      </Tabs.Root>
      <PostCreateError error={error} />
    </Flex>
  );
};
export default NewPostForm;
