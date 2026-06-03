"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";

import { StatusBadge } from "@/components/status-badge";
import type { ApplicationRecord, Device } from "@/lib/types";

type Role = "user" | "admin";

type FormState = {
  deviceId: string;
  userName: string;
  purpose: string;
  borrowDate: string;
  returnDate: string;
};

const initialForm: FormState = {
  deviceId: "",
  userName: "王晨",
  purpose: "",
  borrowDate: "2026-06-06",
  returnDate: "2026-06-07",
};

const statusSteps = [
  { key: "pending", label: "提交申请" },
  { key: "approved", label: "管理员批准" },
  { key: "borrowed", label: "借出确认" },
  { key: "returned_pending_confirm", label: "用户归还" },
  { key: "completed", label: "流程完成" },
] as const;

const actionMap: Record<string, string> = {
  pending: "approve",
  approved: "checkout",
  borrowed: "return",
  returned_pending_confirm: "complete",
};

async function readJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const data = (await response.json()) as T & { error?: string };
  if (!response.ok && "error" in data && data.error) {
    throw new Error(data.error);
  }

  return data;
}

function deviceNameFromId(devices: Device[], deviceId: string): string {
  return devices.find((device) => device.id === deviceId)?.name ?? deviceId;
}

function canUserReturn(status: ApplicationRecord["status"]): boolean {
  return status === "borrowed";
}

function canAdminAct(status: ApplicationRecord["status"]): boolean {
  return ["pending", "approved", "returned_pending_confirm"].includes(status);
}

function adminActionLabel(status: ApplicationRecord["status"]): string {
  if (status === "pending") return "批准申请";
  if (status === "approved") return "确认借出";
  return "完成归还";
}

export function DemoApp({
  initialApplications,
  initialDevices,
}: {
  initialApplications: ApplicationRecord[];
  initialDevices: Device[];
}) {
  const [role, setRole] = useState<Role>("user");
  const [devices, setDevices] = useState<Device[]>(initialDevices);
  const [applications, setApplications] = useState<ApplicationRecord[]>(initialApplications);
  const [form, setForm] = useState<FormState>({
    ...initialForm,
    deviceId: initialDevices[0]?.id ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Demo 已就绪，可按用户和管理员视角切换演示。");
  const [submitting, setSubmitting] = useState(false);

  async function refreshData() {
    setLoading(true);
    try {
      const [{ devices: nextDevices }, { applications: nextApplications }] =
        await Promise.all([
          readJson<{ devices: Device[] }>("/api/devices"),
          readJson<{ applications: ApplicationRecord[] }>("/api/applications"),
        ]);

      setDevices(nextDevices);
      setApplications(nextApplications);
      setForm((current) => ({
        ...current,
        deviceId: nextDevices.some((device) => device.id === current.deviceId)
          ? current.deviceId
          : (nextDevices[0]?.id ?? ""),
      }));
      setMessage("Demo 已同步到最新状态。可继续切换角色演示。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      await readJson<{ application: ApplicationRecord }>("/api/applications", {
        method: "POST",
        body: JSON.stringify(form),
      });

      setMessage("借用申请已提交，管理员现在可以去审批。");
      setForm((current) => ({ ...initialForm, deviceId: current.deviceId }));
      await refreshData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "提交失败");
    } finally {
      setSubmitting(false);
    }
  }

  async function advanceApplication(id: string, action: string, success: string) {
    setSubmitting(true);
    try {
      await readJson<{ application: ApplicationRecord }>(`/api/applications/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });
      setMessage(success);
      await refreshData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "状态更新失败");
    } finally {
      setSubmitting(false);
    }
  }

  const userApplications = applications.filter(
    (application) => application.userName === form.userName,
  );

  return (
    <main className="page-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">青朴工作室设备借还管理系统</p>
          <h1>相机借还最小闭环 Demo</h1>
          <p className="hero-copy">
            演示普通用户申请、管理员审批与确认借出、用户归还、管理员完成归还确认的核心流程。
          </p>
        </div>
        <div className="hero-panel">
          <div className="role-switch">
            <button
              className={role === "user" ? "active" : ""}
              onClick={() => setRole("user")}
              type="button"
            >
              普通用户视角
            </button>
            <button
              className={role === "admin" ? "active" : ""}
              onClick={() => setRole("admin")}
              type="button"
            >
              管理员视角
            </button>
          </div>
          <p className="status-text">{loading ? "加载中..." : message}</p>
        </div>
      </section>

      <section className="summary-grid">
        <article className="summary-card">
          <span>设备总数</span>
          <strong>{devices.length}</strong>
        </article>
        <article className="summary-card">
          <span>待审批申请</span>
          <strong>
            {applications.filter((application) => application.status === "pending").length}
          </strong>
        </article>
        <article className="summary-card">
          <span>借出中设备</span>
          <strong>
            {
              applications.filter((application) =>
                ["borrowed", "returned_pending_confirm"].includes(application.status),
              ).length
            }
          </strong>
        </article>
      </section>

      <section className="layout-grid">
        <div className="card">
          <div className="section-title">
            <h2>设备列表</h2>
            <p>当前可直接用于演示的设备与状态。</p>
          </div>
          <div className="device-grid">
            {devices.map((device) => (
              <article key={device.id} className="device-card">
                <div className="device-image-wrap">
                  <Image
                    alt={device.name}
                    className="device-image"
                    fill
                    sizes="(max-width: 900px) 100vw, 180px"
                    src={device.image}
                  />
                </div>
                <div className="device-meta">
                  <div className="device-head">
                    <div>
                      <h3>{device.name}</h3>
                      <p>{device.category}</p>
                    </div>
                    <StatusBadge status={device.status} />
                  </div>
                  <p className="device-desc">{device.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        {role === "user" ? (
          <div className="card">
            <div className="section-title">
              <h2>提交借用申请</h2>
              <p>使用固定用户“王晨”模拟普通用户操作。</p>
            </div>
            <form className="form-grid" onSubmit={handleSubmit}>
              <label>
                申请人
                <input
                  value={form.userName}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, userName: event.target.value }))
                  }
                />
              </label>
              <label>
                设备
                <select
                  value={form.deviceId}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, deviceId: event.target.value }))
                  }
                >
                  {devices.map((device) => (
                    <option key={device.id} value={device.id}>
                      {device.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="full">
                用途说明
                <textarea
                  rows={3}
                  value={form.purpose}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, purpose: event.target.value }))
                  }
                />
              </label>
              <label>
                借用日期
                <input
                  type="date"
                  value={form.borrowDate}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, borrowDate: event.target.value }))
                  }
                />
              </label>
              <label>
                归还日期
                <input
                  type="date"
                  value={form.returnDate}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, returnDate: event.target.value }))
                  }
                />
              </label>
              <button className="primary-button full" disabled={submitting} type="submit">
                {submitting ? "处理中..." : "提交申请"}
              </button>
            </form>
          </div>
        ) : (
          <div className="card">
            <div className="section-title">
              <h2>管理员操作台</h2>
              <p>对申请执行审批、借出确认和归还确认。</p>
            </div>
            <div className="action-list">
              {applications.filter((application) => canAdminAct(application.status)).length === 0 ? (
                <p className="empty-text">当前没有待处理的管理动作。</p>
              ) : (
                applications
                  .filter((application) => canAdminAct(application.status))
                  .map((application) => (
                    <article className="action-card" key={application.id}>
                      <div>
                        <h3>{deviceNameFromId(devices, application.deviceId)}</h3>
                        <p>
                          {application.userName} · {application.borrowDate} 至 {application.returnDate}
                        </p>
                      </div>
                      <div className="action-row">
                        <StatusBadge status={application.status} />
                        {application.status === "pending" && (
                          <button
                            className="secondary-button"
                            disabled={submitting}
                            onClick={() =>
                              advanceApplication(
                                application.id,
                                "reject",
                                "申请已拒绝，设备重新保持可借用。",
                              )
                            }
                            type="button"
                          >
                            拒绝
                          </button>
                        )}
                        <button
                          className="primary-button"
                          disabled={submitting}
                          onClick={() =>
                            advanceApplication(
                              application.id,
                              actionMap[application.status],
                              `${adminActionLabel(application.status)}已完成。`,
                            )
                          }
                          type="button"
                        >
                          {adminActionLabel(application.status)}
                        </button>
                      </div>
                    </article>
                  ))
              )}
            </div>
          </div>
        )}
      </section>

      <section className="card">
        <div className="section-title">
          <h2>{role === "user" ? "我的申请与归还" : "全部申请记录"}</h2>
          <p>用状态时间线强调流程变化，便于老师快速理解业务闭环。</p>
        </div>
        <div className="timeline-list">
          {(role === "user" ? userApplications : applications).map((application) => (
            <article className="timeline-card" key={application.id}>
              <div className="timeline-head">
                <div>
                  <h3>{deviceNameFromId(devices, application.deviceId)}</h3>
                  <p>
                    {application.userName} · {application.purpose}
                  </p>
                </div>
                <StatusBadge status={application.status} />
              </div>
              <div className="step-row">
                {statusSteps.map((step) => {
                  const active =
                    application.status === step.key ||
                    statusSteps.findIndex((item) => item.key === application.status) >
                      statusSteps.findIndex((item) => item.key === step.key);

                  return (
                    <div className={`step-pill ${active ? "active" : ""}`} key={step.key}>
                      {step.label}
                    </div>
                  );
                })}
                {application.status === "rejected" && (
                  <div className="step-pill rejected">审批拒绝</div>
                )}
              </div>
              <div className="timeline-meta">
                <span>
                  借用时间：{application.borrowDate} - {application.returnDate}
                </span>
                <span>申请编号：{application.id}</span>
              </div>
              {role === "user" && canUserReturn(application.status) && (
                <button
                  className="primary-button inline-button"
                  disabled={submitting}
                  onClick={() =>
                    advanceApplication(
                      application.id,
                      "return",
                      "用户已发起归还，等待管理员确认。",
                    )
                  }
                  type="button"
                >
                  发起归还
                </button>
              )}
            </article>
          ))}
          {!loading && (role === "user" ? userApplications : applications).length === 0 && (
            <p className="empty-text">当前没有可展示的申请记录。</p>
          )}
        </div>
      </section>
    </main>
  );
}
