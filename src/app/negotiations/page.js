import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function NegotiationsListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: threads } = await supabase
    .from("negotiation_threads")
    .select("id, status, listings(title, price, cover_url), buyer_id, seller_id")
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold mb-6">Mes négociations</h1>

      {(!threads || threads.length === 0) && (
        <p className="text-sm text-gray-600">Aucune négociation pour l&apos;instant.</p>
      )}

      <div className="flex flex-col gap-3">
        {threads?.map((thread) => (
          <Link
            key={thread.id}
            href={`/negotiations/${thread.id}`}
            className="border rounded p-3 flex items-center gap-3 hover:bg-gray-50"
          >
            <div className="flex-1">
              <p className="font-medium text-sm">{thread.listings?.title}</p>
              <p className="text-xs text-gray-600">
                {thread.buyer_id === user.id ? "En tant qu'acheteur" : "En tant que vendeur"} ·{" "}
                {thread.status === "accepted" ? "Offre acceptée" : "En cours"}
              </p>
            </div>
            <p className="text-sm font-medium">
              {Number(thread.listings?.price).toFixed(2)} $
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
