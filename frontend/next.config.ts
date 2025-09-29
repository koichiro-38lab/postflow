import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "http",
                hostname: "host.docker.internal",
                port: "9000",
                pathname: "/**",
            },
            {
                protocol: "http",
                hostname: "localhost",
                port: "9000",
                pathname: "/**",
            },
            {
                protocol: "http",
                hostname: "100.118.151.11",
                port: "9000",
                pathname: "/**",
            },
        ],
    },
};

export default nextConfig;
