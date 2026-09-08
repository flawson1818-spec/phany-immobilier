import Link from "next/link";

/** Logo PHANY — le "H" est en bordeaux (charte). */
export function Brand({ href = "/", className = "" }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={`phany-logo text-xl sm:text-2xl ${className}`}>
      P<span className="h">H</span>ANY{" "}
      <span className="font-semibold text-gold-600">IMMOBILIER</span>
    </Link>
  );
}
