import "server-only";
import { criteriaSchema, EMPTY_CRITERIA, type SearchCriteria } from "./criteria";
import { parseHeuristic } from "./heuristic";

type Provider = "heuristic" | "anthropic" | "openai";

function resolveProvider(): Provider {
  const p = (process.env.AI_PROVIDER || "heuristic").toLowerCase();
  if (p === "anthropic" && process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (p === "openai" && process.env.OPENAI_API_KEY) return "openai";
  return "heuristic";
}

const SYSTEM_PROMPT = `Tu extrais des critères de recherche immobilière à Lomé (Togo) depuis une phrase.
Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, avec ces clés :
operation ("RENT"|"SALE"|null), type ("HOUSE"|"APARTMENT"|"STUDIO"|"VILLA"|"LAND"|"SHOP"|"OFFICE"|"WAREHOUSE"|"BUILDING"|"FURNISHED"|null),
city (string|null), district (string|null), minPrice (number|null, en FCFA), maxPrice (number|null, en FCFA),
bedrooms (number|null), bathrooms (number|null), minSurface (number|null, en m2),
furnished (boolean|null), keywords (string[]).
N'invente aucune donnée absente de la phrase : mets null.`;

function safeParseJson(text: string): SearchCriteria {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return { ...EMPTY_CRITERIA };
  try {
    const parsed = criteriaSchema.safeParse(JSON.parse(match[0]));
    return parsed.success ? parsed.data : { ...EMPTY_CRITERIA };
  } catch {
    return { ...EMPTY_CRITERIA };
  }
}

async function callAnthropic(query: string): Promise<SearchCriteria> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: query }],
    }),
  });
  if (!res.ok) throw new Error(`anthropic ${res.status}`);
  const data = await res.json();
  const text = data?.content?.[0]?.text ?? "";
  return safeParseJson(text);
}

async function callOpenAI(query: string): Promise<SearchCriteria> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY!}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: query },
      ],
    }),
  });
  if (!res.ok) throw new Error(`openai ${res.status}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content ?? "";
  return safeParseJson(text);
}

/** Fusionne la sortie LLM avec l'heuristique : l'heuristique comble les trous. */
function merge(primary: SearchCriteria, fallback: SearchCriteria): SearchCriteria {
  const out = { ...fallback };
  for (const key of Object.keys(primary) as (keyof SearchCriteria)[]) {
    const v = primary[key];
    if (key === "keywords") {
      out.keywords = Array.from(new Set([...(fallback.keywords ?? []), ...(primary.keywords ?? [])]));
    } else if (v !== null && v !== undefined) {
      (out[key] as unknown) = v;
    }
  }
  return out;
}

export type ParseResult = { criteria: SearchCriteria; provider: Provider };

/**
 * Transforme une demande naturelle en critères.
 * Toujours un résultat : si le LLM échoue ou n'est pas configuré,
 * on retombe sur l'heuristique.
 */
export async function parseQuery(query: string): Promise<ParseResult> {
  const heuristic = parseHeuristic(query);
  const provider = resolveProvider();
  if (provider === "heuristic") return { criteria: heuristic, provider };

  try {
    const llm = provider === "anthropic" ? await callAnthropic(query) : await callOpenAI(query);
    return { criteria: merge(llm, heuristic), provider };
  } catch (err) {
    console.error("[ai] fallback heuristique:", err);
    return { criteria: heuristic, provider: "heuristic" };
  }
}
