import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { storageMode } from "@/lib/storage";

export async function GET() {
  let db = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = true;
  } catch {
    db = false;
  }
  return NextResponse.json({
    ok: db,
    db,
    storage: storageMode(),
    aiProvider: process.env.AI_PROVIDER || "heuristic",
    time: new Date().toISOString(),
  });
}
