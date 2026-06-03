import { promises as fs } from "node:fs";
import path from "node:path";

import type {
  ApplicationRecord,
  ApplicationStatus,
  DemoData,
  Device,
  DeviceStatus,
} from "@/lib/types";

const dataFile = path.join(process.cwd(), "data", "demo-data.json");

const transitionMap: Record<ApplicationStatus, ApplicationStatus[]> = {
  pending: ["approved", "rejected"],
  approved: ["borrowed"],
  borrowed: ["returned_pending_confirm"],
  returned_pending_confirm: ["completed"],
  completed: [],
  rejected: [],
};

const deviceStatusMap: Partial<Record<ApplicationStatus, DeviceStatus>> = {
  pending: "pending",
  approved: "pending",
  borrowed: "borrowed",
  returned_pending_confirm: "borrowed",
  completed: "available",
  rejected: "available",
};

async function readData(): Promise<DemoData> {
  const raw = await fs.readFile(dataFile, "utf8");
  return JSON.parse(raw) as DemoData;
}

async function writeData(data: DemoData): Promise<void> {
  await fs.writeFile(dataFile, JSON.stringify(data, null, 2), "utf8");
}

function nowIso(): string {
  return new Date().toISOString();
}

function getDeviceStatusFromApplications(
  deviceId: string,
  applications: ApplicationRecord[],
): DeviceStatus {
  const activeStatuses: ApplicationStatus[] = [
    "borrowed",
    "returned_pending_confirm",
    "approved",
    "pending",
  ];

  for (const status of activeStatuses) {
    const hasActive = applications.some(
      (application) =>
        application.deviceId === deviceId && application.status === status,
    );

    if (hasActive) {
      return deviceStatusMap[status] ?? "available";
    }
  }

  return "available";
}

async function syncDeviceStatuses(data: DemoData): Promise<DemoData> {
  const devices = data.devices.map((device) => ({
    ...device,
    status: getDeviceStatusFromApplications(device.id, data.applications),
  }));

  return { ...data, devices };
}

export async function listDevices(): Promise<Device[]> {
  const data = await syncDeviceStatuses(await readData());
  return data.devices;
}

export async function listApplications(): Promise<ApplicationRecord[]> {
  const data = await readData();
  return data.applications.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createApplication(input: {
  deviceId: string;
  userName: string;
  purpose: string;
  borrowDate: string;
  returnDate: string;
}): Promise<ApplicationRecord> {
  const data = await readData();
  const device = data.devices.find((item) => item.id === input.deviceId);

  if (!device) {
    throw new Error("设备不存在");
  }

  if (getDeviceStatusFromApplications(device.id, data.applications) !== "available") {
    throw new Error("当前设备不可申请");
  }

  const timestamp = nowIso();
  const application: ApplicationRecord = {
    id: `APP-${Date.now()}`,
    status: "pending",
    createdAt: timestamp,
    updatedAt: timestamp,
    ...input,
  };

  const nextData = await syncDeviceStatuses({
    devices: data.devices,
    applications: [application, ...data.applications],
  });

  await writeData(nextData);
  return application;
}

export async function updateApplicationStatus(
  id: string,
  nextStatus: ApplicationStatus,
): Promise<ApplicationRecord> {
  const data = await readData();
  const application = data.applications.find((item) => item.id === id);

  if (!application) {
    throw new Error("申请记录不存在");
  }

  const allowed = transitionMap[application.status];
  if (!allowed.includes(nextStatus)) {
    throw new Error("当前状态不允许执行该操作");
  }

  application.status = nextStatus;
  application.updatedAt = nowIso();

  const nextData = await syncDeviceStatuses(data);
  await writeData(nextData);
  return application;
}
