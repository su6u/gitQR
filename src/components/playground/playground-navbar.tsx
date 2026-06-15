import type { CSSProperties } from "react";
import { GithubIcon } from "@/components/icons/github-icon";
import { QuestionMarkIcon } from "@/components/icons/question-mark-icon";
import { cn } from "@/lib/utils";

const GITHUB_REPO_URL = "https://github.com/su6u/git-qr";

const navLinkClass =
  "inline-flex h-9 items-center gap-1.5 rounded-[20px] px-4 text-[13px] text-foreground outline-none transition-colors duration-80 bg-playground-surface ring-1 ring-black/[0.08] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_6px_20px_rgba(0,0,0,0.05)] hover:bg-playground-control active:bg-playground-track focus-visible:ring-1 focus-visible:ring-brand";

export function PlaygroundNavbar({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <nav
      className={cn("flex items-center gap-2", className)}
      style={style}
      aria-label="Site links"
    >
      <a
        href={GITHUB_REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={navLinkClass}
      >
        <GithubIcon size={16} />
        Give a star
      </a>
      <button type="button" className={navLinkClass}>
        <QuestionMarkIcon size={16} />
        How it works
      </button>
    </nav>
  );
}
