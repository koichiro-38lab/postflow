import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    async rewrites() {
        return [
            {
                source: "/api/:path*",
                destination: "http://backend:8080/api/:path*",
            },
            {
                source: "/media/:path*",
                destination: "http://minio:9000/media/:path*",
            },
        ];
    },
    images: {
        remotePatterns: [
            {
                protocol: "http",
                hostname: "localhost",
                port: "3200",
                pathname: "/media/**",
            },
            {
                protocol: "http",
                hostname: "host.docker.internal",
                port: "9000",
                pathname: "/**",
            },
            {
                protocol: "http",
                hostname: "minio",
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
                hostname: "localhost",
                port: "9100",
                pathname: "/**",
            },
            {
                protocol: "http",
                hostname: "100.118.151.11",
                port: "9000",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "demo.postflow.work",
                pathname: "/media/**",
            },
        ],
    },
};

export default nextConfig;
