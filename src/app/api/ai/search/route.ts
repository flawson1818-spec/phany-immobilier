import { route, ok, fail, getClientIp } from "@/lib/api";
import { aiSearchSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { runAiSearch } from "@/lib/ai/search";

export async function POST(req: Request) {
  return route(async () => {
    const ip = getClientIp(req);
    if (!rateLimit(`ai:${ip}`, 20, 60 * 1000).ok) {
      return fail("Trop de recherches. Patientez une minute.", 429);
    }

    const { query } = aiSearchSchema.parse(await req.json());
    const result = await runAiSearch(query);
    return ok(result);
  });
}
