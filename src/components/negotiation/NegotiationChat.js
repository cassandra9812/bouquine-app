"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function NegotiationChat({
  thread,
  currentUserId,
  listing,
  initialMessages,
}) {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const [offerAmount, setOfferAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  const isSeller = currentUserId === thread.seller_id;
  const otherPartyLabel = isSeller ? "l'acheteur" : "le vendeur";

  useEffect(() => {
    const channel = supabase
      .channel(`negotiation-${thread.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "negotiation_messages",
          filter: `thread_id=eq.${thread.id}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.some((m) => m.id === payload.new.id) ? prev : [...prev, payload.new]
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, thread.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // The most recent open offer: an offer/counter_offer not yet followed by an accept/decline.
  const lastMessage = messages[messages.length - 1];
  const pendingOffer =
    lastMessage &&
    (lastMessage.message_type === "offer" || lastMessage.message_type === "counter_offer")
      ? lastMessage
      : null;
  const canRespondToOffer = pendingOffer && pendingOffer.sender_id !== currentUserId;

  async function insertMessage(row) {
    setError(null);
    setSending(true);
    const { data, error } = await supabase
      .from("negotiation_messages")
      .insert({ thread_id: thread.id, sender_id: currentUserId, ...row })
      .select()
      .single();
    setSending(false);
    if (error) {
      setError(error.message);
      return;
    }
    setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data]));
  }

  async function handleSendText(e) {
    e.preventDefault();
    if (!text.trim()) return;
    const body = text.trim();
    setText("");
    await insertMessage({ body, message_type: "text" });
  }

  async function handleSendOffer(e) {
    e.preventDefault();
    const amount = Number(offerAmount);
    if (!amount || amount <= 0) return;
    setOfferAmount("");
    const messageType = messages.some(
      (m) => m.message_type === "offer" || m.message_type === "counter_offer"
    )
      ? "counter_offer"
      : "offer";
    await insertMessage({ offer_amount: amount, message_type: messageType });
  }

  async function handleAccept() {
    await insertMessage({
      message_type: "accept",
      body: `Offre de ${Number(pendingOffer.offer_amount).toFixed(2)} $ acceptée.`,
    });
    await supabase
      .from("negotiation_threads")
      .update({ status: "accepted" })
      .eq("id", thread.id);
  }

  async function handleDecline() {
    await insertMessage({ message_type: "decline", body: "Offre refusée." });
  }

  return (
    <div className="border rounded flex flex-col h-[70vh] max-h-[600px]">
      <div className="border-b p-3">
        <p className="text-sm text-gray-600">
          Négociation avec {otherPartyLabel} · {listing.title} ·{" "}
          <span className="font-medium">{Number(listing.price).toFixed(2)} $ demandé</span>
        </p>
        {thread.status === "accepted" && (
          <p className="text-sm text-green-700 mt-1">
            Une offre a été acceptée pour ce livre.
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {messages.map((m) => {
          const mine = m.sender_id === currentUserId;
          const isOffer = m.message_type === "offer" || m.message_type === "counter_offer";
          const isSystemLike = m.message_type === "accept" || m.message_type === "decline";
          return (
            <div
              key={m.id}
              className={`max-w-[75%] rounded px-3 py-2 text-sm ${
                mine ? "self-end bg-black text-white" : "self-start bg-gray-100"
              } ${isSystemLike ? "italic" : ""}`}
            >
              {isOffer ? (
                <span className="font-medium">
                  {m.message_type === "counter_offer" ? "Contre-offre : " : "Offre : "}
                  {Number(m.offer_amount).toFixed(2)} $
                </span>
              ) : (
                m.body
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {canRespondToOffer && (
        <div className="flex gap-2 p-3 border-t">
          <button
            onClick={handleAccept}
            disabled={sending}
            className="flex-1 bg-black text-white rounded px-3 py-2 text-sm disabled:opacity-50"
          >
            Accepter l&apos;offre ({Number(pendingOffer.offer_amount).toFixed(2)} $)
          </button>
          <button
            onClick={handleDecline}
            disabled={sending}
            className="flex-1 border rounded px-3 py-2 text-sm text-gray-600 disabled:opacity-50"
          >
            Refuser
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 px-3">{error}</p>}

      <form onSubmit={handleSendOffer} className="flex gap-2 p-3 border-t">
        <input
          type="number"
          min="1"
          step="0.5"
          value={offerAmount}
          onChange={(e) => setOfferAmount(e.target.value)}
          placeholder="Ton offre ($)"
          className="border rounded px-3 py-2 w-32"
        />
        <button
          type="submit"
          disabled={sending || !offerAmount}
          className="bg-black text-white rounded px-4 py-2 text-sm disabled:opacity-50"
        >
          Envoyer l&apos;offre
        </button>
      </form>
      <form onSubmit={handleSendText} className="flex gap-2 p-3 pt-0">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Écris un message…"
          className="border rounded px-3 py-2 flex-1"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="border rounded px-4 py-2 text-sm disabled:opacity-50"
        >
          Envoyer
        </button>
      </form>
    </div>
  );
}
