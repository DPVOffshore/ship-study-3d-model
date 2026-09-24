import type { NextConfig } from 'next';

// Static export: `npm run build` writes a fully static site to /out that any host (Vercel, Netlify, S3, nginx) can serve.
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};
export default nextConfig;
