import Link from "next/link";
import SignupForm from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <div className="max-w-sm mx-auto py-16 px-4">
      <h1 className="text-2xl font-semibold mb-6">Créer un compte</h1>
      <SignupForm />
      <p className="text-sm text-gray-600 mt-6">
        Déjà un compte ?{" "}
        <Link href="/login" className="underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
