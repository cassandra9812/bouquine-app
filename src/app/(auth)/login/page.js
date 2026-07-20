import Link from "next/link";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="max-w-sm mx-auto py-16 px-4">
      <h1 className="text-2xl font-semibold mb-6">Se connecter</h1>
      <LoginForm />
      <p className="text-sm text-gray-600 mt-6">
        Pas encore de compte ?{" "}
        <Link href="/signup" className="underline">
          En créer un
        </Link>
      </p>
    </div>
  );
}
