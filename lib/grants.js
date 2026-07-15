// Fetches Assistance to Firefighters Grants (AFG) awards from FEMA's OpenFEMA
// API and returns recent awards to volunteer / rural fire departments.
//
// About the endpoint: it is named "NonDisasterAssistanceFirefighterGrants" but
// it actually holds many unrelated non-disaster programs too (Homeland
// Security Grant Program, Emergency Management Performance Grant, even
// Counter-UAS and a FIFA World Cup grant). So we always pin `programName` to
// "Assistance to Firefighters Grants" to get real fire-service awards.
//
// About "rural and volunteer": the records carry no rural or volunteer field.
// Each record only has awardNumber, fiscalYear, programName, vendorState,
// awardAmount, region, and vendorName. The one text signal we have is the
// department's own name, which for these departments is almost always
// self-descriptive ("... VOLUNTEER FIRE DEPARTMENT", "... RURAL FIRE
// PROTECTION DISTRICT"). So we approximate the category by matching those
// words in the name. It is a name-based heuristic, not FEMA's official
// applicant classification, and the UI says so.

const BASE =
  "https://www.fema.gov/api/open/v1/NonDisasterAssistanceFirefighterGrants";

const AFG = "Assistance to Firefighters Grants";

// vendorName is stored uppercase in the dataset, so a plain substring match
// against uppercase words is enough; no case-folding function is needed.
const VOLUNTEER_OR_RURAL =
  "(substringof('VOLUNTEER',vendorName) or substringof('RURAL',vendorName))";

// Only ever build a state clause from a clean two-letter code so nothing
// user-supplied lands inside the filter string verbatim.
export function safeState(state) {
  if (!state) return null;
  const code = String(state).trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : null;
}

function buildFilter(state) {
  const parts = [`programName eq '${AFG}'`, VOLUNTEER_OR_RURAL];
  if (state) parts.push(`vendorState eq '${state}'`);
  return parts.join(" and ");
}

// Returns { grants, total, latestYear, error }.
//   grants     one page of awards, newest and largest first
//   total      count of ALL matching awards, not just this page
//   latestYear most recent fiscalYear in the page (null if empty)
//   error      a short message when the fetch failed (grants is then [])
export async function firefighterGrants({ state = null, top = 50 } = {}) {
  const code = safeState(state);
  const params = new URLSearchParams({
    $format: "json",
    $inlinecount: "allpages",
    $orderby: "fiscalYear desc,awardAmount desc",
    $top: String(top),
    $filter: buildFilter(code),
  });
  const url = `${BASE}?${params.toString()}`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "fema-afg-grants" },
      // Grant data updates a few times a year at most, so cache generously;
      // auto-refreshing tabs and concurrent viewers then share one call.
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      return {
        grants: [],
        total: 0,
        latestYear: null,
        error: `FEMA API ${res.status}`,
      };
    }

    const body = await res.json();
    // Records live under a key named after the entity; fall back to the first
    // array-valued property that is not the metadata envelope.
    const rows =
      body.NonDisasterAssistanceFirefighterGrants ||
      Object.values(body).find((v) => Array.isArray(v)) ||
      [];
    const total = Number(body?.metadata?.count) || rows.length;
    const latestYear =
      rows.reduce((max, r) => Math.max(max, Number(r.fiscalYear) || 0), 0) ||
      null;

    return {
      grants: rows.map((r) => ({
        awardNumber: r.awardNumber,
        fiscalYear: Number(r.fiscalYear) || null,
        vendorName: r.vendorName,
        vendorState: r.vendorState,
        awardAmount: Number(r.awardAmount) || 0,
        region: r.region,
      })),
      total,
      latestYear,
      error: null,
    };
  } catch (e) {
    return {
      grants: [],
      total: 0,
      latestYear: null,
      error: String(e.message || e),
    };
  }
}
