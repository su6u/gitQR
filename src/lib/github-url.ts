const GITHUB_HTTPS_PREFIX = "https://github.com/";
const GITHUB_HOST = "github.com";
const GITHUB_USERNAME_PATTERN =
  /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;

export { GITHUB_USERNAME_PATTERN };

export type GithubUrlValidationResult =
  | { valid: true; url: string }
  | { valid: false; error: string };

function emptyError(): GithubUrlValidationResult {
  return { valid: false, error: "Enter a GitHub URL" };
}

function normalizeInput(input: string): string {
  if (isValidGithubUsername(input)) {
    return `${GITHUB_HTTPS_PREFIX}${input}`;
  }

  const lower = input.toLowerCase();
  if (
    lower === GITHUB_HOST ||
    lower.startsWith(`${GITHUB_HOST}/`) ||
    lower === `www.${GITHUB_HOST}` ||
    lower.startsWith(`www.${GITHUB_HOST}/`)
  ) {
    return `https://${input}`;
  }
  return input;
}

function normalizedGithubHost(hostname: string): string {
  return hostname.toLowerCase().replace(/^www\./, "");
}

export function isValidGithubUsername(username: string): boolean {
  return GITHUB_USERNAME_PATTERN.test(username);
}

/** Validates and normalizes GitHub profile URLs to https://github.com/{user}. */
export function validateGithubUrl(input: string): GithubUrlValidationResult {
  const trimmed = input.trim();

  if (!trimmed) {
    return emptyError();
  }

  let parsed: URL;
  try {
    parsed = new URL(normalizeInput(trimmed));
  } catch {
    return { valid: false, error: "Enter a valid URL" };
  }

  if (
    (parsed.protocol !== "https:" && parsed.protocol !== "http:") ||
    normalizedGithubHost(parsed.hostname) !== GITHUB_HOST
  ) {
    return { valid: false, error: "Use https://github.com/username" };
  }

  const pathSegments = parsed.pathname.split("/").filter(Boolean);
  if (pathSegments.length === 0) {
    return {
      valid: false,
      error: "Add a username after github.com/",
    };
  }

  if (pathSegments.length > 1) {
    return {
      valid: false,
      error: "Use a GitHub profile URL, not a repository",
    };
  }

  const username = pathSegments[0];
  if (!username || !isValidGithubUsername(username)) {
    return { valid: false, error: "Enter a valid GitHub username" };
  }

  const normalized = `${GITHUB_HTTPS_PREFIX}${username}`;

  return { valid: true, url: normalized };
}

export function isGithubUrl(input: string): boolean {
  return validateGithubUrl(input).valid;
}

export function githubUsernameFromUrl(url: string): string {
  const result = validateGithubUrl(url);
  if (!result.valid) {
    throw new Error(result.error);
  }

  return new URL(result.url).pathname.slice(1);
}

if (import.meta.main) {
  console.assert(validateGithubUrl("su6u").valid);
  console.assert(validateGithubUrl("github.com/su6u").valid);
  console.assert(
    validateGithubUrl("https://github.com/su6u/GitQR").valid === false,
  );
}
