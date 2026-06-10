import { DemoApp } from "@/components/demo-app";
import { getCurrentUser, listApplications, listDevices } from "@/lib/demo-store";

export default async function HomePage() {
  const [devices, applications, currentUser] = await Promise.all([
    listDevices(),
    listApplications(),
    getCurrentUser(),
  ]);

  return (
    <DemoApp
      currentUserName={currentUser.name}
      initialApplications={applications}
      initialDevices={devices}
    />
  );
}
