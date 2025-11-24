import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "prtsihtqnbsdpfgaxxkc.supabase.co",
        pathname: "/storage/v1/object/public/raffles/**",
      },
      {
        protocol: "https",
        hostname: "prtsihtqnbsdpfgaxxkc.supabase.co",
        pathname: "/storage/v1/object/sign/raffles/**",
      },
    ],
  },
};

export default nextConfig;
