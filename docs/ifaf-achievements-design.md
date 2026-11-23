# IFAF records and GAINS

A public system of record for Irish Field Archery Federation records and GAINS awards. Members look up a target score, officers ratify results, and the competition app submits scores through that same ratification.

Sources, read 11 Nov 2026: the GAINS workbook, the records workbook, `piotrberlowski/arc-comp` on main, and the Neon and Prisma Postgres pricing pages.

## Recommendation

Use **Neon Free** as the database and **Prisma ORM** as the only data access layer. Sign in with **Better Auth**, Google and Auth0. Host a new Next.js app on Vercel.

Prisma Postgres Free is the weaker fit for a system of record. It has no backups on the free plan, and it stops accepting queries for the rest of the month at 200,000 operations. Neon Free includes a 6-hour restore window, preview branches, and a native Vercel attachment. This corpus is a few thousand rows, so Neon’s 1 GB cap does not matter. Cache the public pages so the database can scale to zero inside 100 CU-hours. Keep the URL in `DB_POSTGRES_PRISMA_URL` so a later move is a connection-string change.

Vercel Hobby is for personal, non-commercial use. An official federation site may need Pro. If the free compute ceiling becomes real, Neon Launch is pay-per-CU-hour and does not change the schema.

## What the workbooks contain

| Measure | Count |
| --- | --- |
| Numeric GAINS scores | 7,746 |
| Membership numbers | 608 |
| Standing records | 853 |
| Class codes | 144 (12 bow styles by 6 age divisions by 2 genders) |

GAINS is a score ledger: archers down the side, competitions across the top, dated 2022–2026. Records are the current holder, score, and date for one round, bow style, age division, and gender. Earlier holders are not in the file. Star, Gold, Silver, and Bronze are 90%, 80%, 70%, and 50% of the standing record.

| Family | Numeric scores | Standing records |
| --- | --- | --- |
| Bowhunter (UAR, 3D Standard, 3D Hunting) | 5,144 | 409 animal-round holders, including SBG |
| Indoor (Flint and Indoor) | 1,469 | 147 |
| Field (Field, Hunter, Marked Animal) | 925 | 297 target-outdoor holders |
| Standard Big Game | 208 | Included in the 409 |

Expert and International have records and cutoffs, and no GAINS score cells in this extract. Dates are Excel serials, day/month text, or a label with no calendar day, such as `EBHC 2026`.

| Workbook fact | What the system stores |
| --- | --- |
| One row per membership number and class code | A person has many class careers. Awards stay on the class that was shot. |
| 79 numbers have more than one spelling; 32 have more than one surname | A new surname with the same given name is a former name. Two given names on one number are two archers, so the workbook has one number per archer before import. The workbook writes `IRE_` in front of the membership number; the stored number does not. |
| Tracker cells such as `GOLD,g,g` and `b` | The membership secretary’s note of pins already handed out. A pin on that list is not handed out again in the same class and track. |
| Lower case is a qualifying score; capitals are a pin | Persist the band and the pin. One gold-band score is not yet a Gold award. |
| RIP, LEGEND, and quoted nicknames sit in the name cell | Official name is separate from a note. |
| Records include UKIFAC, EBHC, WBHC, EIAC, and club shoots | Every approved score competes for the record of its round type. A GAINS competition also feeds the award track. A record-only event does not. |

## Domain

The award key is **person + age division + gender + bow style + award track**. A written class code combines those three parts (`AFFS-R`, `AMFU`). There are three award tracks: Indoor, Animal, and Field. A score is banded against the record for its own round, then the band is spent inside that track. A Field Gold and a Hunter Gold are one Gold pin on the Field track.

| Entity | Holds | Written by |
| --- | --- | --- |
| Person, PersonName | Membership number is unique per person. The official name is one full-name string, the latest approved name. Each earlier name is kept the same way, with who approved the change and when | Import and a secretary name change |
| BowStyle | 12 styles | Seed |
| AgeDivision | Cub, Junior, Young Adult, Adult, Veteran, Senior. The written prefix is this code plus `M` or `F`, and the longest age code wins (`YA` before `A`) | Seed |
| Round, AwardTrack | 11 live rounds plus archived SBG, each round on one of Indoor, Animal, or Field | Seed |
| Competition | One round of archers at one range. Name, date, and round. A second day or a second round type is another competition. An undated meet keeps the name, such as `EBHC 2026`, and has no date. `countsForGains` is false for a record-only event | Import and API |
| ScoreSubmission | One competition’s entries, still pending. The external id belongs here, so a replay returns this submission | Secretary and API |
| Score | The approved integer for one person at one competition, referencing that score’s bow style, age division, and gender. The round and the date come from the competition. The band is calculated from the record in force that day | Approval of the submission, or a later amendment |
| Record standing | A view of the scores that set a record, refreshed after each score is written or voided. The standing record is the highest score for one round, bow style, age division, and gender. An imported record is a competition with one score, even when the event was external and only one archer is known | Read from scores |
| GAINS award | One pin per person, bow style, age division, gender, track, and level. `pending` until the pin is handed out, then `issued`, with the issue date when it is known | Engine, and the secretary’s tracker |
| Permission | A capability granted to a signed-in account: `system.admin`, `claims.approve`, `names.approve`, `submissions.approve`, or `integrations.manage` | System administrator |
| MembershipClaim | A request to attach a sign-in account to a membership number | Archer, then an account with `claims.approve` |
| IntegrationClient | One competition app. The issued credential, stored as the certificate fingerprint or a secret hash. The private key is shown once and is not kept | Account with `integrations.manage` |

Scores are append-only. An amendment voids the original score and writes a replacement. The standing record is a view over the scores. Pins are stored, each one pending or issued.

### Class codes

The first nine bow styles line up in both workbooks. Longbow, Historical Bow, and Traditional are matched by abbreviation, because the sheets order those three differently. Confirm this against the federation class list before the seed is official. A written code is the age code plus `M` or `F` plus the bow-style code. The database stores those three parts on the score and the award. The 144 codes are that product, and they are not rows.

| Code | Bow style | Class code |
| --- | --- | --- |
| BB-R | Barebow Recurve | Age prefix plus code. Prefixes: SM SF VM VF AM AF YAM YAF JM JF CM CF |
| BB-C | Barebow Compound | Same 12 prefixes |
| FS-R | Freestyle Limited Recurve | `AFFS-R` is Adult Female |
| FS-C | Freestyle Limited Compound | Hyphen stays |
| FU | Freestyle Unlimited | Concatenated: `AMFU` |
| BH-R | Bowhunter Recurve | Hyphen stays |
| BH-C | Bowhunter Compound | Hyphen stays |
| BL | Bowhunter Limited | `AMBL` |
| BU | Bowhunter Unlimited | `AMBU` |
| LB | Longbow | `AMLB` |
| HB | Historical Bow | `AMHB` |
| TR | Traditional Recurve | `AMTR`. `AMTR(IFAF)` normalises to `AMTR` |

### Rounds

| Code | Round | Award track |
| --- | --- | --- |
| FLINT | Flint | Indoor |
| INDOOR | IFAA Indoor | Indoor |
| SBG | Standard Big Game | Animal |
| SBG_ARCHIVED | SBG old format, display only | Animal |
| UAR | Unmarked animal | Animal |
| 3D_STD | 3-D Standard, 2 arrows | Animal |
| 3D_HUNT | 3-D Hunting, 1 arrow | Animal |
| FIELD | Field | Field |
| HUNTER | Hunter | Field |
| MAR | Marked Animal | Field |
| EXPERT | Expert Field | Field |
| INTL | International | Field |

## Rules

These sentences are in the GAINS Info sheet.

- A pin needs two scores in the same band. One qualifying score stays unpaired and is shown as progress.
- Bands are 90, 80, 70, and 50 percent of the IFAF record. An integer score clears a cutoff when it is greater than or equal. 186 clears 185.4. Bronze and Silver are strict bands: a score takes the highest band it clears, and a Gold score is not a Silver or Bronze score.
- HOTSHOT is eight scores that classify as Gold on that track.
- Each pin is handed out once per shooting class and track. A Gold already handed out is not handed out again in that category. The same applies to Bronze, Silver, Hotshot, and Star.
- STAR is two scores at 90% or better, and only after HOTSHOT. Until that pin can be handed out, those scores qualify as Gold. They count toward the one Gold pin and toward the eight scores for Hotshot.
- Scores carry across the calendar year inside a class and track. A class change starts a new career.
- A score is classified once, against the record for that round type on the date it was shot. A later record does not change that band. The band is spent on the round’s track: Indoor, Animal, or Field.
- A new record takes effect on the day it was shot. Its cutoffs are 90, 80, 70, and 50 percent of that score, and they apply only to scores shot on or after that day.
- A tie does not beat a record. An equal score is kept and can still classify for GAINS, and the holder and the cutoffs stay as they are.

## Who uses it

| Person | Route | Gate |
| --- | --- | --- |
| Archer setting a goal | `/gains?round=field&class=AMBH-R` | Public |
| Archer | `/archers/22008` for any member. `/me` after an account with `claims.approve` accepts that account’s claim | Public page, or an approved membership claim for `/me` |
| Archer checking records held | The same archer page | Public |
| Submission reviewer | `/review?status=pending`. Upload a result, modify a submission, approve the whole submission, or amend an official entry | Permission `submissions.approve` |
| Anyone | `/changelog`, and `/changelog/2026-11-14` for one day | Public |
| PRO | Sends the public link for a day’s changelog, `/changelog/2026-11-14` | Public page |
| System administrator | `/admin`. Grants and revokes permissions on other accounts, and can issue competition-app credentials | Permission `system.admin`, bootstrapped from `SYSTEM_ADMIN_EMAILS` |
| Competition app | `POST /api/v1/tournaments` with the full tournament as JSON | Issued credential, for example an mTLS client certificate. The submission stays pending |

Every public filter is a query string, so a support reply is a link. Public pages cache for an hour and refresh when a secretary approves a submission or amends an entry.

## Public changelog

`/changelog` lists the days from issued pins and from the record view. A pending pin stays off the page.

`/changelog` lists the days, newest first. A day has two groups:

- GAINS: each pin handed out that day, with the archer, class, track, and level.
- Records: each record set or replaced that day, with the round type, class, score, and holder. A tie is absent, because it did not change the record.

## Stack

arc-comp 1.7.1 is Next.js 16, React 19, Prisma 6.19 with the `pg` driver adapter, Tailwind 4, Zod, and pnpm. Its login is Auth.js 5 beta, with Google, Auth0, and Discord. This app keeps that runtime. Login is Better Auth with Google and Auth0, using Better Auth’s own user and session tables. Discord is omitted.

The public hosts are `https://gains.fieldarchery.app` and `https://records.fieldarchery.app`. Both serve this app. Staging is `https://gains-staging.fieldarchery.app`. Production `BETTER_AUTH_URL` is `https://gains.fieldarchery.app`; on staging it is `https://gains-staging.fieldarchery.app`. Google and Auth0 callbacks are registered on each host: `https://gains.fieldarchery.app/api/auth/callback/google`, `https://records.fieldarchery.app/api/auth/callback/google`, `https://gains-staging.fieldarchery.app/api/auth/callback/google`, `https://gains.fieldarchery.app/api/auth/callback/auth0`, `https://records.fieldarchery.app/api/auth/callback/auth0`, and `https://gains-staging.fieldarchery.app/api/auth/callback/auth0`. Auth0 Allowed Logout URLs are `http://localhost:3000/`, `https://gains.fieldarchery.app/`, `https://records.fieldarchery.app/`, and `https://gains-staging.fieldarchery.app/`. Sign-out sends the browser back to the host it left. Records and staging are trusted origins because production `BETTER_AUTH_URL` is only the gains host.

Environment names are `IFAF_AT_POSTGRES_PRISMA_URL` (pooled, runtime), `IFAF_AT_POSTGRES_URL_NON_POOLING` (migrations), `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_AUTH0_ID`, `AUTH_AUTH0_SECRET`, `AUTH_AUTH0_ISSUER`, and `SYSTEM_ADMIN_EMAILS`.

| Choice | Neon Free | Prisma Postgres Free | For IFAF |
| --- | --- | --- | --- |
| Price | $0 | $0, no card | Both are free to start |
| Storage | 1 GB per project, 20 GB account cap | 2 GB | Irrelevant |
| Usage ceiling | 100 CU-hours. Scales to zero after 5 idle minutes. Compute suspends when the hours are gone | 200,000 operations, then queries stop until next month | Cached reads keep either ceiling intact. Neon’s failure still leaves a restore window |
| Backups | Instant restore, 6 hours | None on Free | A record book needs a restore path |
| Vercel | Marketplace attachment and preview branches | A connection string | Neon matches how arc-comp deploys |
| Connections | Pooled URL for the app, direct URL for migrations | 10 pooled connections on Free | Same split arc-comp already uses |

## Approval pipeline

1. A competition app posts one tournament as JSON, or the secretary uploads one result file. Either way it becomes one pending submission. Public pages are unchanged.
2. The secretary modifies the submission as a whole: the competition’s name, date, and round, and any entry’s membership number, class, or score. Entries can be added or removed. A second day or a second round type is another competition, such as `EBHC 2026 - day 1`. Nothing is public yet.
3. Review calculates discrepancies beside the entries from the submission as it stands and the official book as it stands. The same inputs produce the same suggestions. A discrepancy is a suggestion, not an error, and it is not stored. People change name, club, bow, age division, and the number they are entered under, so the secretary can approve with the suggestions still showing. The suggestions are:
   - The name matches a person who already has a different membership number.
   - The membership number matches a person whose current name is different, or whose latest entry names a different club.
   - The membership number matches a person whose recent scores use a different bow style, age division, or gender.
4. The secretary approves the submission. Approval is refused while the competition names an unknown round, or an entry is incomplete or names an unknown class. Open discrepancies do not refuse it. Approving writes a score for every entry. Each score is classified against the record for the competition’s round on the competition’s date.
5. A score strictly higher than the record for that round type and class becomes the record, and the previous row is kept. An equal or lower score is kept and the record stays.
6. The engine reruns for each affected person, class, and track. New pins and records append achievement rows.
7. After approval, the secretary can amend an entry. The amendment voids that score, writes the replacement, and reruns the record and the awards for the people affected. The rest of the submission stays approved. An amendment shows the suggestions calculated from the entry and the official book at that moment, and it does not require them to be cleared.
### How a tournament gets in

All three intakes become one pending submission per competition. A competition is one round at one range. Several rounds, or several days, become several competitions. An unknown class stays on that entry, and an unknown round stays on that competition, for the secretary to correct. Nothing is published until the secretary approves the whole submission. Sending the same competition again, with the same external id, returns the original submission.

The competition app posts one JSON document for the whole tournament. Each round in it becomes one competition. arc-comp already has the membership number, age group, equipment category, club, and score, plus `IFAFBowStyleMapping` and `IFAFAgeGenderMapping`, so it can fill `classCode` and `roundCode`. An account with `integrations.manage` issues that app a credential. An mTLS client certificate is the form issued: the private key is shown once at issuance and is not stored. Revoking the credential stops the app. The endpoint is `POST /api/v1/tournaments`.

| JSON field | Required | Notes |
| --- | --- | --- |
| `externalId`, `name`, `startsOn` | Yes | One competition per round. Replay does not duplicate |
| `rounds[].roundCode` | Yes | The round for that competition, which is what the record is for |
| `rounds[].results[].membershipNumber`, `archerName` | Yes | The name is evidence for the secretary, not a merge key |
| `rounds[].results[].club` | No | Used only for the club discrepancy |
| `rounds[].results[].classCode`, `score` | Yes | `score` is an integer |

The secretary can upload the same tournament without the app.

- CSV is the clean file. One row per score: competition name, date, round code, membership number, archer name, club, class code, score.
- IFAF XLSX is the workbook already in use. It is accepted during the transition and parsed into the same submission.

## System administrator

The first accounts are created from `SYSTEM_ADMIN_EMAILS`. When someone signs in with one of those email addresses, that account receives `system.admin`. A system administrator opens `/admin` and grants permissions to other signed-in accounts. The permissions are:

| Permission | What it allows |
| --- | --- |
| `system.admin` | Grant and revoke every permission, including this one |
| `claims.approve` | Approve or reject a membership claim |
| `names.approve` | Approve a new official name on a membership number |
| `submissions.approve` | Upload, modify, approve, and amend tournament submissions |
| `integrations.manage` | Issue and revoke a competition app’s credential |

A person can hold more than one of these. Holding one does not include the others.

## Member accounts

An archer signs in with Google or Auth0 and opens `/me`. The account has no membership number until the archer submits a claim for one, for example `22008`. An account with `claims.approve` approves or rejects that claim. After approval, `/me` shows that member’s pins, the next score on each track, and the records they hold. An account with `names.approve` can approve a new official name for that membership number. The previous name is kept, with who approved the change and when. Public pages for that number then show the new name.

`/archers/22008` shows the same pins and records without a sign-in.

## Tournament review

A tournament becomes one pending submission, from the competition app’s JSON, a CSV upload, or an IFAF workbook upload. An account with `submissions.approve` opens it in `/review`, edits the competition details and any entry, and adds or removes entries. The submission shows discrepancy suggestions: the same person on another number, or the same number with a different name, club, bow style, age division, or gender from their recent scores. Those suggestions stay visible and the reviewer can still approve.

Approval applies to the whole submission. It is refused while the competition names an unknown round, or an entry is incomplete or names an unknown class. Approval writes every score, classifies each one against the record for the competition’s round on the competition’s date, replaces a record when the score is strictly higher, recalculates awards, and adds the day’s changelog entry.

After approval that same permission can amend one entry. The amendment replaces that score and recalculates the record and the awards for the people affected.

## Implementation plan

One phase per agent session. The session reports the done test and stops.

### 0. Write the rules file

Write `docs/gains-rules.md` from the settled rules. Award tracks are Indoor, Animal, and Field. A score is classified against the record for its round type on the date it was shot. HOTSHOT is eight Gold-classifying scores on that track, and each pin is handed out once per class and track. A tie does not beat a record. No application code. Done when that file matches these decisions.

### 1. Scaffold the app

Turn this repo into a Next.js 16 app: React 19, Prisma 6.19, `@prisma/adapter-pg`, `pg`, Zod, Tailwind 4, Better Auth, pnpm. Keep `LICENSE` and extend the README. Do not add domain tables, pages, or Discord, and do not copy arc-comp’s Auth.js models. Done when `pnpm install`, `pnpm exec prisma generate`, and `pnpm build` succeed.

### 2. Vercel and Neon

Create the Vercel project, attach Neon Free, and add `/api/health` that runs `SELECT 1`. Do not print secrets and do not create a Prisma Postgres database. Done when production and preview return 200 and `prisma migrate deploy` has run with the direct URL.

### 3. Domain schema

One migration for the entities above. Do not run Better Auth’s generator a second time if it would overwrite the domain models. Done when the migration applies on a fresh database and score and submission rows are append-only.

### 4. Reference seed

Idempotent seed for 12 styles, 6 age divisions, 12 rounds, and the three award tracks Indoor, Animal, and Field. Gender is male or female on each score and award. Mark `SBG_ARCHIVED` as display-only. Done when running the seed twice does not duplicate rows, every round points at one of those three tracks, and parser tests cover `AFFS-R`, `AMFU`, `AMTR`, `SMBB-R`, and `AMTR(IFAF)`.

### 5. Import the workbooks

`scripts/import-ifaf.ts` using exceljs. Load 7,746 numeric scores as already-approved history and 853 standing records. A standing record that is not already one of those scores becomes its own competition and one score, even when the event was external and only that archer is known. Keep the competition name and leave its date empty when there is no calendar day. A multi-day meet is one competition per day. A record-only event has `countsForGains` false. Pins already handed out are stored as `issued`. A surname change with the same given name stays one person. The membership number is the one in the workbook. Done when a fresh import matches those counts and a second run does not duplicate scores.

### 6. GAINS engine

`src/lib/gains/engine.ts` is pure and implements `docs/gains-rules.md`. It writes a `pending` pin when the scores earn one. The spreadsheet tracker is loaded as `issued` pins already handed out, not as the engine’s expected output. The standing record is the view. Do not change a ratio to raise a pass rate. Done when a class with no record has no threshold, a later record does not rewrite a stored band, and a second Gold is not created in a class and track that already has one.

### 7. Public pages

`/records`, `/gains`, and `/archers/[membershipNumber]`, cached for an hour. A class with no record says so. Done when a browser check, desktop and narrow, filters by round, bow style, age division, and gender, opens an archer, and shows the next required score. The public day-by-day list is `/changelog`, built in phase 10.

### 8. System administrator and member accounts

Google and Auth0 sign-in. An email in `SYSTEM_ADMIN_EMAILS` receives `system.admin` on first sign-in. `/admin` grants `claims.approve`, `names.approve`, `submissions.approve`, and `integrations.manage` to other accounts. `/me` and membership claims work as described above. Done when a listed email can sign in and grant `claims.approve`, and `/me` stays empty until that permission approves the claim.

### 9. Tournament review

`/review` lists pending submissions for accounts with `submissions.approve`. The reviewer edits a submission, sees the discrepancy suggestions, and approves or rejects the whole submission. Approval writes the scores, updates records, recalculates awards, and adds the changelog entry. An amendment after approval replaces one score and recalculates. Done when an account without the permission cannot open the queue, a pending submission is absent from the public pages, and approving the submission publishes every entry.

### 10. Public changelog

Approving a submission adds that day’s GAINS pins and record changes to `/changelog`. `/changelog/2026-11-14` is that day. Done when a browser check shows a new Gold and a replaced record on the day the submission was approved, leaves a tie off the page, and shows a second submission from the same day on the same entry.

### 11. Tournament intake

`POST /api/v1/tournaments` accepts one tournament JSON from an app holding a current issued credential, and the review screen accepts a CSV upload and an IFAF XLSX upload. All three create one pending submission. Done when a replay of the same tournament does not duplicate, a missing or revoked credential is rejected, a CSV and an IFAF XLSX of the same scores produce the same submission, and the secretary can modify that submission and then approve it as a whole.
