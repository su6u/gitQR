import {
  type ContributionDay,
  type ContributionGrid,
  type ContributionLevel,
  colorForLevel,
  EMPTY_CONTRIBUTION_DAY,
  GITHUB_CONTRIBUTION_COLORS,
  levelFromEnum,
} from "@/lib/contributions";

const GRAPHQL_ENDPOINT = "https://api.github.com/graphql";

const CONTRIBUTIONS_QUERY = `
  query ($username: String!) {
    user(login: $username) {
      contributionsCollection {
        contributionCalendar {
          colors
          weeks {
            contributionDays {
              date
              contributionCount
              contributionLevel
              color
            }
          }
        }
      }
    }
  }
`;

interface GraphQLWeek {
  contributionDays: Array<{
    date: string;
    contributionCount: number;
    contributionLevel: string;
    color: string;
  }>;
}

interface GraphQLResponse {
  data?: {
    user?: {
      contributionsCollection?: {
        contributionCalendar?: {
          colors?: string[];
          weeks?: GraphQLWeek[];
        };
      };
    };
  };
  errors?: Array<{ message: string }>;
}

function dayFromGraphQL(
  day: GraphQLWeek["contributionDays"][number],
  palette: readonly string[],
): ContributionDay {
  const level = levelFromEnum(day.contributionLevel);
  return {
    date: day.date,
    count: day.contributionCount,
    level,
    color: day.color || colorForLevel(level, palette),
  };
}

function gridFromGraphQLWeeks(
  weeks: GraphQLWeek[],
  palette: readonly string[],
): ContributionGrid {
  return weeks.map((week) =>
    week.contributionDays.map((day) => dayFromGraphQL(day, palette)),
  );
}

export async function fetchContributionsGraphQL(
  username: string,
  token: string,
): Promise<ContributionGrid> {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: CONTRIBUTIONS_QUERY,
      variables: { username },
    }),
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`GitHub GraphQL failed (${response.status})`);
  }

  const payload = (await response.json()) as GraphQLResponse;
  if (payload.errors?.length) {
    throw new Error(payload.errors[0]?.message ?? "GraphQL error");
  }

  const calendar =
    payload.data?.user?.contributionsCollection?.contributionCalendar;
  if (!calendar?.weeks?.length) {
    throw new Error("User not found or contributions unavailable");
  }

  const palette = calendar.colors?.length
    ? calendar.colors
    : GITHUB_CONTRIBUTION_COLORS;

  return gridFromGraphQLWeeks(calendar.weeks, palette);
}

const CELL_REGEX =
  /id="contribution-day-component-(\d+)-(\d+)"[^>]*data-date="(\d{4}-\d{2}-\d{2})"[^>]*data-level="(\d)"|data-date="(\d{4}-\d{2}-\d{2})"[^>]*id="contribution-day-component-(\d+)-(\d+)"[^>]*data-level="(\d)"/g;

function levelFromScrape(value: string): ContributionLevel {
  const n = Number.parseInt(value, 10);
  if (n >= 0 && n <= 4) return n as ContributionLevel;
  return 0;
}

/** Parse the public /users/{username}/contributions HTML table (no token). */
export async function fetchContributionsScrape(
  username: string,
): Promise<ContributionGrid> {
  const response = await fetch(
    `https://github.com/users/${encodeURIComponent(username)}/contributions`,
    {
      headers: {
        Accept: "text/html",
        "User-Agent": "GitQR",
      },
      next: { revalidate: 3600 },
    },
  );

  if (!response.ok) {
    throw new Error(`GitHub profile not found (${response.status})`);
  }

  const html = await response.text();
  const byKey = new Map<string, ContributionDay>();
  let maxWeek = 0;

  for (const match of html.matchAll(CELL_REGEX)) {
    const dayRow = Number.parseInt(match[1] ?? match[6] ?? "", 10);
    const weekCol = Number.parseInt(match[2] ?? match[7] ?? "", 10);
    const date = match[3] ?? match[5];
    const levelRaw = match[4] ?? match[8];
    if (
      !date ||
      !levelRaw ||
      Number.isNaN(dayRow) ||
      Number.isNaN(weekCol) ||
      dayRow < 0 ||
      dayRow > 6
    ) {
      continue;
    }

    const key = `${weekCol}-${dayRow}`;
    if (byKey.has(key)) continue;

    const level = levelFromScrape(levelRaw);
    byKey.set(key, {
      date,
      count: 0,
      level,
      color: colorForLevel(level),
    });
    maxWeek = Math.max(maxWeek, weekCol);
  }

  if (byKey.size === 0) {
    throw new Error("Could not parse contribution graph");
  }

  const weeks: ContributionGrid = Array.from(
    { length: maxWeek + 1 },
    (_, weekCol) =>
      Array.from({ length: 7 }, (_, dayRow) => {
        return byKey.get(`${weekCol}-${dayRow}`) ?? EMPTY_CONTRIBUTION_DAY;
      }),
  );

  return weeks;
}

export async function fetchContributions(
  username: string,
): Promise<ContributionGrid> {
  const token = process.env.GITHUB_TOKEN;
  if (token) {
    try {
      return await fetchContributionsGraphQL(username, token);
    } catch {
      // Fall through to scrape when GraphQL fails (rate limit, etc.)
    }
  }

  return fetchContributionsScrape(username);
}

export function githubUsernameFromUrl(url: string): string {
  const segments = new URL(url).pathname.split("/").filter(Boolean);
  const username = segments[0];
  if (!username) {
    throw new Error("Missing GitHub username in URL");
  }
  return username;
}

export function isValidContributionGrid(grid: ContributionGrid): boolean {
  return grid.length > 0 && grid.every((week) => week.length === 7);
}

export function padContributionGrid(grid: ContributionGrid): ContributionGrid {
  if (!grid.length) return grid;

  return grid.map((week) => {
    const padded = [...week];
    while (padded.length < 7) {
      padded.push(EMPTY_CONTRIBUTION_DAY);
    }
    return padded.slice(0, 7);
  });
}
