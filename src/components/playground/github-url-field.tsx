"use client";

import { Link2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { InputField, InputGroup } from "@/components/ui/input-group";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const handleSubmit = () => {
    if (loading) return;

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
            handleSubmit();
          }
        }}
        error={touched ? error : undefined}
        type="url"
        inputMode="url"
        autoComplete="url"
        spellCheck={false}
        aria-label="GitHub profile or repository URL"
        trailing={
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="h-7 shrink-0 px-3 text-[12px] text-foreground [&_span]:bg-brand [&_span]:group-hover:bg-brand-hover [&_span]:group-active:bg-brand-hover"
            disabled={!mounted || !value.trim() || loading}
            onClick={handleSubmit}
          >
            {loading ? "…" : "enter"}
          </Button>
        }
      />
    </InputGroup>
  );
}
