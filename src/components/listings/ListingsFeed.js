"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { CONDITIONS, PROVINCES } from "@/lib/pricing";

export default function ListingsFeed() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [keyword, setKeyword] = useState("");
  const [condition, setCondition] = useState("");
  const [language, setLanguage] = useState("");
  const [province, setProvince] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [sort, setSort] = useState("recent");

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function fetchListings() {
      setLoading(true);
      let query = supabase
        .from("listings")
        .select("*, profiles(display_name)")
        .eq("status", "active");

      if (keyword.trim()) {
        const term = `%${keyword.trim()}%`;
        query = query.or(
          `title.ilike.${term},authors.ilike.${term},description.ilike.${term}`
        );
      }
      if (condition) query = query.eq("condition", condition);
      if (language) query = query.eq("language", language);
      if (province) query = query.eq("province", province);
      if (priceMin) query = query.gte("price", Number(priceMin));
      if (priceMax) query = query.lte("price", Number(priceMax));

      if (sort === "price-asc") query = query.order("price", { ascending: true });
      else if (sort === "price-desc") query = query.order("price", { ascending: false });
      else query = query.order("created_at", { ascending: false });

      const { data } = await query;
      if (!cancelled) {
        setListings(data ?? []);
        setLoading(false);
      }
    }

    fetchListings();
    return () => {
      cancelled = true;
    };
  }, [keyword, condition, language, province, priceMin, priceMax, sort]);

  function resetFilters() {
    setKeyword("");
    setCondition("");
    setLanguage("");
    setProvince("");
    setPriceMin("");
    setPriceMax("");
    setSort("recent");
  }

  return (
    <div>
      <input
        type="text"
        placeholder="Rechercher par titre, auteur ou résumé…"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        className="border rounded px-3 py-2 w-full mb-3"
      />

      <div className="flex flex-wrap gap-2 mb-6 text-sm">
        <select
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="">État — tous</option>
          {CONDITIONS.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="">Langue — toutes</option>
          <option value="fr">Français</option>
          <option value="en">Anglais</option>
        </select>
        <select
          value={province}
          onChange={(e) => setProvince(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="">Province — toutes</option>
          {PROVINCES.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <div className="flex items-center gap-1 border rounded px-2 py-1">
          <span>$</span>
          <input
            type="number"
            placeholder="Min"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            className="w-14"
          />
          <span>–</span>
          <input
            type="number"
            placeholder="Max"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            className="w-14"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="recent">Plus récent</option>
          <option value="price-asc">Prix croissant</option>
          <option value="price-desc">Prix décroissant</option>
        </select>
        <button onClick={resetFilters} className="underline text-gray-600">
          Réinitialiser
        </button>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Annonces publiées</h2>
        <span className="text-sm text-gray-600">
          {loading ? "…" : `${listings.length} livre${listings.length > 1 ? "s" : ""}`}
        </span>
      </div>

      {!loading && listings.length === 0 && (
        <p className="text-sm text-gray-600 border border-dashed rounded p-6 text-center">
          Aucun livre ne correspond à ta recherche.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {listings.map((listing) => (
          <Link
            key={listing.id}
            href={`/listings/${listing.id}`}
            className="border rounded p-3 flex gap-3 hover:shadow-sm"
          >
            {listing.cover_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={listing.cover_url}
                alt={listing.title}
                className="w-14 h-20 object-cover border flex-shrink-0"
              />
            )}
            <div className="min-w-0">
              <h3 className="font-semibold text-sm truncate">{listing.title}</h3>
              <p className="text-xs text-gray-600 truncate">{listing.authors}</p>
              <p className="text-xs text-gray-500 mt-1">
                {listing.profiles?.display_name} · {listing.city}
              </p>
              <p className="font-medium mt-1">{Number(listing.price).toFixed(2)} $</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
