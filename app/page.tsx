import { listApplications, listDevices } from "@/lib/demo-store";
import { DemoApp } from "@/components/demo-app";

export default async function HomePage() {
  const [devices, applications] = await Promise.all([listDevices(), listApplications()]);

  return <DemoApp initialApplications={applications} initialDevices={devices} />;
}
