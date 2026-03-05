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
    // Both frontend and backend run on the same server.
    // The backend runs on port 5006 (configured in backend/.env).
    const backendUrl = process.env.BACKEND_INTERNAL_URL || 'http://127.0.0.1:5006';

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
