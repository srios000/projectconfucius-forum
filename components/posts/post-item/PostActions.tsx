"use client";
import { MessageSquare, Share2, Bookmark, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

type Props = {
  handleDelete: (e: React.MouseEvent<HTMLButtonElement>) => void;
  loadingDelete: boolean;
  userIsCreator: boolean;
  userIsAdmin?: boolean;
  postLink: string;
  handleSave: (e: React.MouseEvent<HTMLButtonElement>) => void;
  isSaved: boolean;
  showToast: (args: { title: string; description?: string; status: "success" | "error" | "warning" | "info" }) => void;
};

export default function PostActions({
  handleDelete, loadingDelete, userIsCreator, userIsAdmin,
  postLink, handleSave, isSaved, showToast,
}: Props) {
  const router = useRouter();
  return (
    <div className="flex items-center gap-1 mt-2 text-[11px] text-muted-foreground font-semibold">
      <button
        onClick={(e) => {
          e.stopPropagation();
          router.push(`${postLink}#reply`);
        }}
        className="px-2 py-1 rounded hover:bg-muted hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
      >
        <MessageSquare className="size-3.5" /> Comment
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigator.clipboard.writeText(postLink);
          showToast({ title: "Link copied", status: "success" });
        }}
        className="px-2 py-1 rounded hover:bg-muted hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
      >
        <Share2 className="size-3.5" /> Share
      </button>
      <button
        onClick={handleSave}
        className={
          "px-2 py-1 rounded hover:bg-muted inline-flex items-center gap-1.5 transition-colors " +
          (isSaved ? "text-primary" : "hover:text-foreground")
        }
      >
        <Bookmark className={"size-3.5 " + (isSaved ? "fill-current" : "")} />
        {isSaved ? "Saved" : "Save"}
      </button>
      {(userIsCreator || userIsAdmin) && (
        <button
          disabled={loadingDelete}
          onClick={handleDelete}
          className="px-2 py-1 rounded hover:bg-destructive/10 hover:text-destructive inline-flex items-center gap-1.5 transition-colors"
        >
          <Trash2 className="size-3.5" /> Delete
        </button>
      )}
    </div>
  );
}

