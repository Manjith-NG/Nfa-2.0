import { requireUser } from "@/lib/session";
import { ChangePasswordSection } from "@/components/settings/change-password-section";
import { ProfileDetails } from "@/components/settings/profile-details";

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Profile</h1>
        <p className="mt-1 text-sm text-slate-600">Your profile and security settings</p>
      </div>

      <ProfileDetails user={user} />
      <ChangePasswordSection />
    </div>
  );
}
