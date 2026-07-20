const LANGUAGE_MAP = { fre: "fr", eng: "en", spa: "es", ger: "de", ita: "it" };

function extractTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  if (!match) return null;
  return match[1]
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function formatAuthorName(raw) {
  const cleaned = raw.replace(/\s*\([^)]*\)\.?.*$/, "").trim();
  const [last, first] = cleaned.split(",").map((part) => part.trim());
  return first ? `${first} ${last}` : cleaned;
}

export async function lookupBnf(isbn) {
  const query = `bib.isbn all "${isbn}"`;
  const params = new URLSearchParams({
    version: "1.2",
    operation: "searchRetrieve",
    query,
    recordSchema: "dublincore",
    maximumRecords: "1",
  });

  const res = await fetch(`https://catalogue.bnf.fr/api/SRU?${params}`);
  if (!res.ok) return null;

  const xml = await res.text();
  if (!/<srw:numberOfRecords>[1-9]/.test(xml)) return null;

  const recordMatch = xml.match(/<srw:recordData>([\s\S]*?)<\/srw:recordData>/);
  if (!recordMatch) return null;
  const record = recordMatch[1];

  const title = extractTag(record, "dc:title");
  if (!title) return null;

  const creator = extractTag(record, "dc:creator");
  const publisher = extractTag(record, "dc:publisher");
  const rawLanguage = extractTag(record, "dc:language");

  return {
    isbn,
    title: title.split(" / ")[0],
    authors: creator ? formatAuthorName(creator) : null,
    description: null,
    coverUrl: null,
    language: rawLanguage ? LANGUAGE_MAP[rawLanguage] ?? rawLanguage : null,
    publisher,
    source: "bnf",
  };
}
