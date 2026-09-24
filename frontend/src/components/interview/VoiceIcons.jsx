// Small inline icon set for the interview room's voice and timer controls.
// Plain stroke-based glyphs -- no emoji, no illustrations -- matching the
// app's existing icon style (see Header.jsx's menu icon).
function baseProps(className) {
  return {
    viewBox: "0 0 24 24",
    className: className || "h-4 w-4",
    "aria-hidden": true,
  };
}

export function PlayIcon({ className }) {
  return (
    <svg {...baseProps(className)} fill="currentColor">
      <path d="M7.5 4.5v15l12-7.5-12-7.5z" />
    </svg>
  );
}

export function PauseIcon({ className }) {
  return (
    <svg {...baseProps(className)} fill="none">
      <path d="M8 5v14M16 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ReplayIcon({ className }) {
  return (
    <svg {...baseProps(className)} fill="none">
      <path
        d="M3.5 12a8.5 8.5 0 1 0 2.5-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M3 4v5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MicIcon({ className }) {
  return (
    <svg {...baseProps(className)} fill="none">
      <path
        d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M19 11a7 7 0 0 1-14 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 19v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function StopIcon({ className }) {
  return (
    <svg {...baseProps(className)} fill="currentColor">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

export function ClockIcon({ className }) {
  return (
    <svg {...baseProps(className)} fill="none">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
