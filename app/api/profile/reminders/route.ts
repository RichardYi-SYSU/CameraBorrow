import { NextResponse } from "next/server";

import { listCurrentUserReminders } from "@/lib/demo-store";

export async function GET() {
  const reminders = await listCurrentUserReminders();
  return NextResponse.json({ reminders });
}
