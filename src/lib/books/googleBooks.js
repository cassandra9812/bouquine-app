export async function lookupGoogleBooks(isbn) {
  const res = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(isbn)}`
  );
  if (!res.ok) return null;

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
