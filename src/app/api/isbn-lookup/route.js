import { NextResponse } from "next/server";
import { lookupGoogleBooks } from "@/lib/books/googleBooks";
import { lookupOpenLibrary } from "@/lib/books/openLibrary";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const isbn = searchParams.get("isbn")?.replace(/[^0-9Xx]/g, "");

  if (!isbn) {
    return NextResponse.json({ error: "ISBN manquant." }, { status: 400 });
  }

  let book = null;
  try {
    book = await lookupGoogleBooks(isbn);
  } catch (err) {
    console.error("Google Books lookup failed:", err);
    book = null;
  }

  if (!book) {
    try {
      book = await lookupOpenLibrary(isbn);
    } catch (err) {
      console.error("Open Library lookup failed:", err);
      book = null;
    }
  }

  if (!book) {
    return NextResponse.json(
      { error: "Aucun livre trouvé pour cet ISBN." },
      { status: 404 }
    );
  }

  return NextResponse.json(book);
}
