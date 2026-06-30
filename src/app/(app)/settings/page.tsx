import { requireUser } from "@/lib/session";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { ProfileDetails } from "@/components/settings/profile-details";

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Account</h1>
        <p className="mt-1 text-sm text-slate-600">Your profile and security settings</p>
      </div>

      <ProfileDetails user={user} />

      <section className="nfa-card max-w-2xl">
        <h2 className="text-lg font-semibold text-slate-900">Change password</h2>
        <p className="mt-1 text-sm text-slate-600">
          Update your password after signing in. Use at least 6 characters.
        </p>
        <div className="mt-6">
          <ChangePasswordForm />
        </div>
      </section>
    </div>
  );
}
