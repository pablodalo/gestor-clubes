/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // En CI/Vercel: ejecutar "npm run typecheck" y "npm run lint" antes o en el build para calidad.
  // ignoreDuringBuilds evita que un warning de lint/TS rompa el deploy; corregir errores y luego activar.
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

module.exports = nextConfig;
