import { createServerFn } from "@tanstack/react-start";
import { DEPARTMENTS, SCHOOLS, isVitEmail, DUPLICATE_MSG, formatIST, PANELS, REVIEW_DATES, FILE_RULES, buildFileName, sanitizeName, type FileKind } from "@/lib/config";

const BUCKET = "submission-documents";
const DRIVE_GATEWAY = "https://connector-gateway.lovable.dev/google_drive";
const SHEETS_GATEWAY = "https://connector-gateway.lovable.dev/google_sheets/v4";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_RE = /^[6-9]\d{9}$/;

function fail(message: string): never {
  throw new Error(message);
}

function gatewayHeaders(apiKey: string | undefined) {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  if (!lovableKey || !apiKey) throw new Error("Google integration is not configured");
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": apiKey,
  };
}

async function driveFindFolder(name: string, parentId: string): Promise<string | null> {
  const q = encodeURIComponent(
    `name='${name.replace(/'/g, "\\'")}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
  );
  const res = await fetch(`${DRIVE_GATEWAY}/drive/v3/files?q=${q}&fields=files(id,name)&pageSize=1`, {
    headers: gatewayHeaders(process.env["GOOGLE_DRIVE_API_KEY"]),
  });
  if (!res.ok) throw new Error(`Drive folder lookup failed [${res.status}]`);
  const data = (await res.json()) as { files?: { id: string }[] };
  return data.files?.[0]?.id ?? null;
}

async function driveEnsureFolder(name: string, parentId: string): Promise<string> {
  const existing = await driveFindFolder(name, parentId);
  if (existing) return existing;
  const res = await fetch(`${DRIVE_GATEWAY}/drive/v3/files`, {
    method: "POST",
    headers: { ...gatewayHeaders(process.env["GOOGLE_DRIVE_API_KEY"]), "Content-Type": "application/json" },
    body: JSON.stringify({ name, mimeType: "application/vnd.google-apps.folder", parents: [parentId] }),
  });
  if (!res.ok) throw new Error(`Drive folder creation failed [${res.status}]: ${await res.text()}`);
  return ((await res.json()) as { id: string }).id;
}

async function driveUploadFile(name: string, parentId: string, file: File): Promise<string> {
  const form = new FormData();
  form.append(
    "metadata",
    new Blob([JSON.stringify({ name, parents: [parentId] })], { type: "application/json" }),
  );
  form.append("file", file);
  const res = await fetch(`${DRIVE_GATEWAY}/upload/drive/v3/files?uploadType=multipart&fields=id`, {
    method: "POST",
    headers: gatewayHeaders(process.env["GOOGLE_DRIVE_API_KEY"]),
    body: form,
  });
  if (!res.ok) throw new Error(`Drive upload failed [${res.status}]: ${await res.text()}`);
  return ((await res.json()) as { id: string }).id;
}

async function sheetAppendRow(values: (string | number)[]): Promise<void> {
  const spreadsheetId = process.env["GOOGLE_SHEETS_SPREADSHEET_ID"];
  if (!spreadsheetId) throw new Error("Sheet not configured");
  const res = await fetch(
    `${SHEETS_GATEWAY}/spreadsheets/${spreadsheetId}/values/Submissions!A:X:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      headers: { ...gatewayHeaders(process.env["GOOGLE_SHEETS_API_KEY"]), "Content-Type": "application/json" },
      body: JSON.stringify({ majorDimension: "ROWS", values: [values] }),
    },
  );
  if (!res.ok) throw new Error(`Sheets sync failed [${res.status}]: ${await res.text()}`);
}

async function checkMagicBytes(file: File, kind: FileKind): Promise<boolean> {
  const buf = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const hex = [...buf].map((b) => b.toString(16).padStart(2, "0")).join("");
  if (kind === "report") return hex.startsWith("25504446"); // %PDF
  if (kind === "presentation") return hex.startsWith("504b0304") || hex.startsWith("d0cf11e0"); // zip / ole
  return hex.startsWith("ffd8ff") || hex.startsWith("89504e47"); // jpg / png
}

export const submitSubmission = createServerFn({ method: "POST" })
  .inputValidator((formData: FormData) => formData)
  .handler(async ({ data }) => {
    const get = (k: string) => String(data.get(k) ?? "").trim();

    const studentName = get("studentName");
    const registrationNumber = get("registrationNumber").toUpperCase();
    const email = get("email").toLowerCase();
    const mobileNumber = get("mobileNumber");
    const school = get("school");
    const department = get("department");
    const academicYear = get("academicYear");
    const internshipCompany = get("internshipCompany");
    const projectTitle = get("projectTitle");
    const facultyGuide = get("facultyGuide");
    const panelNumber = Number(get("panelNumber"));
    const reviewDate = get("reviewDate");

    if (!studentName || !registrationNumber || !school || !department || !academicYear)
      fail("Missing mandatory student details");
    if (!EMAIL_RE.test(email) || !isVitEmail(email))
      fail("Please use your VIT student email ID (@vitstudent.ac.in)");
    if (!SCHOOLS.includes(school)) fail("Invalid school");
    if (!DEPARTMENTS.includes(department)) fail("Invalid department");
    if (get("acknowledged") !== "true") fail("Please acknowledge the one-time submission policy");
    if (!MOBILE_RE.test(mobileNumber)) fail("Mobile number must be a valid 10-digit Indian number");
    if (!internshipCompany || !projectTitle) fail("Missing internship details");

    const panel = PANELS.find((p) => p.panel === panelNumber);
    if (!panel) fail("Invalid review panel");
    const date = REVIEW_DATES.find((d) => d.value === reviewDate);
    if (!date) fail("Invalid review date");

    const files: { kind: FileKind; file: File }[] = [];
    for (const kind of ["report", "presentation", "certificate"] as FileKind[]) {
      const f = data.get(kind);
      if (!(f instanceof File) || f.size === 0) fail(`Missing ${FILE_RULES[kind].label}`);
      const rules = FILE_RULES[kind];
      const ext = "." + (f.name.split(".").pop() ?? "").toLowerCase();
      if (!rules.exts.includes(ext as never)) fail(`${rules.label}: only ${rules.exts.join(", ")} allowed`);
      if (f.size > rules.maxBytes) fail(`${rules.label}: exceeds ${rules.maxBytes / 1024 / 1024} MB limit`);
      if (!(await checkMagicBytes(f, kind))) fail(`${rules.label}: file content does not match its type`);
      files.push({ kind, file: f });
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Duplicate prevention: one completed submission per registration number.
    const [regRes, emailRes] = await Promise.all([
      supabaseAdmin.from("submissions").select("submission_id").eq("submission_status", "completed")
        .eq("registration_number", registrationNumber).limit(1),
      supabaseAdmin.from("submissions").select("submission_id").eq("submission_status", "completed")
        .eq("email", email).limit(1),
    ]);
    if (regRes.error || emailRes.error) fail("Could not verify previous submissions. Please try again.");
    if ((regRes.data?.length ?? 0) > 0 || (emailRes.data?.length ?? 0) > 0) fail(DUPLICATE_MSG);

    const { data: idRow, error: idErr } = await supabaseAdmin.rpc("next_submission_id");
    if (idErr || !idRow) fail("Could not generate submission ID");
    const submissionId = idRow as string;

    // Atomically reserve the submission (unique indexes on reg no. + email) BEFORE
    // touching storage, Drive or Sheets, so concurrent duplicates never create resources.
    const names = {} as Record<FileKind, string>;
    for (const { kind, file } of files) {
      const ext = "." + (file.name.split(".").pop() ?? "").toLowerCase();
      names[kind] = buildFileName(registrationNumber, studentName, kind, ext);
    }
    const paths = {} as Record<FileKind, { path: string; name: string }>;
    (Object.keys(names) as FileKind[]).forEach((k) => (paths[k] = { path: `${submissionId}/${names[k]}`, name: names[k] }));

    const { data: inserted, error: insErr } = await supabaseAdmin
      .from("submissions")
      .insert({
        submission_id: submissionId,
        student_name: studentName,
        registration_number: registrationNumber,
        email,
        mobile_number: mobileNumber,
        school,
        department,
        academic_year: academicYear,
        internship_company: internshipCompany,
        project_title: projectTitle,
        faculty_guide: facultyGuide,
        panel_number: panel.panel,
        faculty_name: panel.faculty,
        review_date: reviewDate,
        pdf_file_path: paths.report.path,
        ppt_file_path: paths.presentation.path,
        certificate_file_path: paths.certificate.path,
        pdf_filename: paths.report.name,
        ppt_filename: paths.presentation.name,
        certificate_filename: paths.certificate.name,
        submission_status: "completed",
      })
      .select("created_at")
      .single();
    if (insErr || !inserted) {
      if (insErr?.code === "23505") fail(DUPLICATE_MSG);
      fail(`Could not save submission: ${insErr?.message ?? "unknown error"}`);
    }
    const createdAt = inserted.created_at; // authoritative server timestamp

    // Upload documents to secure storage. On failure, clean up only this new attempt.
    const uploaded: string[] = [];
    for (const { kind, file } of files) {
      const { error: upErr } = await supabaseAdmin.storage.from(BUCKET).upload(paths[kind].path, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });
      if (upErr) {
        if (uploaded.length) await supabaseAdmin.storage.from(BUCKET).remove(uploaded);
        await supabaseAdmin.from("submissions").delete().eq("submission_id", submissionId);
        fail(`Upload failed for ${FILE_RULES[kind].label}: ${upErr.message}`);
      }
      uploaded.push(paths[kind].path);
    }

    // Mirror to Google Drive: date → panel → student folder. Best-effort; status tracked.
    let driveSyncStatus = "pending";
    let driveFolderId: string | null = null;
    const driveIds: Partial<Record<FileKind, string>> = {};
    try {
      const rootId = process.env["GOOGLE_DRIVE_ROOT_FOLDER_ID"];
      if (!rootId) throw new Error("Drive root folder not configured");
      const dateFolder = await driveEnsureFolder(date.label, rootId);
      const panelFolder = await driveEnsureFolder(`Panel ${panel.panel} - ${panel.faculty}`, dateFolder);
      const studentFolderName = `${sanitizeName(registrationNumber)}_${sanitizeName(studentName)}`;
      driveFolderId = await driveEnsureFolder(studentFolderName, panelFolder);
      for (const { kind, file } of files) {
        driveIds[kind] = await driveUploadFile(paths[kind].name, driveFolderId, file);
      }
      driveSyncStatus = "synced";
    } catch (e) {
      console.error("Drive mirror failed:", e);
      driveSyncStatus = "failed";
    }

    // Sync to Google Sheets. RAW input prevents formula injection.
    let sheetSyncStatus = "pending";
    const ist = formatIST(createdAt);
    try {
      const { count } = await supabaseAdmin
        .from("submissions")
        .select("id", { count: "exact", head: true });
      const driveLink = (id: string) => `https://drive.google.com/file/d/${id}/view`;
      await sheetAppendRow([
        count ?? 1,
        submissionId,
        studentName,
        registrationNumber,
        email,
        mobileNumber,
        school,
        department,
        academicYear,
        internshipCompany,
        projectTitle,
        facultyGuide,
        panel.panel,
        panel.faculty,
        date.label,
        ist.date,
        ist.time,
        driveIds.report ? driveLink(driveIds.report) : "",
        driveIds.presentation ? driveLink(driveIds.presentation) : "",
        driveIds.certificate ? driveLink(driveIds.certificate) : "",
        driveFolderId ? `https://drive.google.com/drive/folders/${driveFolderId}` : "",
        "Submitted",
        "Synced",
        new Date(createdAt).toISOString(),
      ]);
      sheetSyncStatus = "synced";
    } catch (e) {
      console.error("Sheets sync failed:", e);
      sheetSyncStatus = "failed";
    }

    await supabaseAdmin
      .from("submissions")
      .update({
        drive_sync_status: driveSyncStatus,
        sheet_sync_status: sheetSyncStatus,
        drive_folder_id: driveFolderId,
        drive_pdf_id: driveIds.report ?? null,
        drive_ppt_id: driveIds.presentation ?? null,
        drive_certificate_id: driveIds.certificate ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("submission_id", submissionId);

    // 30-minute confirmation token.
    const token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    await supabaseAdmin.from("confirmation_tokens").insert({
      token,
      submission_id: submissionId,
      expires_at: expiresAt,
    });

    return {
      submissionId,
      token,
      expiresAt,
      driveSyncStatus,
      sheetSyncStatus,
      filenames: {
        report: paths.report.name,
        presentation: paths.presentation.name,
        certificate: paths.certificate.name,
      },
    };
  });

export const getConfirmation = createServerFn({ method: "GET" })
  .inputValidator((token: string) => token)
  .handler(async ({ data: token }) => {
    if (!token || token.length < 32) return { status: "invalid" as const };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("confirmation_tokens")
      .select("expires_at, submissions(*)")
      .eq("token", token)
      .maybeSingle();
    if (!row || !row.submissions) return { status: "invalid" as const };
    if (new Date(row.expires_at).getTime() < Date.now()) return { status: "expired" as const };
    const s = row.submissions as Record<string, unknown>;
    return {
      status: "ok" as const,
      expiresAt: row.expires_at,
      submission: {
        submissionId: String(s["submission_id"]),
        studentName: String(s["student_name"]),
        registrationNumber: String(s["registration_number"]),
        email: String(s["email"]),
        school: String(s["school"]),
        department: String(s["department"]),
        panelNumber: Number(s["panel_number"]),
        facultyName: String(s["faculty_name"]),
        reviewDate: String(s["review_date"]),
        submittedAt: String(s["created_at"]),
        pdfFilename: String(s["pdf_filename"]),
        pptFilename: String(s["ppt_filename"]),
        certificateFilename: String(s["certificate_filename"]),
        sheetSyncStatus: String(s["sheet_sync_status"]),
        driveSyncStatus: String(s["drive_sync_status"]),
      },
    };
  });
