// Course/field -> role options, used to help pick a role in two steps instead
// of typing one from scratch. "OTHER_VALUE" is the sentinel used by both
// dropdowns to mean "not listed -- let me type it."

export const OTHER_VALUE = "__other__";

export const COURSES = [
  {
    value: "web-development",
    label: "Web Development",
    roles: ["Frontend Developer", "Backend Developer", "Full Stack Developer", "Web Developer"],
  },
  {
    value: "data-science",
    label: "Data Science",
    roles: ["Data Scientist", "Data Analyst", "Data Engineer", "Business Intelligence Analyst"],
  },
  {
    value: "ai-ml",
    label: "AI / Machine Learning",
    roles: [
      "Machine Learning Engineer",
      "AI Engineer",
      "NLP Engineer",
      "Computer Vision Engineer",
      "MLOps Engineer",
    ],
  },
  {
    value: "mobile-development",
    label: "Mobile Development",
    roles: ["Android Developer", "iOS Developer", "Flutter Developer", "React Native Developer"],
  },
  {
    value: "devops-cloud",
    label: "DevOps & Cloud",
    roles: ["DevOps Engineer", "Site Reliability Engineer", "Cloud Engineer", "Platform Engineer"],
  },
  {
    value: "cybersecurity",
    label: "Cybersecurity",
    roles: ["Security Analyst", "Penetration Tester", "Security Engineer", "SOC Analyst"],
  },
  {
    value: "ui-ux-design",
    label: "UI/UX Design",
    roles: ["UI Designer", "UX Designer", "Product Designer"],
  },
  {
    value: "qa-testing",
    label: "Software Testing / QA",
    roles: ["QA Engineer", "Test Automation Engineer", "Manual Tester"],
  },
  {
    value: "database",
    label: "Database Administration",
    roles: ["Database Administrator", "Database Developer", "Data Warehouse Engineer"],
  },
  {
    value: "networking",
    label: "Networking",
    roles: ["Network Engineer", "Network Administrator"],
  },
  {
    value: "game-development",
    label: "Game Development",
    roles: ["Game Developer", "Gameplay Programmer", "Game Designer"],
  },
  {
    value: "blockchain",
    label: "Blockchain",
    roles: ["Blockchain Developer", "Smart Contract Engineer"],
  },
  {
    value: "embedded-systems",
    label: "Embedded Systems",
    roles: ["Embedded Systems Engineer", "Firmware Engineer"],
  },
  {
    value: "product-management",
    label: "Product Management",
    roles: ["Product Manager", "Associate Product Manager", "Technical Product Manager"],
  },
];

// Optional per-session focus for the fundamentals/OOP/problem-solving
// questions -- e.g. picking "Python" makes those questions specifically
// about Python instead of the LLM guessing from role/resume/JD. Deliberately
// one flat list regardless of course/role for now (not curated per role).
export const TOPICS = [
  "Python",
  "Java",
  "JavaScript / TypeScript",
  "C++",
  "C#",
  "Go",
  "Ruby",
  "PHP",
  "SQL",
  "Swift",
  "Kotlin",
];

// Interview category -- shifts the whole 5-question flow the session
// follows (see backend STAGE_SETS), independent of role/difficulty/topic.
// "technical" is the default and matches the original fixed flow.
export const INTERVIEW_TYPES = [
  { value: "technical", label: "Technical" },
  { value: "hr", label: "HR" },
  { value: "behavioral", label: "Behavioral" },
  { value: "project", label: "Project Deep-Dive" },
  { value: "system_design", label: "System Design" },
  { value: "company", label: "Company-style" },
  { value: "mixed", label: "Mixed" },
];

// Fixed role list for the interview setup screen (Phase 2) -- deliberately
// short and flat, unlike the course->role picker used elsewhere.
export const SETUP_ROLES = [
  "Software Engineer",
  "Backend Developer",
  "Frontend Developer",
  "Full Stack Developer",
  "Data Analyst",
  "Data Scientist",
  "System Engineer",
  "AI/ML Engineer",
];

// Interview setup screen difficulty labels -> the backend's difficulty enum
// (easy | medium | hard). Kept as a separate map instead of renaming the
// backend enum, so existing sessions/feedback aren't affected.
export const SETUP_DIFFICULTIES = [
  { value: "easy", label: "Beginner" },
  { value: "medium", label: "Intermediate" },
  { value: "hard", label: "Advanced" },
];

// Interview duration options (minutes) for the setup screen. Not yet
// enforced by the backend (which still asks a fixed number of questions) --
// carried through to the interview page for the timer feature to use once
// it's built.
export const SETUP_DURATIONS = [10, 20, 30, 45];
