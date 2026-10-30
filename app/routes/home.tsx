import { Form, Link } from "react-router";
import { useLocale, useTranslate } from "~/lib/use-translate";
import type { Locale } from "~/lib/i18n";
import type { Route } from "./+types/home";

export const meta: Route.MetaFunction = () => [
  { title: "Keystroke · Typing practice" },
  {
    name: "description",
    content:
      "Practise typing on your own texts or on random Wikipedia articles, with live feedback and a history of your progress.",
  },
];

// The sample in the hero: a static preview of the practice screen.
type SampleKind = "ok" | "fixed" | "wrong" | "next" | "todo";

function sampleRun(text: string, kind: SampleKind): [string, SampleKind][] {
  return Array.from(text).map((character) => [character, kind]);
}

// One sample per language, so the preview reads naturally in both.
const samples: Record<Locale, [string, SampleKind][]> = {
  en: [
    ...sampleRun("The lighthouse keeper climbed the spiral st", "ok"),
    ["a", "fixed"],
    ...sampleRun("irs every evening just ", "ok"),
    ["v", "wrong"],
    ["e", "next"],
    ...sampleRun(
      "fore dusk. He checked the lamp, polished the glass, and wound the clockwork.",
      "todo",
    ),
  ],
  he: [
    ...sampleRun("השען הזקן מרחוב הדקלים לא מכר שע", "ok"),
    ["ו", "fixed"],
    ...sampleRun("נים, הוא רק ", "ok"),
    ["ח", "wrong"],
    ["ת", "next"],
    ...sampleRun(
      "יקן אותם. אנשים הביאו לו שעוני כיס שנעצרו לפני שנים.",
      "todo",
    ),
  ],
};

const sampleClass: Record<SampleKind, string> = {
  ok: "text-ink",
  fixed: "text-fixed underline decoration-dotted underline-offset-4",
  wrong: "text-wrong underline decoration-2 underline-offset-4",
  next: "mark",
  todo: "text-ink-faint",
};

export default function Home() {
  const t = useTranslate();
  const locale = useLocale();
  const steps = [1, 2, 3] as const;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-20 px-5 py-14 sm:py-20">
      <section className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col gap-6">
          <p className="eyebrow">{t("home.eyebrow")}</p>
          <h1 className="font-display text-5xl leading-tight tracking-tight sm:text-6xl">
            {t("home.title.1")}
            <br />
            <span className="mark px-1">{t("home.title.2")}</span>
            <br />
            {t("home.title.3")}
          </h1>
          <p className="max-w-md text-lg leading-relaxed text-ink-muted">
            {t("home.lead")}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/practice" className="btn-accent">
              {t("home.start")}
            </Link>
            <Form method="post" action="/texts/wikipedia">
              <input type="hidden" name="language" value={locale} />
              <button type="submit" className="btn-secondary">
                {t("home.randomWiki")}
              </button>
            </Form>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="card p-6 font-mono text-lg leading-loose"
        >
          <p className="eyebrow mb-3">{t("home.specimen")}</p>
          <p>
            {samples[locale].map(([character, kind], index) => (
              <span key={index} className={sampleClass[kind]}>
                {character}
              </span>
            ))}
          </p>
          <div className="mt-5 flex items-baseline justify-between border-t border-line pt-3">
            <span className="eyebrow">{t("home.wpm")}</span>
            <span className="font-display text-4xl">67</span>
          </div>
        </div>
      </section>

      <section aria-labelledby="how" className="flex flex-col gap-8">
        <h2 id="how" className="section-title">
          {t("home.how")}
        </h2>
        <ol className="grid gap-8 md:grid-cols-3">
          {steps.map((n) => (
            <li key={n} className="flex flex-col gap-2">
              <span className="font-display text-4xl text-ink-faint">{n}</span>
              <h3 className="font-display text-2xl">
                {t(`home.step${n}.title`)}
              </h3>
              <p className="leading-relaxed text-ink-muted">
                {t(`home.step${n}.body`)}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="honest" className="flex flex-col gap-8">
        <h2 id="honest" className="section-title">
          {t("home.honest")}
        </h2>
        <dl className="grid gap-6 sm:grid-cols-2">
          <div>
            <dt className="eyebrow">{t("col.wpm")}</dt>
            <dd className="mt-2 leading-relaxed text-ink-muted">
              {t("home.wpmDef")}
            </dd>
          </div>
          <div>
            <dt className="eyebrow">{t("col.mistakes")}</dt>
            <dd className="mt-2 leading-relaxed text-ink-muted">
              {t("home.mistakesDef")}
            </dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
