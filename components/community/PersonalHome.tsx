import useCallCreatePost from "@/hooks/posts/useCallCreatePost";
import React, { useState } from "react";
import CreateCommunityModal from "../modal/create-community/CreateCommunityModal";
import { Button } from "@/components/ui/button";

/**
 * A sidebar card that provides quick actions for the user's personal home feed.
 * Allows users to initiate post creation or open the community creation modal.
 * @returns A themed card with action buttons for home feed management.
 */
const PersonalHome: React.FC = () => {
  const [open, setOpen] = useState(false); // modal initially closed

  const { onClick } = useCallCreatePost();

  return (
    <>
      <CreateCommunityModal open={open} handleClose={() => setOpen(false)} />
      <div className="flex flex-col bg-card rounded-xl border border-border sticky shadow-md overflow-hidden">
        <div
          className="h-[34px] rounded-t-xl bg-cover bg-center bg-blue-500"
          style={{ backgroundImage: "url(/images/banners/small.jpg)" }}
        />
        <div className="flex flex-col p-3">
          <div className="flex items-center mb-2">
            <img
              src="/images/logo.svg"
              className="h-[50px] mr-2"
              alt="Website logo"
            />
            <span className="font-semibold text-sm">Home</span>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-xs text-muted-foreground">
              Home page personalized based on your subscribed communities.
            </p>
            <Button size="sm" onClick={onClick} className="h-8">
              Create Post
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(true)}
              className="h-8"
            >
              Create Community
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
export default PersonalHome;
