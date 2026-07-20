"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  CONDITIONS,
  FORMATS,
  PROVINCES,
  MIN_PRICE,
  suggestedShippingFor,
} from "@/lib/pricing";

export default function NewListingForm({ user, initialProfile }) {
  const router = useRouter();

  const [isbn, setIsbn] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [book, setBook] = useState(null);

  const [condition, setCondition] = useState(CONDITIONS[1]);
  const [format, setFormat] = useState(FORMATS[1].value);
  const [price, setPrice] = useState("");
  const [city, setCity] = useState(initialProfile?.city ?? "");
  const [province, setProvince] = useState(initialProfile?.province ?? PROVINCES[0]);
  const [shippingFee, setShippingFee] = useState(FORMATS[1].shippingSuggestion.toFixed(2));
  const [allowsPickup, setAllowsPickup] = useState(true);
  const [allowsShipping, setAllowsShipping] = useState(true);
  const [firstEdition, setFirstEdition] = useState(false);
  const [editionSource, setEditionSource] = useState("");
  const [seriesName, setSeriesName] = useState("");
  const [seriesNumber, setSeriesNumber] = useState("");
  const [photos, setPhotos] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const priceTooLow = price !== "" && Number(price) < MIN_PRICE;

  async function handleSearch(e) {
    e.preventDefault();
    setSearchError(null);
    setBook(null);
    setSearching(true);

    const res = await fetch(`/api/isbn-lookup?isbn=${encodeURIComponent(isbn)}`);
    const data = await res.json();

    setSearching(false);
    if (!res.ok) {
      setSearchError(data.error ?? "Aucun livre trouvé pour cet ISBN.");
      return;
    }
    setBook(data);
  }

  function handleFormatChange(value) {
    setFormat(value);
    setShippingFee(suggestedShippingFor(value).toFixed(2));
  }

  function handlePhotoChange(e) {
    const files = Array.from(e.target.files ?? []);
    setPhotos((prev) => [...prev, ...files]);
  }

  function removePhoto(index) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError(null);

    if (!book) {
      setSubmitError("Recherche d'abord un livre par ISBN.");
      return;
    }
    if (Number(price) < MIN_PRICE) {
      setSubmitError(`Le prix minimum est de ${MIN_PRICE.toFixed(2)} $.`);
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const listingId = crypto.randomUUID();

    try {
      for (let i = 0; i < photos.length; i++) {
        const file = photos[i];
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${listingId}/${String(i).padStart(3, "0")}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("listing-photos")
          .upload(path, file);
        if (uploadError) throw uploadError;
      }

      const { error: insertError } = await supabase.from("listings").insert({
        id: listingId,
        seller_id: user.id,
        isbn: book.isbn,
        title: book.title,
        authors: book.authors,
        description: book.description,
        cover_url: book.coverUrl,
        language: book.language,
        condition,
        format,
        price: Number(price),
        first_edition: firstEdition,
        edition_source: editionSource || null,
        series_name: seriesName || null,
        series_number: seriesNumber ? Number(seriesNumber) : null,
        city: city || null,
        province: province || null,
        shipping_fee: Number(shippingFee) || 0,
        allows_pickup: allowsPickup,
        allows_shipping: allowsShipping,
      });
      if (insertError) throw insertError;

      if (photos.length > 0) {
        // Re-derive the exact paths we just uploaded to, in order.
        const { data: files } = await supabase.storage
          .from("listing-photos")
          .list(`${user.id}/${listingId}`);
        const rows = (files ?? [])
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((f, i) => ({
            listing_id: listingId,
            storage_path: `${user.id}/${listingId}/${f.name}`,
            position: i,
          }));
        if (rows.length > 0) {
          const { error: photosError } = await supabase
            .from("listing_photos")
            .insert(rows);
          if (photosError) throw photosError;
        }
      }

      router.push(`/listings/${listingId}`);
      router.refresh();
    } catch (err) {
      setSubmitError(err.message ?? "Une erreur est survenue.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          placeholder="Entre un ISBN (ex. 9780439023528)"
          value={isbn}
          onChange={(e) => setIsbn(e.target.value)}
          className="border rounded px-3 py-2 flex-1"
        />
        <button
          type="submit"
          disabled={searching || !isbn}
          className="bg-black text-white rounded px-4 py-2 disabled:opacity-50"
        >
          {searching ? "Recherche..." : "Rechercher"}
        </button>
      </form>
      {searchError && <p className="text-sm text-red-600">{searchError}</p>}

      {book && (
        <div className="border rounded p-4 flex gap-4">
          {book.coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={book.coverUrl}
              alt={book.title}
              className="w-20 h-28 object-cover border"
            />
          )}
          <div>
            <h3 className="font-semibold">{book.title}</h3>
            <p className="text-sm text-gray-600">{book.authors}</p>
            {book.publisher && (
              <p className="text-xs text-gray-500 mt-1">{book.publisher}</p>
            )}
          </div>
        </div>
      )}

      {book && (
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
              placeholder="12.00"
              className="border rounded px-3 py-2"
            />
            {priceTooLow && (
              <span className="text-xs text-red-600">
                Le prix minimum est de {MIN_PRICE.toFixed(2)} $.
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Format du livre</label>
            <select
              value={format}
              onChange={(e) => handleFormatChange(e.target.value)}
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
            <label className="text-sm font-medium">
              Frais de livraison postale (CAD)
            </label>
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
              placeholder="ex. Laval, QC"
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
              id="firstEdition"
              checked={firstEdition}
              onChange={(e) => setFirstEdition(e.target.checked)}
            />
            <label htmlFor="firstEdition" className="text-sm">
              Il s&apos;agit d&apos;une première édition
            </label>
          </div>
          <div className="col-span-2 flex flex-col gap-1">
            <label className="text-sm font-medium">
              Provenance / édition spéciale (optionnel)
            </label>
            <input
              type="text"
              value={editionSource}
              onChange={(e) => setEditionSource(e.target.value)}
              placeholder="ex. FairyLoot, Bookish Box, tranche dorée, exemplaire signé…"
              className="border rounded px-3 py-2"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Série (optionnel)</label>
            <input
              type="text"
              value={seriesName}
              onChange={(e) => setSeriesName(e.target.value)}
              placeholder="ex. Harry Potter"
              className="border rounded px-3 py-2"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Numéro du tome</label>
            <input
              type="number"
              min="1"
              value={seriesNumber}
              onChange={(e) => setSeriesNumber(e.target.value)}
              className="border rounded px-3 py-2"
            />
          </div>
          <div className="col-span-2 flex flex-col gap-2">
            <label className="text-sm font-medium">
              Photos de ton exemplaire (plusieurs possibles)
            </label>
            <input type="file" accept="image/*" multiple onChange={handlePhotoChange} />
            {photos.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-2">
                {photos.map((file, i) => (
                  <div key={i} className="relative w-16 h-16 border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={URL.createObjectURL(file)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {submitError && (
            <p className="col-span-2 text-sm text-red-600">{submitError}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="col-span-2 bg-black text-white rounded px-4 py-3 disabled:opacity-50"
          >
            {submitting ? "Publication..." : "Publier l'annonce"}
          </button>
        </form>
      )}
    </div>
  );
}
