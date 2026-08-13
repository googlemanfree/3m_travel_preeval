import { describe, expect, it } from "vitest";
import { getDocumentStatusCounts, toDisplayDocumentStatus } from "./services/documentStatus";
import { getRejectedDocumentCount, hasRejectedDocuments } from "@shared/documentStatus";

describe("document status helpers", () => {
  it("maps uploaded documents to the pending display state", () => {
    expect(toDisplayDocumentStatus("uploaded")).toBe("pending");
    expect(toDisplayDocumentStatus("verified")).toBe("verified");
    expect(toDisplayDocumentStatus("rejected")).toBe("rejected");
  });

  it("calculates counts and completion without treating rejected files as complete", () => {
    expect(getDocumentStatusCounts([
      { status: "verified" },
      { status: "uploaded" },
      { status: "rejected" },
      { status: "verified" },
    ])).toEqual({
      totalDocuments: 4,
      verifiedCount: 2,
      pendingCount: 1,
      rejectedCount: 1,
      completionPercentage: 50,
    });
  });

  it("returns zero completion for an empty document list", () => {
    expect(getDocumentStatusCounts([])).toEqual({
      totalDocuments: 0,
      verifiedCount: 0,
      pendingCount: 0,
      rejectedCount: 0,
      completionPercentage: 0,
    });
  });

  it("detects rejected documents for the candidate alert", () => {
    const documents = [{ status: "verified" }, { status: "rejected" }, { status: "rejected" }];

    expect(getRejectedDocumentCount(documents)).toBe(2);
    expect(hasRejectedDocuments(documents)).toBe(true);
    expect(hasRejectedDocuments([{ status: "uploaded" }])).toBe(false);
  });
});
