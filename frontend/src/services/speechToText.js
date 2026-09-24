// Phase 2 -- Feature 11/12: Student Voice Input + Live Transcript.
//
// Thin wrapper around the browser's built-in speech recognition
// (SpeechRecognition / webkitSpeechRecognition) -- no API keys, no backend
// calls. Browser support for this is narrower than speech synthesis
// (notably missing in Firefox as of writing), so isRecognitionSupported()
// lets callers hide the mic entirely when it's not there -- voice input is
// always optional, never required to complete an interview.
function getRecognitionConstructor() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function isRecognitionSupported() {
  return getRecognitionConstructor() !== null;
}

// Starts listening and returns a controller with a stop() method.
//   onInterimResult(text) -- the current, not-yet-final guess, replaced as
//     the student keeps talking. For display only, never the answer itself.
//   onFinalResult(text)   -- one finalized chunk of speech, to be appended
//     to the running answer.
//   onEnd()               -- recognition stopped, for any reason (student
//     stopped it, a silence timeout, or an error).
//   onError(type)         -- e.g. "not-allowed" (mic permission denied),
//     "no-speech", "network", or "unsupported".
export function startRecognition({ onInterimResult, onFinalResult, onEnd, onError } = {}) {
  const Recognition = getRecognitionConstructor();
  if (!Recognition) {
    onError?.("unsupported");
    return { stop: () => {} };
  }

  const recognition = new Recognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  recognition.onresult = (event) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const result = event.results[i];
      if (result.isFinal) {
        onFinalResult?.(result[0].transcript);
      } else {
        interim += result[0].transcript;
      }
    }
    if (interim) {
      onInterimResult?.(interim);
    }
  };
  recognition.onerror = (event) => onError?.(event.error);
  recognition.onend = () => onEnd?.();

  try {
    recognition.start();
  } catch {
    onError?.("start-failed");
  }

  return {
    stop: () => {
      try {
        recognition.stop();
      } catch {
        // Already stopped -- nothing to do.
      }
    },
  };
}
