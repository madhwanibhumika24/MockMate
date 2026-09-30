const VARIANT_CLASSES = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-brand-500 disabled:bg-brand-300",
  secondary:
    "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 focus-visible:ring-brand-500 disabled:text-slate-400",
  // Light, glassy green -- a distinct but lightweight look for a secondary
  // "reference" action (e.g. a formula sheet) that shouldn't compete with
  // the primary brand-colored action next to it. Translucent fill + a soft
  // top highlight for a glossy feel, instead of a heavy solid block.
  success:
    "bg-gradient-to-b from-emerald-300/15 to-emerald-400/5 text-emerald-600 border border-emerald-200/70 backdrop-blur-sm shadow-sm shadow-emerald-500/10 hover:from-emerald-300/20 hover:to-emerald-400/10 focus-visible:ring-emerald-500 disabled:from-emerald-300/5 disabled:to-emerald-300/5 disabled:text-emerald-300 dark:text-emerald-300 dark:border-emerald-400/20 dark:from-emerald-400/10 dark:to-emerald-500/5 dark:hover:from-emerald-400/15 dark:hover:to-emerald-500/10",
};

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

function Button({ children, className = "", variant = "primary", loading = false, disabled, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm
        font-semibold shadow-sm transition focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-offset-2 disabled:cursor-not-allowed
        ${VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export default Button;
