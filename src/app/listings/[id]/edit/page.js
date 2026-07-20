import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EditListingForm from "@/components/listings/EditListingForm";

export default async function EditListingPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: listing } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .single();

  if (!listing) {
    notFound();
  }
  if (listing.seller_id !== user.id) {
    redirect(`/listings/${id}`);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold mb-6">Modifier l&apos;annonce</h1>
      <p className="text-sm text-gray-600 mb-4">{listing.title}</p>
      <EditListingForm listing={listing} />
    </div>
  );
}
