import type { NextConfig } from "next";
import { Agentation as AgentationStub } from "./src/lib/agentation-stub";

void AgentationStub;

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: isProd
      ? {
          agentation: "./src/lib/agentation-stub.ts",
        }
      : {},
  },
};

export default nextConfig;
