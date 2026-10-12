import { formatIST } from "@/lib/config";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock, Download, Printer, AlertTriangle } from "lucide-react";
import { getConfirmation } from "@/lib/submissions.functions";

export const Route = createFileRoute("/confirmation/$token")({
  head: () => ({
    meta: [
      { title: "Submission Confirmed – Summer Internship Review 2026" },
      { name: "description", content: "Your Summer Internship Review 2026 submission acknowledgment." },
      { property: "og:title", content: "Submission Confirmed – Summer Internship Review 2026" },
      { property: "og:description", content: "Your Summer Internship Review 2026 submission acknowledgment." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: ({ params }) => getConfirmation({ data: params.token }),
  component: ConfirmationPage,
});

function useCountdown(expiresAt: string) {
  const [left, setLeft] = useState(() => new Date(expiresAt).getTime() - Date.now());
  useEffect(() => {
    const t = setInterval(() => setLeft(new Date(expiresAt).getTime() - Date.now()), 1000);
    return () => clearInterval(t);
  }, [expiresAt]);
  const s = Math.max(0, Math.floor(left / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function ConfirmationPage() {
  const data = Route.useLoaderData();

  if (data.status !== "ok") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-gold" />
          <h1 className="mt-4 text-2xl font-semibold text-foreground">
            {data.status === "expired" ? "This confirmation link has expired" : "Confirmation not found"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Confirmation links are valid for 30 minutes after submission. Your submitted documents and
            records remain safely stored.
          </p>
          <Link to="/" className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Back to portal
          </Link>
        </div>
      </div>
    );
  }

  const s = data.submission;
  return <ConfirmationBody s={s} expiresAt={data.expiresAt} />;
}

function ConfirmationBody({
  s,
  expiresAt,
}: {
  s: Extract<Awaited<ReturnType<typeof getConfirmation>>, { status: "ok" }>["submission"];
  expiresAt: string;
}) {
  const countdown = useCountdown(expiresAt);

  const rows: [string, unknown][] = [
    ["Student Name", s.studentName],
    ["Registration Number", s.registrationNumber],
    ["VIT Email ID", s.email],
    ["School", s.school],
    ["Department", s.department],
    ["Submission ID", s.submissionId],
    ["Panel Number", s.panelNumber],
    ["Faculty Name", s.facultyName],
    ["Review Date", s.reviewDate],
    ["Submission Date", formatIST(String(s.submittedAt)).date],
    ["Submission Time", formatIST(String(s.submittedAt)).time],
    ["Report File", s.pdfFilename],
    ["Presentation File", s.pptFilename],
    ["Certificate File", s.certificateFilename],
    ["Google Sheets Sync", s.sheetSyncStatus === "synced" ? "Synced" : "Pending retry"],
  ];

  const downloadAck = () => {
    const text = [
      "SUMMER INTERNSHIP REVIEW 2026 — SUBMISSION ACKNOWLEDGMENT",
      "",
      ...rows.map(([k, v]) => `${k}: ${v}`),
      "",
      "This acknowledgment confirms receipt of your internship review documents.",
    ].join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${s.submissionId}_Acknowledgment.txt`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="success-pop rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="text-center">
            <CheckCircle2 className="mx-auto h-16 w-16 text-primary" />
            <h1 className="mt-4 text-2xl font-bold text-foreground md:text-3xl">
              Your Summer Internship Review Documents Have Been Submitted Successfully!
            </h1>
            <div className="gold-rule mx-auto mt-4 h-px w-40" />
          </div>

          <dl className="mt-8 divide-y divide-border rounded-xl border border-border">
            {rows.map(([k, v]) => (
              <div key={k} className="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:justify-between">
                <dt className="text-sm text-muted-foreground">{k}</dt>
                <dd className="text-sm font-medium text-foreground">{String(v)}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 text-sm text-accent-foreground no-print">
            <Clock className="h-4 w-4" />
            This confirmation page expires in <span className="font-mono font-bold">{countdown}</span>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-3 no-print">
            <button
              onClick={downloadAck}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Download className="h-4 w-4" /> Download Acknowledgment
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-md border border-input bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary"
            >
              <Printer className="h-4 w-4" /> Print Acknowledgment
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground no-print">
          Save or print this acknowledgment. The link expires 30 minutes after submission; your
          documents and records remain stored.
        </p>
      </div>
    </div>
  );
}
