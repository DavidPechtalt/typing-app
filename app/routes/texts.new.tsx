import { data, Form, redirect, useNavigation } from "react-router";
import { z } from "zod";
import { fieldClassName, TextField } from "~/components/TextField";
import { newTextSchema } from "~/lib/validation";
import { createText } from "~/models/text.server";
import { requireUserId } from "~/session.server";
import type { Route } from "./+types/texts.new";

export const meta: Route.MetaFunction = () => [
  { title: "Add a text | Typing App" },
];

type FormErrors = {
  title?: string;
  language?: string;
  content?: string;
};

export async function loader({ request }: Route.LoaderArgs) {
  await requireUserId(request);
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const result = newTextSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    const fieldErrors = z.flattenError(result.error).fieldErrors;
    const errors: FormErrors = {
      title: fieldErrors.title?.[0],
      language: fieldErrors.language?.[0],
      content: fieldErrors.content?.[0],
    };
    return data({ errors }, { status: 400 });
  }

  const text = await createText(userId, result.data);
  return redirect(`/practice/${text.id}`);
}

export default function NewText({ actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.formAction === "/texts/new";
  const errors = actionData?.errors;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add a text</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Paste any text to practise on. Line breaks become spaces, and curly
          quotes and long dashes become ones you can type.
        </p>
      </div>

      <Form
        method="post"
        className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900"
      >
        <TextField label="Title" name="title" error={errors?.title} />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="language" className="text-sm font-medium">
            Language
          </label>
          <select
            id="language"
            name="language"
            defaultValue="en"
            aria-invalid={errors?.language ? true : undefined}
            aria-describedby={errors?.language ? "language-error" : undefined}
            className={fieldClassName}
          >
            <option value="en">English</option>
            <option value="he">Hebrew</option>
          </select>
          {errors?.language && (
            <p
              id="language-error"
              className="text-sm text-red-600 dark:text-red-400"
            >
              {errors.language}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="content" className="text-sm font-medium">
            Text (20–2000 characters)
          </label>
          <textarea
            id="content"
            name="content"
            rows={8}
            required
            dir="auto"
            aria-invalid={errors?.content ? true : undefined}
            aria-describedby={errors?.content ? "content-error" : undefined}
            className={fieldClassName}
          />
          {errors?.content && (
            <p
              id="content-error"
              className="text-sm text-red-600 dark:text-red-400"
            >
              {errors.content}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="self-start rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white shadow-sm hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-60"
        >
          {isSubmitting ? "Saving…" : "Save and practise"}
        </button>
      </Form>
    </main>
  );
}
