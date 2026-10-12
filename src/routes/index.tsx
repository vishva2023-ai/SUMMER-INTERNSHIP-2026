import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  GraduationCap,
  FileUp,
    Loader2,
  Search,
  Users,
} from "lucide-react";
import {
  ACADEMIC_YEARS,
  DEPARTMENTS,
  FILE_RULES,
  PANELS,
  REVIEW_DATES,
  SCHOOLS,
  type FileKind,
} from "@/lib/config";
import { FileDrop } from "@/components/FileDrop";
import { submitSubmission } from "@/lib/submissions.functions";
import { isVitEmail, DUPLICATE_MSG } from "@/lib/config";
import vitLogo from "@/assets/vit_logo.png.asset.json";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Summer Internship Review 2026 – VIT Document Submission Portal" },
      {
        name: "description",
        content:
          "Submit your Summer Internship Review 2026 documents: report, presentation, and certificate. Select your review panel and date, upload, and confirm.",
      },
      { property: "og:title", content: "Summer Internship Review 2026 – VIT Document Submission Portal" },
      {
        property: "og:description",
        content: "Submit your internship review documents for the October 2026 reviews.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Portal,
});

const STEPS = [
  { label: "Student Information", icon: GraduationCap },
  { label: "Internship Details", icon: FileUp },
  { label: "Review Panel & Date", icon: Users },
  { label: "Document Upload", icon: FileUp },
  { label: "Preview & Submit", icon: Check },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_RE = /^[6-9]\d{9}$/;

type FormState = {
  studentName: string;
  registrationNumber: string;
  email: string;
  mobileNumber: string;
  school: string;
  department: string;
  academicYear: string;
  internshipCompany: string;
  projectTitle: string;
  facultyGuide: string;
  panelNumber: number | null;
  reviewDate: string;
};

const initialForm: FormState = {
  studentName: "",
  registrationNumber: "",
  email: "",
  mobileNumber: "",
  school: "",
  department: "",
  academicYear: "",
  internshipCompany: "",
  projectTitle: "",
  facultyGuide: "",
  panelNumber: null,
  reviewDate: "",
};

function Field({
  label,
  error,
  children,
  optional,
}: {
  label: string;
  error?: string | undefined;
  children: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">
        {label} {optional && <span className="text-xs text-muted-foreground">(optional)</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs font-medium text-destructive">{error}</span>}
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20";

function Portal() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);
  const [files, setFiles] = useState<Record<FileKind, File | null>>({
    report: null,
    presentation: null,
    certificate: null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [panelSearch, setPanelSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();
  const [warnOpen, setWarnOpen] = useState(false);
  const [dupOpen, setDupOpen] = useState(false);

  const set = (k: keyof FormState, v: string | number | null) =>
    setForm((f) => ({ ...f, [k]: v }));

  const filteredPanels = useMemo(() => {
    const q = panelSearch.trim().toLowerCase();
    if (!q) return PANELS;
    return PANELS.filter(
      (p) => p.faculty.toLowerCase().includes(q) || String(p.panel).includes(q),
    );
  }, [panelSearch]);

  const selectedPanel = PANELS.find((p) => p.panel === form.panelNumber);

  const validateStep = (s: number): boolean => {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (!form.studentName.trim()) e["studentName"] = "Required";
      if (!form.registrationNumber.trim()) e["registrationNumber"] = "Required";
      if (!EMAIL_RE.test(form.email.trim())) e["email"] = "Enter a valid email address";
      else if (!isVitEmail(form.email)) e["email"] = "Use your VIT student email ID (@vitstudent.ac.in)";
      if (!MOBILE_RE.test(form.mobileNumber.trim())) e["mobileNumber"] = "Enter a valid 10-digit Indian mobile number";
      if (!form.school) e["school"] = "Required";
      if (!form.department) e["department"] = "Required";
      if (!form.academicYear) e["academicYear"] = "Required";
    }
    if (s === 1) {
      if (!form.internshipCompany.trim()) e["internshipCompany"] = "Required";
      if (!form.projectTitle.trim()) e["projectTitle"] = "Required";
    }
    if (s === 2) {
      if (!form.panelNumber) e["panelNumber"] = "Select a review panel";
      if (!form.reviewDate) e["reviewDate"] = "Select a review date";
    }
    if (s === 3) {
      if (!files.report) e["report"] = "Internship Report (PDF) is mandatory";
      if (!files.presentation) e["presentation"] = "Internship Presentation (PPT/PPTX) is mandatory";
      if (!files.certificate) e["certificate"] = "Internship Certificate (image) is mandatory";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(undefined);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v ?? "")));
      fd.set("email", form.email.trim().toLowerCase());
      fd.append("acknowledged", "true");
      fd.append("report", files.report!);
      fd.append("presentation", files.presentation!);
      fd.append("certificate", files.certificate!);
      const result = await submitSubmission({ data: fd });
      navigate({ to: "/confirmation/$token", params: { token: result.token } });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Submission failed. Please try again.";
      if (msg.includes(DUPLICATE_MSG)) setDupOpen(true);
      else setSubmitError(msg);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="hero-band text-primary-foreground">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-6">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-card ring-2 ring-gold md:h-20 md:w-20">
            <img src={vitLogo.url} alt="Vellore Institute of Technology logo" className="block h-[88%] w-[88%] object-contain" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gold">
              Vellore Institute of Technology
            </p>
            <h1 className="text-xl font-bold md:text-2xl">Summer Internship Review 2026</h1>
          </div>
        </div>
        <div className="gold-rule h-0.5 w-full" />
      </header>

      {/* Progress */}
      <div className="mx-auto max-w-5xl px-4 pt-8">
        <ol className="flex items-center gap-1 overflow-x-auto pb-2">
          {STEPS.map((s, i) => (
            <li key={s.label} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${
                  i < step
                    ? "border-primary bg-primary text-primary-foreground"
                    : i === step
                      ? "border-gold bg-gold text-gold-foreground"
                      : "border-input bg-card text-muted-foreground"
                }`}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={`hidden text-center text-[11px] font-medium sm:block ${
                  i === step ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {s.label}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* Card */}
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div key={step} className="step-enter rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-foreground">Section A – Student Details</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Student Full Name" error={errors["studentName"]}>
                  <input className={inputCls} value={form.studentName} onChange={(e) => set("studentName", e.target.value)} placeholder="e.g. Vishva S A" />
                </Field>
                <Field label="Registration Number" error={errors["registrationNumber"]}>
                  <input className={inputCls} value={form.registrationNumber} onChange={(e) => set("registrationNumber", e.target.value)} placeholder="e.g. 23MIS0420" />
                </Field>
                <Field label="VIT Email ID" error={errors["email"]}>
                  <input type="email" className={inputCls} value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="name.surname2023@vitstudent.ac.in" />
                </Field>
                <Field label="Mobile Number" error={errors["mobileNumber"]}>
                  <input inputMode="numeric" maxLength={10} className={inputCls} value={form.mobileNumber} onChange={(e) => set("mobileNumber", e.target.value.replace(/\D/g, ""))} placeholder="10-digit mobile" />
                </Field>
                <Field label="School" error={errors["school"]}>
                  <select className={inputCls} value={form.school} onChange={(e) => set("school", e.target.value)}>
                    <option value="">Select school</option>
                    {SCHOOLS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Department" error={errors["department"]}>
                  <select className={inputCls} value={form.department} onChange={(e) => set("department", e.target.value)}>
                    <option value="">Select department</option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Current Academic Year" error={errors["academicYear"]}>
                  <select className={inputCls} value={form.academicYear} onChange={(e) => set("academicYear", e.target.value)}>
                    <option value="">Select year</option>
                    {ACADEMIC_YEARS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-foreground">Section B – Internship Details</h2>
              <Field label="Internship Company / Organization Name" error={errors["internshipCompany"]}>
                <input className={inputCls} value={form.internshipCompany} onChange={(e) => set("internshipCompany", e.target.value)} />
              </Field>
              <Field label="Internship Project Title" error={errors["projectTitle"]}>
                <input className={inputCls} value={form.projectTitle} onChange={(e) => set("projectTitle", e.target.value)} />
              </Field>
              <Field label="Faculty Guide Name" optional>
                <input className={inputCls} value={form.facultyGuide} onChange={(e) => set("facultyGuide", e.target.value)} />
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-foreground">Section C – Review Details</h2>

              <div>
                <span className="mb-1.5 block text-sm font-medium text-foreground">Review Panel</span>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    className={`${inputCls} pl-9`}
                    placeholder="Search by panel number or faculty name…"
                    value={panelSearch}
                    onChange={(e) => setPanelSearch(e.target.value)}
                  />
                </div>
                <div className="max-h-56 overflow-y-auto rounded-lg border border-input">
                  {filteredPanels.length === 0 && (
                    <p className="px-3 py-4 text-sm text-muted-foreground">No matching panel.</p>
                  )}
                  {filteredPanels.map((p) => (
                    <button
                      key={p.panel}
                      type="button"
                      onClick={() => set("panelNumber", p.panel)}
                      className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors ${
                        form.panelNumber === p.panel
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-secondary"
                      }`}
                    >
                      <span>
                        Panel {p.panel} – {p.faculty}
                      </span>
                      {form.panelNumber === p.panel && <Check className="h-4 w-4" />}
                    </button>
                  ))}
                </div>
                {errors["panelNumber"] && <p className="mt-1 text-xs font-medium text-destructive">{errors["panelNumber"]}</p>}
                {selectedPanel && (
                  <p className="mt-2 rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">
                    Selected: <strong>Panel {selectedPanel.panel} – {selectedPanel.faculty}</strong>
                  </p>
                )}
              </div>

              <div>
                <span className="mb-2 block text-sm font-medium text-foreground">
                  <CalendarDays className="mr-1 inline h-4 w-4" /> Review Date (select exactly one)
                </span>
                <div className="grid gap-3 sm:grid-cols-3">
                  {REVIEW_DATES.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => set("reviewDate", d.value)}
                      aria-pressed={form.reviewDate === d.value}
                      className={`relative cursor-pointer rounded-xl border-2 px-4 py-4 text-center transition-all ${
                        form.reviewDate === d.value
                          ? "border-primary bg-primary text-primary-foreground shadow-md ring-2 ring-gold"
                          : "border-input bg-card hover:border-primary/40 hover:bg-secondary"
                      }`}
                    >
                      {form.reviewDate === d.value && (
                        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-gold-foreground">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                      <p className={`text-xs font-medium uppercase tracking-wide ${form.reviewDate === d.value ? "text-gold" : "text-muted-foreground"}`}>{d.day}</p>
                      <p className={`mt-1 font-display text-lg font-semibold ${form.reviewDate === d.value ? "text-primary-foreground" : "text-foreground"}`}>{d.label}</p>
                    </button>
                  ))}
                </div>
                {errors["reviewDate"] && <p className="mt-1 text-xs font-medium text-destructive">{errors["reviewDate"]}</p>}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="rounded-xl border border-gold/50 bg-accent p-4">
                <h3 className="text-sm font-semibold text-accent-foreground">Internship Report – Sample Format</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  The approved sample report will be published here by the coordinators. Placeholder — coming soon.
                </p>
                <div className="mt-3 flex gap-2">
                  <button type="button" disabled className="rounded-md border border-input bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground opacity-60">
                    View Sample PDF
                  </button>
                  <button type="button" disabled className="rounded-md border border-input bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground opacity-60">
                    Download Sample PDF
                  </button>
                </div>
              </div>

              <h2 className="text-lg font-semibold text-foreground">Mandatory Document Uploads</h2>
              <p className="text-xs text-muted-foreground">
                Files are renamed automatically as RegistrationNumber_Name_DocumentType — no manual renaming needed.
              </p>
              <FileDrop kind="report" file={files.report} error={errors["report"]} onChange={(f) => setFiles((p) => ({ ...p, report: f }))} />
              <FileDrop kind="presentation" file={files.presentation} error={errors["presentation"]} onChange={(f) => setFiles((p) => ({ ...p, presentation: f }))} />
              <FileDrop kind="certificate" file={files.certificate} error={errors["certificate"]} onChange={(f) => setFiles((p) => ({ ...p, certificate: f }))} />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-foreground">Preview – Confirm Your Details</h2>
              <dl className="divide-y divide-border rounded-xl border border-border">
                {(
                  [
                    ["Student Name", form.studentName],
                    ["Registration Number", form.registrationNumber],
                    ["VIT Email ID", form.email.trim().toLowerCase()],
                    ["Mobile", form.mobileNumber],
                    ["School", form.school],
                    ["Department", form.department],
                    ["Academic Year", form.academicYear],
                    ["Company", form.internshipCompany],
                    ["Project Title", form.projectTitle],
                    ["Faculty Guide", form.facultyGuide || "—"],
                    ["Panel", selectedPanel ? `Panel ${selectedPanel.panel} – ${selectedPanel.faculty}` : ""],
                    ["Review Date", REVIEW_DATES.find((d) => d.value === form.reviewDate)?.label ?? ""],
                    ["Report", files.report?.name ?? ""],
                    ["Presentation", files.presentation?.name ?? ""],
                    ["Certificate", files.certificate?.name ?? ""],
                  ] as [string, string][]
                ).map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-0.5 px-4 py-2.5 sm:flex-row sm:justify-between">
                    <dt className="text-sm text-muted-foreground">{k}</dt>
                    <dd className="text-sm font-medium text-foreground">{v}</dd>
                  </div>
                ))}
              </dl>
              {submitError && (
                <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                  {submitError}
                </p>
              )}
            </div>
          )}

          {/* Nav */}
          <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
            <button
              type="button"
              onClick={back}
              disabled={step === 0 || submitting}
              className="inline-flex items-center gap-2 rounded-md border border-input bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4" /> {step === 4 ? "Edit Details" : "Back"}
            </button>
            {step < 4 ? (
              <button
                type="button"
                onClick={next}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setWarnOpen(true)}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Uploading & Saving…
                  </>
                ) : (
                  <>
                    Confirm and Submit <Check className="h-4 w-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </main>

      <AlertDialog open={warnOpen} onOpenChange={setWarnOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Important – One Submission Only</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Each student is allowed to submit their Summer Internship Review 2026 documents only once.</p>
                <p>Please carefully verify your personal details, review panel, review date, internship information, and all three uploaded documents before submitting.</p>
                <p>Multiple submissions using the same registration number or VIT email ID are not permitted. Only your first successful submission will be retained.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go Back and Review</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setWarnOpen(false); void submit(); }}>
              I Understand – Submit Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={dupOpen} onOpenChange={setDupOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Already Submitted</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>You have already submitted your Summer Internship Review 2026 documents.</p>
                <p>Only one submission is permitted per student. Your original submission has been retained. Further submissions will not be accepted.</p>
                <p>For any queries or clarifications, or if a correction is required, please contact Prof. Kalaivani S (8608725003) &amp; kalaivanis@vit.ac.in.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setDupOpen(false)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        Summer Internship Review 2026 · Academic Year 2026 · Vellore Institute of Technology
      </footer>
    </div>
  );
}
