import { NextRequest, NextResponse } from "next/server";

import { createApplication, listApplications } from "@/lib/demo-store";

export async function GET() {
  const applications = await listApplications();
  return NextResponse.json({ applications });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      deviceId?: string;
      userName?: string;
      purpose?: string;
      borrowDate?: string;
      returnDate?: string;
    };

    if (
      !body.deviceId ||
      !body.userName ||
      !body.purpose ||
      !body.borrowDate ||
      !body.returnDate
    ) {
      return NextResponse.json({ error: "表单信息不完整" }, { status: 400 });
    }

    const application = await createApplication({
      deviceId: body.deviceId,
      userName: body.userName,
      purpose: body.purpose,
      borrowDate: body.borrowDate,
      returnDate: body.returnDate,
    });

    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "创建申请失败";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
