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
      <label htmlFor={name} className="text-sm font-semibold">
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
        className="field"
      />
      <FieldError id={errorId} message={error} />
    </div>
  );
}

type FieldErrorProps = {
  id: string;
  message: string | undefined;
};

export function FieldError({ id, message }: FieldErrorProps) {
  if (!message) {
    return null;
  }

  return (
    <p id={id} className="flex items-center gap-2 text-sm font-medium">
      <span
        aria-hidden="true"
        className="size-2.5 shrink-0 rounded-full bg-pink"
      />
      {message}
    </p>
  );
}
