import { useEffect, useRef, useState } from "react";

import {
  discussGDTopic,
  generateCustomGDTopicBrief,
  generateGDTopicBrief,
  listGDCategories,
  listGDTopics,
} from "../../services/api.js";
import Button from "../common/Button.jsx";

function BackIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function MessageIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21 11.5a8.38 8.38 0 01-4.5 7.5 8.38 8.38 0 01-8.6-.3L3 20l1.4-4.2A8.38 8.38 0 013 11.5 8.5 8.5 0 0111.5 3h.1a8.38 8.38 0 018.4 7.9v.6z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LightbulbIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 18h6M10 21h4M12 3a6 6 0 00-6 6c0 2.2 1.1 3.6 2.1 4.6.6.6 1 1.4 1.1 2.4h5.6c.1-1 .5-1.8 1.1-2.4C17 12.6 18 11.2 18 9a6 6 0 00-6-6z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FlagIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 21V4m0 1.5h9.5L13 9l2.5 3.5H6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckCircleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.15" />
      <path d="M8 12.3l2.6 2.6L16 9.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XCircleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.15" />
      <path d="M9.5 9.5l5 5M14.5 9.5l-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SparkleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.5l1.8 5.2 5.2 1.8-5.2 1.8L12 17.5l-1.8-5.2-5.2-1.8 5.2-1.8L12 2.5z" />
    </svg>
  );
}

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

function PointList({ heading, tone, points }) {
  const tones =
    tone === "for"
      ? {
          card: "bg-emerald-50/60 dark:bg-emerald-900/10",
          heading: "text-emerald-700 dark:text-emerald-400",
          badge: "bg-white/80 dark:bg-slate-900/40 text-emerald-700 dark:text-emerald-400 ring-emerald-200 dark:ring-emerald-800",
          rule: "border-emerald-200 dark:border-emerald-800",
          Icon: CheckCircleIcon,
        }
      : {
          card: "bg-amber-50/60 dark:bg-amber-900/10",
          heading: "text-amber-700 dark:text-amber-400",
          badge: "bg-white/80 dark:bg-slate-900/40 text-amber-700 dark:text-amber-400 ring-amber-200 dark:ring-amber-800",
          rule: "border-amber-200 dark:border-amber-800",
          Icon: XCircleIcon,
        };
  const Icon = tones.Icon;

  return (
    <div className={`card ${tones.card}`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 flex-none ${tones.heading}`} />
        <h4 className={`text-sm font-semibold ${tones.heading}`}>{heading}</h4>
      </div>
      <ol className="mt-4 space-y-4">
        {points.map((item, index) => (
          <li key={index} className="flex gap-3">
            <span
              className={`flex h-6 w-6 flex-none items-center justify-center rounded-full text-xs font-bold ring-1 ${tones.badge}`}
            >
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium leading-snug text-slate-900 dark:text-slate-100">{item.point}</p>
              {item.example && (
                <p className={`mt-1.5 border-l-2 ${tones.rule} pl-2.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400`}>
                  {item.example}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function GDChatBubble({ from, children }) {
  const isAI = from === "ai";
  return (
    <div className={`flex items-end gap-2 ${isAI ? "justify-start" : "flex-row-reverse justify-start"}`}>
      <span
        className={`flex h-6 w-6 flex-none select-none items-center justify-center rounded-full text-[10px] font-semibold ${
          isAI ? "bg-brand-100 dark:bg-brand-800/50 text-brand-700 dark:text-brand-300" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
        }`}
      >
        {isAI ? "AI" : "ME"}
      </span>
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
          isAI ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200" : "bg-brand-600 text-white"
        }`}
      >
        <p className="whitespace-pre-wrap">{children}</p>
      </div>
    </div>
  );
}

function GDTypingBubble() {
  return (
    <div className="flex items-end gap-2 justify-start">
      <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-brand-100 dark:bg-brand-800/50 text-[10px] font-semibold text-brand-700 dark:text-brand-300">
        AI
      </span>
      <div className="flex items-center gap-1 rounded-2xl bg-slate-100 dark:bg-slate-800 px-3.5 py-3 shadow-sm">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "0ms" }} />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "150ms" }} />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}

function TopicDiscussion({ topic }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    setMessages([]);
    setInput("");
    setChatError("");
  }, [topic.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, sending]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const history = messages.map(({ role, content }) => ({ role, content }));
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setChatError("");
    setSending(true);

    discussGDTopic({ topicTitle: topic.title, topicPrompt: topic.prompt, message: text, history })
      .then(({ data }) => setMessages((prev) => [...prev, { role: "ai", content: data.reply }]))
      .catch((err) => setChatError(err.response?.data?.detail || "Couldn't get a response right now. Please try again."))
      .finally(() => setSending(false));
  };

  return (
    <div className="card">
      <div className="flex items-center gap-2">
        <MessageIcon className="h-5 w-5 flex-none text-brand-600 dark:text-brand-400" />
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Discuss with AI</h4>
      </div>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Ask a follow-up, dig into a point, or push back on an argument -- keep exploring before you go into the
        discussion.
      </p>

      {messages.length > 0 && (
        <div className="mt-4 max-h-96 space-y-3 overflow-y-auto pr-1">
          {messages.map((message, index) => (
            <GDChatBubble key={index} from={message.role}>
              {message.content}
            </GDChatBubble>
          ))}
          {sending && <GDTypingBubble />}
          <div ref={endRef} />
        </div>
      )}

      {chatError && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{chatError}</p>}

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          maxLength={800}
          disabled={sending}
          placeholder={'e.g. "Give me a stronger counterpoint" or "What\'s a real example of this?"'}
          className="input-field flex-1"
        />
        <Button type="submit" loading={sending} disabled={!input.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
}

function TopicBrief({ topic, brief, loading, error, onRegenerate, onBack }) {
  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
      >
        <BackIcon className="h-4 w-4" />
        Back to topics
      </button>

      <div className="card">
        <span className="inline-flex w-fit items-center rounded-full bg-brand-50 dark:bg-brand-900/40 px-2.5 py-1 text-xs font-semibold text-brand-600 dark:text-brand-400">
          {topic.category}
        </span>
        <h3 className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{topic.title}</h3>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{topic.prompt}</p>
      </div>

      {loading && (
        <div className="card flex flex-col items-center gap-3 py-14 text-center">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600 dark:border-slate-700 dark:border-t-brand-400" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Researching this topic...</p>
        </div>
      )}

      {!loading && error && (
        <div className="card">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <Button className="mt-3" onClick={onRegenerate}>
            Try again
          </Button>
        </div>
      )}

      {!loading && !error && brief && (
        <>
          <div className="card animate-fade-up">
            <div className="flex items-center gap-2">
              <MessageIcon className="h-5 w-5 flex-none text-brand-600 dark:text-brand-400" />
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Introduction</h4>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{brief.intro}</p>
          </div>

          {brief.quick_facts.length > 0 && (
            <div className="card animate-fade-up-delay-1">
              <div className="flex items-center gap-2">
                <LightbulbIcon className="h-5 w-5 flex-none text-brand-600 dark:text-brand-400" />
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Quick facts to mention</h4>
              </div>
              <ul className="mt-3 space-y-2">
                {brief.quick_facts.map((fact, index) => (
                  <li key={index} className="flex gap-2.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-brand-400" />
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 animate-fade-up-delay-2">
            <PointList heading="Points in favor" tone="for" points={brief.points_for} />
            <PointList heading="Points against" tone="against" points={brief.points_against} />
          </div>

          {brief.conclusion && (
            <div className="card">
              <div className="flex items-center gap-2">
                <FlagIcon className="h-5 w-5 flex-none text-brand-600 dark:text-brand-400" />
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">How to conclude</h4>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{brief.conclusion}</p>
            </div>
          )}

          {brief.key_phrases.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2">
                <MessageIcon className="h-5 w-5 flex-none text-brand-600 dark:text-brand-400" />
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Handy phrases to sound confident</h4>
              </div>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {brief.key_phrases.map((group) => (
                  <div key={group.category}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                      {group.category}
                    </p>
                    <ul className="mt-1.5 space-y-1">
                      {group.phrases.map((phrase, index) => (
                        <li key={index} className="text-sm italic text-slate-600 dark:text-slate-400">
                          &ldquo;{phrase}&rdquo;
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button variant="secondary" onClick={onRegenerate}>
            Regenerate
          </Button>

          <TopicDiscussion topic={topic} />
        </>
      )}
    </div>
  );
}

function GroupDiscussion() {
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null); // null = "All topics"
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedTopic, setSelectedTopic] = useState(null);
  const [brief, setBrief] = useState(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefError, setBriefError] = useState("");

  const [customQuery, setCustomQuery] = useState("");

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

  const runBrief = (topic) => {
    setSelectedTopic(topic);
    setBrief(null);
    setBriefError("");
    setBriefLoading(true);
    const request = topic.isCustom ? generateCustomGDTopicBrief(topic.title) : generateGDTopicBrief(topic.id);
    request
      .then(({ data }) => setBrief(data))
      .catch((err) => setBriefError(err.response?.data?.detail || "Couldn't research this topic right now. Please try again."))
      .finally(() => setBriefLoading(false));
  };

  const handleCustomSearch = (event) => {
    event.preventDefault();
    const query = customQuery.trim();
    if (!query) return;
    runBrief({ id: `custom-${Date.now()}`, category: "Custom topic", title: query, prompt: "A topic you searched for.", isCustom: true });
  };

  if (selectedTopic) {
    return (
      <TopicBrief
        topic={selectedTopic}
        brief={brief}
        loading={briefLoading}
        error={briefError}
        onRegenerate={() => runBrief(selectedTopic)}
        onBack={() => setSelectedTopic(null)}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Group discussion topics</h3>
            <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
              Pick a topic and MockMate will research it for you -- quick facts, points for and against with
              examples, a closing line, and phrases to sound confident. A live, AI-simulated discussion round
              -- practicing against multiple AI participants, not an actual group -- is coming soon.
            </p>
          </div>
          <span className="inline-flex flex-none items-center rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            Live discussion coming soon
          </span>
        </div>

        <div className="mt-4 rounded-xl border border-brand-100 dark:border-brand-900/40 bg-brand-50/50 dark:bg-brand-950/20 p-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-700 dark:text-brand-400">
            <SparkleIcon className="h-3.5 w-3.5" />
            Search topics with AI
          </div>
          <form onSubmit={handleCustomSearch} className="mt-2 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={customQuery}
                onChange={(event) => setCustomQuery(event.target.value)}
                maxLength={200}
                placeholder="Not in the list? Type any GD topic, e.g. “Should exams be abolished?”"
                className="input-field pl-9"
              />
            </div>
            <Button type="submit" disabled={!customQuery.trim()} className="sm:flex-none">
              Search
            </Button>
          </form>
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
              <Button className="mt-2 self-start" onClick={() => runBrief(topic)}>
                Research this topic
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default GroupDiscussion;
