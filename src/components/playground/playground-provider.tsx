"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ContributionGrid } from "@/lib/contributions";
import { githubUsernameFromUrl } from "@/lib/github-contributions";
import { buildStyledQrGrid, type StyledQrGrid } from "@/lib/qr-map";

interface PlaygroundContextValue {
  githubUrl: string | null;
  grid: StyledQrGrid | null;
  loading: boolean;
  error: string | null;
  generate: (url: string) => Promise<void>;
}

const PlaygroundContext = createContext<PlaygroundContextValue | null>(null);

async function fetchContributionGrid(
  username: string,
): Promise<ContributionGrid> {
  const response = await fetch(
    `/api/contributions?username=${encodeURIComponent(username)}`,
  );
  const payload = (await response.json()) as {
    weeks?: ContributionGrid;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error ?? "Failed to load contributions");
  }

  if (!payload.weeks?.length) {
    throw new Error("No contribution data returned");
  }

  return payload.weeks;
}

export function PlaygroundProvider({ children }: { children: ReactNode }) {
  const [githubUrl, setGithubUrl] = useState<string | null>(null);
  const [grid, setGrid] = useState<StyledQrGrid | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (url: string) => {
    setLoading(true);
    setError(null);

    try {
      const username = githubUsernameFromUrl(url);
      const contributions = await fetchContributionGrid(username);
      const styled = await buildStyledQrGrid(url, contributions);
      setGithubUrl(url);
      setGrid(styled);
    } catch (err) {
      setGrid(null);
      setGithubUrl(null);
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({ githubUrl, grid, loading, error, generate }),
    [githubUrl, grid, loading, error, generate],
  );

  return (
    <PlaygroundContext.Provider value={value}>
      {children}
    </PlaygroundContext.Provider>
  );
}

export function usePlayground() {
  const ctx = useContext(PlaygroundContext);
  if (!ctx) {
    throw new Error("usePlayground must be used within PlaygroundProvider");
  }
  return ctx;
}
