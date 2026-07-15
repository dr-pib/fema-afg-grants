// Fetches firefighter grant awards from FEMA's OpenFEMA API and returns them
// filtered/sorted for the explorer.
//
// About the endpoint: it is named "NonDisasterAssistanceFirefighterGrants" but
// it actually holds several unrelated non-disaster programs too (Homeland
// Security Grant Program, Emergency Management Performance Grant, Counter-UAS,
// even a FIFA World Cup grant). So we always restrict to the three genuine
// firefighter programs below.
//
// The three firefighter programs (this is our "type" axis, since the feed has
// no per-award activity field like "vehicle" vs "PPE" vs "wellness"):
//   AFG   Assistance to Firefighters Grants        equipment, apparatus, PPE, ops
//   SAFER Staffing for Adequate Fire & Emergency   staffing, volunteer recruit/retain
//   FPS   Fire Prevention and Safety               prevention + firefighter wellness
//
// What the feed does NOT have: county, city/zip, congressional district, the
// fine-grained AFG activity, and any official career/volunteer or rural/urban
// classification. Each record only carries awardNumber, fiscalYear,
// programName, vendorState, awardAmount, region, vendorName. So "rural and
// volunteer" is approximated by matching those words in the department's own
// name (nearly always self-descriptive), and the UI says so.

const BASE =
  "https://www.fema.gov/api/open/v1/NonDisasterAssistanceFirefighterGrants";

// key -> exact programName string in the dataset.
export const PROGRAMS = {
  AFG: "Assistance to Firefighters Grants",
  SAFER: "Staffing for Adequate Fire and Emergency Response (SAFER)",
  FPS: "Fire Prevention and Safety",
};

// Short labels for the UI (table badge / dropdown).
export const PROGRAM_LABELS = {
  AFG: "AFG",
  SAFER: "SAFER",
  FPS: "FP&S",
};

const FIREFIGHTER_PROGRAMS = Object.values(PROGRAMS);

export const SORTS = {
  year_desc: { label: "Newest first", odata: "fiscalYear desc,awardAmount desc" },
  amount_desc: { label: "Largest award", odata: "awardAmount desc,fiscalYear desc" },
  amount_asc: { label: "Smallest award", odata: "awardAmount asc,fiscalYear desc" },
  name_asc: { label: "Department A–Z", odata: "vendorName asc,fiscalYear desc" },
};

export const MIN_AMOUNTS = [
  { value: 0, label: "Any amount" },
  { value: 50000, label: "$50k+" },
  { value: 100000, label: "$100k+" },
  { value: 250000, label: "$250k+" },
  { value: 500000, label: "$500k+" },
  { value: 1000000, label: "$1M+" },
];

export const PAGE_SIZES = [50, 100, 200];

// OData string literals escape a single quote by doubling it.
function odataStr(s) {
  return String(s).replace(/'/g, "''");
}

// Only ever build a state clause from a clean two-letter code.
export function safeState(state) {
  if (!state) return null;
  const code = String(state).trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : null;
}

// Map a full programName back to a short key/label.
export function programKey(name) {
  for (const [key, full] of Object.entries(PROGRAMS)) {
    if (full === name) return key;
  }
  if (name && name.includes("SAFER")) return "SAFER";
  return null;
}

// Normalize a free-text department search into something safe for substringof:
// data is uppercase, so uppercase the query, drop odd characters, cap length.
function cleanQuery(q) {
  if (!q) return "";
  return String(q)
    .toUpperCase()
    .replace(/[^A-Z0-9 &.\-/]/g, "")
    .trim()
    .slice(0, 60);
}

function programClause(program) {
  if (program && PROGRAMS[program]) {
    return `programName eq '${odataStr(PROGRAMS[program])}'`;
  }
  // All firefighter programs (excludes the non-firefighter noise).
  return `(${FIREFIGHTER_PROGRAMS.map(
    (p) => `programName eq '${odataStr(p)}'`,
  ).join(" or ")})`;
}

function buildFilter({ program, state, year, minAmount, query, ruralVolunteer }) {
  const parts = [programClause(program)];

  if (ruralVolunteer) {
    parts.push(
      "(substringof('VOLUNTEER',vendorName) or substringof('RURAL',vendorName))",
    );
  }
  if (state) parts.push(`vendorState eq '${state}'`);
  if (Number.isInteger(year)) parts.push(`fiscalYear eq ${year}`);
  if (minAmount > 0) parts.push(`awardAmount ge ${minAmount}`);
  if (query) parts.push(`substringof('${odataStr(query)}',vendorName)`);

  return parts.join(" and ");
}

// Returns { grants, total, error }.
//   grants  one page of awards in the requested order
//   total   count of ALL matching awards, not just this page
//   error   a short message when the fetch failed (grants is then [])
export async function firefighterGrants({
  program = null,
  state = null,
  year = null,
  minAmount = 0,
  query = "",
  ruralVolunteer = true,
  sort = "year_desc",
  top = 50,
} = {}) {
  const filter = buildFilter({
    program: PROGRAMS[program] ? program : null,
    state: safeState(state),
    year: Number.isInteger(year) ? year : null,
    minAmount: Number(minAmount) > 0 ? Number(minAmount) : 0,
    query: cleanQuery(query),
    ruralVolunteer: !!ruralVolunteer,
  });
  const orderby = (SORTS[sort] || SORTS.year_desc).odata;
  const pageSize = PAGE_SIZES.includes(Number(top)) ? Number(top) : 50;

  const params = new URLSearchParams({
    $format: "json",
    $inlinecount: "allpages",
    $orderby: orderby,
    $top: String(pageSize),
    $filter: filter,
  });

  try {
    const res = await fetch(`${BASE}?${params.toString()}`, {
      headers: { "User-Agent": "fema-afg-grants" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      return { grants: [], total: 0, error: `FEMA API ${res.status}` };
    }
    const body = await res.json();
    const rows = pickRows(body);
    const total = Number(body?.metadata?.count) || rows.length;

    return {
      grants: rows.map((r) => ({
        awardNumber: r.awardNumber,
        fiscalYear: Number(r.fiscalYear) || null,
        vendorName: r.vendorName,
        vendorState: r.vendorState,
        awardAmount: Number(r.awardAmount) || 0,
        program: programKey(r.programName),
        programName: r.programName,
      })),
      total,
      error: null,
    };
  } catch (e) {
    return { grants: [], total: 0, error: String(e.message || e) };
  }
}

// Most recent fiscalYear across the firefighter programs, for the year picker.
// Cached like the main query; returns null if the API is unreachable.
export async function latestFiscalYear() {
  const params = new URLSearchParams({
    $format: "json",
    $select: "fiscalYear",
    $orderby: "fiscalYear desc",
    $top: "1",
    $filter: programClause(null),
  });
  try {
    const res = await fetch(`${BASE}?${params.toString()}`, {
      headers: { "User-Agent": "fema-afg-grants" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const rows = pickRows(await res.json());
    return Number(rows[0]?.fiscalYear) || null;
  } catch {
    return null;
  }
}

// Records live under a key named after the entity; fall back to the first
// array-valued property that is not the metadata envelope.
function pickRows(body) {
  return (
    body?.NonDisasterAssistanceFirefighterGrants ||
    Object.values(body || {}).find((v) => Array.isArray(v)) ||
    []
  );
}
