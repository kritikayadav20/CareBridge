import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Allow unsafe-eval for Recharts (required for chart rendering)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "script-src 'self' 'unsafe-eval' 'unsafe-inline'; object-src 'none';",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
