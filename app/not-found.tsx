import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";

/**
 * The default 404 error page for the application.
 * Displayed when a user navigates to a non-existent route.
 * Provides helpful links to return to the home page or browse communities.
 * @returns A centered error message with navigation options.
 */
const PageNotFound: React.FC = () => {
  return (
    <div className="flex flex-col justify-center items-center min-h-[60vh] p-4 text-center">
      <h1 className="text-2xl font-bold text-muted-foreground">
        Sorry, this page does not exist!
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

export default PageNotFound;
