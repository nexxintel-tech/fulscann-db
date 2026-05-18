export const EVIDENCE_BUCKET = "evidence-files";
const MAX_EVIDENCE_FILE_SIZE = 10 * 1024 * 1024;

export function sanitizeEvidenceFileName(fileName: string) {
  const cleaned = fileName
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return cleaned || "evidence-file";
}

export function buildEvidenceStoragePath(input: {
  businessId: string;
  reportId: string;
  fileName: string;
  uniqueId: string;
}) {
  return `${input.businessId}/${input.reportId}/${input.uniqueId}-${sanitizeEvidenceFileName(input.fileName)}`;
}

export function validateEvidenceUpload(file: File | null) {
  if (!file || file.size === 0) {
    return "Select an evidence file to upload.";
  }

  if (file.size > MAX_EVIDENCE_FILE_SIZE) {
    return "Evidence file must be 10MB or smaller.";
  }

  return null;
}
