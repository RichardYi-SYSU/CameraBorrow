import { ProfileCenter } from "@/components/profile-center";
import {
  getProfileOverview,
  listCurrentUserApplications,
  listDevices,
} from "@/lib/demo-store";

export default async function ProfilePage() {
  const [overview, applications, devices] = await Promise.all([
    getProfileOverview(),
    listCurrentUserApplications(),
    listDevices(),
  ]);

  return <ProfileCenter applications={applications} devices={devices} overview={overview} />;
}
