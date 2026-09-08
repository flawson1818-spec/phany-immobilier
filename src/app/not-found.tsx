import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-navy-700 px-4 text-center text-white">
      <div className="phany-logo text-3xl text-white">
        P<span className="text-gold-400">H</span>ANY
      </div>
      <h1 className="text-xl font-bold">Page introuvable</h1>
      <p className="text-white/80">Cette page n&apos;existe pas ou n&apos;est plus disponible.</p>
      <Link href="/" className="mt-2 rounded-lg bg-gold-500 px-4 py-2 font-semibold">
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}
