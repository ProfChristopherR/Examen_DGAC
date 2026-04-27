/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/Examen_DGAC',
  assetPrefix: '/Examen_DGAC/',
  distDir: 'dist',
  productionBrowserSourceMaps: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;
