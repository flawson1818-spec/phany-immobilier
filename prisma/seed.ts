import "dotenv/config";
import { PrismaClient, type PropertyStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const IMG = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=70`;

const HOUSE_IMAGES = [
  IMG("1600585154340-be6161a56a0c"),
  IMG("1600596542815-ffad4c1539a9"),
  IMG("1560518883-ce09059eeffa"),
  IMG("1600607687939-ce8a6c25118c"),
  IMG("1600566753190-17f0baa2a6c3"),
];

async function upsertUser(
  email: string,
  name: string,
  role: "SUPER_ADMIN" | "ADMIN" | "AGENT" | "OWNER" | "CLIENT",
  password: string,
  phone?: string,
) {
  const passwordHash = await bcrypt.hash(password, 12);
  return prisma.user.upsert({
    where: { email },
    update: { name, role, phone },
    create: { email, name, role, phone, passwordHash },
  });
}

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@phany.tg";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "ChangeMoi2026!";
  const demoPassword = "phany2026";

  const admin = await upsertUser(adminEmail, "Administrateur PHANY", "SUPER_ADMIN", adminPassword, "+22890000000");
  const agent = await upsertUser("agent@phany.tg", "Koffi Agent", "AGENT", demoPassword, "+22891111111");
  const owner1 = await upsertUser("proprio1@phany.tg", "Ama Doumé", "OWNER", demoPassword, "+22892222222");
  const owner2 = await upsertUser("proprio2@phany.tg", "Yao Kpatchali", "OWNER", demoPassword, "+22893333333");
  const client = await upsertUser("client@phany.tg", "Elom Amégan", "CLIENT", demoPassword, "+22894444444");

  console.log("Comptes :", { admin: admin.email, agent: agent.email, owner1: owner1.email, client: client.email });

  // Repartir de zéro pour les biens de démo.
  await prisma.propertyImage.deleteMany();
  await prisma.visit.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.property.deleteMany();

  type Seed = {
    ownerId: string;
    title: string;
    type: "HOUSE" | "APARTMENT" | "STUDIO" | "VILLA" | "LAND" | "SHOP" | "OFFICE";
    operation: "RENT" | "SALE";
    price: number;
    district: string;
    bedrooms?: number;
    bathrooms?: number;
    surface?: number;
    furnished?: boolean;
    features: string[];
    description: string;
    status: PropertyStatus;
  };

  const seeds: Seed[] = [
    {
      ownerId: owner1.id,
      title: "Villa 4 chambres avec jardin à Baguida",
      type: "VILLA",
      operation: "RENT",
      price: 450000,
      district: "Baguida",
      bedrooms: 4,
      bathrooms: 3,
      surface: 320,
      features: ["parking", "jardin", "forage", "groupe électrogène", "sécurité"],
      description:
        "Belle villa familiale au calme à Baguida, à 10 minutes de la plage. Grand salon, cuisine équipée, 4 chambres dont une suite parentale, cour spacieuse avec jardin et parking pour 3 véhicules. Forage et groupe électrogène.",
      status: "PUBLISHED",
    },
    {
      ownerId: owner1.id,
      title: "Appartement meublé 2 chambres à Agoè",
      type: "APARTMENT",
      operation: "RENT",
      price: 180000,
      district: "Agoè",
      bedrooms: 2,
      bathrooms: 2,
      surface: 95,
      furnished: true,
      features: ["climatisation", "parking", "eau courante", "carrelage"],
      description:
        "Appartement moderne entièrement meublé au 2e étage, quartier Agoè. Deux chambres climatisées, salon lumineux, cuisine américaine équipée. Idéal expatrié ou jeune cadre. Charges d'eau incluses.",
      status: "PUBLISHED",
    },
    {
      ownerId: owner2.id,
      title: "Studio à louer à Tokoin",
      type: "STUDIO",
      operation: "RENT",
      price: 38000,
      district: "Tokoin",
      bedrooms: 1,
      bathrooms: 1,
      surface: 28,
      features: ["carrelage", "eau courante"],
      description:
        "Studio propre et bien ventilé à Tokoin, proche du CHU. Coin cuisine séparé, douche interne, cour commune sécurisée. Disponible immédiatement. Idéal étudiant ou célibataire.",
      status: "PUBLISHED",
    },
    {
      ownerId: owner2.id,
      title: "Maison 3 chambres à Adidogomé",
      type: "HOUSE",
      operation: "RENT",
      price: 150000,
      district: "Adidogomé",
      bedrooms: 3,
      bathrooms: 2,
      surface: 140,
      features: ["parking", "forage", "terrasse"],
      description:
        "Maison basse de 3 chambres avec salon et salle à manger, à Adidogomé. Cour clôturée, forage, terrasse couverte. Quartier résidentiel calme, accès facile au grand contournement.",
      status: "PUBLISHED",
    },
    {
      ownerId: owner1.id,
      title: "Terrain 600 m² à vendre à Adétikopé",
      type: "LAND",
      operation: "SALE",
      price: 9000000,
      district: "Adétikopé",
      surface: 600,
      features: ["titre foncier"],
      description:
        "Parcelle de 600 m² (20x30) à Adétikopé, dans une zone en plein développement. Titre foncier disponible, terrain plat, viabilisation en cours dans le secteur. Idéal habitation ou investissement.",
      status: "PUBLISHED",
    },
    {
      ownerId: owner2.id,
      title: "Boutique en bordure de route à Nyékonakpoè",
      type: "SHOP",
      operation: "RENT",
      price: 120000,
      district: "Nyékonakpoè",
      surface: 45,
      features: ["rideau métallique", "électricité", "eau courante"],
      description:
        "Local commercial de 45 m² en bordure de voie bitumée à Nyékonakpoè, fort passage. Rideau métallique, compteur électrique dédié, point d'eau. Convient commerce, agence ou restauration.",
      status: "PUBLISHED",
    },
    {
      ownerId: owner1.id,
      title: "Villa haut standing 5 chambres à Baguida (à vérifier)",
      type: "VILLA",
      operation: "SALE",
      price: 85000000,
      district: "Baguida",
      bedrooms: 5,
      bathrooms: 4,
      surface: 480,
      features: ["piscine", "parking", "domotique", "forage"],
      description:
        "Villa contemporaine de standing avec piscine, à finir d'aménager. 5 chambres, bureau, double séjour, cuisine et arrière-cuisine, dépendance. Grand terrain arboré. Dossier en cours de vérification PHANY.",
      status: "PENDING",
    },
  ];

  for (const s of seeds) {
    const ref = `PHANY-LOM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const property = await prisma.property.create({
      data: {
        reference: ref,
        ownerId: s.ownerId,
        title: s.title,
        type: s.type,
        operation: s.operation,
        price: s.price,
        city: "Lomé",
        district: s.district,
        bedrooms: s.bedrooms ?? null,
        bathrooms: s.bathrooms ?? null,
        surface: s.surface ?? null,
        furnished: s.furnished ?? false,
        features: s.features,
        description: s.description,
        status: s.status,
        publishedAt: s.status === "PUBLISHED" ? new Date() : null,
        reviewedById: s.status === "PUBLISHED" ? admin.id : null,
        reviewedAt: s.status === "PUBLISHED" ? new Date() : null,
      },
    });

    const imgs = s.type === "LAND" ? HOUSE_IMAGES.slice(4) : HOUSE_IMAGES.slice(0, 4);
    await prisma.propertyImage.createMany({
      data: imgs.map((url, i) => ({
        propertyId: property.id,
        url,
        isPrimary: i === 0,
        sortOrder: i,
      })),
    });
  }

  // Une visite de démo.
  const firstPublished = await prisma.property.findFirst({ where: { status: "PUBLISHED" } });
  if (firstPublished) {
    await prisma.visit.create({
      data: {
        propertyId: firstPublished.id,
        clientId: client.id,
        status: "REQUESTED",
        note: "Disponible en fin de semaine, de préférence le matin.",
      },
    });
  }

  console.log("Seed terminé :", seeds.length, "biens créés.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
