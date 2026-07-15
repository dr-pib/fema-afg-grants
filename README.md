# fema-afg-grants

A small Next.js app for searching recent **FEMA firefighter grant awards**,
defaulting to **volunteer and rural** departments. A reference for what peer
departments are winning and how much when putting together a grant application.

## Data source and caveats

Data comes from the OpenFEMA
[`NonDisasterAssistanceFirefighterGrants`](https://www.fema.gov/api/open/v1/NonDisasterAssistanceFirefighterGrants)
endpoint. The authoritative field list (from OpenFEMA's own
`OpenFemaDataSetFields`) is exactly: `awardNumber, fiscalYear, programName,
programAbbreviation, vendorState, awardAmount, region, vendorName, id`.

Things worth knowing, all surfaced in the app itself:

1. **The endpoint is misnamed.** Despite "FirefighterGrants," it also holds
   unrelated non-disaster programs (Homeland Security Grant Program, EMPG,
   Counter-UAS, even a FIFA World Cup grant). The app restricts to the three
   genuine firefighter programs:
   - **AFG** — Assistance to Firefighters Grants (equipment, apparatus, PPE)
   - **SAFER** — Staffing for Adequate Fire & Emergency Response (staffing,
     volunteer recruitment/retention)
   - **FP&S** — Fire Prevention and Safety (prevention + firefighter wellness)
2. **No rural/volunteer field.** The feed has no official career/volunteer or
   rural/urban classification, so "rural and volunteer" is approximated by
   matching the department name (`VOLUNTEER` / `RURAL`). It is a name-based
   heuristic, not FEMA's category.
3. **No county or per-award activity.** The feed carries no county, city, or
   zip, and no fine-grained AFG activity (e.g. a specific vehicle vs turnout
   gear vs a wellness program). Program is the closest "type" axis available
   here. County/activity would need a different data source.

## Filtering vs sorting

- **Filters** (narrow the set): program/type, state, fiscal year, minimum
  award size, rural/volunteer-only toggle, and a department-name search.
- **Sort** (order the set): newest first, largest award, smallest award, or
  department A to Z. Award size is offered both ways: as a minimum-amount
  filter and as a sort.

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
```

- `lib/grants.js` builds the OpenFEMA query (validated/sanitized inputs, 1h
  cache) and exposes the program, sort, and amount option lists.
- `app/page.js` is the explorer: a filter bar, summary tiles, and the awards
  table with a program-type badge.
