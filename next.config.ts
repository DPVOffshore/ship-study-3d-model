import type { NextConfig } from 'next';

// Static export: `npm run build` writes a fully static site to /out that any host (Vercel, Netlify, S3, nginx) can serve.
// BASE_PATH lets it live under a sub-path, e.g. GitHub Pages at /<repo>/ (set by .github/workflows/deploy.yml).
const basePath = process.env.BASE_PATH || '';

const nextConfig: NextConfig = {
  output: 'export',
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};
export default nextConfig;
