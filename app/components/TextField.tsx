// Shared look for inputs, text areas and selects.
export const fieldClassName =
  "rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/30 aria-invalid:border-red-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";

type TextFieldProps = {
  label: string;
  name: string;
  type?: "text" | "email" | "password";
  autoComplete?: string;
  error?: string;
};

export function TextField({
  label,
  name,
  type = "text",
  autoComplete,
  error,
}: TextFieldProps) {
  const errorId = `${name}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={fieldClassName}
      />
      {error && (
        <p id={errorId} className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
