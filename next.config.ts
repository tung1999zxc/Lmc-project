import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  /* config options here */
};
module.exports = {
  eslint: {
    // Nếu được đặt thành true, ESLint sẽ bị bỏ qua trong quá trình build
    ignoreDuringBuilds: true,
  },
};
export default nextConfig;
