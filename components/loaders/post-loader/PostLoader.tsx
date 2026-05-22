import React from "react";
import PostLoaderItem from "./PostLoaderItem";

const PostLoader: React.FC = () => {
  return (
    <div className="space-y-6">
      <PostLoaderItem height="200px" />
      <PostLoaderItem height="50px" />
    </div>
  );
};

export default PostLoader;

