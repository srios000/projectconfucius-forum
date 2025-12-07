import React from "react";
import { Flex } from "@chakra-ui/react";
import TextInputs from "../post-form/TextInputs";
import ImageUpload from "../post-form/ImageUpload";

type PostBodyProps = {
  selectedTab: string;
  handleCreatePost: () => Promise<void>;
  onTextChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  loading: boolean;
  textInputs: { title: string; body: string };
  selectedFile: string | undefined;
  onSelectFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
  setSelectedTab: React.Dispatch<React.SetStateAction<string>>;
  setSelectedFile: React.Dispatch<React.SetStateAction<string | undefined>>;
};

const PostBody: React.FC<PostBodyProps> = ({
  selectedTab,
  handleCreatePost,
  onTextChange,
  loading,
  textInputs,
  selectedFile,
  onSelectFile,
  setSelectedTab,
  setSelectedFile,
}) => {
  return (
    <Flex p={4}>
      {selectedTab === "Post" && (
        <TextInputs
          textInputs={textInputs}
          handleCreatePost={handleCreatePost}
          onChange={onTextChange}
          loading={loading}
        />
      )}

      {selectedTab === "Images" && (
        <ImageUpload
          selectedFile={selectedFile}
          onSelectImage={onSelectFile}
          setSelectedTab={setSelectedTab}
          setSelectedFile={setSelectedFile}
        />
      )}
    </Flex>
  );
};

export default PostBody;
