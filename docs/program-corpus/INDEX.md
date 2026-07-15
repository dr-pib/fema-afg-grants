# FEMA Firefighter Grant Programs — Documentation Corpus

A collected, searchable corpus of the official documentation FEMA publishes for its
three firefighter grant programs, plus a quick-reference of **what each program can
actually fund** (the eligibility taxonomy — the closest structured answer to "what
did/can departments buy" that public sources provide).

## The three programs

| File | Program | Funds, in one line |
|---|---|---|
| [`afg.md`](afg.md) | **AFG** — Assistance to Firefighters Grants | Equipment, PPE, training, wellness, facility mods, and **vehicles/apparatus**. |
| [`safer.md`](safer.md) | **SAFER** — Staffing for Adequate Fire & Emergency Response | **Hiring** career firefighters, and **recruitment/retention** of volunteers. |
| [`fps.md`](fps.md) | **FP&S** — Fire Prevention and Safety | Fire **prevention/community risk reduction**, and firefighter-safety **research**. |

Each program file has three sections: (1) a document inventory (every official doc found, with URL), (2) eligible activities & equipment, and (3) key rules (cost share, eligibility, performance period, application components).

## Quick reference: what the money can fund

This is the eligibility taxonomy from FEMA's own program rules. It does NOT tell you what a *specific* past award bought (that isn't published — see the note below), but it is the authoritative "what's fundable" map.

- **AFG › Operations & Safety** — Equipment · PPE (turnout gear, SCBA) · Wellness & Fitness (medical exams, behavioral health, cancer screening) · Training · Facility modifications (sprinklers, source-capture exhaust).
- **AFG › Vehicle Acquisition** — pumper/engine, aerial, quint, brush, tanker/tender, rescue, ambulance. *(Capped at 25% of available funds; ~10% of that reserved for ambulances.)*
- **AFG › Regional** — shared vehicles, training, wellness across multiple departments.
- **AFG › Micro Grant** — voluntary option for Operations & Safety requests of $75,000 or less.
- **SAFER › Hiring** — salary + benefits for new hires, rehires, or retained firefighters (volunteer/combination depts hire paid firefighters).
- **SAFER › Recruitment & Retention** — marketing, recruit training, leadership development, PPE for new recruits (volunteer/combination depts + interest orgs).
- **FP&S › Prevention** — smoke alarms, public education, code enforcement, wildfire/WUI risk reduction, fire investigation.
- **FP&S › R&D** — firefighter-safety research (universities/research orgs; fire depts not eligible).

## Important limitation (why the corpus, not per-award purposes)

FEMA's award **data** (the OpenFEMA feed this app uses, and USASpending) records only *who got how much, which program, where, and when* — never what was purchased. A dry-run search across 20 Arkansas rural/volunteer awards found a citable purpose for only **1 of 20** (the largest, a pumper/tanker); Arkansas's delegation rarely issues per-award press releases, and department detail lives on login-walled Facebook. So the *program documentation here* is the reliable, structured "what's fundable" source; per-award purpose is not systematically available.

## Getting the actual PDFs

The build environment can't download `fema.gov` files (Akamai blocks its IP), so this corpus captures the **content and links**, not the binaries. To pull the real PDFs onto your own machine:

```bash
cd docs/program-corpus
bash download.sh        # downloads all listed PDFs into ./pdfs/
```

`urls.txt` is the plain list of every document URL if you'd rather grab them another way. Sourcing/verification caveats are noted inline in each program file (some figures came from FEMA search snippets or third-party grant sites because the FEMA PDFs couldn't be opened here — confirm against the primary PDF before relying on a specific number).

*Compiled 2026-07-15.*
