import { NextResponse } from "next/server";

/**
 * GET /api/health
 *
 * Health check endpoint used by uptime monitors and deployment checks.
 * Returns HTTP 200 with a JSON body when the server is running.
 * No authentication required.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? "1.0.0",
      environment: process.env.NODE_ENV,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
