const GITHUB_HTTPS_PREFIX = "https://github.com/";
const GITHUB_HOST = "github.com";

export type GithubUrlValidationResult =
  | { valid: true; url: string }
  | { valid: false; error: string };

function emptyError(): GithubUrlValidationResult {
  return { valid: false, error: "Enter a GitHub URL" };
}

function prefixError(): GithubUrlValidationResult {
  return {
    valid: false,
    error: "Only https://github.com/ URLs are accepted",
  };
}

/** Validates that a URL is an https://github.com/ link with a path segment */
export function validateGithubUrl(input: string): GithubUrlValidationResult {
  const trimmed = input.trim();

  if (!trimmed) {
    return emptyError();
  }

  if (!trimmed.startsWith(GITHUB_HTTPS_PREFIX)) {
    return prefixError();
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, error: "Enter a valid URL" };
  }

  if (parsed.protocol !== "https:" || parsed.hostname !== GITHUB_HOST) {
    return prefixError();
  }

  const pathSegments = parsed.pathname.split("/").filter(Boolean);
  if (pathSegments.length === 0) {
    return {
      valid: false,
      error: "Add a username or repository after github.com/",
    };
  }

  const normalized = `${GITHUB_HTTPS_PREFIX}${pathSegments.join("/")}`;

  return { valid: true, url: normalized };
}

export function isGithubUrl(input: string): boolean {
  return validateGithubUrl(input).valid;
}
