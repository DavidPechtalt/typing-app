// Delete button for one table row in the admin pages. Posts { id } to the
// current route's action.
import { useFetcher } from "react-router";

// What every admin delete action returns, so this component can show an error.
export type DeleteActionData = { error: string | null };

type DeleteButtonProps = {
  id: number;
  // Accessible name, e.g. "Delete text Lorem", because every row's visible label is just "Delete".
  label: string;
  // Shown in the browser's confirm dialog before anything is sent.
  confirmMessage: string;
};

export function DeleteButton({ id, label, confirmMessage }: DeleteButtonProps) {
  // One fetcher per row: each row has its own pending state, and the page
  // does not navigate. After the action finishes, React Router reloads the
  // page's loader, so the deleted row disappears from the table.
  const fetcher = useFetcher<DeleteActionData>();
  const isDeleting = fetcher.state !== "idle";
  const error = fetcher.data?.error;

  return (
    <fetcher.Form
      method="post"
      onSubmit={(event) => {
        // Cancelling the submit event stops the fetcher from sending anything.
        if (!window.confirm(confirmMessage)) event.preventDefault();
      }}
      className="flex flex-col items-end gap-1"
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        aria-label={label}
        disabled={isDeleting}
        className="rounded-md px-2.5 py-1 text-sm font-medium text-red-600 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-950"
      >
        {isDeleting ? "Deleting…" : "Delete"}
      </button>
      {/* role="alert" makes screen readers announce the error as soon as it appears. */}
      {error && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </fetcher.Form>
  );
}
