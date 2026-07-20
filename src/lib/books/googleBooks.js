async function fetchVolumes(isbn) {
  const params = new URLSearchParams({ q: `isbn:${isbn}` });
  if (process.env.GOOGLE_BOOKS_API_KEY) {
    params.set("key", process.env.GOOGLE_BOOKS_API_KEY);
  }
  return fetch(`https://www.googleapis.com/books/v1/volumes?${params}`);
}

export async function lookupGoogleBooks(isbn) {
  let res = await fetchVolumes(isbn);

  if (!res.ok && res.status >= 500) {
    // Google's backend occasionally returns a transient 5xx; one retry clears most of these.
    res = await fetchVolumes(isbn);
  }

  if (!res.ok) {
    console.error("Google Books API error:", res.status, await res.text());
    return null;
  }

  const data = await res.json();
  const item = data.items?.[0];
  if (!item) return null;

  const info = item.volumeInfo ?? {};
  return {
    isbn,
    title: info.title ?? null,
    authors: info.authors?.join(", ") ?? null,
    description: info.description ?? null,
    coverUrl: info.imageLinks?.thumbnail?.replace("http://", "https://") ?? null,
    language: info.language ?? null,
    publisher: info.publisher ?? null,
    source: "google_books",
  };
}
