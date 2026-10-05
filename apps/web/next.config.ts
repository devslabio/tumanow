import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const turbopackRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  turbopack: {
    root: turbopackRoot,
  },
};

export default nextConfig;
