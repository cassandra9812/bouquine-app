export async function lookupOpenLibrary(isbn) {
  const res = await fetch(
    `https://openlibrary.org/api/books?bibkeys=ISBN:${encodeURIComponent(isbn)}&format=json&jscmd=data`
  );
  if (!res.ok) return null;

  const data = await res.json();
  const book = data[`ISBN:${isbn}`];
  if (!book) return null;

  return {
    isbn,
    title: book.title ?? null,
    authors: book.authors?.map((a) => a.name).join(", ") ?? null,
    description:
      typeof book.notes === "string" ? book.notes : book.notes?.value ?? null,
    coverUrl: book.cover?.large ?? book.cover?.medium ?? null,
    language: null,
    publisher: book.publishers?.[0]?.name ?? null,
    source: "open_library",
  };
}
