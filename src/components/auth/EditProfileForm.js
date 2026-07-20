"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function EditProfileForm({ initialProfile }) {
  const [displayName, setDisplayName] = useState(initialProfile.display_name ?? "");
  const [city, setCity] = useState(initialProfile.city ?? "");
  const [province, setProvince] = useState(initialProfile.province ?? "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName, city, province })
      .eq("id", user.id);

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="displayName" className="text-sm font-medium">
          Nom affiché
        </label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="border rounded px-3 py-2"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="city" className="text-sm font-medium">
          Ville
        </label>
        <input
          id="city"
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="ex. Laval, QC"
          className="border rounded px-3 py-2"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="province" className="text-sm font-medium">
          Province
        </label>
        <input
          id="province"
          type="text"
          value={province}
          onChange={(e) => setProvince(e.target.value)}
          placeholder="ex. Québec"
          className="border rounded px-3 py-2"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-green-700">Profil enregistré.</p>}
      <button
        type="submit"
        disabled={loading}
        className="bg-black text-white rounded px-4 py-2 disabled:opacity-50"
      >
        {loading ? "Enregistrement..." : "Enregistrer"}
      </button>
    </form>
  );
}
