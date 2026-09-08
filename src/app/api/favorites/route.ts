import { route, ok, HttpError, requireApiUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bodySchema = z.object({ propertyId: z.string().min(1) });

export async function GET() {
  return route(async () => {
    const user = await requireApiUser();
    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id },
      include: {
        property: {
          include: { images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1 } },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return ok(
      favorites.map((f) => ({ ...f, property: { ...f.property, price: f.property.price.toString() } })),
    );
  });
}

// Toggle favori.
export async function POST(req: Request) {
  return route(async () => {
    const user = await requireApiUser();
    const { propertyId } = bodySchema.parse(await req.json());

    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) throw new HttpError("Bien introuvable", 404);

    const existing = await prisma.favorite.findUnique({
      where: { userId_propertyId: { userId: user.id, propertyId } },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return ok({ favorited: false });
    }
    await prisma.favorite.create({ data: { userId: user.id, propertyId } });
    return ok({ favorited: true });
  });
}
