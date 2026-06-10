import Link from "next/link";
import Image from "next/image";

import { StatusBadge } from "@/components/status-badge";
import type { ApplicationRecord, Device, ProfileOverview, ReminderRecord } from "@/lib/types";

const groupDefinitions: Array<{
  key: string;
  title: string;
  statuses: ApplicationRecord["status"][];
}> = [
  { key: "pending", title: "待审核", statuses: ["pending"] },
  { key: "approved", title: "已通过", statuses: ["approved"] },
  { key: "rejected", title: "已驳回", statuses: ["rejected"] },
  { key: "borrowing", title: "借用中", statuses: ["borrowed"] },
  { key: "returning", title: "待归还", statuses: ["returned_pending_confirm"] },
  { key: "completed", title: "已归还", statuses: ["completed"] },
  { key: "overdue", title: "已逾期", statuses: ["overdue"] },
  { key: "abnormal", title: "异常待处理", statuses: ["abnormal_pending"] },
];

function deviceNameFromId(devices: Device[], deviceId: string): string {
  return devices.find((device) => device.id === deviceId)?.name ?? deviceId;
}

function renderReminderDate(reminder: ReminderRecord): string {
  return new Date(reminder.createdAt).toLocaleString("zh-CN", {
    hour12: false,
  });
}

export function ProfileCenter({
  applications,
  devices,
  overview,
}: {
  applications: ApplicationRecord[];
  devices: Device[];
  overview: ProfileOverview;
}) {
  return (
    <main className="page-shell">
      <section className="hero hero-compact">
        <div>
          <p className="eyebrow">个人中心</p>
          <h1>我的资料、借用记录与提醒</h1>
          <p className="hero-copy">
            该页面聚合展示当前用户资料、待归还与逾期情况，以及站内提醒信息。
          </p>
          <div className="hero-links">
            <Link className="ghost-link" href="/">
              返回流程演示首页
            </Link>
          </div>
        </div>
      </section>

      <section className="profile-grid">
        <article className="card profile-card">
          <div className="profile-header">
            <div className="avatar-wrap">
              <Image
                alt={overview.user.name}
                className="avatar-image"
                fill
                sizes="96px"
                src={overview.user.avatar}
              />
            </div>
            <div>
              <h2>{overview.user.name}</h2>
              <p>{overview.user.identityType}</p>
            </div>
          </div>
          <div className="profile-meta-grid">
            <div>
              <span>学号 / 工号</span>
              <strong>{overview.user.studentOrStaffId}</strong>
            </div>
            <div>
              <span>学院</span>
              <strong>{overview.user.college}</strong>
            </div>
            <div>
              <span>年级</span>
              <strong>{overview.user.grade}</strong>
            </div>
            <div>
              <span>手机号</span>
              <strong>{overview.user.phone}</strong>
            </div>
          </div>
        </article>

        <article className="card stats-card-grid">
          <div className="summary-card soft-summary">
            <span>待归还</span>
            <strong>{overview.stats.pendingReturnCount}</strong>
          </div>
          <div className="summary-card soft-summary">
            <span>已逾期</span>
            <strong>{overview.stats.overdueCount}</strong>
          </div>
          <div className="summary-card soft-summary">
            <span>已归还</span>
            <strong>{overview.stats.completedCount}</strong>
          </div>
        </article>
      </section>

      <section className="layout-grid profile-layout-grid">
        <section className="card">
          <div className="section-title">
            <h2>当前设备卡片</h2>
            <p>展示当前仍处于借用过程中的设备，包括逾期记录。</p>
          </div>
          <div className="timeline-list">
            {overview.currentItems.length === 0 ? (
              <p className="empty-text">当前没有待归还或逾期中的设备。</p>
            ) : (
              overview.currentItems.map((application) => (
                <article className="timeline-card" key={application.id}>
                  <div className="timeline-head">
                    <div>
                      <h3>{deviceNameFromId(devices, application.deviceId)}</h3>
                      <p>
                        {application.borrowDate} - {application.returnDate}
                      </p>
                    </div>
                    <StatusBadge status={application.status} />
                  </div>
                  <div className="timeline-meta">
                    <span>用途：{application.purpose}</span>
                    <span>记录编号：{application.id}</span>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="card">
          <div className="section-title">
            <h2>提醒中心</h2>
            <p>站内提醒由审批结果、借出确认和逾期状态触发。</p>
          </div>
          <div className="timeline-list">
            {overview.reminders.length === 0 ? (
              <p className="empty-text">当前没有提醒。</p>
            ) : (
              overview.reminders.map((reminder) => (
                <article className="timeline-card" key={reminder.id}>
                  <div className="timeline-head">
                    <div>
                      <h3>{reminder.title}</h3>
                      <p>{reminder.content}</p>
                    </div>
                  </div>
                  <div className="timeline-meta">
                    <span>{renderReminderDate(reminder)}</span>
                    <span>{reminder.readAt ? "已读" : "未读"}</span>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </section>

      <section className="card">
        <div className="section-title">
          <h2>借用记录分组</h2>
          <p>覆盖文档要求的主要借用状态，便于后续继续扩展正式导航。</p>
        </div>
        <div className="record-group-grid">
          {groupDefinitions.map((group) => {
            const items = applications.filter((application) =>
              group.statuses.includes(application.status),
            );

            return (
              <article className="record-group-card" key={group.key}>
                <div className="record-group-head">
                  <h3>{group.title}</h3>
                  <span>{items.length}</span>
                </div>
                <div className="group-list">
                  {items.length === 0 ? (
                    <p className="empty-text">暂无记录</p>
                  ) : (
                    items.map((application) => (
                      <div className="group-row" key={application.id}>
                        <div>
                          <strong>{deviceNameFromId(devices, application.deviceId)}</strong>
                          <p>
                            {application.borrowDate} - {application.returnDate}
                          </p>
                        </div>
                        <StatusBadge status={application.status} />
                      </div>
                    ))
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
