import ProfilePage from "@/components/settings/profile";
import { getUser } from "@/app/actions/auth";

async function ProfileSettingsPage() {
  const user = await getUser();

  return (
    <div>
      <ProfilePage id={user?.id} email={user?.email} user_metadata={user?.user_metadata} />
    </div>
  );
}

export default ProfileSettingsPage;