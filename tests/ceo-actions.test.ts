import { describe, expect, it } from "vitest";
import {
  canShareIntegrityReport,
  getActiveInstitutionAccess,
  getOpenClarificationRequests,
  getOpenExceptions
} from "@/lib/ceo/actions";
import { analystNotes, controlExceptions, institutionAccess } from "@/lib/data/sample-data";

describe("CEO actions", () => {
  it("shows only business-visible clarification requests", () => {
    const requests = getOpenClarificationRequests(analystNotes, "biz_001");

    expect(requests).toHaveLength(1);
    expect(requests[0]?.noteType).toBe("clarification_request");
    expect(requests[0]?.visibility).toBe("business_visible");
  });

  it("finds unresolved exceptions for CEO resolution", () => {
    const exceptions = getOpenExceptions(controlExceptions, "biz_001");

    expect(exceptions.map((exception) => exception.id)).toEqual(["exc_003"]);
  });

  it("limits active institution access to current grants", () => {
    const access = getActiveInstitutionAccess(institutionAccess, "biz_001");

    expect(access).toHaveLength(1);
    expect(access[0]?.status).toBe("active");
  });

  it("allows report sharing only when the Integrity Report is ready", () => {
    expect(canShareIntegrityReport(true)).toBe(true);
    expect(canShareIntegrityReport(false)).toBe(false);
  });
});
