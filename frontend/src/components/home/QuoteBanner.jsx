function QuoteBanner() {
  return (
    <div className="bg-slate-900 py-14">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <p className="text-2xl font-semibold italic leading-snug text-white sm:text-3xl">
          &ldquo;The secret of getting ahead is getting started.&rdquo;
        </p>
        <footer className="mt-4 text-sm font-medium uppercase tracking-wide text-brand-300">
          &mdash; Mark Twain
        </footer>
      </div>
    </div>
  );
}

export default QuoteBanner;
