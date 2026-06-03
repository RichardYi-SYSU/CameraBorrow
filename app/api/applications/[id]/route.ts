import { NextRequest, NextResponse } from "next/server";

import { updateApplicationStatus } from "@/lib/demo-store";
import type { ApplicationStatus } from "@/lib/types";

const actionMap: Record<string, ApplicationStatus> = {
  approve: "approved",
  reject: "rejected",
  checkout: "borrowed",
  return: "returned_pending_confirm",
  complete: "completed",
};

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as { action?: string };
    const nextStatus = body.action ? actionMap[body.action] : undefined;

    if (!nextStatus) {
      return NextResponse.json({ error: "无效操作" }, { status: 400 });
    }

    const application = await updateApplicationStatus(id, nextStatus);
    return NextResponse.json({ application });
  } catch (error) {
    const message = error instanceof Error ? error.message : "更新状态失败";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
