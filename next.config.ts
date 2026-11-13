import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  outputFileTracingIncludes: {
    '/api/cron/audits': ['./src/mocks/**/*', './src/crawlers/**/*'],
    '/api/audit/**/*': ['./src/mocks/**/*', './src/crawlers/**/*'],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
