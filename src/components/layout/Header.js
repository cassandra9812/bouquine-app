import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b border-gray-200">
      <div className="max-w-3xl mx-auto flex items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-semibold">
          Bouquine
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {user ? (
            <Link href="/account" className="underline">
              Mon compte
            </Link>
          ) : (
            <>
              <Link href="/login" className="underline">
                Se connecter
              </Link>
              <Link href="/signup" className="underline">
                Créer un compte
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
