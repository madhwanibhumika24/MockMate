import { useEffect, useRef } from "react";

/**
 * A row of single-digit boxes for entering a numeric verification code.
 * Typing advances focus automatically; backspace/arrow keys move back and
 * forth; pasting a full code fills every box at once.
 */
function OtpCodeInput({ length = 6, value, onChange, disabled = false, autoFocus = true }) {
  const inputsRef = useRef([]);

  useEffect(() => {
    if (autoFocus) inputsRef.current[0]?.focus();
  }, [autoFocus]);

  const digits = Array.from({ length }, (_, index) => value[index] || "");

  const handleChange = (index, event) => {
    const raw = event.target.value.replace(/\D/g, "");
    const next = digits.slice();

    if (!raw) {
      next[index] = "";
      onChange(next.join(""));
      return;
    }

    // A fast typist or an OS autofill can drop more than one digit into a
    // single box (e.g. pasting via the keyboard suggestion bar) -- spread
    // whatever came in across the remaining boxes instead of dropping it.
    let cursor = index;
    for (const char of raw.split("")) {
      if (cursor >= length) break;
      next[cursor] = char;
      cursor += 1;
    }
    onChange(next.join(""));
    inputsRef.current[Math.min(cursor, length - 1)]?.focus();
  };

  const handleKeyDown = (index, event) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (event.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (event.key === "ArrowRight" && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    event.preventDefault();
    onChange(pasted);
    inputsRef.current[Math.min(pasted.length, length - 1)]?.focus();
  };

  return (
    <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(event) => handleChange(index, event)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          className="h-12 w-10 rounded-lg border border-slate-300 text-center text-lg font-semibold text-slate-900 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:bg-slate-100 disabled:text-slate-400 sm:h-14 sm:w-12"
        />
      ))}
    </div>
  );
}

export default OtpCodeInput;
