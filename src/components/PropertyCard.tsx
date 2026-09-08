import Link from "next/link";
import Image from "next/image";
import { OPERATION_LABELS, PROPERTY_TYPE_LABELS } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import { Badge } from "./ui";

export type PropertyCardData = {
  id: string;
  reference: string;
  title: string;
  type: keyof typeof PROPERTY_TYPE_LABELS;
  operation: keyof typeof OPERATION_LABELS;
  price: string | number;
  city: string;
  district: string;
  bedrooms: number | null;
  bathrooms: number | null;
  surface: number | null;
  furnished: boolean;
  images: { url: string; alt: string | null }[];
};

export function PropertyCard({
  property,
  compatibility,
}: {
  property: PropertyCardData;
  compatibility?: number;
}) {
  const cover = property.images[0];
  return (
    <Link
      href={`/properties/${property.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-navy-100 bg-white transition hover:shadow-[0_16px_40px_rgba(18,35,63,0.12)]"
    >
      <div className="relative aspect-[4/3] bg-navy-50">
        {cover ? (
          <Image
            src={cover.url}
            alt={cover.alt ?? property.title}
            fill
            sizes="(max-width:768px) 100vw, 380px"
            className="object-cover transition group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            Pas de photo
          </div>
        )}
        <div className="absolute left-3 top-3 flex gap-2">
          <Badge tone="navy">{OPERATION_LABELS[property.operation]}</Badge>
          {typeof compatibility === "number" && (
            <Badge tone="gold">{compatibility}% compatible</Badge>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-muted">
          {PROPERTY_TYPE_LABELS[property.type]} · {property.district}, {property.city}
        </div>
        <h3 className="line-clamp-1 font-semibold text-navy-800">{property.title}</h3>
        <div className="text-lg font-extrabold text-bordeaux-600">
          {formatPrice(property.price)}
          {property.operation === "RENT" && (
            <span className="text-xs font-medium text-muted"> /mois</span>
          )}
        </div>
        <div className="mt-auto flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
          {property.bedrooms != null && <span>{property.bedrooms} ch.</span>}
          {property.bathrooms != null && <span>{property.bathrooms} sdb</span>}
          {property.surface != null && <span>{property.surface} m²</span>}
          {property.furnished && <span>Meublé</span>}
          <span className="ml-auto font-mono">{property.reference}</span>
        </div>
      </div>
    </Link>
  );
}
