import { useEffect, useState } from "react";

import { listGDCategories, listGDTopics } from "../../services/api.js";

function CategoryPill({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
        active
          ? "bg-brand-600 text-white"
          : "border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-brand-300 hover:text-brand-600 dark:hover:text-brand-400"
      }`}
    >
      {children}
    </button>
  );
}

function GroupDiscussion() {
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null); // null = "All topics"
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listGDCategories()
      .then(({ data }) => setCategories(data))
      .catch(() => {
        /* category pills are a nice-to-have -- topics still load without them */
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    listGDTopics(activeCategory)
      .then(({ data }) => {
        if (!cancelled) setTopics(data);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load group discussion topics. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeCategory]);

  return (
    <div className="space-y-5">
      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Group discussion topics</h3>
            <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
              Browse real GD topics to prepare with. A live, AI-simulated discussion round -- practicing
              against multiple AI participants, not an actual group -- is coming soon.
            </p>
          </div>
          <span className="inline-flex flex-none items-center rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            Live discussion coming soon
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          <CategoryPill active={activeCategory === null} onClick={() => setActiveCategory(null)}>
            All topics
          </CategoryPill>
          {categories.map((category) => (
            <CategoryPill key={category} active={activeCategory === category} onClick={() => setActiveCategory(category)}>
              {category}
            </CategoryPill>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">{error}</div>
      )}

      {loading ? (
        <div className="card py-10 text-center text-sm text-slate-500 dark:text-slate-400">Loading topics...</div>
      ) : topics.length === 0 ? (
        <div className="card py-10 text-center text-sm text-slate-500 dark:text-slate-400">No topics in this category yet.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {topics.map((topic) => (
            <div key={topic.id} className="card flex flex-col gap-2">
              <span className="inline-flex w-fit items-center rounded-full bg-brand-50 dark:bg-brand-900/40 px-2.5 py-1 text-xs font-semibold text-brand-600 dark:text-brand-400">
                {topic.category}
              </span>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{topic.title}</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">{topic.prompt}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default GroupDiscussion;
