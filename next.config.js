/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'export',
  images: {
    unoptimized: true,
  },
  // GitHub Pages serves from a subdirectory if not using custom domain
  // Remove basePath if using custom domain (aarshj.me)
  // basePath: '/repository-name',
  trailingSlash: true,
}

module.exports = nextConfig
