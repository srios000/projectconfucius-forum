import { Community } from "@/atoms/communitiesAtom";
import useCreatePost from "@/hooks/posts/useCreatePost";
import useSelectFile from "@/hooks/useSelectFile";
import { Flex, Icon } from "@chakra-ui/react";
import { User } from "firebase/auth";
import { useParams, useRouter } from "next/navigation";
import React, { useState } from "react";
import { IoDocumentText, IoImageOutline } from "react-icons/io5";
import BackToCommunityButton from "./BackToCommunityButton";
import PostBody from "./PostBody";
import PostCreateError from "./PostCreateError";
import TabList from "./TabList";

/**
 * Props for NewPostForm component.
 * @param {user} - user object
 */
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
  const [textInputs, setTextInputs] = useState({
    title: "",
    body: "",
  });
  const { selectedFile, setSelectedFile, onSelectFile } = useSelectFile(
    3000,
    3000
  );
  const { handleCreatePost, loading, error } = useCreatePost();

  /**
   * Handles the creation of a new post.
   * Uploads the posts contents to Firestore including any optional image.
   *
   * @async
   */
  const onCreatePost = async () => {
    const communityId = params?.communityId as string;
    await handleCreatePost(
      user,
      communityId,
      communityImageURL,
      textInputs,
      selectedFile
    );
  };

  /**
   * Keeps track of the text inputs in the form and updates the state.
   * @param {React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>} event - event object from the input
   */
  const onTextChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const {
      target: { name, value },
    } = event;
    setTextInputs((prev) => ({
      ...prev,
      [name]: value,
    })); // update the state
  };

  return (
    <Flex
      direction="column"
      bg={{ base: "white", _dark: "gray.800" }}
      borderRadius={10}
      mt={2}
      shadow="md"
    >
      <TabList
        formTabs={formTabs}
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTab}
      />
      <BackToCommunityButton communityId={currentCommunity?.id} />
      <PostBody
        selectedTab={selectedTab}
        handleCreatePost={onCreatePost}
        onTextChange={onTextChange}
        loading={loading}
        textInputs={textInputs}
        selectedFile={selectedFile}
        onSelectFile={onSelectFile}
        setSelectedTab={setSelectedTab}
        setSelectedFile={setSelectedFile}
      />
      <PostCreateError error={error} />
    </Flex>
  );
};
export default NewPostForm;
