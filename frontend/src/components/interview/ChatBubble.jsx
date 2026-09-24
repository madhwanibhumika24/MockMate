// Phase 2 -- Feature 4: a single message in the interview room's
// conversation area. Kept intentionally plain (no avatars/animations) --
// the AI identity already lives in the room's header strip, this just
// needs to read clearly as "who said this."
function ChatBubble({ from, children }) {
  const isAI = from === "ai";

  return (
    <div className={`flex ${isAI ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[75%] ${
          isAI ? "bg-slate-100 text-slate-800" : "bg-brand-600 text-white"
        }`}
      >
        <p className={`mb-1 text-xs font-semibold ${isAI ? "text-slate-500" : "text-brand-100"}`}>
          {isAI ? "AI Interviewer" : "You"}
        </p>
        <p className="whitespace-pre-wrap">{children}</p>
      </div>
    </div>
  );
}

export default ChatBubble;
