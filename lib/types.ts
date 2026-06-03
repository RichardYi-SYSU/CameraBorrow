export type DeviceStatus = "available" | "pending" | "borrowed";

export type ApplicationStatus =
  | "pending"
  | "approved"
  | "borrowed"
  | "returned_pending_confirm"
  | "completed"
  | "rejected";

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

export type DemoData = {
  devices: Device[];
  applications: ApplicationRecord[];
};
