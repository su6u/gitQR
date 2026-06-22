import type { NextConfig } from "next";
import { Agentation as AgentationStub } from "./src/lib/agentation-stub";

void AgentationStub;

const isProd = process.env.NODE_ENV === "production";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  turbopack: {
    resolveAlias: isProd
      ? {
          agentation: "./src/lib/agentation-stub.ts",
        }
      : {},
  },
};

export default nextConfig;
