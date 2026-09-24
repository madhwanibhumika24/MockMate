// Phase 2 -- Feature 9: AI Voice Output.
//
// Thin wrapper around the browser's built-in speech synthesis
// (window.speechSynthesis / SpeechSynthesisUtterance) -- no API keys, no
// backend calls, no extra dependencies. Supported in every major desktop
// and mobile browser except a few older/less common ones, which
// isSpeechSupported() lets callers detect up front so the interview can
// fall back to text-only (silently, no broken controls shown) rather than
// erroring.
export function isSpeechSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

// Cancels whatever is currently speaking/queued and starts a new utterance.
// Callbacks are optional and let the caller drive a simple
// idle/speaking/paused UI state.
export function speak(text, { onStart, onEnd, onError } = {}) {
  if (!isSpeechSupported() || !text) {
    onError?.();
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onError?.();

  window.speechSynthesis.speak(utterance);
}

export function pauseSpeech() {
  if (isSpeechSupported()) {
    window.speechSynthesis.pause();
  }
}

export function resumeSpeech() {
  if (isSpeechSupported()) {
    window.speechSynthesis.resume();
  }
}

export function cancelSpeech() {
  if (isSpeechSupported()) {
    window.speechSynthesis.cancel();
  }
}
