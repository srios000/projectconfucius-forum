import { Button } from "@/components/ui/button";

export default function AuthButtons() {
  return (
    <>
      <Button asChild variant="outline" size="sm">
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/api/auth/start">Log in</a>
      </Button>
      <Button asChild size="sm">
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/api/auth/start">Sign up</a>
      </Button>
    </>
  );
}
