import { NextResponse } from "next/server";

import { listCurrentUserApplications } from "@/lib/demo-store";

export async function GET() {
  const applications = await listCurrentUserApplications();
  return NextResponse.json({ applications });
}
