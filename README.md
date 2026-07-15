# fema-afg-grants

A small Next.js app that surfaces recent **FEMA Assistance to Firefighters
Grants (AFG)** awarded to **volunteer and rural** fire departments. It's a
reference for what peer departments are winning and how much when putting
together a grant application.

## Data source and caveats

Data comes from the OpenFEMA
[`NonDisasterAssistanceFirefighterGrants`](https://www.fema.gov/api/open/v1/NonDisasterAssistanceFirefighterGrants)
endpoint. Two things worth knowing (both surfaced in the app itself):

1. **The endpoint is misnamed.** Despite "FirefighterGrants," it actually
   holds many unrelated non-disaster programs (Homeland Security Grant
   Program, EMPG, Counter-UAS, even a FIFA World Cup grant). The app pins
   `programName eq 'Assistance to Firefighters Grants'` to get real
   fire-service awards.
2. **There is no rural/volunteer field.** A record only carries
   `awardNumber, fiscalYear, programName, vendorState, awardAmount, region,
   vendorName`. So "rural and volunteer" is approximated by matching the
   department's own name (`VOLUNTEER` / `RURAL`), which for these departments
   is almost always self-descriptive. It is a name-based heuristic, not FEMA's
   official applicant category.

The most recent fiscal year in the AFG data is 2024.

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
```

- `lib/grants.js` fetches and filters the AFG data (state filter, 1h cache).
- `app/page.js` is the explorer: summary tiles, a state picker (Arkansas is a
  quick chip), and a table of awards, newest and largest first.
