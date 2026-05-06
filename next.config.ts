import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Avoid picking a parent folder (e.g. Desktop) when another lockfile exists nearby.
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  outputFileTracingRoot: projectRoot,
};

export default nextConfig;
