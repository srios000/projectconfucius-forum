import { Metadata } from "next";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Circus Discussions",
  description: "A discussion platform",
};

/**
 * Root layout wiring global providers and metadata for the App Router.
 * @param children - Route content to render inside the provider tree.
 * @returns HTML scaffold with Providers applied to the body.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
