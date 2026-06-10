import { promises as fs } from "node:fs";
import path from "node:path";

import type {
  ApplicationRecord,
  ApplicationStatus,
  DemoData,
  Device,
  DeviceStatus,
  ProfileOverview,
  ProfileStats,
  ReminderRecord,
  ReminderType,
  UserProfile,
} from "@/lib/types";

const dataFile = path.join(process.cwd(), "data", "demo-data.json");

const transitionMap: Record<ApplicationStatus, ApplicationStatus[]> = {
  pending: ["approved", "rejected"],
  approved: ["borrowed"],
  borrowed: ["returned_pending_confirm"],
  overdue: ["returned_pending_confirm"],
  returned_pending_confirm: ["completed", "abnormal_pending"],
  completed: [],
  rejected: [],
  abnormal_pending: [],
};

const deviceStatusMap: Partial<Record<ApplicationStatus, DeviceStatus>> = {
  pending: "pending",
  approved: "pending",
  borrowed: "borrowed",
  overdue: "borrowed",
  returned_pending_confirm: "borrowed",
  abnormal_pending: "borrowed",
  completed: "available",
  rejected: "available",
};

function nowIso(): string {
  return new Date().toISOString();
}

function currentDateInShanghai(): string {
  const formatter = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

async function readData(): Promise<DemoData> {
  const raw = await fs.readFile(dataFile, "utf8");
  return JSON.parse(raw) as DemoData;
}

async function writeData(data: DemoData): Promise<void> {
  await fs.writeFile(dataFile, JSON.stringify(data, null, 2), "utf8");
}

function reminderExists(
  reminders: ReminderRecord[],
  applicationId: string,
  type: ReminderType,
): boolean {
  return reminders.some(
    (reminder) => reminder.applicationId === applicationId && reminder.type === type,
  );
}

function createReminder(
  user: UserProfile,
  application: ApplicationRecord,
  deviceName: string,
  type: ReminderType,
): ReminderRecord {
  const templates: Record<ReminderType, { title: string; content: string }> = {
    approved: {
      title: "申请已通过",
      content: `${deviceName} 的借用申请已通过，请按预约时间到工作室领取设备。`,
    },
    rejected: {
      title: "申请未通过",
      content: `${deviceName} 的借用申请未通过，请查看用途或时间安排后重新提交。`,
    },
    borrowed: {
      title: "设备已借出",
      content: `${deviceName} 已借出，请在 ${application.returnDate} 前归还。`,
    },
    overdue: {
      title: "设备已逾期",
      content: `${deviceName} 已超过预计归还时间，请尽快归还并联系管理员。`,
    },
  };

  return {
    id: `REM-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId: user.id,
    applicationId: application.id,
    type,
    title: templates[type].title,
    content: templates[type].content,
    createdAt: nowIso(),
    readAt: null,
  };
}

function resolveStatus(application: ApplicationRecord, today: string): ApplicationStatus {
  if (application.status === "borrowed" && application.returnDate < today) {
    return "overdue";
  }

  return application.status;
}

function syncDerivedData(data: DemoData): { data: DemoData; changed: boolean } {
  const today = currentDateInShanghai();
  let changed = false;

  const applications = data.applications.map((application) => {
    const resolvedStatus = resolveStatus(application, today);
    if (resolvedStatus !== application.status) {
      changed = true;
      return {
        ...application,
        status: resolvedStatus,
      };
    }

    return application;
  });

  const reminders = [...data.reminders];
  for (const application of applications) {
    if (
      application.status === "overdue" &&
      application.userName === data.currentUser.name &&
      !reminderExists(reminders, application.id, "overdue")
    ) {
      const deviceName =
        data.devices.find((device) => device.id === application.deviceId)?.name ?? application.deviceId;
      reminders.unshift(createReminder(data.currentUser, application, deviceName, "overdue"));
      changed = true;
    }
  }

  const devices = data.devices.map((device) => ({
    ...device,
    status: getDeviceStatusFromApplications(device.id, applications),
  }));

  return {
    data: {
      ...data,
      devices,
      applications,
      reminders,
    },
    changed,
  };
}

async function readSyncedData(): Promise<DemoData> {
  const synced = syncDerivedData(await readData());
  if (synced.changed) {
    await writeData(synced.data);
  }
  return synced.data;
}

function getDeviceStatusFromApplications(
  deviceId: string,
  applications: ApplicationRecord[],
): DeviceStatus {
  const activeStatuses: ApplicationStatus[] = [
    "overdue",
    "borrowed",
    "abnormal_pending",
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

function sortApplications(applications: ApplicationRecord[]): ApplicationRecord[] {
  return [...applications].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function sortReminders(reminders: ReminderRecord[]): ReminderRecord[] {
  return [...reminders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function createProfileStats(applications: ApplicationRecord[]): ProfileStats {
  return {
    pendingReturnCount: applications.filter((application) =>
      ["approved", "borrowed", "overdue", "returned_pending_confirm"].includes(
        application.status,
      ),
    ).length,
    overdueCount: applications.filter((application) => application.status === "overdue").length,
    completedCount: applications.filter((application) => application.status === "completed").length,
  };
}

function maybeAddStatusReminder(data: DemoData, application: ApplicationRecord): DemoData {
  const reminderTypeByStatus: Partial<Record<ApplicationStatus, ReminderType>> = {
    approved: "approved",
    rejected: "rejected",
    borrowed: "borrowed",
    overdue: "overdue",
  };

  const reminderType = reminderTypeByStatus[application.status];
  if (!reminderType || application.userName !== data.currentUser.name) {
    return data;
  }

  if (reminderExists(data.reminders, application.id, reminderType)) {
    return data;
  }

  const deviceName =
    data.devices.find((device) => device.id === application.deviceId)?.name ?? application.deviceId;

  return {
    ...data,
    reminders: [
      createReminder(data.currentUser, application, deviceName, reminderType),
      ...data.reminders,
    ],
  };
}

export async function listDevices(): Promise<Device[]> {
  const data = await readSyncedData();
  return data.devices;
}

export async function listApplications(): Promise<ApplicationRecord[]> {
  const data = await readSyncedData();
  return sortApplications(data.applications);
}

export async function getCurrentUser(): Promise<UserProfile> {
  const data = await readSyncedData();
  return data.currentUser;
}

export async function listCurrentUserApplications(): Promise<ApplicationRecord[]> {
  const data = await readSyncedData();
  return sortApplications(
    data.applications.filter(
      (application) => application.userName === data.currentUser.name,
    ),
  );
}

export async function listCurrentUserReminders(): Promise<ReminderRecord[]> {
  const data = await readSyncedData();
  return sortReminders(
    data.reminders.filter((reminder) => reminder.userId === data.currentUser.id),
  );
}

export async function getProfileOverview(): Promise<ProfileOverview> {
  const data = await readSyncedData();
  const applications = data.applications.filter(
    (application) => application.userName === data.currentUser.name,
  );

  return {
    user: data.currentUser,
    stats: createProfileStats(applications),
    currentItems: sortApplications(
      applications.filter((application) =>
        ["approved", "borrowed", "overdue", "returned_pending_confirm"].includes(
          application.status,
        ),
      ),
    ),
    reminders: sortReminders(
      data.reminders.filter((reminder) => reminder.userId === data.currentUser.id),
    ),
  };
}

export async function createApplication(input: {
  deviceId: string;
  userName: string;
  purpose: string;
  borrowDate: string;
  returnDate: string;
}): Promise<ApplicationRecord> {
  const data = await readSyncedData();
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

  const nextData = syncDerivedData({
    ...data,
    applications: [application, ...data.applications],
  }).data;

  await writeData(nextData);
  return application;
}

export async function updateApplicationStatus(
  id: string,
  nextStatus: ApplicationStatus,
): Promise<ApplicationRecord> {
  const data = await readSyncedData();
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

  const withReminder = maybeAddStatusReminder(data, application);
  const nextData = syncDerivedData(withReminder).data;
  await writeData(nextData);
  return application;
}
