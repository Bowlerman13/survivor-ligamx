/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ["logoeps.com"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "logoeps.com",
        port: "",
        pathname: "/wp-content/uploads/**",
      },
    ],
    unoptimized: true,
  },
}

module.exports = nextConfig
