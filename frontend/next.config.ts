import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    eslint: { ignoreDuringBuilds: true },   // only disables ESLint in `next build`
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "cdn.your-service.example.com",
                pathname: "/**", // placeholder CDN for public showcase
            },
        ],
    },
};

export default nextConfig;

