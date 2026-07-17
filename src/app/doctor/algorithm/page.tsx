import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export default function AlgorithmPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <Link href="/doctor" className="text-sm text-zinc-500 hover:text-brand-dark">
          ← All patients
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">How the Sjögren&apos;s Symptom Signal is calculated</h1>
        <p className="mt-1 text-sm text-zinc-500">
          The composite score compares a patient&apos;s recent symptoms to their own history — it is relative to
          each patient, not an absolute severity scale.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. Personal baseline</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-zinc-600">
          <p>
            For every non-safety symptom, the system looks at that patient&apos;s own scores from the{" "}
            <strong>prior 90 days</strong> (strictly before the day being calculated) and computes:
          </p>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-zinc-50 p-3 text-xs text-zinc-700">
            baseline = mean(last 90 days of that symptom&apos;s scores)
          </pre>
          <p className="mt-2">
            This requires at least <strong>5 prior data points</strong>. If a symptom doesn&apos;t have enough
            history yet, it&apos;s excluded entirely from that day&apos;s composite score — never treated as a zero.
            This is why a brand-new patient won&apos;t have a composite score right away.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Weight and calculation method (per symptom)</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-zinc-600">
          <p>
            Each symptom has a <strong>weight</strong>, shown as a percentage, that controls how much it
            contributes to the composite score. Weight has a catalog-wide default, and can be overridden per
            patient from the &quot;Score settings&quot; controls under each symptom&apos;s chart on the patient page.
          </p>
          <p className="mt-2">Each symptom also has a calculation method:</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>
              <strong>Average</strong> — compares today&apos;s score to the raw baseline average, in the symptom&apos;s
              1–5 score units (1 = Severe, 5 = None).
            </li>
            <li>
              <strong>Std. deviation</strong> — normalizes that comparison by the patient&apos;s own historical
              variability for that symptom (a personal z-score), so a symptom that naturally swings a lot
              day-to-day doesn&apos;t dominate the composite just because its raw numbers move more.
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Weighted deviation and composite score</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-zinc-600">
          <pre className="overflow-x-auto rounded-lg bg-zinc-50 p-3 text-xs text-zinc-700">
{`raw deviation      = baseline score − today's score
                     (scores are 1-5, worst to best, so a lower score is a worse day)
normalized dev.    = "Std. deviation" method: raw deviation ÷ standard deviation
                     "Average" method: raw deviation, unchanged
weighted deviation = normalized deviation × symptom weight

composite score    = sum(weighted deviations) ÷ sum(weights of included symptoms)`}
          </pre>
          <p className="mt-2">
            This is a weighted average of how far today&apos;s scores are from that patient&apos;s own normal —
            not an absolute severity score. Higher always means worse. It&apos;s unbounded: a very good day can go
            well below 0, a very bad day can go well above.
          </p>
          <div className="mt-3 rounded-lg border border-zinc-200 p-3">
            <p className="font-medium text-zinc-700">Worked example</p>
            <p className="mt-1 text-xs text-zinc-500">
              Eye dryness: baseline 3.2, today 2 (worse than usual), weight 20% → weighted deviation = (3.2 − 2) ×
              0.20 = 0.24
              <br />
              Mouth dryness: baseline 4.0, today 4 (unchanged), weight 10% → weighted deviation = 0
              <br />
              Composite = (0.24 + 0) ÷ (0.20 + 0.10) = <strong>0.8</strong>
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Category thresholds</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-zinc-400">
              <tr>
                <th className="py-1.5 pr-4">Composite score</th>
                <th className="py-1.5">Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-600">
              <tr>
                <td className="py-2 pr-4">&lt; 0.4</td>
                <td className="py-2">Stable</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">≥ 0.4</td>
                <td className="py-2">Mildly elevated</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">≥ 1.0</td>
                <td className="py-2">Moderately elevated</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">≥ 1.6</td>
                <td className="py-2">Significantly elevated</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-2 text-sm text-zinc-500">
            There&apos;s no symmetric &quot;very negative = extra stable&quot; tier — anything below 0.4 is simply
            &quot;Stable.&quot; These thresholds are scaled for the 1-5 score range (max single-symptom deviation of
            4, vs. 10 previously) — proportionally the same sensitivity as before.
          </p>
        </CardContent>
      </Card>

    </div>
  );
}
