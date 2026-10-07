import type { NextConfig } from "next";

// The app is fully client-side, so it can be exported as a static site.
// NEXT_PUBLIC_BASE_PATH is set when it is served from a subpath, such as
// GitHub Pages (/cash-registry).
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
};

export default nextConfig;
