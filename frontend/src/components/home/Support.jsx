import { useState } from "react";

import Button from "../common/Button.jsx";

const FAQ_ITEMS = [
  {
    question: "How are interview questions generated?",
    answer:
      "Each question is generated from the role you choose, plus the job description and resume you provide -- so questions stay relevant to you instead of coming from a fixed template.",
  },
  {
    question: "How many questions are in a mock interview?",
    answer:
      "A typical session has five questions, mixing behavioral and technical angles depending on the role you're practicing for.",
  },
  {
    question: "What kind of feedback do I get?",
    answer:
      "After you finish a session, you'll get a short summary, specific strengths tied to your answers, and concrete things to improve -- not just a score.",
  },
  {
    question: "Is my resume stored securely?",
    answer:
      "Your resume is processed to extract its text so questions can reference your background, and it stays linked only to your own practice session.",
  },
  {
    question: "Can I practice more than once?",
    answer: "Yes -- start as many sessions as you like, for different roles or job descriptions.",
  },
  {
    question: "Is there a cost to use MockMate?",
    answer: "MockMate is free to use while we're in early access.",
  },
];

function Support() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setSubmitting(true);
    setSubmitted(true);
  };

  return (
    <div id="support" className="scroll-mt-20 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">Support</span>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">Questions? We've got answers</h2>
          <p className="mt-3 text-slate-600 dark:text-slate-400">
            Can't find what you're looking for? Send us a message and we'll get back to you.
          </p>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-2">
          <div className="space-y-3">
            {FAQ_ITEMS.map((item) => (
              <details
                key={item.question}
                className="group rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-4 open:shadow-sm"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-900 dark:text-slate-100 marker:content-none">
                  {item.question}
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-5 w-5 flex-none text-slate-400 dark:text-slate-500 transition-transform group-open:rotate-180"
                  >
                    <path
                      d="M6 9l6 6 6-6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </summary>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{item.answer}</p>
              </details>
            ))}
          </div>

          <div className="card">
            {submitted ? (
              <div className="flex h-full flex-col items-center justify-center py-10 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                  <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Thanks for reaching out</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">We'll get back to you as soon as we can.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Contact us</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">We read every message.</p>

                <div className="mt-6 space-y-5">
                  <div>
                    <label htmlFor="contactName" className="field-label">
                      Name
                    </label>
                    <input
                      id="contactName"
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Jane Doe"
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="contactEmail" className="field-label">
                      Email
                    </label>
                    <input
                      id="contactEmail"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="contactMessage" className="field-label">
                      Message
                    </label>
                    <textarea
                      id="contactMessage"
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      rows={4}
                      placeholder="How can we help?"
                      className="input-field resize-none"
                      required
                    />
                  </div>

                  {error && <div className="rounded-lg bg-red-50 dark:bg-red-900/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">{error}</div>}

                  <Button type="submit" loading={submitting} className="w-full">
                    Send message
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Support;
