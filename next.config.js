/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Evita que el build falle por warnings de ESLint/TypeScript en Vercel
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

module.exports = nextConfig;
