import Link from "next/link";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-navy-700 to-navy-600 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-xl">
        <Link href="/" className="phany-logo text-2xl">
          P<span className="h">H</span>ANY <span className="text-gold-600">IMMOBILIER</span>
        </Link>
        <h1 className="mt-4 text-xl font-bold text-navy-800">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        <div className="mt-5">{children}</div>
      </div>
    </main>
  );
}
