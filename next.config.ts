/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 15 uses App Router by default
  // Set port to 3000 to avoid conflicts
  serverExternalPackages: []
}

// Set port for Next.js dev server
process.env.PORT = process.env.PORT || '3000'

module.exports = nextConfig