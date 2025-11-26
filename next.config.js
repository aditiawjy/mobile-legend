/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Warning: This allows production builds with ESLint errors.
    // TODO: Fix lint errors and remove this option
    ignoreDuringBuilds: true,
  },
  // Removed rewrites to allow Next.js API routes to work
};

module.exports = nextConfig;
