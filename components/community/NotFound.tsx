import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * Friendly empty state shown when a community id is invalid.
 * @returns Message with links back to home and discovery.
 */
const CommunityNotFound: React.FC = () => {
  return (
    <div className="flex flex-col justify-center items-center min-h-[60vh] p-4 text-center">
      <h1 className="text-2xl font-bold text-muted-foreground">
        Sorry, this community does not exist!
      </h1>
      <div className="flex flex-row gap-4 mt-6">
        <Button asChild className="w-[150px]">
          <Link href="/">Home</Link>
        </Button>
        <Button asChild variant="outline" className="w-[150px]">
          <Link href="/communities">All Communities</Link>
        </Button>
      </div>
    </div>
  );
};

export default CommunityNotFound;
