import type { NextConfig } from "next";

const projectRoot = process.cwd();

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },
  async rewrites() {
    // Proxy to local backend in development, production backend otherwise.
    const isDev = process.env.NODE_ENV === 'development';
    const destination = isDev
      ? 'http://127.0.0.1:5006'
      : 'https://api.powerfrill.com';

    return [
      {
        source: '/api/v1/:path*',
        destination: `${destination}/api/v1/:path*`,
      },
      {
        source: '/socket.io/:path*',
        destination: `${destination}/socket.io/:path*`,
      }
    ];
  },
};

export default nextConfig;
