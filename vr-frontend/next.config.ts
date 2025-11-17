import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "clothing-images-vrc-4107.s3.us-east-1.amazonaws.com",
      "clothing-images-vrc-4107.s3.us-east-2.amazonaws.com"
    ],
  },
};

export default nextConfig;
