import type { Prisma } from "@prisma/client";
import { route, ok, requireApiRole, getClientIp } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { propertyInputSchema } from "@/lib/validation";
import { generateReference } from "@/lib/property";
import { writeAudit } from "@/lib/audit";

// Recherche publique — ne renvoie QUE des biens publiés.
export async function GET(req: Request) {
  return route(async () => {
    const url = new URL(req.url);
    const p = url.searchParams;
    const where: Prisma.PropertyWhereInput = { status: "PUBLISHED" };
    const operation = p.get("operation");
    const type = p.get("type");
    const district = p.get("district");
    const maxPrice = p.get("maxPrice");
    if (operation === "RENT" || operation === "SALE") where.operation = operation;
    if (type) where.type = type as Prisma.PropertyWhereInput["type"];
    if (district) where.district = { contains: district, mode: "insensitive" };
    if (maxPrice) where.price = { lte: Number(maxPrice) };

    const rows = await prisma.property.findMany({
      where,
      include: { images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] } },
      orderBy: { publishedAt: "desc" },
      take: 100,
    });
    return ok(rows.map((r) => ({ ...r, price: r.price.toString() })));
  });
}

// Création d'un bien par un propriétaire (statut DRAFT).
export async function POST(req: Request) {
  return route(async () => {
    const user = await requireApiRole(["OWNER", "ADMIN", "SUPER_ADMIN"]);
    const data = propertyInputSchema.parse(await req.json());

    const property = await prisma.property.create({
      data: {
        ...data,
        address: data.address || null,
        ownerId: user.id,
        reference: generateReference(data.city),
        status: "DRAFT",
      },
    });

    await writeAudit({
      actorId: user.id,
      action: "property.create",
      entity: "Property",
      entityId: property.id,
      ip: getClientIp(req),
    });

    return ok({ ...property, price: property.price.toString() }, 201);
  });
}
