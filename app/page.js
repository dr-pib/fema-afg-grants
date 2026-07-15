import {
  firefighterGrants,
  latestFiscalYear,
  safeState,
  PROGRAMS,
  PROGRAM_LABELS,
  SORTS,
  MIN_AMOUNTS,
  PAGE_SIZES,
} from "../lib/grants";

export const dynamic = "force-dynamic";

// US states + DC for the picker.
const STATES = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"],
  ["CA", "California"], ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"],
  ["DC", "District of Columbia"], ["FL", "Florida"], ["GA", "Georgia"], ["HI", "Hawaii"],
  ["ID", "Idaho"], ["IL", "Illinois"], ["IN", "Indiana"], ["IA", "Iowa"],
  ["KS", "Kansas"], ["KY", "Kentucky"], ["LA", "Louisiana"], ["ME", "Maine"],
  ["MD", "Maryland"], ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"],
  ["MS", "Mississippi"], ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"],
  ["NV", "Nevada"], ["NH", "New Hampshire"], ["NJ", "New Jersey"], ["NM", "New Mexico"],
  ["NY", "New York"], ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"],
  ["OK", "Oklahoma"], ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"],
  ["SC", "South Carolina"], ["SD", "South Dakota"], ["TN", "Tennessee"], ["TX", "Texas"],
  ["UT", "Utah"], ["VT", "Vermont"], ["VA", "Virginia"], ["WA", "Washington"],
  ["WV", "West Virginia"], ["WI", "Wisconsin"], ["WY", "Wyoming"],
];

const PROGRAM_OPTIONS = [
  ["", "All firefighter programs"],
  ["AFG", "AFG — equipment, apparatus, PPE"],
  ["SAFER", "SAFER — staffing & recruitment"],
  ["FPS", "FP&S — prevention & wellness"],
];

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const FIRST_YEAR = 2001;

export default async function Page({ searchParams }) {
  const sp = searchParams || {};

  // Parse + validate inputs.
  const program = PROGRAMS[sp.program] ? sp.program : null;
  const state = safeState(sp.state);
  const yearNum = Number.parseInt(sp.year, 10);
  const year = Number.isInteger(yearNum) ? yearNum : null;
  const minAmount = MIN_AMOUNTS.some((m) => m.value === Number(sp.min))
    ? Number(sp.min)
    : 0;
  const query = typeof sp.q === "string" ? sp.q : "";
  const includeAll = sp.all === "1";
  const ruralVolunteer = !includeAll;
  const sort = SORTS[sp.sort] ? sp.sort : "year_desc";
  const top = PAGE_SIZES.includes(Number(sp.top)) ? Number(sp.top) : 50;

  const [{ grants, total, error }, latestYear] = await Promise.all([
    firefighterGrants({
      program,
      state,
      year,
      minAmount,
      query,
      ruralVolunteer,
      sort,
      top,
    }),
    latestFiscalYear(),
  ]);

  const maxYear = latestYear || 2024;
  const years = [];
  for (let y = maxYear; y >= FIRST_YEAR; y--) years.push(y);

  const shownTotal = grants.reduce((s, g) => s + g.awardAmount, 0);
  const anyFilter =
    program || state || year || minAmount || query || includeAll || sort !== "year_desc";

  return (
    <main className="wrap">
      <header className="topbar">
        <div className="title">
          <span className="logo">🚒</span>
          <span>FEMA AFG Grants</span>
        </div>
        <a
          className="how-link"
          href="https://www.fema.gov/grants/preparedness/firefighters"
          target="_blank"
          rel="noreferrer"
        >
          About AFG ↗
        </a>
      </header>

      <div className="intro">
        <div className="intro-head">
          <span>Firefighter grant awards · volunteer &amp; rural</span>
          <span className="tag">OpenFEMA</span>
        </div>
        <p className="desc">
          Search FEMA firefighter grant awards from{" "}
          <a
            href="https://www.fema.gov/api/open/v1/NonDisasterAssistanceFirefighterGrants"
            target="_blank"
            rel="noreferrer"
          >
            OpenFEMA ↗
          </a>
          . Three programs are covered: <strong>AFG</strong> (equipment,
          apparatus, PPE), <strong>SAFER</strong> (staffing &amp; volunteer
          recruitment), and <strong>FP&amp;S</strong> (fire prevention &amp;
          firefighter wellness). Defaults to <strong>rural and volunteer</strong>{" "}
          departments.
        </p>
        <p className="desc">
          Two caveats, so the numbers are honest: the feed has no official
          rural/volunteer flag, so that filter matches the department name
          (it says "VOLUNTEER" or "RURAL") — a good approximation, not FEMA's
          category. And the feed carries no county or per-award activity detail
          (e.g. a specific vehicle vs turnout gear vs a wellness program), so
          program is the closest "type" you can filter by here.
        </p>
      </div>

      <form className="filterbar" method="get">
        <div className="field">
          <label htmlFor="program">Program / type</label>
          <select id="program" name="program" className="select" defaultValue={program || ""}>
            {PROGRAM_OPTIONS.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="state">State</label>
          <select id="state" name="state" className="select" defaultValue={state || ""}>
            <option value="">All states</option>
            {STATES.map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="year">Fiscal year</label>
          <select id="year" name="year" className="select" defaultValue={year || ""}>
            <option value="">All years</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="min">Min award</label>
          <select id="min" name="min" className="select" defaultValue={String(minAmount)}>
            {MIN_AMOUNTS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="sort">Sort by</label>
          <select id="sort" name="sort" className="select" defaultValue={sort}>
            {Object.entries(SORTS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>

        <div className="field field-wide">
          <label htmlFor="q">Search department</label>
          <input
            id="q"
            name="q"
            type="text"
            className="input"
            placeholder="e.g. CAPPS, TOWNSHIP, COUNTY…"
            defaultValue={query}
            maxLength={60}
          />
        </div>

        <div className="field">
          <label htmlFor="top">Show</label>
          <select id="top" name="top" className="select" defaultValue={String(top)}>
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>{n} rows</option>
            ))}
          </select>
        </div>

        <label className="checkline" htmlFor="all">
          <input id="all" name="all" type="checkbox" value="1" defaultChecked={includeAll} />
          Include all departments (not just rural/volunteer)
        </label>

        <div className="actions">
          <button type="submit" className="btn btn-primary">Apply filters</button>
          <a className="how-link" href="/">Reset</a>
          <a className="how-link" href="/?state=AR">Arkansas</a>
        </div>
      </form>

      {error ? (
        <div className="error-card">
          <div className="error-title">Could not load grants</div>
          <p className="desc">
            {error}. The FEMA API may be down or rate limiting; try again in a
            bit.
          </p>
        </div>
      ) : (
        <>
          <section className="summary">
            <div className="metric">
              <div className="metric-label">Matching awards</div>
              <div className="metric-value">{total.toLocaleString("en-US")}</div>
            </div>
            <div className="metric">
              <div className="metric-label">Showing</div>
              <div className="metric-value">{grants.length}</div>
            </div>
            <div className="metric">
              <div className="metric-label">Shown total</div>
              <div className="metric-value">{usd.format(shownTotal)}</div>
            </div>
            <div className="metric">
              <div className="metric-label">Rows sorted by</div>
              <div className="metric-value metric-sm">{SORTS[sort].label}</div>
            </div>
          </section>

          <div className="table-wrap">
            <table className="gtable">
              <thead>
                <tr>
                  <th className="num">FY</th>
                  <th>Department</th>
                  <th>State</th>
                  <th>Type</th>
                  <th className="num">Award</th>
                </tr>
              </thead>
              <tbody>
                {grants.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="gempty">
                      No matching awards{anyFilter ? " for these filters" : ""}.
                    </td>
                  </tr>
                ) : (
                  grants.map((g) => (
                    <tr key={g.awardNumber}>
                      <td className="num">{g.fiscalYear || "—"}</td>
                      <td>
                        <div className="gdept">{g.vendorName}</div>
                        <div className="gaward">{g.awardNumber}</div>
                      </td>
                      <td>{g.vendorState || "—"}</td>
                      <td>
                        <span className={`badge badge-${g.program || "x"}`}>
                          {g.program ? PROGRAM_LABELS[g.program] : "—"}
                        </span>
                      </td>
                      <td className="num gamt">{usd.format(g.awardAmount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      <footer className="foot muted">
        Data from OpenFEMA · AFG / SAFER / FP&amp;S programs · rural/volunteer
        matched by department name · cached 1h
      </footer>
    </main>
  );
}
