"use client";

import React from "react";
import Link from "next/link";
import { LuTrash } from "react-icons/lu";
import { FaReddit } from "react-icons/fa";
import useSavedPosts from "@/hooks/posts/useSavedPosts";
import { Button } from "@/components/ui/button";

export default function SavedPostsList() {
  const { savedPosts, onRemoveSavedPost } = useSavedPosts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">Saved Posts</h1>
        <p className="text-xs text-muted-foreground mt-1">Your bookmarked discussions and threads.</p>
      </div>

      <div className="space-y-3">
        {savedPosts.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-xl">
            <p className="text-sm text-muted-foreground">No saved posts yet.</p>
          </div>
        ) : (
          savedPosts.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:border-primary/40 hover:bg-muted/10 transition-all duration-200"
            >
              <div className="flex items-center gap-3 min-w-0">
                {item.communityImageUrl ? (
                  <img
                    src={item.communityImageUrl}
                    className="size-10 rounded-full object-cover shrink-0 border border-border"
                    alt="Community avatar"
                  />
                ) : (
                  <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <FaReddit className="size-6 text-primary" />
                  </div>
                )}
                <div className="min-w-0 space-y-0.5">
                  <Link
                    href={`/c/${item.communityId}/posts/${item.postId}`}
                    className="block font-semibold text-sm hover:underline hover:text-primary transition-colors truncate"
                  >
                    {item.postTitle}
                  </Link>
                  <Link
                    href={`/c/${item.communityId}`}
                    className="inline-block text-xs text-muted-foreground hover:underline"
                  >
                    c/{item.communityId}
                  </Link>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                onClick={() => onRemoveSavedPost(item.postId)}
                aria-label="Remove saved post"
              >
                <LuTrash className="size-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
