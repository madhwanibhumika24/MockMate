import { Link } from "react-router-dom";

import InterviewShowcaseCard from "./InterviewShowcaseCard.jsx";

const HEADING_LINE_1 = "Practice like it's the real thing";
const HEADING_LINE_2 = "so the real thing feels easy";
const LETTER_STEP = 0.028;

// Splits a line into per-letter <span>s (grouped by word, so a word never
// wraps mid-letter) with a staggered animation-delay, left to right. Pure
// CSS handles the actual animation, so this stays cheap even for longer
// headlines -- no timers, no re-renders.
function renderAnimatedWords(text, startIndex) {
  let index = startIndex;
  const words = text.split(" ");
  const nodes = [];

  words.forEach((word, wordIndex) => {
    const letters = word.split("").map((char, charIndex) => {
      const delay = index * LETTER_STEP;
      index += 1;
      return (
        <span key={charIndex} className="letter-reveal" style={{ animationDelay: `${delay}s` }}>
          {char}
        </span>
      );
    });
    index += 1; // reserve a beat for the space after this word

    nodes.push(
      <span key={`word-${wordIndex}`} className="inline-block whitespace-nowrap">
        {letters}
      </span>,
    );

    // Pushed as its own sibling (not inside the nowrap word span) so it's a
    // real breakable space between words instead of trailing whitespace
    // that gets collapsed away inside an inline-block box.
    if (wordIndex < words.length - 1) {
      nodes.push(" ");
    }
  });

  return { nodes, nextIndex: index };
}

function Hero() {
  const line1 = renderAnimatedWords(HEADING_LINE_1, 0);
  // Line 2 reveals as one gradient-clipped unit right after line 1 finishes
  // typing -- splitting *that* line into transformed per-letter spans
  // breaks background-clip: text in Chrome, so it stays a single node.
  const line2Delay = line1.nextIndex * LETTER_STEP + 0.05;
  const contentDelay = line2Delay + 0.5;

  return (
    <div className="mx-auto grid max-w-5xl items-center gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
      <div className="text-center lg:text-left">
        <span className="animate-fade-up inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-100">
          Practice makes prepared
        </span>

        <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl">
          <span className="block">{line1.nodes}</span>
          <span
            className="animate-fade-up block bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent"
            style={{ animationDelay: `${line2Delay}s` }}
          >
            {HEADING_LINE_2}
          </span>
        </h1>

        <p
          className="animate-fade-up mx-auto mt-5 max-w-xl text-lg text-slate-600 lg:mx-0"
          style={{ animationDelay: `${contentDelay}s` }}
        >
          Tell MockMate the role you're targeting and it generates tailored
          interview questions, then gives you structured feedback on how you
          answered.
        </p>

        <div
          className="animate-fade-up mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start"
          style={{ animationDelay: `${contentDelay + 0.12}s` }}
        >
          <Link
            to="/login"
            className="group inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-brand-600/30 transition hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-md"
          >
            Start a mock interview
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
            >
              <path
                d="M5 12h14m0 0l-6-6m6 6l-6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <a href="/#features" className="text-sm font-semibold text-slate-600 transition hover:text-brand-600">
            See what's included
          </a>
        </div>

        <blockquote
          className="animate-fade-up mx-auto mt-12 max-w-md border-l-4 border-brand-400 pl-4 text-left lg:mx-0"
          style={{ animationDelay: `${contentDelay + 0.24}s` }}
        >
          <p className="text-base italic text-slate-600">
            &ldquo;Success is where preparation and opportunity meet.&rdquo;
          </p>
          <footer className="mt-1 text-sm text-slate-400">&mdash; Bobby Unser</footer>
        </blockquote>
      </div>

      <div className="animate-fade-up hidden lg:block" style={{ animationDelay: `${contentDelay + 0.1}s` }}>
        <InterviewShowcaseCard />
      </div>
    </div>
  );
}

export default Hero;
