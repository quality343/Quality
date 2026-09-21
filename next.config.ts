import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  /**
   * The Turso/libSQL driver must be loaded at runtime, not bundled.
   *
   * `@libsql/client` reaches its native `libsql` binding through dynamic
   * requires and directory scans, so webpack tries to parse files that are not
   * JavaScript (LICENSE, README.md) and the build fails with
   * "Module parse failed: Unexpected token". Marking these as external keeps
   * the driver out of the bundle, which is also what you want for a native
   * dependency on a serverless runtime.
   */
  serverExternalPackages: ["@prisma/adapter-libsql", "@libsql/client", "libsql"],
};

export default nextConfig;
