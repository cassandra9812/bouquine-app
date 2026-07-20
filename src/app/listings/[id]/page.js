import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ListingDetailPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: listing } = await supabase
    .from("listings")
    .select("*, profiles(display_name)")
    .eq("id", id)
    .single();

  if (!listing) {
    notFound();
  }

  const { data: photoRows } = await supabase
    .from("listing_photos")
    .select("storage_path")
    .eq("listing_id", id)
    .order("position");

  const photoUrls = (photoRows ?? []).map(
    (p) => supabase.storage.from("listing-photos").getPublicUrl(p.storage_path).data.publicUrl
  );

  const isOwner = user?.id === listing.seller_id;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {listing.status !== "active" && (
        <p className="mb-4 text-sm inline-block bg-gray-100 rounded px-3 py-1">
          {listing.status === "sold" ? "Vendu" : "Annonce annulée"}
        </p>
      )}

      <div className="flex gap-6 mb-6">
        <div className="flex flex-col gap-2">
          {(photoUrls.length > 0 ? photoUrls : [listing.cover_url]).map(
            (url, i) =>
              url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={url}
                  alt={listing.title}
                  className="w-28 h-40 object-cover border"
                />
              )
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{listing.title}</h1>
          <p className="text-gray-600">{listing.authors}</p>
          <p className="text-xl font-medium mt-2">{Number(listing.price).toFixed(2)} $</p>
          <p className="text-sm text-gray-600 mt-1">
            {listing.condition} · {listing.format}
            {listing.first_edition && " · Première édition"}
          </p>
          {listing.series_name && (
            <p className="text-sm text-gray-600">
              Série : {listing.series_name}
              {listing.series_number ? ` — Tome ${listing.series_number}` : ""}
            </p>
          )}
          {listing.edition_source && (
            <p className="text-sm text-gray-600">{listing.edition_source}</p>
          )}
          <p className="text-sm text-gray-600 mt-2">
            Vendeur : {listing.profiles?.display_name ?? "—"}
            {listing.city && ` · ${listing.city}`}
            {listing.province && `, ${listing.province}`}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {listing.allows_pickup && "Remise en main propre"}
            {listing.allows_pickup && listing.allows_shipping && " · "}
            {listing.allows_shipping &&
              `Livraison postale (+${Number(listing.shipping_fee).toFixed(2)} $)`}
          </p>

          {isOwner && (
            <div className="flex gap-4 mt-4 text-sm">
              <Link href={`/listings/${listing.id}/edit`} className="underline">
                Modifier
              </Link>
            </div>
          )}
        </div>
      </div>

      {listing.description && (
        <p className="text-sm text-gray-700 leading-relaxed border-t pt-4">
          {listing.description}
        </p>
      )}
    </div>
  );
}
