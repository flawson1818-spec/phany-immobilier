import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "PHANY IMMOBILIER — l'immobilier intelligent à Lomé",
    template: "%s · PHANY IMMOBILIER",
  },
  description:
    "Plateforme immobilière intelligente pour Lomé et le Togo : recherche assistée par PHANY AI, annonces vérifiées, visites organisées.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
