import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import NegotiationChat from "@/components/negotiation/NegotiationChat";

export default async function NegotiationPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: thread } = await supabase
    .from("negotiation_threads")
    .select("*, listings(id, title, price, cover_url)")
    .eq("id", id)
    .single();

  if (!thread) {
    notFound();
  }
  if (thread.buyer_id !== user.id && thread.seller_id !== user.id) {
    redirect("/");
  }

  const { data: messages } = await supabase
    .from("negotiation_messages")
    .select("*")
    .eq("thread_id", id)
    .order("created_at", { ascending: true });

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Link
        href={`/listings/${thread.listings.id}`}
        className="text-sm underline text-gray-600 mb-4 inline-block"
      >
        ← Retour à l&apos;annonce
      </Link>
      <NegotiationChat
        thread={thread}
        currentUserId={user.id}
        listing={thread.listings}
        initialMessages={messages ?? []}
      />
    </div>
  );
}
