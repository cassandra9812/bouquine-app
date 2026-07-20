"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CONDITIONS, FORMATS, PROVINCES, MIN_PRICE } from "@/lib/pricing";

export default function EditListingForm({ listing }) {
  const router = useRouter();
  const [condition, setCondition] = useState(listing.condition);
  const [format, setFormat] = useState(listing.format);
  const [price, setPrice] = useState(String(listing.price));
  const [city, setCity] = useState(listing.city ?? "");
  const [province, setProvince] = useState(listing.province ?? PROVINCES[0]);
  const [shippingFee, setShippingFee] = useState(String(listing.shipping_fee));
  const [allowsPickup, setAllowsPickup] = useState(listing.allows_pickup);
  const [allowsShipping, setAllowsShipping] = useState(listing.allows_shipping);
  const [firstEdition, setFirstEdition] = useState(listing.first_edition);
  const [editionSource, setEditionSource] = useState(listing.edition_source ?? "");

  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    if (Number(price) < MIN_PRICE) {
      setError(`Le prix minimum est de ${MIN_PRICE.toFixed(2)} $.`);
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("listings")
      .update({
        condition,
        format,
        price: Number(price),
        city: city || null,
        province,
        shipping_fee: Number(shippingFee) || 0,
        allows_pickup: allowsPickup,
        allows_shipping: allowsShipping,
        first_edition: firstEdition,
        edition_source: editionSource || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", listing.id);

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  async function handleCancel() {
    setCancelling(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("listings")
      .update({ status: "cancelled" })
      .eq("id", listing.id);

    setCancelling(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/account/listings");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">État du livre</label>
        <select
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          className="border rounded px-3 py-2"
        >
          {CONDITIONS.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Prix demandé (CAD)</label>
        <input
          type="number"
          min={MIN_PRICE}
          step="0.5"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="border rounded px-3 py-2"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Format du livre</label>
        <select
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          className="border rounded px-3 py-2"
        >
          {FORMATS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.value}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Frais de livraison (CAD)</label>
        <input
          type="number"
          min="0"
          step="0.5"
          value={shippingFee}
          onChange={(e) => setShippingFee(e.target.value)}
          className="border rounded px-3 py-2"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Ville</label>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="border rounded px-3 py-2"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Province</label>
        <select
          value={province}
          onChange={(e) => setProvince(e.target.value)}
          className="border rounded px-3 py-2"
        >
          {PROVINCES.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </div>
      <div className="col-span-2 flex gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={allowsPickup}
            onChange={(e) => setAllowsPickup(e.target.checked)}
          />
          Remise en main propre
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={allowsShipping}
            onChange={(e) => setAllowsShipping(e.target.checked)}
          />
          Livraison postale
        </label>
      </div>
      <div className="col-span-2 flex items-center gap-2">
        <input
          type="checkbox"
          id="editFirstEdition"
          checked={firstEdition}
          onChange={(e) => setFirstEdition(e.target.checked)}
        />
        <label htmlFor="editFirstEdition" className="text-sm">
          Première édition
        </label>
      </div>
      <div className="col-span-2 flex flex-col gap-1">
        <label className="text-sm font-medium">Provenance / édition spéciale</label>
        <input
          type="text"
          value={editionSource}
          onChange={(e) => setEditionSource(e.target.value)}
          className="border rounded px-3 py-2"
        />
      </div>

      {error && <p className="col-span-2 text-sm text-red-600">{error}</p>}
      {saved && <p className="col-span-2 text-sm text-green-700">Annonce mise à jour.</p>}

      <button
        type="submit"
        disabled={saving}
        className="bg-black text-white rounded px-4 py-2 disabled:opacity-50"
      >
        {saving ? "Enregistrement..." : "Enregistrer les modifications"}
      </button>
      <button
        type="button"
        onClick={handleCancel}
        disabled={cancelling}
        className="border border-red-600 text-red-600 rounded px-4 py-2 disabled:opacity-50"
      >
        {cancelling ? "Annulation..." : "Annuler l'annonce"}
      </button>
    </form>
  );
}
