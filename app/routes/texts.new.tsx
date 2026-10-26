import { data, Form, Link, redirect, useNavigation } from "react-router";
import { z } from "zod";
import { FieldError, TextField } from "~/components/TextField";
import { newTextSchema } from "~/lib/validation";
import { createText } from "~/models/text.server";
import { requireUserId } from "~/session.server";
import type { Route } from "./+types/texts.new";

export const meta: Route.MetaFunction = () => [
  { title: "Add a text | Keyprint" },
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
        <Link to="/texts" className="link text-sm">
          ← Back to texts
        </Link>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight">
          Add a text
        </h1>
        <p className="mt-2 text-muted">
          Paste anything you want to practise. Line breaks become spaces, and
          curly quotes and long dashes become keys you can actually type.
        </p>
      </div>

      <Form method="post" className="card flex flex-col gap-5 p-6 sm:p-8">
        <TextField label="Title" name="title" error={errors?.title} />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="language" className="text-sm font-semibold">
            Language
          </label>
          <select
            id="language"
            name="language"
            defaultValue="en"
            aria-invalid={errors?.language ? true : undefined}
            aria-describedby={errors?.language ? "language-error" : undefined}
            className="field"
          >
            <option value="en">English</option>
            <option value="he">Hebrew</option>
          </select>
          <FieldError id="language-error" message={errors?.language} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="content" className="text-sm font-semibold">
            Text{" "}
            <span className="font-normal text-muted">(20–2000 characters)</span>
          </label>
          <textarea
            id="content"
            name="content"
            rows={8}
            required
            dir="auto"
            aria-invalid={errors?.content ? true : undefined}
            aria-describedby={errors?.content ? "content-error" : undefined}
            className="field font-mono text-sm leading-relaxed"
          />
          <FieldError id="content-error" message={errors?.content} />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary self-start"
        >
          {isSubmitting ? "Saving…" : "Save and start typing"}
        </button>
      </Form>
    </main>
  );
}
