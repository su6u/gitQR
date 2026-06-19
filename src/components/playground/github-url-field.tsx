"use client";

import { Link2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { InputField, InputGroup } from "@/components/ui/input-group";
import { fontWeights } from "@/lib/font-weight";
import { validateGithubUrl } from "@/lib/github-url";

export function GithubUrlField({
  onSubmit,
  loading = false,
}: {
  onSubmit?: (url: string) => void;
  loading?: boolean;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [touched, setTouched] = useState(false);
  const runValidation = useCallback((input: string) => {
    const trimmed = input.trim();
    if (!trimmed) {
      setError(undefined);
      return;
    }

    const result = validateGithubUrl(trimmed);
    if (result.valid) {
      setError(undefined);
      return;
    }
    setError(result.error);
  }, []);

  const handleChange = (next: string) => {
    setValue(next);
    if (!next.trim()) {
      setError(undefined);
      setTouched(false);
      return;
    }
    setTouched(true);
    runValidation(next);
  };

  const handleBlur = () => {
    if (!value.trim()) {
      setError(undefined);
      setTouched(false);
      return;
    }
    setTouched(true);
    runValidation(value);
  };

  const canSubmit = useMemo(() => {
    if (loading) return false;
    const trimmed = value.trim();
    if (!trimmed) return false;
    return validateGithubUrl(trimmed).valid;
  }, [value, loading]);

  const handleSubmit = () => {
    if (!canSubmit) return;

    setTouched(true);
    const result = validateGithubUrl(value);
    if (!result.valid) {
      setError(result.error);
      return;
    }

    setError(undefined);
    setValue(result.url);
    onSubmit?.(result.url);
  };

  return (
    <InputGroup className="w-full gap-2">
      <InputField
        index={0}
        label="GitHub URL"
        placeholder="https://github.com/username"
        icon={Link2}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            if (canSubmit) handleSubmit();
          }
        }}
        error={touched ? error : undefined}
        type="url"
        inputMode="url"
        autoComplete="url"
        spellCheck={false}
        aria-label="GitHub profile or repository URL"
        trailing={
          <span className="playground-enter-pill inline-flex shrink-0 rounded-[16px]">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 shrink-0 px-3 text-[12px] text-foreground hover:text-foreground focus-visible:ring-[#FA70B3]/40"
              style={{ fontVariationSettings: fontWeights.medium }}
              disabled={!canSubmit}
              onClick={handleSubmit}
            >
              {loading ? "…" : "enter"}
            </Button>
          </span>
        }
      />
    </InputGroup>
  );
}
