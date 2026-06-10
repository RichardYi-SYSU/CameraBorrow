import type { ApplicationStatus, DeviceStatus } from "@/lib/types";

const labelMap: Record<ApplicationStatus | DeviceStatus, string> = {
  available: "可借用",
  pending: "待审批",
  approved: "已批准",
  borrowed: "借出中",
  overdue: "已逾期",
  returned_pending_confirm: "待确认归还",
  completed: "已完成",
  rejected: "已拒绝",
  abnormal_pending: "异常待处理",
};

export function StatusBadge({
  status,
}: {
  status: ApplicationStatus | DeviceStatus;
}) {
  return <span className={`badge badge-${status}`}>{labelMap[status]}</span>;
}
