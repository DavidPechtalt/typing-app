// Upload a text to practise on: paste it, or choose a .txt file. Logged-in users only.
import { data, Form, redirect, useNavigation } from "react-router";
import { z } from "zod";
import { PageHeader } from "~/components/PageHeader";
import { db } from "~/db.server";
import type { Translate } from "~/lib/i18n";
import { getTranslator } from "~/lib/locale.server";
import { useTranslate } from "~/lib/use-translate";
import { requireUserId } from "~/session.server";
import type { Route } from "./+types/texts.new";

export const meta: Route.MetaFunction = () => [
  { title: "Upload a text · Keystroke" },
];

// Limits that keep a practice reasonable and the database row small.
const MIN_CONTENT = 20;
const MAX_CONTENT = 3000;
const MAX_FILE_BYTES = 64 * 1024;

export async function loader({ request }: Route.LoaderArgs) {
  await requireUserId(request);
  return null;
}

// The schema is built per request so its error messages are in the user's language.
function uploadSchema(t: Translate) {
  return z.object({
    title: z.string().trim().min(1, t("upload.err.title")).max(120),
    language: z.enum(["en", "he"], { error: t("upload.err.language") }),
    content: z
      .string()
      .transform((value) => value.replace(/\s+/g, " ").trim())
      .pipe(
        z
          .string()
          .min(MIN_CONTENT, t("upload.err.min", { min: MIN_CONTENT }))
          .max(MAX_CONTENT, t("upload.err.max", { max: MAX_CONTENT })),
      ),
  });
}

export async function action({ request }: Route.ActionArgs) {
  const userId = await requireUserId(request);
  const t = await getTranslator(request);
  const formData = await request.formData();

  const file = formData.get("file");
  let content = formData.get("content");
  // A chosen file replaces the pasted text.
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_FILE_BYTES) {
      return data({ errors: { file: t("upload.err.file") } }, { status: 400 });
    }
    content = await file.text();
  }

  const parsed = uploadSchema(t).safeParse({
    title: formData.get("title"),
    language: formData.get("language"),
    content,
  });
  if (!parsed.success) {
    const { fieldErrors } = z.flattenError(parsed.error);
    return data(
      {
        errors: {
          title: fieldErrors.title?.[0],
          language: fieldErrors.language?.[0],
          content: fieldErrors.content?.[0],
        },
      },
      { status: 400 },
    );
  }

  const text = await db.text.create({
    data: { ...parsed.data, ownerId: userId, source: "UPLOAD" },
    select: { id: true },
  });

  return redirect(`/practice?text=${text.id}`);
}

export default function NewText({ actionData }: Route.ComponentProps) {
  const t = useTranslate();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const errors: {
    title?: string;
    language?: string;
    content?: string;
    file?: string;
  } = actionData?.errors ?? {};

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-5 py-10">
      <PageHeader title={t("upload.title")}>
        <p className="text-ink-muted">
          {t("upload.lead", { min: MIN_CONTENT, max: MAX_CONTENT })}
        </p>
      </PageHeader>

      <Form
        method="post"
        encType="multipart/form-data"
        className="card flex flex-col gap-5 p-6"
      >
        <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="title" className="text-sm font-medium">
              {t("upload.titleLabel")}
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              maxLength={120}
              dir="auto"
              aria-invalid={errors.title ? true : undefined}
              aria-describedby={errors.title ? "title-error" : undefined}
              className="field"
            />
            {errors.title && (
              <p id="title-error" className="text-sm text-wrong">
                {errors.title}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="language" className="text-sm font-medium">
              {t("upload.language")}
            </label>
            <select
              id="language"
              name="language"
              defaultValue="en"
              className="field"
            >
              <option value="en">{t("lang.en")}</option>
              <option value="he">{t("lang.he")}</option>
            </select>
            {errors.language && (
              <p className="text-sm text-wrong">{errors.language}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="content" className="text-sm font-medium">
            {t("upload.text")}
          </label>
          <textarea
            id="content"
            name="content"
            rows={8}
            dir="auto"
            maxLength={MAX_CONTENT * 2}
            placeholder={t("upload.placeholder")}
            aria-invalid={errors.content ? true : undefined}
            aria-describedby={errors.content ? "content-error" : "content-hint"}
            className="field font-mono text-sm leading-relaxed"
          />
          {errors.content ? (
            <p id="content-error" className="text-sm text-wrong">
              {errors.content}
            </p>
          ) : (
            <p id="content-hint" className="text-sm text-ink-faint">
              {t("upload.hint")}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="file" className="text-sm font-medium">
            {t("upload.file")}
          </label>
          <input
            id="file"
            name="file"
            type="file"
            accept=".txt,text/plain"
            aria-describedby={errors.file ? "file-error" : "file-hint"}
            className="field file:me-3 file:rounded-sm file:border-0 file:bg-surface-3 file:px-3 file:py-1 file:text-sm file:font-medium file:text-ink"
          />
          {errors.file ? (
            <p id="file-error" className="text-sm text-wrong">
              {errors.file}
            </p>
          ) : (
            <p id="file-hint" className="text-sm text-ink-faint">
              {t("upload.fileHint")}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary mt-2 self-start"
        >
          {isSubmitting ? t("upload.submitting") : t("upload.submit")}
        </button>
      </Form>
    </main>
  );
}
