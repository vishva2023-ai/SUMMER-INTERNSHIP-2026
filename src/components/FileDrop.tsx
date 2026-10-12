import { useRef, useState } from "react";
import { FileText, Image, Presentation, Upload, X } from "lucide-react";
import { FILE_RULES, type FileKind } from "@/lib/config";

const ICONS: Record<FileKind, typeof FileText> = {
  report: FileText,
  presentation: Presentation,
  certificate: Image,
};

export function FileDrop({
  kind,
  file,
  onChange,
  error,
}: {
  kind: FileKind;
  file: File | null;
  onChange: (f: File | null) => void;
  error?: string | undefined;
}) {
  const rules = FILE_RULES[kind];
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState<string>();
  const Icon = ICONS[kind];

  const accept = rules.exts.join(",");
  const maxMb = rules.maxBytes / 1024 / 1024;

  const validate = (f: File): string | undefined => {
    const ext = "." + (f.name.split(".").pop() ?? "").toLowerCase();
    if (!rules.exts.includes(ext as never))
      return `Only ${rules.exts.join(", ")} files are accepted.`;
    if (f.size > rules.maxBytes) return `File exceeds the ${maxMb} MB limit.`;
    return undefined;
  };

  const pick = (f: File | null) => {
    if (!f) return onChange(null);
    const err = validate(f);
    setLocalError(err);
    onChange(err ? null : f);
  };

  const previewUrl =
    file && (kind === "certificate" || kind === "report") ? URL.createObjectURL(file) : null;

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        aria-label={`${rules.label} upload`}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          pick(e.dataTransfer.files?.[0] ?? null);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
          dragOver
            ? "border-gold bg-accent"
            : file
              ? "border-primary/40 bg-secondary"
              : "border-input bg-card hover:border-primary/40"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => pick(e.target.files?.[0] ?? null)}
        />
        {file ? (
          <>
            <Icon className="h-8 w-8 text-primary" />
            <p className="max-w-full truncate text-sm font-medium text-foreground">{file.name}</p>
            <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">{rules.label}</p>
            <p className="text-xs text-muted-foreground">
              Drag & drop or click to browse · {rules.exts.join(", ")} · max {maxMb} MB
            </p>
          </>
        )}
      </div>

      {file && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-md border border-input px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary"
          >
            Replace
          </button>
          <button
            type="button"
            onClick={() => {
              setLocalError(undefined);
              onChange(null);
            }}
            className="inline-flex items-center gap-1 rounded-md border border-input px-3 py-1.5 text-xs font-medium text-destructive hover:bg-secondary"
          >
            <X className="h-3 w-3" /> Remove
          </button>
        </div>
      )}

      {previewUrl && kind === "certificate" && (
        <img src={previewUrl} alt="Certificate preview" className="max-h-48 rounded-lg border border-border object-contain" />
      )}
      {previewUrl && kind === "report" && (
        <iframe src={previewUrl} title="Report preview" className="h-64 w-full rounded-lg border border-border" />
      )}

      {(localError || error) && <p className="text-xs font-medium text-destructive">{localError ?? error}</p>}
    </div>
  );
}
