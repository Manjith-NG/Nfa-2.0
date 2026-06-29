import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfkit", "fontkit"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
    optimizePackageImports: ["lucide-react", "recharts"],
    /** Fewer parallel prerender workers → fewer DB connections during `next build` on Render. */
    staticGenerationMaxConcurrency: 1,
  },
};

export default nextConfig;
