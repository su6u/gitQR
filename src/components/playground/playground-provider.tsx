"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { scanCopyToastClassNames } from "@/components/ui/sonner";
import type { ContributionGrid } from "@/lib/contributions";
import { githubUsernameFromUrl } from "@/lib/github-contributions";
import { buildStyledQrGrid, type StyledQrGrid } from "@/lib/qr-map";
import { decodeStyledQrGrid, preloadQrDecoders } from "@/lib/qr-decode";

export type ScanStatus = "idle" | "scanning" | "success" | "error";

interface PlaygroundContextValue {
  githubUrl: string | null;
  grid: StyledQrGrid | null;
  loading: boolean;
  error: string | null;
  scanMode: boolean;
  scanStatus: ScanStatus;
  generate: (url: string) => Promise<void>;
  toggleScanMode: () => void;
  exitScanMode: () => void;
  scanQr: () => Promise<void>;
}

const PlaygroundContext = createContext<PlaygroundContextValue | null>(null);

/** Shown on the board before the user submits a URL. Input stays empty. */
const DEMO_GITHUB_URL = "https://github.com/su6u";

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

async function loadStyledGrid(url: string): Promise<StyledQrGrid> {
  const username = githubUsernameFromUrl(url);
  const contributions = await fetchContributionGrid(username);
  return buildStyledQrGrid(url, contributions);
}

function copyTextDuringUserGesture(text: string) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);
  if (!copied) {
    throw new Error("Could not copy");
  }
}

export function PlaygroundProvider({ children }: { children: ReactNode }) {
  const [githubUrl, setGithubUrl] = useState<string | null>(null);
  const [grid, setGrid] = useState<StyledQrGrid | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState(false);
  const [scanStatus, setScanStatus] = useState<ScanStatus>("idle");
  const hasUserSubmittedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const styled = await loadStyledGrid(DEMO_GITHUB_URL);
        if (!cancelled && !hasUserSubmittedRef.current) {
          setGrid(styled);
        }
      } catch {
        // Demo unavailable — board stays empty until user submits.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const resetScanFeedback = useCallback(() => {
    setScanStatus("idle");
  }, []);

  const exitScanMode = useCallback(() => {
    setScanMode(false);
    resetScanFeedback();
  }, [resetScanFeedback]);

  const toggleScanMode = useCallback(() => {
    setScanMode((on) => {
      if (on) {
        resetScanFeedback();
      } else {
        preloadQrDecoders();
      }
      return !on;
    });
  }, [resetScanFeedback]);

  const generate = useCallback(async (url: string) => {
    hasUserSubmittedRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const styled = await loadStyledGrid(url);
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

  const scanQr = useCallback(async () => {
    if (!grid) {
      setScanStatus("error");
      toast.error("Generate a QR first", { icon: null });
      return;
    }

    setScanStatus("scanning");

    try {
      const { url } = await decodeStyledQrGrid(grid);

      try {
        await navigator.clipboard.writeText(url);
      } catch {
        copyTextDuringUserGesture(url);
      }

      setScanStatus("success");
      toast.success(url, {
        icon: null,
        classNames: scanCopyToastClassNames,
      });
    } catch (err) {
      setScanStatus("error");
      toast.error(
        err instanceof Error ? err.message : "Could not read this QR",
        { icon: null },
      );
    }
  }, [grid]);

  const value = useMemo(
    () => ({
      githubUrl,
      grid,
      loading,
      error,
      scanMode,
      scanStatus,
      generate,
      toggleScanMode,
      exitScanMode,
      scanQr,
    }),
    [
      githubUrl,
      grid,
      loading,
      error,
      scanMode,
      scanStatus,
      generate,
      toggleScanMode,
      exitScanMode,
      scanQr,
    ],
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
