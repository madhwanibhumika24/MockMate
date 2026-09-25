function Logo({ className = "", dark = true }) {
  return (
    <span className={`inline-flex items-baseline text-2xl font-extrabold tracking-tight ${className}`}>
      <span className={dark ? "text-white" : "text-slate-900 dark:text-white"}>Mock</span>
      <span className={dark ? "text-brand-400" : "text-brand-600 dark:text-brand-400"}>Mate</span>
      <span className="ml-1 -translate-y-3 inline-block h-1.5 w-1.5 rounded-full bg-brand-400" />
    </span>
  );
}

export default Logo;
