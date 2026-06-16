import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This project is self-contained; pin the workspace root so a parent
  // lockfile (e.g. while nested under another repo) doesn't confuse Turbopack.
  turbopack: { root: import.meta.dirname },
  // Allow phones/iPads on the local network to load the dev server.
  // Development only — Vercel ignores this. Add your machine's LAN IP if needed.
  allowedDevOrigins: [],
};

export default nextConfig;
