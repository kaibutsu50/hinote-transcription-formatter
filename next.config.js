/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: process.env.GITHUB_ACTIONS ? '/hinote' : '',
  assetPrefix: process.env.GITHUB_ACTIONS ? '/hinote' : '',
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig