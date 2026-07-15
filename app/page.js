import { firefighterGrants, safeState } from "../lib/grants";

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

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default async function Page({ searchParams }) {
  const activeCode = safeState(searchParams?.state);
  const { grants, total, latestYear, error } = await firefighterGrants({
    state: activeCode,
    top: 50,
  });

  const shownTotal = grants.reduce((s, g) => s + g.awardAmount, 0);
  const activeName = activeCode
    ? STATES.find(([c]) => c === activeCode)?.[1] || activeCode
    : "All states";

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
          <span>Assistance to Firefighters Grants · volunteer &amp; rural</span>
          <span className="tag">OpenFEMA</span>
        </div>
        <p className="desc">
          Recent AFG awards going to <strong>volunteer and rural</strong> fire
          departments, newest and largest first. Handy as a reference for what
          peer departments are winning and how much when putting together an
          application.
        </p>
        <p className="desc">
          Source:{" "}
          <a
            href="https://www.fema.gov/api/open/v1/NonDisasterAssistanceFirefighterGrants"
            target="_blank"
            rel="noreferrer"
          >
            OpenFEMA NonDisasterAssistanceFirefighterGrants ↗
          </a>
          . That dataset also carries unrelated non-disaster programs, so this
          app pins it to the AFG program only. FEMA does not tag records as
          rural or volunteer, so those are matched from the department name (it
          says "VOLUNTEER" or "RURAL"); it is a name-based approximation, not
          FEMA's official applicant category.
        </p>
      </div>

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
              <div className="metric-label">Latest FY</div>
              <div className="metric-value">{latestYear || "—"}</div>
            </div>
          </section>

          <div className="filters">
            <form className="filter-form" method="get">
              <label className="filter-label" htmlFor="state">
                State
              </label>
              <select
                id="state"
                name="state"
                className="select"
                defaultValue={activeCode || ""}
              >
                <option value="">All states</option>
                {STATES.map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
              <button type="submit" className="btn">
                Filter
              </button>
            </form>
            <div className="chips">
              <a
                href="/"
                className={!activeCode ? "chip chip-active" : "chip"}
              >
                All states
              </a>
              <a
                href="/?state=AR"
                className={activeCode === "AR" ? "chip chip-active" : "chip"}
              >
                Arkansas
              </a>
            </div>
          </div>

          <div className="table-wrap">
            <table className="gtable">
              <thead>
                <tr>
                  <th className="num">FY</th>
                  <th>Department</th>
                  <th>State</th>
                  <th className="num">Award</th>
                </tr>
              </thead>
              <tbody>
                {grants.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="gempty">
                      No matching awards for {activeName}.
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
        Data from OpenFEMA · AFG program only · rural/volunteer matched by
        department name · newest &amp; largest first · cached 1h
      </footer>
    </main>
  );
}
