/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: process.env.GITHUB_ACTIONS ? '/hinote-transcription-formatter' : '',
  assetPrefix: process.env.GITHUB_ACTIONS ? '/hinote-transcription-formatter' : '',
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig