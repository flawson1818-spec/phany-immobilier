import { LOME_DISTRICTS } from "../constants";
import { EMPTY_CRITERIA, type SearchCriteria } from "./criteria";

/** Retire les accents pour comparer de façon tolérante. */
function deburr(s: string) {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

const TYPE_PATTERNS: [RegExp, SearchCriteria["type"]][] = [
  [/\bvillas?\b/, "VILLA"],
  [/\bstudios?\b/, "STUDIO"],
  [/\bapparts?\b|\bappartements?\b/, "APARTMENT"],
  [/\bterrains?\b|\bparcelles?\b/, "LAND"],
  [/\bboutiques?\b|\bmagasins?\b|\blocal commercial\b/, "SHOP"],
  [/\bbureaux?\b|\boffice\b/, "OFFICE"],
  [/\bentrepots?\b|\bhangars?\b/, "WAREHOUSE"],
  [/\bimmeubles?\b/, "BUILDING"],
  [/\bmeublees?\b|\bmeuble\b/, "FURNISHED"],
  [/\bmaisons?\b/, "HOUSE"],
];

const KEYWORDS = [
  "parking",
  "garage",
  "piscine",
  "jardin",
  "climatisation",
  "clim",
  "groupe electrogene",
  "forage",
  "securite",
  "gardien",
  "terrasse",
  "balcon",
  "chauffe-eau",
  "carrelage",
  "eau courante",
  "electricite",
  "meuble",
];

function parseAmount(raw: string): number | null {
  const lower = raw.toLowerCase();
  const cleaned = lower.replace(/[\s.]/g, "").replace(/,/g, ".").replace(/fcfa|xof|f$/g, "");
  let value = parseFloat(cleaned);
  if (Number.isNaN(value)) return null;
  if (/million|\bm\b/.test(lower)) value *= 1_000_000;
  else if (/\bk\b/.test(lower)) value *= 1_000;
  return Math.round(value);
}

/**
 * Parseur heuristique : aucune dépendance externe, fonctionne hors-ligne.
 * Ne renvoie que des critères de filtrage — jamais un bien inventé.
 */
export function parseHeuristic(query: string): SearchCriteria {
  const q = deburr(query);
  const c: SearchCriteria = { ...EMPTY_CRITERIA, keywords: [] };

  if (/\b(vente|acheter|achat|a vendre)\b/.test(q)) c.operation = "SALE";
  else if (/\b(location|louer|a louer|bail|mensuel|par mois|\/mois)\b/.test(q)) c.operation = "RENT";

  for (const [re, type] of TYPE_PATTERNS) {
    if (re.test(q)) {
      c.type = type;
      break;
    }
  }

  if (/\bnon\s+meuble/.test(q)) c.furnished = false;
  else if (/\bmeuble/.test(q)) c.furnished = true;

  const district = LOME_DISTRICTS.find((d) => q.includes(deburr(d)));
  if (district) c.district = district;
  if (/\blome\b/.test(q)) c.city = "Lomé";

  const bed = q.match(/(\d+)\s*(?:chambres?|ch\b|pieces?)/);
  if (bed) c.bedrooms = Number(bed[1]);

  const bath = q.match(/(\d+)\s*(?:salles?)\s*(?:de\s*bain|d[' ]?eau|douche)/);
  if (bath) c.bathrooms = Number(bath[1]);

  const surf = q.match(/(\d+(?:[.,]\d+)?)\s*(?:m2|m²|metres?\s*carr)/);
  if (surf) c.minSurface = Math.round(parseFloat(surf[1]!.replace(",", ".")));

  const max = q.match(
    /(?:max(?:imum)?|budget|moins de|jusqu a|au plus|plafond)\D{0,6}([\d\s.,]+(?:\s*(?:millions?|k))?)/,
  );
  if (max) c.maxPrice = parseAmount(max[1]!);

  const min = q.match(
    /(?:min(?:imum)?|a partir de|au moins)\D{0,6}([\d\s.,]+(?:\s*(?:millions?|k))?)/,
  );
  if (min) c.minPrice = parseAmount(min[1]!);

  if (c.maxPrice == null && c.minPrice == null) {
    const lone = q.match(/([\d][\d\s.]{2,})\s*(?:fcfa|xof|f)\b/);
    if (lone) c.maxPrice = parseAmount(lone[1]!);
  }

  c.keywords = KEYWORDS.filter((k) => {
    if (k === "meuble" && c.furnished === false) return false;
    return q.includes(k);
  });

  return c;
}
