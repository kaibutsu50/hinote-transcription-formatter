/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: process.env.NODE_ENV === 'production' ? '/hinote' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/hinote' : '',
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig