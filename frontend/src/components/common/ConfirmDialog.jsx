// Small reusable confirmation card -- used in place of the browser's own
// confirm()/alert() popups (which can't be styled and show the raw
// "localhost:xxxx says" chrome) for anything destructive or worth a second
// thought, like logging out.
function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="card w-full max-w-sm">
        <h3 id="confirm-dialog-title" className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h3>
        {message && <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{message}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 transition hover:bg-slate-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="relative overflow-hidden rounded-lg border border-red-300/50 bg-red-400/15 px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 shadow-sm shadow-red-900/5 backdrop-blur-md transition hover:bg-red-400/25"
          >
            <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-lg bg-gradient-to-b from-white/50 to-transparent" />
            <span className="relative z-10">{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
