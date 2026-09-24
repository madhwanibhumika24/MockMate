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

// Chrome (most noticeably on Windows) has two long-standing speech
// synthesis bugs that both show up as choppy, cutting-in-and-out audio on
// anything longer than a short sentence:
//   1. it silently pauses speech after ~15 seconds unless something nudges
//      it, and
//   2. an utterance with no live reference elsewhere in the page can get
//      garbage-collected mid-speech.
// currentUtterance and the keep-alive interval below exist specifically to
// work around those two things, not for anything functional.
let currentUtterance = null;
let keepAliveTimer = null;

function startKeepAlive() {
  stopKeepAlive();
  keepAliveTimer = window.setInterval(() => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }
  }, 10000);
}

function stopKeepAlive() {
  if (keepAliveTimer) {
    window.clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }
}

// getVoices() can return an empty list the first time it's called in
// Chrome -- the real list only arrives asynchronously via the
// "voiceschanged" event. Cache whatever we're given so a slightly-late
// voice list from the very first question isn't lost.
let cachedVoices = [];

function loadVoices() {
  if (!isSpeechSupported()) return [];
  const voices = window.speechSynthesis.getVoices();
  if (voices.length) {
    cachedVoices = voices;
  }
  return cachedVoices;
}

if (isSpeechSupported()) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

// The Web Speech API doesn't expose a "gender" field on voices, only a
// name and a language/locale -- so matching "Indian" and "female" is a
// best-effort name match against the voice names actually shipped by
// Windows/Chrome/macOS for Indian English (and Hindi), not a guarantee.
// What's actually available depends on the voices installed on the
// student's own machine (on Windows: Settings > Time & Language > Speech).
const INDIAN_FEMALE_VOICE_NAMES = ["neerja", "heera", "lekha", "swara"];
const FEMALE_HINT_WORDS = ["female", "woman"];

function isIndianLocale(voice) {
  const lang = voice.lang?.toLowerCase() || "";
  return lang === "en-in" || lang === "hi-in";
}

function looksFemale(voice) {
  const name = voice.name?.toLowerCase() || "";
  return (
    INDIAN_FEMALE_VOICE_NAMES.some((known) => name.includes(known)) ||
    FEMALE_HINT_WORDS.some((word) => name.includes(word))
  );
}

// Best available match, in order of preference: an Indian voice that also
// looks female, then any Indian voice, then any English voice that looks
// female, then null (meaning: let the browser use its own default voice).
function pickPreferredVoice() {
  const voices = loadVoices();
  if (!voices.length) return null;

  return (
    voices.find((voice) => isIndianLocale(voice) && looksFemale(voice)) ||
    voices.find(isIndianLocale) ||
    voices.find((voice) => (voice.lang?.toLowerCase() || "").startsWith("en") && looksFemale(voice)) ||
    null
  );
}

// Cancels whatever is currently speaking/queued and starts a new utterance.
// Callbacks are optional and let the caller drive a simple
// idle/speaking/paused UI state.
export function speak(text, { onStart, onEnd, onError } = {}) {
  if (!isSpeechSupported() || !text) {
    onError?.();
    return;
  }

  stopKeepAlive();
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  // Normal (medium) rate and natural pitch -- tuned down from an earlier
  // slower/higher-pitched setting that read as less clear.
  utterance.rate = 1;
  utterance.pitch = 1;

  const preferredVoice = pickPreferredVoice();
  if (preferredVoice) {
    utterance.voice = preferredVoice;
    utterance.lang = preferredVoice.lang;
  }

  utterance.onstart = () => {
    startKeepAlive();
    onStart?.();
  };
  utterance.onend = () => {
    stopKeepAlive();
    currentUtterance = null;
    onEnd?.();
  };
  utterance.onerror = () => {
    stopKeepAlive();
    currentUtterance = null;
    onError?.();
  };

  // Held in module scope (not just this function's local variable) so
  // Chrome has a live reference to the utterance for as long as it's
  // speaking -- see the note above.
  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

export function pauseSpeech() {
  if (isSpeechSupported()) {
    stopKeepAlive();
    window.speechSynthesis.pause();
  }
}

export function resumeSpeech() {
  if (isSpeechSupported()) {
    window.speechSynthesis.resume();
    startKeepAlive();
  }
}

export function cancelSpeech() {
  if (isSpeechSupported()) {
    stopKeepAlive();
    window.speechSynthesis.cancel();
  }
  currentUtterance = null;
}
