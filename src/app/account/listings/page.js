import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function MyListingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: listings } = await supabase
    .from("listings")
    .select("id, title, price, condition, city, status, cover_url")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Mes annonces</h1>
        <Link href="/listings/new" className="underline text-sm">
          Ajouter un livre
        </Link>
      </div>

      {(!listings || listings.length === 0) && (
        <p className="text-sm text-gray-600">
          Tu n&apos;as encore publié aucune annonce.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {listings?.map((listing) => (
          <div
            key={listing.id}
            className="flex items-center gap-3 border rounded p-3"
          >
            {listing.cover_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={listing.cover_url}
                alt={listing.title}
                className="w-10 h-14 object-cover border"
              />
            )}
            <div className="flex-1">
              <Link href={`/listings/${listing.id}`} className="font-medium hover:underline">
                {listing.title}
              </Link>
              <p className="text-xs text-gray-600">
                {listing.condition} · {listing.city}
                {listing.status !== "active" &&
                  ` · ${listing.status === "sold" ? "Vendu" : "Annulée"}`}
              </p>
            </div>
            <p className="font-medium">{Number(listing.price).toFixed(2)} $</p>
            <Link
              href={`/listings/${listing.id}/edit`}
              className="text-xs underline text-gray-600"
            >
              Modifier
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
