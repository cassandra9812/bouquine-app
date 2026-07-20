import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/auth/LogoutButton";
import EditProfileForm from "@/components/auth/EditProfileForm";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, city, province")
    .eq("id", user.id)
    .single();

  return (
    <div className="max-w-sm mx-auto py-16 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Mon compte</h1>
        <LogoutButton />
      </div>
      <p className="text-sm text-gray-600 mb-6">{user.email}</p>
      <EditProfileForm initialProfile={profile ?? {}} />
    </div>
  );
}
