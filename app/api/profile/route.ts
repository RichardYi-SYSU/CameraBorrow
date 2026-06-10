import { NextResponse } from "next/server";

import { getProfileOverview } from "@/lib/demo-store";

export async function GET() {
  const overview = await getProfileOverview();
  return NextResponse.json(overview);
}
