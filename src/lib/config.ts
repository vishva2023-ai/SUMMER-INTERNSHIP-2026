// ── Configurable portal settings ─────────────────────────────────────────────
// Edit these lists for future academic years. Panel ↔ faculty mapping is exact
// for Summer Internship Review 2026; do not reorder (panel number = index + 1).

export const REVIEW_DATES = [
  { value: "2026-10-14", label: "14 October 2026", day: "Wednesday" },
  { value: "2026-10-15", label: "15 October 2026", day: "Thursday" },
  { value: "2026-10-16", label: "16 October 2026", day: "Friday" },
] as const;

export const PANELS: { panel: number; faculty: string }[] = [
  { panel: 1, faculty: "Prof. Hemalatha S" },
  { panel: 2, faculty: "Prof. Shantharajah S P" },
  { panel: 3, faculty: "Prof. Dhinesh Babu L D" },
  { panel: 4, faculty: "Prof. Kamalakannan J" },
  { panel: 5, faculty: "Prof. Sree Dharinya S" },
  { panel: 6, faculty: "Prof. Santhi K" },
  { panel: 7, faculty: "Prof. Kiruba Thangam R" },
  { panel: 8, faculty: "Prof. Prabukumar M" },
  { panel: 9, faculty: "Prof. Anitha A" },
  { panel: 10, faculty: "Prof. Thilagavathi M" },
  { panel: 11, faculty: "Prof. Mareeswari V" },
  { panel: 12, faculty: "Prof. Sujatha R" },
  { panel: 13, faculty: "Prof. Prabhu J" },
  { panel: 14, faculty: "Prof. Swarna Priya R M" },
  { panel: 15, faculty: "Prof. Senthil Kumar M" },
  { panel: 16, faculty: "Prof. Siva Rama Krishnan Somayaji" },
  { panel: 17, faculty: "Prof. Chiranji Lal Chowdhary" },
  { panel: 18, faculty: "Prof. Vanmathi C" },
  { panel: 19, faculty: "Prof. Agilandeeswari L" },
  { panel: 20, faculty: "Prof. Rahamathunnisa U" },
  { panel: 21, faculty: "Prof. VijayaRani A" },
  { panel: 22, faculty: "Prof. Bhavani S" },
  { panel: 23, faculty: "Prof. Krithika L B" },
  { panel: 24, faculty: "Prof. Brijendra Singh" },
  { panel: 25, faculty: "Prof. Magesh G" },
  { panel: 26, faculty: "Prof. TamilPriya D" },
  { panel: 27, faculty: "Prof. Valarmathi B" },
  { panel: 28, faculty: "Prof. Rajeswari C" },
  { panel: 29, faculty: "Prof. Karthikeyan J" },
  { panel: 30, faculty: "Prof. Rajesh Kaluri" },
  { panel: 31, faculty: "Prof. Navaneethan C" },
  { panel: 32, faculty: "Prof. Dharmendra Singh Rajput" },
  { panel: 33, faculty: "Prof. Uma K" },
  { panel: 34, faculty: "Prof. Vellingiri J" },
  { panel: 35, faculty: "Prof. Balaji E" },
  { panel: 36, faculty: "Prof. Jagadeesan S" },
  { panel: 37, faculty: "Prof. Jagannathan J" },
  { panel: 38, faculty: "Prof. Balaganesh N" },
  { panel: 39, faculty: "Ms. Sujana M" },
  { panel: 40, faculty: "Mr. Krishnaiahgari Joseph" },
  { panel: 41, faculty: "Mr. Muthu Kumar M" },
  { panel: 42, faculty: "Ms. Tejasri K" },
  { panel: 43, faculty: "Ms. Maddela Shreshta" },
  { panel: 44, faculty: "Mr. Jayasuriya R" },
  { panel: 45, faculty: "Mr. Sendhilkumar T" },
  { panel: 46, faculty: "Ms. Sai Sri Hemantha Konala" },
  { panel: 47, faculty: "Mr. Amuthan S" },
  { panel: 48, faculty: "Ms. Dhivya J" },
  { panel: 49, faculty: "Mr. Suresh V J" },
  { panel: 50, faculty: "Mr. Gunanidhi G S" },
  { panel: 51, faculty: "Dr. Ayeswarya S" },
  { panel: 52, faculty: "Dr. Kalaivani S" },
];

// NOTE: Placeholder options — replace with the official VIT school/department
// lists when provided. Kept configurable per the project brief.
export const SCHOOLS = [
  "School of Computer Science Engineering and Information Systems (SCORE)",
  "School of Computer Science and Engineering (SCOPE)",
  "School of Information Technology and Engineering (SITE)",
  "School of Electronics Engineering (SENSE)",
  "School of Electrical Engineering (SELECT)",
  "School of Mechanical Engineering (SMEC)",
  "School of Civil Engineering (SCE)",
  "School of Bio Sciences and Technology (SBST)",
  "School of Social Sciences and Languages (SSL)",
  "School of Business (VSB)",
  "Other",
];

export const DEPARTMENTS = [
  "Software and System Engineering",
  "Computer Science and Engineering",
  "Information Technology",
  "Electronics and Communication Engineering",
  "Electrical and Electronics Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Biotechnology",
  "Master of Computer Applications",
  "Master of Business Administration",
  "Other",
];

export const ACADEMIC_YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"];

export const FILE_RULES = {
  report: { label: "Internship Report", exts: [".pdf"], maxBytes: 5 * 1024 * 1024 },
  presentation: { label: "Internship Presentation", exts: [".ppt", ".pptx"], maxBytes: 5 * 1024 * 1024 },
  certificate: { label: "Internship Certificate", exts: [".jpg", ".jpeg", ".png"], maxBytes: 3 * 1024 * 1024 },
} as const;

export type FileKind = keyof typeof FILE_RULES;

export function sanitizeName(name: string): string {
  return name
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function buildFileName(reg: string, name: string, kind: FileKind, ext: string): string {
  const type = kind === "report" ? "Report" : kind === "presentation" ? "Presentation" : "Certificate";
  return `${sanitizeName(reg)}_${sanitizeName(name)}_${type}${ext.toLowerCase()}`;
}

// Approved institutional student email domains (lowercase).
export const VIT_EMAIL_DOMAINS = ["vitstudent.ac.in"];

export function isVitEmail(email: string): boolean {
  const e = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return false;
  return VIT_EMAIL_DOMAINS.includes(e.split("@")[1] ?? "");
}

export const DUPLICATE_MSG = "DUPLICATE_SUBMISSION";

export function formatIST(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", { timeZone: "Asia/Kolkata", day: "numeric", month: "long", year: "numeric" });
  const time = d.toLocaleTimeString("en-US", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }) + " IST";
  return { date, time };
}
