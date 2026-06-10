export type DeviceStatus = "available" | "pending" | "borrowed";

export type ApplicationStatus =
  | "pending"
  | "approved"
  | "borrowed"
  | "overdue"
  | "returned_pending_confirm"
  | "completed"
  | "rejected"
  | "abnormal_pending";

export type ReminderType = "approved" | "rejected" | "borrowed" | "overdue";

export type Device = {
  id: string;
  name: string;
  category: string;
  status: DeviceStatus;
  description: string;
  image: string;
};

export type ApplicationRecord = {
  id: string;
  deviceId: string;
  userName: string;
  purpose: string;
  borrowDate: string;
  returnDate: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
};

export type UserProfile = {
  id: string;
  name: string;
  studentOrStaffId: string;
  college: string;
  grade: string;
  identityType: string;
  phone: string;
  avatar: string;
};

export type ReminderRecord = {
  id: string;
  userId: string;
  applicationId: string;
  type: ReminderType;
  title: string;
  content: string;
  createdAt: string;
  readAt: string | null;
};

export type ProfileStats = {
  pendingReturnCount: number;
  overdueCount: number;
  completedCount: number;
};

export type ProfileOverview = {
  user: UserProfile;
  stats: ProfileStats;
  currentItems: ApplicationRecord[];
  reminders: ReminderRecord[];
};

export type DemoData = {
  currentUser: UserProfile;
  devices: Device[];
  applications: ApplicationRecord[];
  reminders: ReminderRecord[];
};
