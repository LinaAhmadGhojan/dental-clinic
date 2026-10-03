import type { NextConfig } from "next";

// Static export so the app can be hosted anywhere (shared hosting, GitHub Pages, ...).
// Set NEXT_PUBLIC_BASE_PATH (e.g. "/restaurant-os") to serve it from a sub-folder.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
