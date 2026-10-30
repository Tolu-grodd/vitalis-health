# Vitalis Health

A health tracking web app. Meals are logged component by component with weights
and calories, blood pressure is recorded and graded, and water, sleep and
medication sit on the same timeline. Everything is date and time stamped,
charted, filterable and exportable.

**Live:** https://vitalis-health-a7f3c.web.app
**Firebase console:** https://console.firebase.google.com/project/vitalis-health-a7f3c

---

## What it does

**Meals and calories**

- Unlimited meals per day, freely named. Not locked to breakfast, lunch, dinner.
- Each meal holds unlimited components. A component carries its own name, weight
  in grams, calories and optional protein, carbs and fat. Totals roll up per meal
  and per day.
- A food library of about 160 foods (Nigerian staples, soups, proteins, plus
  international) quoted per 100 g. Pick one and the weight drives the numbers.
  Type your own figure and your figure stands.
- Fully manual entry is always available. The library is a shortcut, never a gate.
- Save any component to your own foods, and save whole meals as reusable templates.
- Every entry auto-stamps today's date and the current time. Both stay editable,
  so back-filling a forgotten meal works.

**Blood pressure**

- Systolic, diastolic and pulse, plus arm and position, auto-stamped and editable.
- Graded live against the ACC/AHA adult categories, from normal to hypertensive
  crisis, by whichever number is worse.
- Mean arterial pressure and pulse pressure, trend charts, category distribution.

**Vitals**

- Water with one-tap quick amounts and a daily goal meter.
- Sleep with hours, quality, and bedtime to wake, which fills the hours for you
  and handles crossing midnight.
- Medication and supplements with dose, time and a taken toggle. Anything logged
  once becomes a one-tap button next time.

**Analysis**

- Dashboard with a calorie goal ring, macro meters, streak, stat tiles carrying
  sparklines and period-over-period deltas, an activity timeline and a calorie
  intensity strip.
- Insights are derived observations: averages against goals, best and worst days,
  movement against the previous period, late-night eating, biggest calorie source,
  blood pressure trend, calories against next-day systolic, short nights against
  readings, medication adherence and logging consistency.
- History shows a month calendar shaded by calorie load with a blood pressure
  grade dot. Click any day for its full record.
- One global date-range filter scopes every chart and list. Every chart has a
  data-table twin, so no value is reachable only by hover.
- Exports: a PDF report you can hand to a clinician, plus CSV for meals (one row
  per component), blood pressure and vitals.

---

## Stack

- React 19, TypeScript, Vite
- Tailwind CSS v4, with design tokens in `src/index.css`
- Recharts for charts, `lucide-react` for icons, `date-fns` for dates
- jsPDF and jspdf-autotable for the PDF report, loaded on demand
- Firebase: Firestore with offline persistence, Google Auth, Hosting

Colours follow a validated data-visualisation palette: a fixed categorical slot
order, a single sequential blue ramp for magnitude, and reserved status colours
that never double as a series.

---

## Data model

Everything lives under the signed-in user, so the security rules stay to one rule.

```
users/{uid}/meals/{id}      date, time, at, slot, name, items[], kcal, protein, carbs, fat, grams, note
users/{uid}/bp/{id}         date, time, at, systolic, diastolic, pulse, arm, position, category, note
users/{uid}/water/{id}      date, time, at, ml
users/{uid}/sleep/{id}      date, time, at, hours, quality, bedtime, wake, note
users/{uid}/meds/{id}       date, time, at, name, dose, taken, note
users/{uid}/foods/{id}      your saved foods, per 100 g
users/{uid}/templates/{id}  reusable meals
users/{uid}/meta/settings   goals, targets, preferences
```

`date` is a local `YYYY-MM-DD` key, so a meal logged at 00:30 stays on the day you
ate it. All filtering runs on that single field, which means no composite indexes
are needed.

---

## Running it

```bash
cp .env.example .env.local   # then fill in your own Firebase web app settings
npm install
npm run dev
```

`.env.local` holds the Firebase web config. A Firebase web API key is public by
design; access is controlled by the Firestore rules, not by hiding the key.

Deploy:

```bash
npm run build && firebase deploy
```

---

## Disclaimer

Vitalis records what you tell it and charts it back. It is not a medical device,
it does not diagnose or treat, and its blood pressure categories are
informational. Take the exported report to a clinician rather than acting on it
alone.
