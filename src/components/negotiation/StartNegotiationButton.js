"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function StartNegotiationButton({ listingId, sellerId, user }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleClick() {
    if (!user) {
      router.push("/login");
      return;
    }

    setLoading(true);
    setError(null);
    const supabase = createClient();

    const { data: thread, error: err } = await supabase
      .from("negotiation_threads")
      .upsert(
        { listing_id: listingId, buyer_id: user.id, seller_id: sellerId },
        { onConflict: "listing_id,buyer_id" }
      )
      .select()
      .single();

    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push(`/negotiations/${thread.id}`);
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="border rounded px-4 py-2 text-sm disabled:opacity-50"
      >
        {loading ? "..." : "Négocier le prix"}
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
