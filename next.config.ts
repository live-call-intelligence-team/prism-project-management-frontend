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
    // Proxy API calls to the backend running on the same server.
    // VPS: backend runs on port 5002 (default).
    // Local dev: set BACKEND_INTERNAL_URL in .env.development to override.
    const backendUrl = process.env.BACKEND_INTERNAL_URL || 'http://127.0.0.1:5002';

    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendUrl}/api/v1/:path*`,
      },
      {
        source: '/socket.io/:path*',
        destination: `${backendUrl}/socket.io/:path*`,
      }
    ];
  },
};

export default nextConfig;
