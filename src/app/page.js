import ListingsFeed from "@/components/listings/ListingsFeed";

export default function Home() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-semibold mb-4">
        Scanne le code-barres. Le reste s&apos;écrit tout seul.
      </h1>
      <p className="text-gray-600 max-w-prose mb-10">
        Entre l&apos;ISBN d&apos;un livre, on va chercher le titre, l&apos;auteur et
        la couverture pour toi.
      </p>
      <ListingsFeed />
    </div>
  );
}
