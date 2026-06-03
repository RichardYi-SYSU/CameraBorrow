import { NextResponse } from "next/server";

import { listDevices } from "@/lib/demo-store";

export async function GET() {
  const devices = await listDevices();
  return NextResponse.json({ devices });
}
