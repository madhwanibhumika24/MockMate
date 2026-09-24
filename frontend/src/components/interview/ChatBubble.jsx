// Phase 2 -- a single message in the interview room's conversation area.
// Each row gets a small initials badge (AI / ME) so the conversation reads
// clearly at a glance, plus a subtle shadow on the bubble for a touch of
// depth -- still flat, no gradients or illustrated avatars.
function ChatBubble({ from, children }) {
  const isAI = from === "ai";

  return (
    <div className={`flex items-end gap-2 ${isAI ? "justify-start" : "flex-row-reverse justify-start"}`}>
      <span
        className={`flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-full text-[11px] font-semibold ${
          isAI ? "bg-brand-100 text-brand-700" : "bg-slate-200 text-slate-600"
        }`}
      >
        {isAI ? "AI" : "ME"}
      </span>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm sm:max-w-[75%] ${
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
