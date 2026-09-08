import "server-only";
import type { NotificationType } from "@prisma/client";
import { prisma } from "./prisma";

type NotifyInput = {
  userId: string;
  type?: NotificationType;
  title: string;
  body?: string;
  link?: string;
};

/** Crée une notification en base (best-effort). */
export async function notify(input: NotifyInput) {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type ?? "SYSTEM",
        title: input.title,
        body: input.body,
        link: input.link,
      },
    });
  } catch (err) {
    console.error("[notify] échec:", err);
  }
}
