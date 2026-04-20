/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/Examen_DGAC',
  assetPrefix: '/Examen_DGAC/',
  distDir: process.env.NEXT_DIST_DIR || '.next',
  productionBrowserSourceMaps: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;
