import { NextResponse } from "next/server";

async function searchGoogleBooks(title) {
  const params = new URLSearchParams({
    q: `intitle:${title}`,
    maxResults: "10",
  });
  if (process.env.GOOGLE_BOOKS_API_KEY) {
    params.set("key", process.env.GOOGLE_BOOKS_API_KEY);
  }

  const res = await fetch(`https://www.googleapis.com/books/v1/volumes?${params}`);
  if (!res.ok) return [];

  const data = await res.json();
  return (data.items ?? []).map((item) => {
    const info = item.volumeInfo ?? {};
    const isbn13 = info.industryIdentifiers?.find((id) => id.type === "ISBN_13");
    return {
      isbn: isbn13?.identifier ?? null,
      title: info.title ?? null,
      authors: info.authors?.join(", ") ?? null,
      description: info.description ?? null,
      coverUrl: info.imageLinks?.thumbnail?.replace("http://", "https://") ?? null,
      language: info.language ?? null,
      publisher: info.publisher ?? null,
      source: "google_books",
    };
  }).filter((b) => b.title);
}

async function searchOpenLibrary(title) {
  const params = new URLSearchParams({ title, limit: "10" });
  const res = await fetch(`https://openlibrary.org/search.json?${params}`);
  if (!res.ok) return [];

  const data = await res.json();
  return (data.docs ?? []).map((doc) => ({
    isbn: doc.isbn?.[0] ?? null,
    title: doc.title ?? null,
    authors: doc.author_name?.join(", ") ?? null,
    description: null,
    coverUrl: doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
      : null,
    language: null,
    publisher: doc.publisher?.[0] ?? null,
    source: "open_library",
  })).filter((b) => b.title);
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("q")?.trim();

  if (!title) {
    return NextResponse.json({ error: "Titre manquant." }, { status: 400 });
  }

  let results = [];
  try {
    results = await searchGoogleBooks(title);
  } catch (err) {
    console.error("Google Books title search failed:", err);
  }

  if (results.length === 0) {
    try {
      results = await searchOpenLibrary(title);
    } catch (err) {
      console.error("Open Library title search failed:", err);
    }
  }

  return NextResponse.json({ results });
}
