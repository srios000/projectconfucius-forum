import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/community/:communityId",
        destination: "/c/:communityId",
        permanent: true, // 308
      },
      {
        source: "/community/:communityId/comments/:pid",
        destination: "/c/:communityId/posts/:pid",
        permanent: true,
      },
      {
        source: "/community/:communityId/submit",
        destination: "/c/:communityId", // composer is inline; no submit page
        permanent: true,
      },
    ];
  },
};

export default config;
