import { describe, expect, it } from "vitest";
import {
  buildEvidenceStoragePath,
  sanitizeEvidenceFileName,
  validateEvidenceUpload
} from "@/lib/evidence/storage";

describe("evidence storage", () => {
  it("sanitizes uploaded file names", () => {
    expect(sanitizeEvidenceFileName(" May invoice #1.pdf ")).toBe("May-invoice-1.pdf");
    expect(sanitizeEvidenceFileName("")).toBe("evidence-file");
  });

  it("builds business/report-scoped storage paths", () => {
    expect(
      buildEvidenceStoragePath({
        businessId: "biz_1",
        reportId: "rep_1",
        fileName: "Bank Inflow.pdf",
        uniqueId: "upload_1"
      })
    ).toBe("biz_1/rep_1/upload_1-Bank-Inflow.pdf");
  });

  it("validates required file uploads", () => {
    expect(validateEvidenceUpload(null)).toBe("Select an evidence file to upload.");

    const file = new File(["evidence"], "evidence.txt", { type: "text/plain" });
    expect(validateEvidenceUpload(file)).toBeNull();
  });
});
