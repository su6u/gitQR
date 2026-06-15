import { NextResponse } from "next/server";
import {
  fetchContributions,
  padContributionGrid,
} from "@/lib/github-contributions";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username")?.trim();

  if (
    !username ||
    !/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(username)
  ) {
    return NextResponse.json(
      { error: "Valid GitHub username required" },
      { status: 400 },
    );
  }

  try {
    const grid = padContributionGrid(await fetchContributions(username));
    return NextResponse.json({ username, weeks: grid });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch contributions";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
