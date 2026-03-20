/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["three"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    NEXT_PUBLIC_ASSET_URL: "https://studymetervideos.s3.ap-northeast-1.amazonaws.com/entity",
  },
};

export default nextConfig;